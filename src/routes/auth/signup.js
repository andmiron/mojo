import * as argon2 from 'argon2'
import { randomBytes } from 'node:crypto'

export default function signupRoute(fastify, opts, done) {
   fastify.route({
      method: 'POST',
      url: '/signup',
      schema: {
         description: 'User signup route',
         body: {
            type: 'object',
            required: ['email', 'password'],
            additionalProperties: false,
            properties: {
               email: { type: 'string', format: 'email', maxLength: 255 },
               password: { type: 'string', minLength: 8, maxLength: 255 },
            },
         },
         response: {
            201: {
               description: 'User signup success',
               type: 'object',
               required: ['userId', 'email'],
               properties: {
                  userId: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
               },
            },
            400: {
               description: 'User signup failed',
               type: 'object',
               properties: {
                  success: { type: 'boolean', default: false },
                  message: { type: 'string' },
                  value: { type: 'string', format: 'email' },
               },
            },
         },
      },
      handler: async function (request, reply) {
         const { email, password } = request.body

         try {
            const hashedPassword = await argon2.hash(password)
            const confirmationToken = randomBytes(32).toString('hex')

            const result = await fastify.pg.query(
               `INSERT INTO users (email, password, confirmation_token) VALUES ($1,$2,$3) RETURNING id`,
               [email, hashedPassword, confirmationToken]
            )
            const userId = result.rows[0].id

            //    TODO confirmation link send

            await reply.code(201).send({
               userId,
               email,
            })
         } catch (err) {
            if (err.code === '23505') {
               await reply
                  .code(400)
                  .send({ success: false, message: err.message, value: email })
            } else {
               await reply.send(err)
            }
         }
      },
   })
   done()
}
