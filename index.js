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

let drawingHistory = []; // array of point objects { x, y, isNewStroke, tool, lineWidth, color, socketId, strokeId, ts }

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send full history to newly connected client
  socket.emit('loadHistory', drawingHistory);

  socket.on('draw', (data) => {
    // keep socket id for history
    data.socketId = data.socketId || socket.id;
    data.strokeId = data.strokeId || ('stroke-' + Date.now() + '-' + Math.floor(Math.random()*100000));
    data.ts = Date.now();

    drawingHistory.push(data);

    // broadcast to everyone *except* the emitter (prevent duplicate local draws)
    socket.broadcast.emit('ondraw', data);
  });

  // Accept a bundle of points (used for redo or pasting a whole stroke)
  socket.on('drawBundle', (pointsArray) => {
    // pointsArray = [ {x,y,isNewStroke,tool,lineWidth,color,socketId,strokeId}, ... ]
    pointsArray.forEach(p => {
      p.socketId = p.socketId || socket.id;
      p.ts = Date.now();
      drawingHistory.push(p);
    });
    // broadcast the bundle to others (so they draw it)
    socket.broadcast.emit('ondrawBundle', pointsArray);
  });

  // Per-user undo: remove last stroke belonging to that socket
  socket.on('undo', (payload) => {
    // payload should be { strokeId } (client chooses strokeId to undo)
    const { strokeId } = payload || {};
    if (!strokeId) return;

    // Remove any points with this strokeId
    drawingHistory = drawingHistory.filter(pt => pt.strokeId !== strokeId);

    // Inform everyone (including emitter) that a stroke was removed
    io.emit('strokeRemoved', { strokeId });
  });

  // Per-user redo is handled entirely client-side by re-sending the stroke via drawBundle

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
