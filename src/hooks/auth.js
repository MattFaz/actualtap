module.exports = async (fastify, opts) => {
    fastify.addHook("preHandler", async (request, reply) => {
        if (request.headers["api_key"] !== process.env.API_KEY) {
            reply.code(401).send({ error: "Unauthorized" });
        }
    });
};
