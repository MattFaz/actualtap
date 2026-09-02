const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const fastify = require("fastify");

/**
 * Build a server with a mocked Actual API to test sync failure handling
 * without needing a real Actual Budget server.
 */
async function buildMockServer({ syncBehaviour = "success", nearbyPayees = [] } = {}) {
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
    getPayees: async () => [{ id: "payee-1", name: "Test" }],
    addTransactions: async () => "ok",
    sync: async () => {
      if (syncBehaviour === "fail") {
        throw new Error("PostError: unauthorized");
      }
    },
  });
  const locationRequests = [];
  app.decorate("actualInternal", {
    send: async (name, args) => {
      locationRequests.push({ name, args });
      return name === "api/payees-get-nearby" ? nearbyPayees : undefined;
    },
  });
  app.decorate("locationRequests", locationRequests);

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

  it("saves a payee location when coordinates are supplied", async () => {
    const app = await buildMockServer();
    const response = await app.inject({
      method: "POST",
      url: "/transaction",
      headers: { "x-api-key": "test-key", "content-type": "application/json" },
      payload: { account: "Checking", payee: "Test", latitude: -37.8136, longitude: 144.9631 },
    });

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(app.locationRequests, [
      { name: "api/payees-get-nearby", args: { latitude: -37.8136, longitude: 144.9631, maxDistance: 500 } },
      { name: "api/payee-location-create", args: { payeeId: "payee-1", latitude: -37.8136, longitude: 144.9631 } },
    ]);
    await app.close();
  });

  it("does not save a duplicate nearby payee location", async () => {
    // Shape matches api/payees-get-nearby's real return (NearbyPayeeEntity)
    const app = await buildMockServer({
      nearbyPayees: [{ payee: { id: "payee-1" }, location: { payee_id: "payee-1" } }],
    });
    const response = await app.inject({
      method: "POST",
      url: "/transaction",
      headers: { "x-api-key": "test-key", "content-type": "application/json" },
      payload: { account: "Checking", payee: "Test", latitude: -37.8136, longitude: 144.9631 },
    });

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(app.locationRequests, [
      { name: "api/payees-get-nearby", args: { latitude: -37.8136, longitude: 144.9631, maxDistance: 500 } },
    ]);
    await app.close();
  });

  it("requires both location coordinates", async () => {
    const app = await buildMockServer();
    const response = await app.inject({
      method: "POST",
      url: "/transaction",
      headers: { "x-api-key": "test-key", "content-type": "application/json" },
      payload: { account: "Checking", latitude: -37.8136 },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(JSON.parse(response.body).error, "Invalid location");
    await app.close();
  });
});
