import dotenv from 'dotenv'
dotenv.config()
import { randomUUID } from 'node:crypto'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import postgresPlugin from '@fastify/postgres'
import fastifyMailer from 'fastify-mailer'
import fastifyCors from '@fastify/cors'
import fastifyRateLimit from '@fastify/rate-limit'
import healthCheckRoute from './routes/healthCheck.js'
import signupRoute from './routes/auth/signup.js'
import loginRoute from './routes/auth/login.js'
import logoutRoute from './routes/auth/logout.js'
import verifyRoute from './routes/auth/verify.js'

export default async function (opts) {
   const app = fastify(opts)

   app.setGenReqId(() => randomUUID())

   app.setErrorHandler(async function (err, request, reply) {
      request.log.error({ err, stack: err.stack })
      if (err.validation) reply.code(err.status || 500)
      reply.send(err)
   })

   const swaggerOptions = {
      swagger: {
         info: {
            title: 'MOJO',
            description: 'Documentation for API endpoints.',
            version: '1.0.0',
         },
         tags: [
            { name: 'auth', description: 'Authentication related end-points' },
            {
               name: 'healthcheck',
               description: 'API and database health check',
            },
         ],
         host: 'localhost',
         schemes: ['http', 'https'],
         consumes: ['application/json'],
         produces: ['application/json'],
      },
   }

   const swaggerUiOptions = {
      routePrefix: '/docs',
      exposeRoute: true,
   }

   app.register(swagger, swaggerOptions)
   app.register(swaggerUI, swaggerUiOptions)

   app.register(postgresPlugin, {
      connectionString: process.env.DB_CONN_STRING,
      ssl: {
         rejectUnauthorized: false,
      },
   })

   app.register(fastifyCors)
   app.register(fastifyRateLimit)
   app.register(fastifyCookie)
   app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET,
      cookie: {
         cookieName: 'accessToken',
         signed: false,
      },
   })

   app.register(fastifyMailer, {
      transport: {
         host: process.env.SMTP_HOST,
         port: process.env.SMTP_PORT,
         auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD,
         },
      },
   })

   app.decorate('authenticate', async function (request, reply) {
      try {
         await request.jwtVerify()
      } catch (err) {
         reply.code(401).send({
            success: false,
            message: err.message,
         })
      }
   })

   app.register(healthCheckRoute)
   app.register(signupRoute, { prefix: '/api/v1/auth' })
   app.register(loginRoute, { prefix: '/api/v1/auth' })
   app.register(logoutRoute, { prefix: '/api/v1/auth' })
   app.register(verifyRoute, { prefix: '/api/v1/auth' })

   await app.ready()
   app.swagger()

   return app
}
