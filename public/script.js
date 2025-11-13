const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const canvasRect = canvas.getBoundingClientRect();

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var io = io();

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

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

const getTouchCoords = (e) => {
    const touch = e.touches[0] || e.changedTouches[0];
    const x = touch.clientX - canvasRect.left;
    const y = touch.clientY - canvasRect.top;
    return { x, y };
}
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
    };

    const dotData = { 
        ...startData,
        isNewStroke: false,
    };

    drawStroke(startData); 
    drawStroke(dotData);
    
    io.emit('draw', startData);
    io.emit('draw', dotData);
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
    };

    drawStroke(data);
    io.emit('draw', data);
}
const handleTouchEnd = (e) => {
    e.preventDefault();
    mouseDown = false;
}

clearBtn.onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    io.emit('clearCanvas');
}

io.on('canvasCleared', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    };

    const dotData = { 
        ...startData,
        isNewStroke: false,
    };

    drawStroke(startData); 
    drawStroke(dotData);
    
    io.emit('draw', startData);
    io.emit('draw', dotData);

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
    };

    drawStroke(data);
    io.emit('draw', data);

}

function drawStroke({x, y, isNewStroke, tool, lineWidth, color}){

    if (tool === 'pen'){
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
    } else if (tool === 'eraser'){
        ctx.globalCompositeOperation = 'destination-out';
    }
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'bevel';

    if (isNewStroke){
        ctx.beginPath();
        ctx.moveTo(x,y)
    } else {
        ctx.lineTo(x,y);
        ctx.stroke();
    }
}




// function drawFromEvent(e) {
//     const x = e.clientX - canvasRect.left;
//     const y = e.clientY - canvasRect.top;
//     const lineWidth = (currentTool === 'pen') ? penWidth : eraserWidth;
    
//     const data = {
//         x: x,
//         y: y,
//         tool: currentTool,
//         lineWidth: lineWidth,
//         color: currentColor
//         // Note: isNewStroke is no longer needed!
//     };
    
//     // 1. Draw locally
//     drawDot(data);
    
//     // 2. Emit to server
//     io.emit('draw', data);
// }

// function drawDot({x, y, tool, lineWidth, color}){
    
//     // Set the drawing properties
//     if (tool === 'pen'){
//         ctx.globalCompositeOperation = 'source-over';
//         ctx.fillStyle = color; // Use fillStyle for filled circles
//     } else if (tool === 'eraser'){
//         ctx.globalCompositeOperation = 'destination-out';
//     }
    
//     // Calculate radius. Divide by 2 because lineWidth is a diameter.
//     const radius = lineWidth / 2;
    
//     // --- This is the new drawing logic ---
//     ctx.beginPath();
//     // ctx.arc(x, y, radius, startAngle, endAngle)
//     ctx.arc(x, y, radius, 0, Math.PI * 2);
//     ctx.fill(); // Use fill() instead of stroke()
// }


io.on("loadHistory", (history) => {
    console.log("Loading history...");
    for (const data of history) {
        drawStroke(data);
    }
    console.log("History loaded.");
})

io.on("ondraw", (data) => {
    drawStroke(data);
});
