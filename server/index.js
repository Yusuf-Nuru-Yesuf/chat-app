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

const ADMIN = 'Admin'

const UsersState = {
  users: [],
  setUser: function (newUsersArray) {
    this.users = newUsersArray
  },
}

io.on('connection', socket => {
  console.log(`User ${socket.id} connected`)

  //Upon conection - only to user
  socket.emit('display message', builMsg(ADMIN, `Welcome to the chat!`))

  socket.on('join chat room', ({ name, room }) => {
    
    // leave previous room
    const prevRoom = getUser(socket.id)?.room
    if (prevRoom) {
      socket.leave(prevRoom)
      io.to(prevRoom).emit('display message', builMsg(ADMIN, `${name} has left the room`))
      io.to(prevRoom).emit('display users', getUsersInRoom(prevRoom))
    }

    // activate user and join new room
    const user = activateUser(socket.id, name, room)
    socket.join(user.room)

    // to user who just joined 
    socket.emit('display message', builMsg(ADMIN, `Welcome to the ${user.room} room!`))

    // to all others in the room
    socket.broadcast.to(user.room).emit('display message', builMsg(ADMIN, `${user.name} has joined the room`))

    // update users in room
    io.to(user.room).emit('display users', { users: getUsersInRoom(user.room) })

    // update all active rooms
    io.emit('display rooms', { rooms: getAllActiveRooms() })
  })

  // When user disconnects - to all others
  socket.on('disconnect', () => {
    const user = getUser(socket.id)
    userLeavesApp(socket.id)
    
    if(user) {
      io.to(user.room).emit('display message', builMsg(ADMIN, `${user.name} has left the room`))

      io.to(user.room).emit('display users', { users: getUsersInRoom(user.room) })

      io.emit('display rooms', { rooms : getAllActiveRooms() })
    }
    
    console.log(`User ${socket.id} disconnected`)
  })

  // Listening for a message event
  socket.on('send message', ({ name, text }) => {
    const room = getUser(socket.id)?.room
    if (room) {
      io.to(room).emit("display message", builMsg(name, text))
    }
  })

  // Listen for activity
  socket.on('send activity', (name) => {
    const room = getUser(socket.id)?.room
    if(room) {
      socket.broadcast.to(room).emit('display activity', name)
    }
  })
})

function builMsg(name, text) {
  return {
    name,
    text,
    time: new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    }).format(new Date()),
  }
}

// User Functions
function activateUser(id, name, room) {
  const user = { id, name, room }
  UsersState.setUser([
    ...UsersState.users.filter(user => user.id !== id), 
    user,
  ])
  return user
}

function userLeavesApp(id) {
  UsersState.setUser(
    UsersState.users.filter(user => user.id !== id)
  )
}

function getUser(id) {
  return UsersState.users.find(user => user.id === id)
}

function getUsersInRoom(room) {
  return UsersState.users.filter(user => user.room === room)
}

function getAllActiveRooms() {
  return Array.from(new Set(UsersState.users.map(user => user.room)))
}
