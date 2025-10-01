const actual = require("@actual-app/api");
const fp = require("fastify-plugin");
const os = require("os");
const path = require("path");
const fs = require("fs");

const actualConnector = fp(async (fastify, options) => {
  fastify.log.info("Starting Actual API connector initialization");

  try {
    fastify.log.info("Initializing Actual API");
    // Set a timeout for initialization
    const initTimeout = setTimeout(() => {
      throw new Error("Actual API initialization timed out after 30 seconds");
    }, 30000);

    // Use OS temp directory - will be cleaned up automatically
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "actualtap-"));
    fastify.log.info(`Temporary data directory: ${dataDir}`);

    await actual.init({
      dataDir: dataDir,
      serverURL: process.env.ACTUAL_URL,
      password: process.env.ACTUAL_PASSWORD,
    });

    clearTimeout(initTimeout);
    fastify.log.info("Actual API initialized successfully");

    // Try to download the budget with retry logic
    let budgetDownloaded = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!budgetDownloaded && retryCount < maxRetries) {
      try {
        fastify.log.info(
          `Downloading budget with Sync ID: ${process.env.ACTUAL_SYNC_ID} ${
            process.env.ACTUAL_ENCRYPTION_PASSWORD
              ? `with encryption password: ${process.env.ACTUAL_ENCRYPTION_PASSWORD}`
              : ""
          } (attempt ${retryCount + 1}/${maxRetries})`
        );

        if (process.env.ACTUAL_ENCRYPTION_PASSWORD) {
          await actual.downloadBudget(process.env.ACTUAL_SYNC_ID, { password: process.env.ACTUAL_ENCRYPTION_PASSWORD });
        } else {
          await actual.downloadBudget(process.env.ACTUAL_SYNC_ID);
        }
        fastify.log.info("Budget downloaded successfully");
        budgetDownloaded = true;
      } catch (err) {
        retryCount++;
        fastify.log.error(
          `Budget download/sync error (attempt ${retryCount}/${maxRetries}): ${err.message || err.reason || err}`
        );

        if (retryCount < maxRetries) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (!budgetDownloaded) {
      const error = new Error(`Failed to download budget after ${maxRetries} attempts.`);
      fastify.log.error(error);
      throw error;
    }

    fastify.decorate("actual", actual);
    fastify.log.info("Actual API connector setup completed successfully");

    fastify.addHook("onClose", async (done) => {
      fastify.log.info("Starting Actual API cleanup");
      try {
        await actual.close();
        fastify.log.info("Actual API cleanup completed successfully");
        done();
      } catch (err) {
        fastify.log.error(`Error during Actual API cleanup: ${err.message}`);
        done(err);
      }
    });
  } catch (err) {
    fastify.log.error(`Actual API initialization failed: ${err.message}`);
    throw err;
  }
});

module.exports = actualConnector;
