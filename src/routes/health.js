const { version } = require("../../package.json");

module.exports = async (fastify, opts) => {
  fastify.get("/health", async (request, reply) => {
    return { status: "ok", version };
  });
};
