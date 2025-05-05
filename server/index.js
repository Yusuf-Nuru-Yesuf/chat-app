import express from 'express'
import { Server } from 'socket.io'

const PORT = process.env.PORT || 4000

const app = express()

const expressServer = app.listen(PORT, () => {
  console.log(`listening on port http://localhost:${PORT}`)
})

export const io = new Server(expressServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://127.0.0.1:3000']
  }
})
