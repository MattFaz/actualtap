const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const { buildServer, cleanupTransactions, getFirstAccount } = require("./helpers");

describe("Transaction API", async () => {
  let app;
  let testAccount;
  const createdTransactionIds = [];

  before(async () => {
    app = await buildServer();
    testAccount = await getFirstAccount(app.actual);
  });

  after(async () => {
    // Cleanup all created transactions
    if (createdTransactionIds.length > 0) {
      await cleanupTransactions(app.actual, testAccount.id, createdTransactionIds);
      console.log(`Cleaned up ${createdTransactionIds.length} test transaction(s)`);
    }
    await app.close();
  });

  describe("Success scenarios", () => {
    it("should create a payment transaction", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "x-api-key": app.config.API_KEY,
          "content-type": "application/json",
        },
        payload: {
          account: testAccount.name,
          amount: 12.34,
          payee: "Test Payment",
        },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.ok(body.id, "Response should include transaction ID");
      assert.strictEqual(body.amount, -1234, "Payment should be negative");
      assert.strictEqual(body.payee_name, "Test Payment");
      createdTransactionIds.push(body.id);
    });

    it("should create a deposit transaction", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "x-api-key": app.config.API_KEY,
          "content-type": "application/json",
        },
        payload: {
          account: testAccount.name,
          amount: 50.00,
          payee: "Test Deposit",
          type: "deposit",
        },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.ok(body.id, "Response should include transaction ID");
      assert.strictEqual(body.amount, 5000, "Deposit should be positive");
      createdTransactionIds.push(body.id);
    });

    it("should create a transaction with notes", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "x-api-key": app.config.API_KEY,
          "content-type": "application/json",
        },
        payload: {
          account: testAccount.name,
          amount: 5.00,
          payee: "Test Notes",
          notes: "This is a test note",
        },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.notes, "This is a test note");
      createdTransactionIds.push(body.id);
    });

    it("should use default values when optional fields omitted", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "x-api-key": app.config.API_KEY,
          "content-type": "application/json",
        },
        payload: {
          account: testAccount.name,
        },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.amount, 0, "Default amount should be 0");
      assert.strictEqual(body.payee_name, "Unknown", "Default payee should be Unknown");
      createdTransactionIds.push(body.id);
    });
  });
});
