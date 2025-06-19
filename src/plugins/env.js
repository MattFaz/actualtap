const fastifyEnv = require("@fastify/env");

const schema = {
  type: "object",
  required: ["API_KEY", "ACTUAL_URL", "ACTUAL_PASSWORD", "ACTUAL_SYNC_ID"],
  properties: {
    API_KEY: { type: "string" },
    ACTUAL_URL: { type: "string" },
    ACTUAL_PASSWORD: { type: "string" },
    ACTUAL_SYNC_ID: { type: "string" },
  },
};

const options = {
  schema: schema,
  data: process.env,
};

const validateEnvVars = () => {
  const requiredVars = schema.required;
  const missingVars = requiredVars.filter((key) => !process.env[key] || process.env[key].trim() === "");

  if (missingVars.length > 0) {
    // TODO: remove this after a few months
    if (missingVars.includes("ACTUAL_SYNC_ID")) {
      throw new Error("v1.0.7 changed ACTUAL_BUDGET_ID to ACTUAL_SYNC_ID, please update your environment variables");
    }
    throw new Error(`Missing or empty required environment variables: ${missingVars.join(", ")}`);
  }
};

validateEnvVars();

module.exports = async (fastify, opts) => {
  try {
    await fastify.register(fastifyEnv, options);
  } catch (error) {
    fastify.log.error(`Failed to register environment variables: ${error.message}`);
    throw error;
  }
};
