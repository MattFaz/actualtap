const fastifyEnv = require("@fastify/env");

// Conditionally load .env only in development environments
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const schema = {
    type: "object",
    required: [
        "API_KEY",
        "ACTUAL_URL",
        "ACTUAL_PASSWORD",
        "ACTUAL_BUDGET_ID",
        "ACTUAL_DEFAULT_ACCOUNT_ID",
        "ACTUAL_BACKUP_PAYEE",
    ],
    properties: {
        API_KEY: { type: "string" },
        ACTUAL_URL: { type: "string" },
        ACTUAL_PASSWORD: { type: "string" },
        ACTUAL_BUDGET_ID: { type: "string" },
        ACTUAL_DEFAULT_ACCOUNT_ID: { type: "string" },
        ACTUAL_BACKUP_PAYEE: { type: "string" },
    },
};

const options = {
    schema: schema,
    data: process.env,
};

const validateEnvVars = () => {
    const requiredVars = schema.required;
    const missingVars = requiredVars.filter(
        (key) => !process.env[key] || process.env[key].trim() === ""
    );

    if (missingVars.length > 0) {
        throw new Error(
            `Missing or empty required environment variables: ${missingVars.join(
                ", "
            )}`
        );
    }
};

validateEnvVars();

module.exports = async (fastify, opts) => {
    try {
        await fastify.register(fastifyEnv, options);
    } catch (error) {
        fastify.log.error(
            `Failed to register environment variables: ${error.message}`
        );
        throw error;
    }
};
