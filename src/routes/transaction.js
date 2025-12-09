const { randomUUID } = require("crypto");

const transactionSchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        amount: { type: "number", default: 0 },
        payee: { type: "string", default: "Unknown" },
        account: { type: "string" },
        notes: { type: "string" },
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

const createTransaction = (request) => {
  const { payee, amount, notes, type = "payment" } = request.body;
  const isDeposit = type === "deposit";
  const transactionAmount = amount !== undefined ? Math.round(amount * 100) * (isDeposit ? 1 : -1) : 0;

  return {
    id: randomUUID(),
    payee_name: payee || "Unknown",
    amount: transactionAmount,
    notes: notes || "",
    date: new Date().toLocaleDateString('en-CA'),
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
    
    if (result === "ok") {
      fastify.log.info("Transaction added successfully");
      return reply.send(transaction);
    }
    
    // If not "ok", it's an error. Throwing will be caught by global error handler (500)
    const errorMessage = result?.errors ? result.errors.join(", ") : JSON.stringify(result);
    throw new Error(`Failed to add transaction: ${errorMessage}`);
  });
};