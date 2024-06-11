const actual = require("@actual-app/api");
const fp = require("fastify-plugin");
const path = require("path");
const fs = require("fs");

const actualConnector = fp(async (fastify, options) => {
    // Path to the data directory in the root
    const dataDir = path.join(process.cwd(), "data");

    // Ensure the data directory exists
    if (!fs.existsSync(dataDir)) {
        fastify.log.info(`Data directory does not exist. Creating: ${dataDir}`);
        fs.mkdirSync(dataDir, { recursive: true });
    } else {
        fastify.log.info(`Data directory exists: ${dataDir}`);
    }

    try {
        await actual.init({
            dataDir: dataDir,
            serverURL: process.env.ACTUAL_URL,
            password: process.env.ACTUAL_PASSWORD,
        });

        await actual.downloadBudget(process.env.ACTUAL_BUDGET_ID);

        fastify.decorate("actual", actual);

        fastify.addHook("onClose", async (done) => {
            await actual.close();
            done();
        });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
});

module.exports = actualConnector;
