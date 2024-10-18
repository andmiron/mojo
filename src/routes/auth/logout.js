export default function logoutRoute(fastify, opts, done) {
   fastify.route({
      method: 'POST',
      url: '/logout',
      schema: {
         description: 'User logout route',
         tags: ['auth'],
         headers: {
            type: 'object',
            properties: {
               Authorization: {
                  type: 'string',
                  description: 'Bearer JWT token in the format "Bearer token"',
               },
               Cookie: {
                  type: 'string',
                  description:
                     'Cookie containing the JWT token if using cookie-based auth',
               },
            },
            required: ['Authorization'],
         },
         response: {
            200: {
               description: 'User successfully logged out',
               type: 'object',
               properties: {
                  success: { type: 'boolean', default: true },
                  message: { type: 'string' },
               },
            },
            401: {
               description: 'User is not logged in',
               type: 'object',
               properties: {
                  success: { type: 'boolean', default: false },
                  message: { type: 'string' },
               },
            },
         },
      },
      onRequest: [fastify.authenticate],
      handler: async function (request, reply) {
         try {
            reply.clearCookie('accessToken').send({
               success: true,
               message: 'Logged out successfully',
            })
         } catch (err) {
            reply.code(500).send({
               success: false,
               message: 'Error during logout',
            })
         }
      },
   })
   done()
}
