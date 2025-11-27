// public/script.js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// set logical canvas size (you can change as needed)
canvas.width = 400;
canvas.height = 800;

// helper to get fresh bounding rect
function getCanvasRect() {
  return canvas.getBoundingClientRect();
}

var socket = io();

let drawing = false;

// UI elements
const colorPicker = document.getElementById('color-picker');
const penSizeSlider = document.getElementById('pen-size-slider');
const eraserSizeSlider = document.getElementById('eraser-size-slider');
const penBtn = document.getElementById('pen-btn');
const eraserBtn = document.getElementById('eraser-btn');
const clearBtn = document.getElementById('clear-btn');

// load persisted prefs
let currentTool = localStorage.getItem('currentTool') || 'pen';
let currentColor = localStorage.getItem('color') || '#000000';
colorPicker.value = currentColor;

if (localStorage.getItem('penSizeSlider')) {
  penSizeSlider.value = localStorage.getItem('penSizeSlider');
}
if (localStorage.getItem('eraserSizeSlider')) {
  eraserSizeSlider.value = localStorage.getItem('eraserSizeSlider');
}

let penWidth = Number(penSizeSlider.value) || 3;
let eraserWidth = Number(eraserSizeSlider.value) || 10;

const activePaths = {};

// Utility: normalize pointer coordinates relative to canvas
function getPointerCoords(e) {
  const rect = getCanvasRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

// Pointer event handlers (works for mouse + touch)
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  drawing = true;

  const { x, y } = getPointerCoords(e);
  const lineWidth = (currentTool === 'pen') ? penWidth : eraserWidth;

  const startData = {
    x: x,
    y: y,
    isNewStroke: true,
    tool: currentTool,
    lineWidth: lineWidth,
    color: currentColor,
    socketId: socket.id // may be undefined momentarily, server will fill if needed
  };

  drawStroke(startData);
  socket.emit('draw', startData);
});

canvas.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  e.preventDefault();

  const { x, y } = getPointerCoords(e);
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
});

canvas.addEventListener('pointerup', (e) => {
  e.preventDefault();
  canvas.releasePointerCapture(e.pointerId);
  drawing = false;
});

canvas.addEventListener('pointercancel', (e) => {
  e.preventDefault();
  drawing = false;
});

// Clear
clearBtn.onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let k in activePaths) delete activePaths[k];
  socket.emit('clearCanvas');
};

socket.on('canvasCleared', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let k in activePaths) delete activePaths[k];
});

// Tool buttons
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

penSizeSlider.oninput = (e) => {
  penWidth = Number(e.target.value);
  localStorage.setItem('penSizeSlider', String(penWidth));
  currentTool = 'pen';
  localStorage.setItem('currentTool', 'pen');
};

eraserSizeSlider.oninput = (e) => {
  eraserWidth = Number(e.target.value);
  localStorage.setItem('eraserSizeSlider', String(eraserWidth));
  currentTool = 'eraser';
  localStorage.setItem('currentTool', 'eraser');
};

// Draw function
function drawStroke({ x, y, isNewStroke, tool, lineWidth, color, socketId }) {
  // fallback id so we can track local paths even if socket.id is not set
  if (!socketId) socketId = 'local-' + (Date.now());

  if (!activePaths[socketId]) {
    activePaths[socketId] = { lastX: x, lastY: y };
  }

  ctx.save();

  if (tool === 'pen') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color || '#000';
  } else if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    // when erasing, strokeStyle is not needed for destination-out
  }

  ctx.lineWidth = Number(lineWidth) || 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  if (isNewStroke) {
    ctx.moveTo(x, y);
  } else {
    const last = activePaths[socketId];
    ctx.moveTo(last.lastX, last.lastY);
  }
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.restore();

  activePaths[socketId] = { lastX: x, lastY: y };
}

// Load existing history on connect
socket.on('loadHistory', (history) => {
  // draw history in order
  for (const data of history) {
    drawStroke(data);
  }
});

// remote draw events
socket.on('ondraw', (data) => {
  drawStroke(data);
});

// keep canvas rect updated on resize (important if responsive)
window.addEventListener('resize', () => {
  // nothing needed for resized logical canvas, we recompute rect per pointer event
});
