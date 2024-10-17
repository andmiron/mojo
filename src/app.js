import dotenv from 'dotenv'
dotenv.config()
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { randomUUID } from 'node:crypto'
import postgresPlugin from '@fastify/postgres'
import healthCheck from './routes/healthCheck.js'
import authRoutes from './routes/auth/index.js'

export default function (opts) {
   const app = fastify(opts)

   app.setGenReqId(() => randomUUID())

   app.setErrorHandler(async function (err, request, reply) {
      request.log.error({ err, stack: err.stack })
      if (err.validation) reply.code(err.status || 500)
      reply.send(err)
   })

   // app.setNotFoundHandler(async function (request, reply) {
   //    request.log.warn(`Route not found: ${request.method} ${request.url}`)
   //    reply.code(404)
   //    return { error: 'Resource not found!' }
   // })

   app.register(postgresPlugin, {
      connectionString: process.env.DB_CONN_STRING,
      ssl: {
         rejectUnauthorized: false,
      },
   })

   app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET,
   })

   app.register(healthCheck)
   app.register(authRoutes, { prefix: '/api/v1/auth' })

   return app
}
