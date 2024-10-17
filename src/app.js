import dotenv from 'dotenv'
dotenv.config()
import { randomUUID } from 'node:crypto'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import postgresPlugin from '@fastify/postgres'
import healthCheckRoute from './routes/healthCheck.js'
import signupRoute from './routes/auth/signup.js'
import loginRoute from './routes/auth/login.js'

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

   app.register(fastifyCookie)
   app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET,
   })

   app.register(healthCheckRoute)
   app.register(signupRoute, { prefix: '/api/v1/auth' })
   app.register(loginRoute, { prefix: '/api/v1/auth' })

   await app.ready()
   app.swagger()

   return app
}
