const { log } = require('console');
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

    socket.emit('loadHistory', drawingHistory);

    socket.on('draw', (data) => {
        data.socketId = socket.id;
        drawingHistory.push(data);
        io.emit('ondraw', data);
    })

    socket.on('clearCanvas', () => {
        drawingHistory = [];
        socket.broadcast.emit('canvasCleared');
    });

    socket.on('disconnect', (reason) => {
        console.log('A user disconnected:', socket.id, 'Reason:', reason);
    })
});

app.use(express.static('public'));

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
