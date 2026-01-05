const fastify = require("fastify");

/**
 * Build a Fastify server instance for testing.
 * Uses inject() - no port binding needed.
 */
async function buildServer() {
  const app = fastify({
    logger: false,
  });

  await app.register(require("../src/plugins/env"));

  // Auth hook
  app.addHook("preHandler", async (request, reply) => {
    if (request.url === "/health" || request.url.startsWith("/health?")) return;
    const apiKey = request.headers["x-api-key"];
    if (apiKey !== app.config.API_KEY) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });

  await app.register(require("@fastify/cors"), { methods: ["POST"] });
  await app.register(require("../src/plugins/actualConnector"));
  await app.register(require("../src/routes/transaction"));
  await app.register(require("../src/routes/health"));

  return app;
}

/**
 * Delete transactions by IDs.
 * @param {object} actual - The actual API instance
 * @param {string} accountId - Account ID containing transactions
 * @param {string[]} transactionIds - Array of transaction IDs to delete
 */
async function cleanupTransactions(actual, accountId, transactionIds) {
  for (const id of transactionIds) {
    try {
      await actual.deleteTransaction(id);
    } catch (err) {
      console.error(`Failed to delete transaction ${id}: ${err.message}`);
    }
  }
}

/**
 * Get the first account ID from the budget.
 * @param {object} actual - The actual API instance
 * @returns {Promise<{id: string, name: string}>}
 */
async function getFirstAccount(actual) {
  const accounts = await actual.getAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found in budget");
  }
  return accounts[0];
}

module.exports = {
  buildServer,
  cleanupTransactions,
  getFirstAccount,
};
