const actual = require("@actual-app/api");
const fp = require("fastify-plugin");
const path = require("path");
const fs = require("fs");

const actualConnector = fp(async (fastify, options) => {
  fastify.log.info("Starting Actual API connector initialization");

  // Path to the data directory in the root
  const dataDir = path.join(process.cwd(), "data");

  // Ensure the data directory exists
  if (!fs.existsSync(dataDir)) {
    fastify.log.info(`Data directory does not exist. Creating: ${dataDir}`);
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      fastify.log.info("Data directory created successfully");
    } catch (err) {
      const error = new Error(`Failed to create data directory: ${err.message}`);
      fastify.log.error(error);
      throw error;
    }
  } else {
    fastify.log.info(`Data directory exists: ${dataDir}`);
  }

  try {
    fastify.log.info("Initializing Actual API");
    // Set a timeout for initialization
    const initTimeout = setTimeout(() => {
      throw new Error("Actual API initialization timed out after 30 seconds");
    }, 30000);

    await actual.init({
      dataDir: dataDir,
      serverURL: process.env.ACTUAL_URL,
      password: process.env.ACTUAL_PASSWORD,
    });

    clearTimeout(initTimeout);
    fastify.log.info("Actual API initialized successfully");

    try {
      fastify.log.info(`Downloading budget with ID: ${process.env.ACTUAL_BUDGET_ID}`);
      await actual.downloadBudget(process.env.ACTUAL_BUDGET_ID);
      fastify.log.info("Budget downloaded successfully");
    } catch (err) {
      const error = new Error(`Failed to download budget: ${err.message}`);
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
