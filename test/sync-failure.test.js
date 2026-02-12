const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const fastify = require("fastify");

/**
 * Build a server with a mocked Actual API to test sync failure handling
 * without needing a real Actual Budget server.
 */
async function buildMockServer({ syncBehaviour = "success" } = {}) {
  const app = fastify({ logger: false, ajv: { customOptions: { allowUnionTypes: true } } });

  // Minimal env config
  app.decorate("config", { API_KEY: "test-key" });

  // Auth hook
  app.addHook("preHandler", async (request, reply) => {
    if (request.url === "/health" || request.url.startsWith("/health?")) return;
    const apiKey = request.headers["x-api-key"];
    if (apiKey !== app.config.API_KEY) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });

  // Mock Actual API
  app.decorate("actual", {
    getAccounts: async () => [{ id: "acc-1", name: "Checking" }],
    addTransactions: async () => "ok",
    sync: async () => {
      if (syncBehaviour === "fail") {
        throw new Error("PostError: unauthorized");
      }
    },
  });

  await app.register(require("../src/routes/transaction"));

  return app;
}

describe("Sync failure handling", () => {
  describe("when sync succeeds", () => {
    let app;

    before(async () => {
      app = await buildMockServer({ syncBehaviour: "success" });
    });

    after(async () => {
      await app.close();
    });

    it("should return 200", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: { "x-api-key": "test-key", "content-type": "application/json" },
        payload: { account: "Checking", amount: 10.0, payee: "Test" },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.ok(body.id);
      assert.strictEqual(body.payee_name, "Test");
    });
  });

  describe("when sync fails", () => {
    let app;

    before(async () => {
      app = await buildMockServer({ syncBehaviour: "fail" });
    });

    after(async () => {
      await app.close();
    });

    it("should return 500 with sync error details", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: { "x-api-key": "test-key", "content-type": "application/json" },
        payload: { account: "Checking", amount: 10.0, payee: "Test" },
      });

      assert.strictEqual(response.statusCode, 500);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, "Sync failed");
      assert.ok(body.message.includes("failed to sync"), `Expected sync failure message, got: ${body.message}`);
    });
  });
});
