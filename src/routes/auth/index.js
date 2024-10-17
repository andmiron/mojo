import * as argon2 from 'argon2'
import { randomBytes } from 'node:crypto'

export default function (fastify, opts, done) {
   fastify.route({
      method: 'POST',
      url: '/signup',
      schema: {
         description: 'User signup request schema',
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
               type: 'object',
               required: ['userId', 'email'],
               properties: {
                  userId: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
               },
            },
         },
      },
      handler: async function (request, reply) {
         const { email, password } = request.body
         try {
            const hashedPassword = await argon2.hash(password)
            const confirmationHash = randomBytes(32).toString('hex')
            const result = await fastify.pg.query(
               `INSERT INTO users (email, password, confirmation_token) VALUES ($1,$2,$3) RETURNING id`,
               [email, hashedPassword, confirmationHash]
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

   fastify.route({
      method: 'POST',
      url: '/login',
      schema: {
         description: 'User login request schema',
         body: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
               email: { type: 'string', format: 'email', maxLength: 255 },
               password: { type: 'string', minLength: 8, maxLength: 255 },
               rememberMe: { type: 'boolean', default: false },
            },
         },
      },
      handler: async function (request, reply) {
         const { email, password: providedPassword } = request.body

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

         const token = fastify.jwt.sign({
            email,
         })

         await reply.send({
            success: true,
            token,
         })
      },
   })

   // fastify.route({
   //    method: 'POST',
   //    url: '/logout',
   //    schema: {},
   //    handler: async function (request, reply) {},
   // })
   //
   // fastify.route({
   //    method: 'POST',
   //    url: '/confirmation',
   //    schema: {},
   //    handler: async function (request, reply) {},
   // })

   done()
}
