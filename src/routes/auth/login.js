import * as argon2 from 'argon2'

export default function loginRoute(fastify, opts, done) {
   fastify.route({
      method: 'POST',
      url: '/login',
      schema: {
         description: 'User login route',
         tags: ['auth'],
         body: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
               email: { type: 'string', format: 'email', maxLength: 255 },
               password: { type: 'string', minLength: 8, maxLength: 255 },
               rememberMe: { type: 'boolean', default: false },
            },
         },
         response: {
            200: {
               description: 'User login success',
               type: 'object',
               properties: {
                  success: { type: 'boolean', default: true },
                  accessToken: { type: 'string' },
               },
            },
            400: {
               description: 'User login failed',
               type: 'object',
               properties: {
                  success: { type: 'boolean', default: false },
                  message: { type: 'string' },
               },
            },
         },
      },
      handler: async function (request, reply) {
         const { email, password: providedPassword, rememberMe } = request.body

         const userPasswordQueryResult = await fastify.pg.query(
            `SELECT password from users WHERE email=$1`,
            [email]
         )

         if (!userPasswordQueryResult.rows.length) {
            await reply.code(400).send({
               success: false,
               message: 'Invalid email or password',
            })
         }

         const hashedPassword = userPasswordQueryResult.rows[0].password
         const isPasswordValid = await argon2.verify(
            hashedPassword,
            providedPassword
         )

         if (!isPasswordValid)
            await reply.code(400).send({
               success: false,
               message: 'Invalid email or password',
            })

         const accessToken = fastify.jwt.sign(
            { email },
            { expiresIn: rememberMe ? '30d' : '1d' }
         )

         await reply
            .setCookie('accessToken', accessToken, {
               path: '/',
               httpOnly: true,
               maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
               sameSite: true,
            })
            .send({
               success: true,
               accessToken,
            })
      },
   })

   done()
}
