<script setup>
import { io } from "socket.io-client";
import { ref, onMounted, computed, nextTick } from "vue";

const socket = io("http://localhost:4000");

const activityMsg = ref("")
const message = ref("")
const messages = ref([])
const name = ref("")
const room = ref("")
const users = ref([])
const rooms = ref([])
const chatDisplay = ref(null)

let activitTimer

// Send message
function sendMessage(e) {
  e.preventDefault()
  if (message.value.trim() && name.value.trim() && room.value.trim()) {
    socket.emit('send message', {
      name: name.value,
      text: message.value
    })
    message.value = ''
  }
}

// Join chat room
function joinChatRoom(e) {
  e.preventDefault()
  if (name.value.trim() && room.value.trim()) {
    socket.emit('join chat room', {
      name: name.value,
      room: room.value
    })
  }
}

// Emit typing activity
function onTyping() {
  socket.emit('send activity', name.value)
}

const getMessageClass = ({ name: sender }) => {
  if (sender === name.value) return 'post post--left'
  if (sender !== 'Admin') return 'post post--right'
  return 'post'
}

const formatMessage = ({ name: sender, text, time}) => {
  if (sender === 'Admin') {
    return `<div class="post__text">${text}</div>`
  }

  return `
    <div class="post__header ${sender === name.value ? 'post__header--user' : 'post__header--reply'}">
      <span class="post__header--name">${sender}</span>
      <span class="post__header--time">${time}</span>
    </div>
    <div class="post__text">${text}</div>
  `
}

const formattedUsers = computed(() => {
  if (!users.value.length) return ''
  return `<em>Users in ${room.value}:</em><br>${users.value.map(user => user.name).join(', ')}`
})

const formattedRooms = computed(() => {
  if (!rooms.value.length) return ''
  return `<em>Available rooms:</em><br>${rooms.value.map(room => room).join(', ')}`
})

onMounted(() => {
  socket.on('display message', (data) => {
    activityMsg.value = ''
    messages.value.push(data)
    nextTick(() => {
      if (chatDisplay.value) {
        chatDisplay.value.scrollTop = chatDisplay.value.scrollHeight
      }
    })
  })

  socket.on('display activity', (name) => {
    activityMsg.value = `${name} is typing...`

    clearTimeout(activitTimer)
    activitTimer = setTimeout(() => {
      activityMsg.value = ''
    }, 3000)
  })

  socket.on('display users', ({ users: u }) => {
    users.value = u
  })

  socket.on('display rooms', ({ rooms: r }) => {
    rooms.value = r
  })
})

</script>

<template>
  <main>
    <form class="form-join" @submit="joinChatRoom">
      <input type="text" id="name" placeholder="Your name" v-model="name" maxlength="8" size="5" required/>
      <input type="text" id="room" placeholder="Chat room" v-model="room" size="5" required/>
      <button type="submit" id="join">Join</button>
    </form>

    <ul class="chat-display" ref="chatDisplay">
      <li
        v-for="(message, index) in messages"
        :key="index"
        :class="getMessageClass(message)"
        v-html="formatMessage(message)"
      ></li>
    </ul>

    <p class="user-list" v-html="formattedUsers"></p>
    <p class="room-list" v-html="formattedRooms"></p>
    <p class="activity">{{ activityMsg }}</p>

    <form @submit="sendMessage" class="form-message">
      <input type="text" id="message" placeholder="Your message" v-model="message" @keypress="onTyping" required/>
      <button type="submit">Send</button>
    </form>

  </main>
</template>

<style>
.chat-display {
    background-color: #333;
    list-style-type: none;
    width: 100%;
    max-width: 600px;
    border-radius: 10px;
    margin: 1rem auto;
    padding: 0;
    display: flex;
    flex-flow: column;
    justify-content: left;
    overflow: auto;
    flex-grow: 1;
}

.post {
    background-color: #eee;
    border-radius: 10px;
    padding: 0 0 .25rem;
    margin: .5rem;
    overflow: hidden;
    flex-shrink: 0;
}

.post--left {
    width: 60%;
    align-self: flex-start;
}

.post--right {
    width: 60%;
    align-self: flex-end;
}

.post__header {
    color: #fff;
    padding: .25rem .5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: .5rem;
}

.post__header--user {
    background-color: blue;
}

.post__header--reply {
    background-color: purple;
}

.post__header--name {
    font-weight: bold;
}

.post__header--time {
    font-size: .8rem;
}

.post__text {
    margin-top: 5px;
    color: #333;
    padding: .25rem .5rem;
}

li {
  padding: 1rem;
}

.user-list,
.room-list,
.activity {
    width: 100%;
    min-height: 2.65rem;
    margin: 0 auto;
    max-width: 600px;
    padding: .75rem .25rem;
}

.activity {
    font-style: italic;
}
</style>


