import express from 'express'
import dotenv from 'dotenv'
import testnetRouter from './routes/testnet.js'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: '.env.local' })

const app = express()
app.use(express.json({ limit: '10kb' }))
app.use('/api/testnet', testnetRouter)

const webDistPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../web/dist')

app.use(express.static(webDistPath))

app.use((req, res, next) => {
  const isApiRequest = req.path === '/api' || req.path.startsWith('/api/')

  if (req.method !== 'GET' || isApiRequest) {
    return next()
  }

  res.sendFile(resolve(webDistPath, 'index.html'), (error) => {
    if (error) next(error)
  })
})

const port = Number(process.env.PORT ?? 3000)

app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on port ${port}`)
})
