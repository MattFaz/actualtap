const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const { buildServer, cleanupTransactions, getFirstAccount } = require("./helpers");

describe("Transaction API", () => {
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

    // Force exit after Actual API finishes final sync
    // The API keeps internal handles alive after close()
    setTimeout(() => process.exit(0), 2000);
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

    it("should accept amount as a string (payment)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "x-api-key": app.config.API_KEY,
          "content-type": "application/json",
        },
        payload: {
          account: testAccount.name,
          amount: "4.00",
          payee: "Test String Amount",
        },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.amount, -400, "String amount should be parsed and negative for payment");
      createdTransactionIds.push(body.id);
    });

    it("should accept amount as a string (deposit)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "x-api-key": app.config.API_KEY,
          "content-type": "application/json",
        },
        payload: {
          account: testAccount.name,
          amount: "25.50",
          payee: "Test String Deposit",
          type: "deposit",
        },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.amount, 2550, "String amount should be parsed and positive for deposit");
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

  describe("Failure scenarios", () => {
    it("should return 401 when API key is missing", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          account: testAccount.name,
          amount: 10.00,
        },
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, "Unauthorized");
    });

    it("should return 401 when API key is invalid", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "x-api-key": "invalid-key",
          "content-type": "application/json",
        },
        payload: {
          account: testAccount.name,
          amount: 10.00,
        },
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, "Unauthorized");
    });

    it("should return 400 when account name is invalid", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "x-api-key": app.config.API_KEY,
          "content-type": "application/json",
        },
        payload: {
          account: "NonExistentAccount12345",
          amount: 10.00,
        },
      });

      assert.strictEqual(response.statusCode, 400);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, "Invalid account");
      assert.ok(body.message.includes("not found"), "Should mention account not found");
    });

    it("should return 400 when account field is missing", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "x-api-key": app.config.API_KEY,
          "content-type": "application/json",
        },
        payload: {
          amount: 10.00,
          payee: "Test",
        },
      });

      assert.strictEqual(response.statusCode, 400);
    });

    it("should return 400 when type is invalid", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/transaction",
        headers: {
          "x-api-key": app.config.API_KEY,
          "content-type": "application/json",
        },
        payload: {
          account: testAccount.name,
          amount: 10.00,
          type: "invalid",
        },
      });

      assert.strictEqual(response.statusCode, 400);
    });
  });
});
