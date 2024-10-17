export default function (fastify, opts, done) {
   fastify.get(
      '/health',
      {
         schema: {
            response: {
               200: {
                  type: 'object',
                  properties: {
                     status: { type: 'string' },
                     message: { type: 'string' },
                  },
               },
               500: {
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
