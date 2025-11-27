function longPress(target, onLongPress) {
    let timer;

    target.addEventListener("touchstart", () => {
        timer = setTimeout(onLongPress, 700);
    });

    target.addEventListener("mousedown", () => {
        timer = setTimeout(onLongPress, 700);
    });

    const cancel = () => clearTimeout(timer);

    target.addEventListener("touchend", cancel);
    target.addEventListener("mouseup", cancel);
    target.addEventListener("mouseleave", cancel);
}

const penBtn = document.getElementById("pen-btn");
const eraserBtn = document.getElementById("eraser-btn");
const penPopup = document.getElementById("pen-popup");
const eraserPopup = document.getElementById("eraser-popup");

// Long-press handlers
longPress(penBtn, () => { 
    penPopup.style.display = "block"; 
    eraserPopup.style.display = "none"; 
});

longPress(eraserBtn, () => { 
    eraserPopup.style.display = "block"; 
    penPopup.style.display = "none"; 
});

// Hide popups on normal click
penBtn.onclick = () => {
    penPopup.style.display = "none";
    eraserPopup.style.display = "none";
};

eraserBtn.onclick = () => {
    penPopup.style.display = "none";
    eraserPopup.style.display = "none";
};

document.getElementById("clear-btn").onclick = () => {
    penPopup.style.display = "none";
    eraserPopup.style.display = "none";
};
