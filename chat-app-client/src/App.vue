<script setup>
import { io } from "socket.io-client";
import { ref } from "vue";

const socket = io("http://localhost:4000");

const activity = ref("")
const message = ref("")
const messages = ref([])
const name = ref("")
const chatRoom = ref("")

// Send message
function sendMessage(e) {
  e.preventDefault()
  if (message.value.trim() && name.value.trim() && chatRoom.value.trim()) {
    socket.emit('send message', {
      name: name.value,
      chatRoom: chatRoom.value,
      message: message.value
    })
    message.value = ''
  }
}

// handle incoming messages
socket.on('display message', (data) => {
  activity.value = ''
  messages.value.push(data)
})

// Handle activity
let timeout
socket.on('display activity', (name) => {
  activity.value = `${name} is typing...`

  clearTimeout(timeout)
  timeout = setTimeout(() => {
    activity.value = ''
  }, 3000)
})

// Emit typing activity
function onTyping() {
  socket.emit('send activity', name.value)
}

</script>

<template>
  <main>
    <form class="form-join" @submit="joinChatRoom">
      <input type="text" id="name" placeholder="Your name" v-model="name" maxlength="8" size="5" required/>
      <input type="text" id="room" placeholder="Chat room" v-model="chatRoom" size="5" required/>
      <button type="submit" id="join">Join</button>
    </form>

    <ul class="chat-display">
      <li v-for="message in messages" :key="message">{{ message }}</li>
    </ul>

    <p class="user-list"></p>
    <p class="room-list"></p>
    <p class="activity">{{ activity }}</p>

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


