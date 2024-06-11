const fastify = require("fastify")({ logger: true });

// Modular function registrations
async function registerModules() {
    await fastify.register(require("./plugins/env"));
    await fastify.register(require("@fastify/cors"), {
        methods: ["GET", "POST"],
    });
    await fastify.register(require("./plugins/actualConnector"));
    await fastify.register(require("./hooks/auth"));
    await fastify.register(require("./routes/index"));
    await fastify.register(require("./routes/transaction"));
}

// Global Error Handler
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply
        .status(error.statusCode || 500)
        .send({ error: error.message || "An error occurred" });
});

// Start the server
const start = async () => {
    try {
        await registerModules();
        await fastify.listen({ port: 3001, host: "0.0.0.0" });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
