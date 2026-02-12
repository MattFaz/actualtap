const fastify = require("fastify")({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
        ignore: "hostname,pid",
        singleLine: false,
        hideObject: false,
      },
    },
  },
  ajv: {
    customOptions: {
      allowUnionTypes: true,
    },
  },
  routerOptions: {
    ignoreTrailingSlash: true,
  },
  pluginTimeout: 120000, // 120 seconds to match Actual API initialization timeout and retries
});
const { version } = require("../package.json");

// Modular function registrations
async function registerModules() {
  await fastify.register(require("./plugins/env"));

  // Global authentication hook - registered after env to access fastify.config
  fastify.addHook("preHandler", async (request, reply) => {
    if (request.url === "/health" || request.url.startsWith("/health?")) {
      return;
    }

    const apiKey = request.headers["x-api-key"];
    if (apiKey !== fastify.config.API_KEY) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }
  });

  await fastify.register(require("@fastify/cors"), {
    methods: ["POST"],
  });
  await fastify.register(require("./plugins/actualConnector"));
  await fastify.register(require("./routes/transaction"));
  await fastify.register(require("./routes/health"));
}

// Global Error Handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(error.statusCode || 500).send({ error: error.message || "An error occurred" });
});

// Start the server
const start = async () => {
  try {
    fastify.log.info(`Starting ActualTap v${version}`);
    await registerModules();
    await fastify.listen({ port: 3001, host: "::" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();