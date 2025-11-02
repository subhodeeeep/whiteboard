const http = require('http');
const { Server } = require('socket.io');

let drawingHistory = [];

const httpServer = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type' : 'text/plain'});
    res.end('Socket.io server running');
})
const io = new Server(httpServer, {
    cors: { origin: '*' } 
});

io.on('connection', (socket) => {

    console.log('A user connected:', socket.id);

    socket.emit('loadHistory', drawingHistory);

    socket.on('draw', (data) => {
        drawingHistory.push(data);
        socket.broadcast.emit('ondraw', data);
    })

    socket.on('clearCanvas', () => {
        drawingHistory = [];
        socket.broadcast.emit('canvasCleared');
    });

    socket.on('disconnect', (reason) => {
        console.log('A user disconnected:', socket.id, 'Reason:', reason);
    })
});

module.exports = (req, res) => {
    httpServer.emit('request', req, res)
}
