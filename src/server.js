const fastify = require("fastify")({ logger: true, ignoreTrailingSlash: true });

// Global authentication hook - registered at root level to apply to all routes
fastify.addHook("preHandler", async (request, reply) => {
  const apiKey = request.headers["x-api-key"] || request.headers["X-API-KEY"];
  if (apiKey !== process.env.API_KEY) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }
});

// Modular function registrations
async function registerModules() {
  await fastify.register(require("./plugins/env"));
  await fastify.register(require("@fastify/cors"), {
    methods: ["POST"],
  });
  await fastify.register(require("./plugins/actualConnector"));
  await fastify.register(require("./routes/transaction"));
}

// Global Error Handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(error.statusCode || 500).send({ error: error.message || "An error occurred" });
});

// Start the server
const start = async () => {
  try {
    fastify.log.info("Starting server v1.0.10");
    await registerModules();
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
