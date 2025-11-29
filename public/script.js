// public/script.js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Logical canvas size
canvas.width = 400;
canvas.height = 800;

// Helper rect
function getCanvasRect() {
  return canvas.getBoundingClientRect();
}

var socket = io();

let drawing = false;

// UI elements
const colorPicker = document.getElementById('color-picker');
const penBtn = document.getElementById('pen-btn');
const eraserBtn = document.getElementById('eraser-btn');
const clearBtn = document.getElementById('clear-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const sizeSlider = document.getElementById('global-size-slider');

// Settings
let penWidth = Number(localStorage.getItem('size')) || 10;
let eraserWidth = Number(localStorage.getItem('size')) || 10;
let currentColor = localStorage.getItem('color') || '#000000';
let currentTool = localStorage.getItem('currentTool') || 'pen';
let currentPenStyle = localStorage.getItem('penStyle') || 'soft';
let currentEraserStyle = localStorage.getItem('eraserStyle') || 'hard';

// Stroke management
let activePaths = {};
let actions = [];
let redoStack = [];
let currentStroke = [];

// Get pointer coordinates
function getPointerCoords(e) {
  const rect = getCanvasRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

// Create point data
function makePointData(x, y, isNewStroke) {
  const lineWidth = (currentTool==='pen') ? penWidth : eraserWidth;
  const penStyle = (currentTool==='pen') ? currentPenStyle : currentEraserStyle;

  return {
    x, y,
    isNewStroke,
    tool: currentTool,
    lineWidth,
    penStyle,
    color: window.ui && window.ui.getState ? window.ui.getState().currentColor : currentColor, // store current color at this point
    socketId: socket.id
  };
}


// ----------------------------
// DRAW FUNCTION
// ----------------------------
function drawStrokePoint({ x, y, isNewStroke, tool, lineWidth, penStyle, color, socketId }) {
  if (!socketId) socketId = 'local-' + Date.now();
  if (!activePaths[socketId] || isNewStroke) {
    activePaths[socketId] = { lastX: x, lastY: y };
  }
  const last = activePaths[socketId];

  ctx.save();
  ctx.fillStyle = color;   // ✅ use stored color
  ctx.strokeStyle = color;

  if (tool === 'pen') ctx.globalCompositeOperation = 'source-over';
  else ctx.globalCompositeOperation = 'destination-out';

  drawCircleLine(last, {x, y}, lineWidth, { constantDensity: true, dotted: false });
  activePaths[socketId] = { lastX: x, lastY: y };
  ctx.restore();
}



// Circle-line renderer
function drawCircleLine(from, to, radius, opts) {
  const dx = to.x - from.lastX;
  const dy = to.y - from.lastY;
  const dist = Math.sqrt(dx*dx + dy*dy);

  const step = opts && opts.dotted ? radius * 2 : 0.01;
  const steps = Math.max(1, Math.floor(dist / step));

  for (let i = 0; i <= steps; i++) {
    const px = from.lastX + dx * (i / steps);
    const py = from.lastY + dy * (i / steps);

    ctx.beginPath();
    ctx.arc(px, py, radius / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ----------------------------
// POINTER EVENTS
// ----------------------------
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  drawing = true;
  currentStroke = [];

  const { x, y } = getPointerCoords(e);
  const point = makePointData(x, y, true);
  currentStroke.push(point);
  drawStrokePoint(point);
  socket.emit('draw', point);
});

canvas.addEventListener('pointermove', (e) => {
  if (!drawing) return;

  const { x, y } = getPointerCoords(e);
  const point = makePointData(x, y, false);
  currentStroke.push(point);
  drawStrokePoint(point);
  socket.emit('draw', point);
});

function saveHistory() {
  try {
    localStorage.setItem("actions", JSON.stringify(actions));
  } catch (err) {
    console.warn('saveHistory failed', err);
  }

  // Emit updated history to server so server's authoritative history matches client
  // We send the actions array (array of { points: [...] } objects). If you prefer sending only raw points, adapt server.
  try {
    socket.emit('historyUpdate', actions);
  } catch (err) {
    // ignore socket errors silently
    console.warn('historyUpdate emit failed', err);
  }
}


canvas.addEventListener('pointerup', () => {
  drawing = false;
  if (currentStroke.length) {
    actions.push([...currentStroke]);
    redoStack = [];
    saveHistory();                 // important - persist & emit
    // also emit final stroke bundle (compatibility with servers that expect bundles)
    try {
      socket.emit('drawBundle', currentStroke);
    } catch (e) { /* ignore */ }
  }
  currentStroke = [];
});

// ----------------------------
// UNDO, REDO, CLEAR
// ----------------------------
clearBtn.onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  actions = [];
  redoStack = [];
  saveHistory();                 // persist & emit
  socket.emit('clearCanvas');
};

undoBtn.onclick = () => {
  if (!actions.length) return;
  const removed = actions.pop();
  redoStack.push(removed);
  redrawCanvas();
  saveHistory();                 // persist & emit

  // optionally tell server specifically which stroke removed (server can also listen to historyUpdate)
  if (removed && removed.length) {
    try { socket.emit('undoAction', { strokeId: removed[0].strokeId || null }); } catch(e){ }
  } else if (removed && removed.id) {
    try { socket.emit('undoAction', { strokeId: removed.id }); } catch(e){ }
  }
};

redoBtn.onclick = () => {
  if (!redoStack.length) return;
  const stroke = redoStack.pop();
  actions.push(stroke);
  redrawCanvas();
  saveHistory();                 // persist & emit
  try { socket.emit('redoAction', stroke); } catch(e) {}
};

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  activePaths = {};
  for (const stroke of actions) {
    // stroke might be stored as either array-of-points or {id, points}
    const points = Array.isArray(stroke) ? stroke : (stroke.points || []);
    for (const point of points) {
      drawStrokePoint(point); // ✅ this uses point.color
    }
  }
}


// ----------------------------
// SOCKET EVENTS
// ----------------------------
socket.on('loadHistory', (history) => {
  // Replace local actions with server history if server provides authoritative actions
  if (!history) return;

  // If server sends actions (array of {id, points}), use directly
  if (history.length && history[0] && (history[0].points || history[0].id)) {
    actions = history.slice();
    saveHistory(); // persist locally and (careful) emit - server will ignore or handle
    redrawCanvas();
    return;
  }

  // Otherwise assume server sent raw points → group by strokeId
  const groups = {};
  for (const p of history) {
    const sid = p.strokeId || ('s-unknown');
    groups[sid] = groups[sid] || [];
    groups[sid].push(p);
  }
  // convert groups into actions array
  actions = Object.keys(groups).map(sid => ({ id: sid, points: groups[sid] }));
  saveHistory();
  redrawCanvas();
});

socket.on('ondraw', (data) => drawStrokePoint(data));

// Server cleared
socket.on('canvasCleared', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  actions = [];
  redoStack = [];
  saveHistory();
});

