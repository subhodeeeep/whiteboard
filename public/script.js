const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const canvasRect = canvas.getBoundingClientRect();

canvas.width = 720;
canvas.height = 1500;

var socket = io();

let mouseDown = false;

const colorPicker = document.getElementById('color-picker');
const penSizeSlider = document.getElementById('pen-size-slider');
const eraserSizeSlider = document.getElementById('eraser-size-slider');
const penBtn = document.getElementById('pen-btn')
const eraserBtn = document.getElementById('eraser-btn')
const clearBtn = document.getElementById('clear-button');

let currentTool = localStorage.getItem('currentTool') || 'pen';
let currentColor = localStorage.getItem('color') || '#000000';
colorPicker.value = currentColor;

penSizeSlider.value = localStorage.getItem('penSizeSlider') || penSizeSlider.value;
eraserSizeSlider.value = localStorage.getItem('eraserSizeSlider') || eraserSizeSlider.value;

let penWidth = penSizeSlider.value;
let eraserWidth = eraserSizeSlider.value;

const getTouchCoords = (e) => {
    const touch = e.touches[0] || e.changedTouches[0];
    const x = touch.clientX - canvasRect.left;
    const y = touch.clientY - canvasRect.top;
    return { x, y };
}

const activePaths = {};

const handleTouchStart = (e) => {
    e.preventDefault();
    mouseDown = true;

    const { x, y } = getTouchCoords(e);
    const lineWidth = (currentTool === 'pen') ? penWidth : eraserWidth;

    const startData = {
        x: x,
        y: y,
        isNewStroke: true,
        tool: currentTool,
        lineWidth: lineWidth,
        color: currentColor,
        socketId: socket.id
    };
    drawStroke(startData);     
    socket.emit('draw', startData);
}

const handleTouchMove = (e) => {
    e.preventDefault();
    if (!mouseDown) return;

    const { x, y } = getTouchCoords(e);
    const lineWidth = (currentTool === 'pen') ? penWidth : eraserWidth;

    const data = {
        x: x,
        y: y,
        isNewStroke: false,
        tool: currentTool,
        lineWidth: lineWidth,
        color: currentColor,
        socketId: socket.id
    };

    drawStroke(data);
    socket.emit('draw', data);
}
const handleTouchEnd = (e) => {
    e.preventDefault();
    mouseDown = false;
}


canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

clearBtn.onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let key in activePaths) delete activePaths[key];
    socket.emit('clearCanvas');
}

socket.on('canvasCleared', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let key in activePaths) delete activePaths[key];
});

penBtn.onclick = () => {
    localStorage.setItem('currentTool', 'pen');
    currentTool = 'pen';
};
eraserBtn.onclick = () => {
    localStorage.setItem('currentTool', 'eraser');
    currentTool = 'eraser';
};

colorPicker.onchange = (e) => {
    currentColor = e.target.value;
    localStorage.setItem('color', currentColor);
};

penSizeSlider.onchange = (e) => {
    penWidth = penSizeSlider.value;
    localStorage.setItem('penSizeSlider', penWidth);
    currentTool = 'pen';
    localStorage.setItem('currentTool', 'pen');
}

eraserSizeSlider.onchange = (e) => {
    eraserWidth = eraserSizeSlider.value;
    localStorage.setItem('eraserSizeSlider', eraserWidth);
    currentTool = 'eraser';
    localStorage.setItem('currentTool', 'eraser');
}

window.onmousedown = (e) => {
    mouseDown = true;

    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    const lineWidth = (currentTool === 'pen') ? penWidth : eraserWidth;

    const startData = {
        x: x,
        y: y,
        isNewStroke: true,
        tool: currentTool,
        lineWidth: lineWidth,
        color: currentColor,
        socketId: socket.id
    };

    drawStroke(startData);     
    socket.emit('draw', startData);
}

window.onmouseup = (e) => {
    mouseDown = false;
}

window.onmousemove = (e) => {

    if (!mouseDown) return;

    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    const lineWidth = (currentTool === 'pen') ? penWidth : eraserWidth;

    const data = {
        x: x,
        y: y,
        isNewStroke: false,
        tool: currentTool,
        lineWidth: lineWidth,
        color: currentColor,
        socketId: socket.id
    };

    drawStroke(data);
    socket.emit('draw', data);

}

function drawStroke({x, y, isNewStroke, tool, lineWidth, color, socketId}){
    if (!socketId) return;

    if (!activePaths[socketId]) {
        activePaths[socketId] = { lastX: x, lastY: y };
    }
    ctx.save(); 
    
    if (tool === 'pen'){
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
    } else if (tool === 'eraser'){
        ctx.globalCompositeOperation = 'destination-out';
    }
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'bevel';

    ctx.beginPath();
    if (isNewStroke){
        ctx.moveTo(x,y)
    } else {
        const last = activePaths[socketId];
        ctx.moveTo(last.lastX, last.lastY);
    }
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.restore();
    activePaths[socketId] = { lastX: x, lastY: y };
}

socket.on("loadHistory", (history) => {
    console.log("Loading history...");
    for (const data of history) {
        drawStroke(data);
    }
    console.log("History loaded.");
})

socket.on("ondraw", (data) => {
    drawStroke(data);
});
