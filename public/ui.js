// ui.js
document.addEventListener("DOMContentLoaded", () => {

    const penBtn = document.getElementById("penBtn");
    const eraserBtn = document.getElementById("eraserBtn");
    const clearBtn = document.getElementById("clearBtn");

    const penSize = document.getElementById("pen-size-slider");
    const eraserSize = document.getElementById("eraser-size-slider");
    const penStyleMenu = document.getElementById("pen-style-menu");

    let longPressTimer = null;
    const LONG_PRESS_TIME = 600; // ms

    // Hide menus initially
    penSize.style.display = "none";
    eraserSize.style.display = "none";
    penStyleMenu.style.display = "none";

    // Utility
    const show = (el) => el.style.display = "block";
    const hide = (el) => el.style.display = "none";


    /****************************
     *  PEN BUTTON
     ***************************/
    penBtn.addEventListener("mousedown", () => {
        longPressTimer = setTimeout(() => {
            show(penSize);
            show(penStyleMenu);
        }, LONG_PRESS_TIME);
    });

    penBtn.addEventListener("mouseup", () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });

    // short click = activate pen
    penBtn.addEventListener("click", () => {
        hide(eraserSize);
        hide(penStyleMenu);

        if (!penSize.style.display.includes("block")) {
            hide(penSize);
        }

        window.selectTool && window.selectTool("pen");
    });



    /****************************
     *  ERASER BUTTON
     ***************************/
    eraserBtn.addEventListener("mousedown", () => {
        longPressTimer = setTimeout(() => {
            show(eraserSize);
        }, LONG_PRESS_TIME);
    });

    eraserBtn.addEventListener("mouseup", () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });

    // short click = activate eraser
    eraserBtn.addEventListener("click", () => {
        hide(penSize);
        hide(penStyleMenu);

        if (!eraserSize.style.display.includes("block")) {
            hide(eraserSize);
        }

        window.selectTool && window.selectTool("eraser");
    });



    /****************************
     *  CLEAR BUTTON
     ***************************/
    clearBtn.addEventListener("click", () => {
        if (window.clearCanvas) window.clearCanvas();
    });


    /****************************
     *  OPTIONAL: TIMER SUPPORT
     ***************************/
    const startTimerBtn = document.getElementById("startTimerBtn");
    const timerInput = document.getElementById("timerInput");

    if (startTimerBtn && timerInput) {
        startTimerBtn.addEventListener("click", () => {
            let seconds = parseInt(timerInput.value) || 0;
            if (window.setTimer) window.setTimer(seconds);
        });
    }

});
