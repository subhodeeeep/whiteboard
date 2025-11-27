// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let drawingHistory = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send full history to newly connected client
  socket.emit('loadHistory', drawingHistory);

  socket.on('draw', (data) => {
    // keep socket id for history
    data.socketId = data.socketId || socket.id;
    drawingHistory.push(data);

    // broadcast to everyone *except* the emitter (prevent duplicate local draws)
    socket.broadcast.emit('ondraw', data);
  });

  socket.on('clearCanvas', () => {
    drawingHistory = [];
    // broadcast canvas cleared to everyone except emitter (emitter usually already cleared locally)
    socket.broadcast.emit('canvasCleared');
  });

  socket.on('disconnect', (reason) => {
    console.log('A user disconnected:', socket.id, 'Reason:', reason);
  });
});

app.use(express.static('public'));

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
