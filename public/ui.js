// public/ui.js
(function(){
  // appState
  window.appState = {
    currentTool: localStorage.getItem('currentTool') || 'pen',
    currentColor: localStorage.getItem('color') || '#000000',
    currentSize: Number(localStorage.getItem('size')) || 10,
    currentPenStyle: localStorage.getItem('penStyle') || 'soft',
    currentEraserStyle: localStorage.getItem('eraserStyle') || 'hard'
  };

  const penBtn = document.getElementById('pen-btn');
  const eraserBtn = document.getElementById('eraser-btn');
  const penPopup = document.getElementById('pen-popup');
  const eraserPopup = document.getElementById('eraser-popup');
  const colorPicker = document.getElementById('color-picker');
  const penStyleSelect = document.getElementById('pen-style-select');
  const eraserStyleSelect = document.getElementById('eraser-style-select');
  const globalSizeSlider = document.getElementById('global-size-slider');
  const sizeValue = document.getElementById('size-value');
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const clearBtn = document.getElementById('clear-btn');

  // -----------------------------
  // Color picker
  // -----------------------------
  colorPicker.value = window.appState.currentColor;
  colorPicker.addEventListener('input', (e)=>{
    window.appState.currentColor = e.target.value;
    localStorage.setItem('color', e.target.value);
  });

  // -----------------------------
  // Styles selects
  // -----------------------------
  penStyleSelect.value = window.appState.currentPenStyle;
  penStyleSelect.addEventListener('change', (e)=>{
    window.appState.currentPenStyle = e.target.value;
    localStorage.setItem('penStyle', e.target.value);
  });

  eraserStyleSelect.value = window.appState.currentEraserStyle;
  eraserStyleSelect.addEventListener('change', (e)=>{
    window.appState.currentEraserStyle = e.target.value;
    localStorage.setItem('eraserStyle', e.target.value);
  });

  // -----------------------------
  // Tool buttons
  // -----------------------------
  function setActiveTool(tool){
    window.appState.currentTool = tool;
    localStorage.setItem('currentTool', tool);
    penBtn.setAttribute('aria-pressed', tool === 'pen');
    eraserBtn.setAttribute('aria-pressed', tool === 'eraser');
  }
  penBtn.addEventListener('click', ()=> setActiveTool('pen'));
  eraserBtn.addEventListener('click', ()=> setActiveTool('eraser'));

  // -----------------------------
  // Global size slider
  // -----------------------------
  globalSizeSlider.value = window.appState.currentSize;
  sizeValue.textContent = globalSizeSlider.value;
  globalSizeSlider.addEventListener('input', (e)=>{
    const v = Number(e.target.value);
    window.appState.currentSize = v;
    sizeValue.textContent = v;
    localStorage.setItem('size', String(v));
  });

  // -----------------------------
  // Popup helpers
  // -----------------------------
  function addPopupBehavior(wrapper, popup){
    let hideTimer = null;
    let holdTimer = null;
    let touchOpened = false;

    function openPopup(mode){
      clearTimeout(hideTimer);
      wrapper.classList.add(mode);
      popup.setAttribute('aria-hidden', 'false');
    }

    function scheduleClose(){
      clearTimeout(hideTimer);
      hideTimer = setTimeout(()=>{
        wrapper.classList.remove('show-hover');
        wrapper.classList.remove('show-touch');
        popup.setAttribute('aria-hidden', 'true');
        touchOpened = false;
      }, 1000);
    }

    // Hover
    wrapper.addEventListener('mouseenter', ()=> openPopup('show-hover'));
    popup.addEventListener('mouseenter', ()=> clearTimeout(hideTimer));

    wrapper.addEventListener('mouseleave', (e)=>{
      if (popup.contains(e.relatedTarget)) return;
      scheduleClose();
    });
    popup.addEventListener('mouseleave', (e)=>{
      if (wrapper.contains(e.relatedTarget)) return;
      scheduleClose();
    });

    // Touch
    wrapper.addEventListener('touchstart', ()=>{
      clearTimeout(holdTimer);
      holdTimer = setTimeout(()=>{
        touchOpened = true;
        openPopup('show-touch');
      }, 1000);
    }, {passive:true});
    wrapper.addEventListener('touchmove', ()=> clearTimeout(holdTimer));
    wrapper.addEventListener('touchend', ()=> clearTimeout(holdTimer));

    document.addEventListener('touchstart', (ev)=>{
      if (!touchOpened) return;
      if (!wrapper.contains(ev.target)){
        wrapper.classList.remove('show-touch');
        popup.setAttribute('aria-hidden','true');
        touchOpened = false;
      }
    }, {passive:true});

    // Click toggle
    wrapper.addEventListener('click', (e)=>{
      if (touchOpened) return;
      const isOpen = wrapper.classList.contains('show-hover') ||
                     wrapper.classList.contains('show-touch');
      if (!isOpen){
        openPopup('show-hover');
      } else {
        if (!popup.contains(e.target)){
          wrapper.classList.remove('show-hover');
          popup.setAttribute('aria-hidden','true');
        }
      }
    });
  }

  function closePopup(popup){
    const wrapper = popup.parentElement;
    wrapper.classList.remove('show-hover');
    wrapper.classList.remove('show-touch');
    popup.setAttribute('aria-hidden', 'true');
  }

  // wire popups
  document.querySelectorAll('.tool-wrapper').forEach(w => {
    const pop = w.querySelector('.popup');
    if (pop) addPopupBehavior(w, pop);
  });

  // expose UI for script.js
  window.ui = {
    undoBtn, redoBtn, clearBtn,
    colorPicker, penStyleSelect, eraserStyleSelect,
    getState: ()=> window.appState,
    closePopup
  };

  // initial state
  setActiveTool(window.appState.currentTool);

})();
