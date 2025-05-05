import express from 'express'
import { Server } from 'socket.io'

const PORT = process.env.PORT || 4000

const app = express()

const expressServer = app.listen(PORT, () => {
  console.log(`listening on port http://localhost:${PORT}`)

})

const io = new Server(expressServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://127.0.0.1:3000']
  }
})


io.on('connection', socket => {
  console.log(`User ${socket.id} connected`)

  //Upon conection - only to use
  socket.emit('display message', 'Welcome to Chat App!')

  //Upon conection - to all others
  socket.broadcast.emit('display message', `User ${socket.id} connected`)

  // Listening for a message event
  socket.on('send message', data => {
    console.log(data)
    io.emit("display message", `${socket.id}: ${data}`)
  })

  // When user disconnects - to all others
  socket.on('disconnect', () => {
    socket.broadcast.emit('display message', `User ${socket.id} diconnected`)
  })

  // Listen for activity
  socket.on('send activity', (name) => {
    socket.broadcast.emit('display activity', name)
  })
})