// Server confirmed undo of strokeId
socket.on('serverUndo', ({ strokeId }) => {
  actions = actions.filter(a => {
    const pts = Array.isArray(a) ? a : (a.points || []);
    // compare using action.id if present, else first point strokeId
    if (a.id) return a.id !== strokeId;
    if (pts.length && pts[0].strokeId) return pts[0].strokeId !== strokeId;
    return true;
  });
  saveHistory();
  redrawCanvas();
});

// ----------------------------
// UI
// ----------------------------
penBtn.onclick = () => currentTool = 'pen';
eraserBtn.onclick = () => currentTool = 'eraser';

sizeSlider.oninput = (e) => {
  penWidth = eraserWidth = Number(e.target.value);
  localStorage.setItem('size', String(penWidth));
};

colorPicker.oninput = (e) => {
  currentColor = e.target.value;
  localStorage.setItem('color', currentColor);

  if (drawing && currentStroke.length) {
    currentStroke[currentStroke.length - 1].color = currentColor;
  }
};

// Load saved history on startup
const saved = localStorage.getItem("actions");
if (saved) {
  try {
    actions = JSON.parse(saved) || [];
    redrawCanvas();
  } catch (e) {
    console.warn('failed to parse local actions', e);
    actions = [];
  }
}

// ask server for history (server typically emits loadHistory on connection)
socket.emit('requestHistory');

