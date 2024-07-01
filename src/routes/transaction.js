const transactionSchema = {
    schema: {
        body: {
            type: "object",
            properties: {
                amount: { type: "number", minimum: 0.01 },
                merchant: { type: "string" },
            },
            anyOf: [{ required: ["merchant"] }, { required: ["amount"] }],
        },
    },
};

const createTransaction = (request) => {
    const { merchant, amount } = request.body;

    const payee_name = merchant || process.env.ACTUAL_BACKUP_PAYEE;
    const transactionAmount =
        amount !== undefined ? -Math.round(amount * 100) : 0;

    return {
        payee_name,
        amount: transactionAmount,
        cleared: false,
        date: new Date().toISOString().split("T")[0],
        imported_id: `${new Date().getTime()}`,
    };
};

const handleTransactionResult = (result, transaction, reply, log) => {
    if (result && result.errors) {
        log.error(`Error adding transaction: ${result.errors}`);
        reply.code(500).send({ message: result.errors });
    } else if (result && result.added && result.added.length > 0) {
        log.info(`Transaction added: ${JSON.stringify(result.added[0])}`);
        transaction.actual_id = result.added[0];
        reply.send(transaction);
    } else if (result && result.updated && result.updated.length > 0) {
        log.info(`Transaction updated: ${JSON.stringify(result.updated[0])}`);
        transaction.actual_id = result.updated[0];
        reply.send(transaction);
    } else {
        log.error("Unexpected error: No result from addTransactions");
        reply.code(500).send({ message: "Unknown error" });
    }
};

module.exports = async (fastify, opts) => {
    fastify.post("/transaction", transactionSchema, async (request, reply) => {
        request.log.info(
            `Received transaction request with body: ${JSON.stringify(
                request.body
            )}`
        );
        try {
            const transaction = createTransaction(request);
            const result = await fastify.actual.importTransactions(
                process.env.ACTUAL_DEFAULT_ACCOUNT_ID,
                [transaction]
            );
            handleTransactionResult(result, transaction, reply, fastify.log);
        } catch (err) {
            fastify.log.error(`Error importing transaction: ${err.message}`);
            reply.code(400).send({
                error: "Faield to import transaction",
                message: err.message,
            });
        }
    });
};
