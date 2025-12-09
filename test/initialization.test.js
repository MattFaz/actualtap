const { describe, it } = require("node:test");
const assert = require("node:assert");
const fastify = require("fastify");

/**
 * Build server with custom env overrides for testing initialization failures.
 */
async function buildServerWithEnv(envOverrides) {
  const app = fastify({ logger: false });

  // Custom env plugin with overrides
  const originalEnv = { ...process.env };
  Object.assign(process.env, envOverrides);

  try {
    await app.register(require("../src/plugins/env"));
    await app.register(require("../src/plugins/actualConnector"));
  } finally {
    // Restore original env
    Object.keys(envOverrides).forEach((key) => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  }

  return app;
}

describe("Initialization failures", () => {
  it("should fail with invalid ACTUAL_URL", async () => {
    await assert.rejects(
      async () => {
        await buildServerWithEnv({
          ACTUAL_URL: "not-a-valid-url",
        });
      },
      (err) => {
        assert.ok(
          err.message.includes("Invalid ACTUAL_URL") || err.message.includes("URL"),
          `Expected URL error, got: ${err.message}`
        );
        return true;
      }
    );
  });

  it("should fail with wrong ACTUAL_PASSWORD", async () => {
    await assert.rejects(
      async () => {
        await buildServerWithEnv({
          ACTUAL_PASSWORD: "definitely-wrong-password-12345",
        });
      },
      (err) => {
        assert.ok(
          err.message.includes("password") ||
            err.message.includes("Authentication") ||
            err.message.includes("auth"),
          `Expected auth error, got: ${err.message}`
        );
        return true;
      }
    );
  });

  it("should fail with invalid ACTUAL_SYNC_ID", async () => {
    await assert.rejects(
      async () => {
        await buildServerWithEnv({
          ACTUAL_SYNC_ID: "00000000-0000-0000-0000-000000000000",
        });
      },
      (err) => {
        // May get "Budget 'x' not found" or auth error with "no budgets found"
        assert.ok(
          err.message.includes("not found") ||
          err.message.includes("Budget") ||
          err.message.toLowerCase().includes("budget"),
          `Expected budget-related error, got: ${err.message}`
        );
        return true;
      }
    );
  });
});
