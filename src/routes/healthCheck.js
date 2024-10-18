export default function (fastify, opts, done) {
   fastify.get(
      '/health',
      {
         schema: {
            description: 'Health check request',
            tags: ['health-check'],
            response: {
               200: {
                  description: 'API and DB are healthy',
                  type: 'object',
                  properties: {
                     status: { type: 'string' },
                     message: { type: 'string' },
                  },
               },
               500: {
                  description: 'API or DB error',
                  type: 'object',
                  properties: {
                     status: { type: 'string' },
                     message: { type: 'string' },
                  },
               },
            },
         },
      },
      async (request, reply) => {
         try {
            const client = await fastify.pg.connect()
            await client.query('SELECT 1')
            client.release()
            await reply.send({
               status: 'OK',
               message: 'API and database are ok',
            })
         } catch (err) {
            await reply
               .code(500)
               .send({ status: 'ERROR', message: err.message })
         }
      }
   )
   done()
}
