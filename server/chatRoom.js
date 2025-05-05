import { io } from './index.js'

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
    io.to(user.room).emit('display users', { users: getUsersInRoom(user.room)})

    // update all active rooms
    io.emit('display rooms', { rooms: getAllActiveRooms() })
  })

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
