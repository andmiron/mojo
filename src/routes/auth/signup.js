import * as argon2 from 'argon2'
import { randomBytes } from 'node:crypto'
import { constructConfirmationLink } from '../../utils/email.js'

export default function signupRoute(fastify, opts, done) {
   fastify.route({
      method: 'POST',
      url: '/signup',
      schema: {
         description: 'User signup route',
         tags: ['auth'],
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
                  status: { type: 'boolean', default: true },
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
         const hashedPassword = await argon2.hash(password)
         const confirmationToken = randomBytes(32).toString('hex')
         try {
            const newUserId = await fastify.pg.transact(async (client) => {
               const insertUserQuery = `INSERT INTO users (email, password, confirmation_token) VALUES ($1,$2,$3) RETURNING id`
               const queryResult = await client.query(insertUserQuery, [
                  email,
                  hashedPassword,
                  confirmationToken,
               ])
               const newUserId = queryResult.rows[0].id
               const confirmationLink = constructConfirmationLink(
                  request.protocol,
                  request.host,
                  confirmationToken
               )
               const mailInfo = await fastify.mailer.sendMail({
                  from: 'MOJO',
                  to: email,
                  subject: 'Signup verification process',
                  text: confirmationLink,
                  html: `<a>${confirmationLink}</a>`,
               })
               request.log.info(
                  `Mail has been sent successfully. ID: ${mailInfo.messageId}`
               )
               return newUserId
            })

            await reply.code(201).send({
               success: true,
               email,
               userId: newUserId,
            })
         } catch (err) {
            if (err.code === '23505') {
               request.log.error(err.message)
               await reply
                  .code(400)
                  .send({ success: false, message: err.message, value: email })
            } else {
               request.log.error(err.message)
               await reply.send(err)
            }
         }
      },
   })
   done()
}
