// styles.js
// High-quality, visually distinct presets. Each preset defines:
// - lineWidthFactor: how base size scales
// - alphaMap: function(speed, pressure) => alpha
// - jitter: scatter amount for 'hand' style
// - shadowBlur: bloom for glow / soft
// - dash: line dash pattern
// - anglePressure: for calligraphy (affects width by angle)
(function(){
  window.penStyles = {
    soft: {
      lineWidthFactor: 1.0,
      shadowBlur: 6,
      dash: [],
      alphaMap: (speed, pressure) => Math.max(0.18, Math.min(1, 0.9 * (pressure || 1) * (1 / (0.5 + speed * 0.02)))),
      jitter: 0.6
    },
    hand: {
      lineWidthFactor: 1.0,
      shadowBlur: 1,
      dash: [],
      alphaMap: (speed, pressure) => Math.max(0.35, Math.min(1, (pressure || 1) * (1 / (0.6 + speed * 0.015)))),
      jitter: 1.8 // visible grainy wobble
    },
    dotted: {
      lineWidthFactor: 0.9,
      shadowBlur: 0,
      dash: [1, 8],
      alphaMap: (speed, pressure) => Math.max(0.5, 0.9 * (pressure || 1)),
      jitter: 0.2
    },
    calligraphy: {
      lineWidthFactor: 1.4,
      shadowBlur: 0,
      dash: [],
      alphaMap: (speed, pressure) => Math.max(0.65, (pressure || 1) * (1 / (0.4 + speed * 0.01))),
      // calligraphy expects an 'angle' property in points; we will derive width from angle if available
      angleFactor: 0.9,
      jitter: 0
    }
  };

  window.eraserStyles = {
    hard: {
      lineWidthFactor: 1.0,
      shadowBlur: 0,
      dash: [],
      alphaMap: ()=>1,
      jitter: 0
    },
    soft: {
      lineWidthFactor: 1.0,
      shadowBlur: 16,
      dash: [],
      alphaMap: ()=>1,
      jitter: 0
    },
    smudge: {
      lineWidthFactor: 1.0,
      shadowBlur: 3,
      dash: [],
      alphaMap: ()=>0.9,
      jitter: 1.6,
      smudge: true // indicates smudge behavior (we simulate by drawing with lowered alpha)
    },
    dottedErase: {
      lineWidthFactor: 1.0,
      shadowBlur: 0,
      dash: [4,6],
      alphaMap: ()=>1,
      jitter: 0
    }
  };
})();
