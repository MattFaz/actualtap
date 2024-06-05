module.exports = async (fastify, opts) => {
    fastify.get('/', function (request, reply) {
        reply.send({ hello: 'world' });
    });
};