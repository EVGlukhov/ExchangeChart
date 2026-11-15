import express from 'express'
import dotenv from 'dotenv'
import testnetRouter from './routes/testnet'

dotenv.config({ path: '.env.local' })

const app = express()
app.use(express.json({ limit: '10kb' }))
app.use('/api/testnet', testnetRouter)

const port = Number(process.env.PORT ?? 3000)

app.listen(port, '127.0.0.1', () => {
  console.log(`API listening on http://localhost:${port}`)
})
