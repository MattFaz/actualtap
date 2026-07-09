const { randomUUID } = require("crypto");

const transactionSchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        amount: { type: ["number", "string"], default: 0 },
        payee: { type: "string", default: "Unknown" },
        account: { type: "string" },
        notes: { type: "string" },
        date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        type: {
          type: "string",
          enum: ["payment", "deposit"],
          default: "payment",
        },
      },
      required: ["account"],
    },
  },
};

// The schema pattern guarantees YYYY-MM-DD shape; this catches impossible
// dates like 2026-02-31 that a Date round-trip silently rolls over
const isValidDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const createTransaction = (request) => {
  const { payee, amount: rawAmount, notes, date, type = "payment" } = request.body;
  const amount = typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;
  const isDeposit = type === "deposit";
  const transactionAmount = amount !== undefined && !isNaN(amount) ? Math.round(amount * 100) * (isDeposit ? 1 : -1) : 0;

  return {
    id: randomUUID(),
    payee_name: payee || "Unknown",
    amount: transactionAmount,
    notes: notes || "",
    date: date || new Date().toLocaleDateString('en-CA'),
    cleared: false,
  };
};

const getAccountId = async (fastify, accountName) => {
  const accounts = await fastify.actual.getAccounts();
  const account = accounts.find((acc) => acc.name.toLowerCase() === accountName.toLowerCase());
  return { accountId: account?.id, accounts };
};

module.exports = async (fastify, opts) => {
  fastify.post("/transaction", transactionSchema, async (request, reply) => {
    request.log.info(`Received transaction request with body: ${JSON.stringify(request.body)}`);

    if (request.body.date && !isValidDate(request.body.date)) {
      return reply.code(400).send({
        error: "Invalid date",
        message: `"${request.body.date}" is not a valid calendar date. Expected format: YYYY-MM-DD`,
      });
    }

    const transaction = createTransaction(request);
    const accountName = request.body.account;
    const { accountId, accounts } = await getAccountId(fastify, accountName);

    if (!accountId) {
      return reply.code(400).send({
        error: "Invalid account",
        message: `Account "${accountName}" not found. Available accounts: ${accounts.map((a) => a.name).join(", ")}`,
      });
    }

    const result = await fastify.actual.addTransactions(accountId, [transaction]);

    if (result !== "ok") {
      const errorMessage = result?.errors ? result.errors.join(", ") : JSON.stringify(result);
      throw new Error(`Failed to add transaction: ${errorMessage}`);
    }

    fastify.log.info("Transaction added successfully");

    // Explicitly sync to the server so we catch errors (e.g. expired auth)
    // before responding, rather than returning 200 with a silent sync failure
    try {
      await fastify.actual.sync();
      fastify.log.info("Sync completed successfully");
    } catch (syncErr) {
      fastify.log.error(`Sync failed after adding transaction: ${syncErr.message}`);
      return reply.code(500).send({
        error: "Sync failed",
        message: "Transaction was saved locally but failed to sync to the server. It may be lost on restart.",
      });
    }

    return reply.send(transaction);
  });
};