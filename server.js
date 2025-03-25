const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config(); // Подключаем .env

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000; // Используем порт из .env или 4000
const CLIENT_URL = process.env.CLIENT_URL || "https://movie-alixan.netlify.app/"; // Клиентский URL

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL, // Теперь можно менять без редактирования кода
    methods: ["GET", "POST"]
  }
});

let onlineUsers = {};
let roomUsers = new Set();
let chatHistory = [];

io.on("connection", (socket) => {
  console.log("Пользователь подключился", socket.id);

  socket.on("join", (name) => {
    onlineUsers[socket.id] = name;
    io.emit("updateUsers", Object.values(onlineUsers));
  });

  socket.on("enterRoom", (name) => {
    roomUsers.add(name);
    io.emit("updateRoomUsers", Array.from(roomUsers));
    socket.emit("chatHistory", chatHistory);
  });

  socket.on("leaveRoom", (name) => {
    roomUsers.delete(name);
    io.emit("updateRoomUsers", Array.from(roomUsers));
  });

  socket.on("sendMessage", (message) => {
    chatHistory.push(message);
    io.emit("receiveMessage", message);
  });

  // Запуск фильма
  socket.on("startMovie", () => {
    io.emit("playMovie");
  });

  // Остановка фильма
  socket.on("pauseMovie", () => {
    io.emit("pauseMovie");
  });

  socket.on("disconnect", () => {
    if (onlineUsers[socket.id]) {
      roomUsers.delete(onlineUsers[socket.id]);
      delete onlineUsers[socket.id];
      io.emit("updateUsers", Object.values(onlineUsers));
      io.emit("updateRoomUsers", Array.from(roomUsers));
    }
    console.log("Пользователь отключился", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
