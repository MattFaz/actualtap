const actual = require("@actual-app/api");
const fp = require("fastify-plugin");
const os = require("os");
const path = require("path");
const fs = require("fs");

// Validate and normalize URL format
const validateUrl = (url) => {
  if (!url || typeof url !== "string") {
    throw new Error("ACTUAL_URL is not a valid string");
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("ACTUAL_URL must use http:// or https:// protocol");
    }
    return url.replace(/\/+$/, ""); // Remove trailing slashes
  } catch (err) {
    throw new Error(`Invalid ACTUAL_URL format: ${err.message}`);
  }
};

// Verify network connectivity
const verifyConnectivity = async (url) => {
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.status < 200 || response.status >= 400) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
  } catch (err) {
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      throw new Error("Connection timed out - check if server is accessible");
    }
    if (err.cause?.code === "ENOTFOUND") {
      throw new Error("Cannot resolve hostname - check if ACTUAL_URL is correct");
    }
    if (err.cause?.code === "ECONNREFUSED") {
      throw new Error("Connection refused - check if server is running");
    }
    throw new Error(`Network error: ${err.message}`);
  }
};

// Initialize Actual API
const initializeActual = async (serverURL, password, timeoutMs) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "actualtap-"));

  try {
    await Promise.race([
      actual.init({ dataDir, serverURL, password }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs)),
    ]);
  } catch (err) {
    if (err.message === "TIMEOUT") {
      throw new Error(`Initialization timed out after ${timeoutMs / 1000} seconds`);
    }
    throw new Error(`Failed to initialize Actual API: ${err.message}`);
  }
};

// Verify authentication and return budgets
const verifyAuthentication = async () => {
  try {
    const budgets = await actual.getBudgets();
    if (!budgets || budgets.length === 0) {
      throw new Error("ACTUAL_PASSWORD is incorrect (no budgets found)");
    }
    return budgets;
  } catch (err) {
    throw new Error(`Authentication failed: ${err.message}`);
  }
};

// Verify budget exists
const verifyBudgetExists = (budgets, syncId) => {
  const budget = budgets.find((b) => b.groupId === syncId);
  if (!budget) {
    const availableIds = budgets.map((b) => b.groupId).join(", ");
    throw new Error(`Budget '${syncId}' not found. Available: ${availableIds}`);
  }
  return budget;
};

// Download budget with retry logic
const downloadBudget = async (syncId, encryptionPassword, logger, maxRetries, retryDelay) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Downloading budget (attempt ${attempt}/${maxRetries})`);

      if (encryptionPassword) {
        await actual.downloadBudget(syncId, { password: encryptionPassword });
      } else {
        await actual.downloadBudget(syncId);
      }

      return; // Success!
    } catch (err) {
      lastError = err;

      // Check for encryption errors - don't retry these
      if (err.message?.includes("decrypt") || err.message?.includes("encryption")) {
        throw new Error(`ACTUAL_ENCRYPTION_PASSWORD is incorrect: ${err.message}`);
      }

      // Log the error and retry if we have attempts left
      logger.warn(`Budget download attempt ${attempt}/${maxRetries} failed: ${err.message || err.reason || err}`);

      if (attempt < maxRetries) {
        logger.info(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // All retries exhausted
  throw new Error(`Failed to download budget after ${maxRetries} attempts: ${lastError.message || lastError.reason || lastError}`);
};

const actualConnector = fp(async (fastify) => {
  const { 
    ACTUAL_URL, 
    ACTUAL_PASSWORD, 
    ACTUAL_SYNC_ID, 
    ACTUAL_ENCRYPTION_PASSWORD 
  } = fastify.config;

  const TIMEOUT = 30000;
  const RETRY_COUNT = 3;
  const RETRY_DELAY = 2000;

  fastify.log.info("Initializing Actual connector");

  // Validate and normalize URL
  const url = validateUrl(ACTUAL_URL);
  fastify.log.info(`Connecting to: ${url}`);

  // Verify server is reachable
  await verifyConnectivity(url);
  fastify.log.info("Server is reachable");

  // Initialize Actual API
  await initializeActual(url, ACTUAL_PASSWORD, TIMEOUT);
  fastify.log.info("Actual API initialized");

  // Verify authentication and get budgets
  const budgets = await verifyAuthentication();
  fastify.log.info(`Authenticated - found ${budgets.length} budget(s)`);

  // Verify budget exists
  const budget = verifyBudgetExists(budgets, ACTUAL_SYNC_ID);
  fastify.log.info(`Budget found: ${budget.name || budget.groupId}`);

  // Download budget
  await downloadBudget(ACTUAL_SYNC_ID, ACTUAL_ENCRYPTION_PASSWORD, fastify.log, RETRY_COUNT, RETRY_DELAY);
  fastify.log.info("Budget downloaded successfully");

  // Decorate fastify instance
  fastify.decorate("actual", actual);

  // Cleanup on shutdown
  fastify.addHook("onClose", async (done) => {
    try {
      await actual.close();
      fastify.log.info("Actual API closed");
      done();
    } catch (err) {
      fastify.log.error(`Cleanup error: ${err.message}`);
      done(err);
    }
  });
});

module.exports = actualConnector;