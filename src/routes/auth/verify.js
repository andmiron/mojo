export default function verifyRoute(fastify, opts, done) {
   fastify.route({
      method: 'POST',
      url: '/verify',
      schema: {
         description: 'User verification through email',
         tags: ['auth'],
         body: {
            type: 'object',
            properties: {
               token: { type: 'string' },
            },
         },
         response: {
            200: {
               description: 'Email successfully verified',
               type: 'object',
               properties: {
                  success: { type: 'boolean', default: true },
                  message: { type: 'string' },
                  userId: { type: 'string', format: 'uuid' },
               },
            },
            400: {
               description: 'Email verification failure',
               type: 'object',
               properties: {
                  success: { type: 'boolean', default: false },
                  message: { type: 'string' },
               },
            },
         },
      },
      handler: async function (request, reply) {
         const { token: confirmationToken } = request.body
         const verifyUserQuery = `
            UPDATE users
            SET is_confirmed=TRUE, confirmation_token=NULL, confirmation_token_expires_at=NULL
            WHERE confirmation_token=$1
            AND confirmation_token_expires_at > NOW()
            AND is_confirmed=FALSE
            RETURNING id;
         `
         const queryResult = await fastify.pg.query(verifyUserQuery, [
            confirmationToken,
         ])

         if (!queryResult.rows.length)
            await reply.code(400).send({
               success: false,
               message: 'Invalid or expired token provided',
            })

         const verifiedUserId = queryResult.rows[0].id
         await reply.send({
            success: true,
            message: 'Successfully verified',
            userId: verifiedUserId,
         })
      },
   })
   done()
}
