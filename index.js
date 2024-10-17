import buildApp from './src/app.js'
import loggerOpts from './src/logger.js'
import closeWithGrace from 'close-with-grace'

const app = await buildApp({
   logger: loggerOpts,
})

const port = process.env.PORT || 3000
const host = process.env.HOST || '127.0.0.1'

closeWithGrace(async ({ signal, err }) => {
   if (err) {
      app.log.error({ err }, 'Server closing due to error...')
   } else {
      app.log.info(`${signal} received. Shutting down...`)
   }
   await app.close()
})

await app.listen({ port, host })
