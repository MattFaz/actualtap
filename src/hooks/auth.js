module.exports = async (fastify, opts) => {
  fastify.addHook("preHandler", async (request, reply) => {
    const apiKey = request.headers["x-api-key"] || request.headers["X-API-KEY"];
    if (apiKey !== process.env.API_KEY) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }
  });
};
