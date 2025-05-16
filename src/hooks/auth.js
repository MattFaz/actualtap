module.exports = async (fastify, opts) => {
  fastify.addHook("preHandler", async (request, reply) => {
    if (request.headers["X-API-KEY"] !== process.env.API_KEY) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
};
