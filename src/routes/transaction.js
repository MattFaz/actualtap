const transactionSchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        amount: { type: "number", minimum: 0, default: 0 },
        payee: { type: "string", default: "Unknown" },
        account: { type: "string" },
        notes: { type: "string" }
      },
      required: ["account"],
    },
  },
};

const createTransaction = (request) => {
  const { payee, amount, notes } = request.body;
  const transactionAmount = amount !== undefined ? -Math.round(amount * 100) : 0;

  return {
    payee_name: payee || "Unknown",
    amount: transactionAmount,
    notes: notes || "",
    date: new Date().toISOString().split("T")[0],
    cleared: false,
  };
};

const getAccountId = async (fastify, accountName) => {
  const accounts = await fastify.actual.getAccounts();
  const account = accounts.find((acc) => acc.name.toLowerCase() === accountName.toLowerCase());
  return { accountId: account?.id, accounts };
};

const handleTransactionResult = (result, transaction, reply, log) => {
  log.info("Result:", result);

  // addTransactions returns "ok" when successful
  if (result === "ok") {
    log.info("Transaction added successfully");
    return reply.send(transaction);
  }

  if (!result) {
    log.error("No result from addTransactions");
    return reply.code(500).send({ message: "Unknown error" });
  }

  // Handle error cases - check if result has error properties
  if (result.errors?.length > 0) {
    log.error(`Error adding transaction: ${result.errors}`);
    return reply.code(500).send({ message: result.errors });
  }

  log.error("Unexpected error: No transactions were added");
  return reply.code(500).send({ message: "No transactions were added", debug: typeof result });
};

module.exports = async (fastify, opts) => {
  fastify.post("/transaction", transactionSchema, async (request, reply) => {
    request.log.info(`Received transaction request with body: ${JSON.stringify(request.body)}`);
    try {
      const transaction = createTransaction(request);
      const accountName = request.body.account;
      const { accountId, accounts } = await getAccountId(fastify, accountName);

      if (!accountId) {
        reply.code(400).send({
          error: "Invalid account",
          message: `Account "${accountName}" not found. Available accounts: ${accounts.map((a) => a.name).join(", ")}`,
        });
        return;
      }

      // const result = await fastify.actual.importTransactions(accountId, [transaction]);
      const result = await fastify.actual.addTransactions(accountId, [transaction]);
      handleTransactionResult(result, transaction, reply, fastify.log);
    } catch (err) {
      fastify.log.error(`Error importing transaction: ${err.message}`);
      reply.code(400).send({
        error: "Failed to import transaction",
        message: err.message,
      });
    }
  });
};
