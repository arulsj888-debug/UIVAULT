const copies = 100;
const textElement = document.getElementById("text");
const text = textElement.innerText;

for (let i = 0; i < copies; i++) {
  const newText = document.createElement("div");
  newText.className = "text__copy";
  newText.style = `--index: ${i + 1};`;
  newText.innerText = text;
  textElement.appendChild(newText);
}

const frame = document.getElementsByTagName("body")[0];

const mouseFunction = (mouse) => {
  const clientX = mouse.offsetX !== undefined ? mouse.offsetX : mouse.touches[0].clientX;
  const clientY = mouse.offsetY !== undefined ? mouse.offsetY : mouse.touches[0].clientY;

  let horizontal;
  let vertical;

  if (clientX > frame.offsetWidth / 2) {
    horizontal = ((clientX - frame.offsetWidth / 2) / (frame.offsetWidth / 2)) * -1;
  } else {
    horizontal = (frame.offsetWidth / 2 - clientX) / (frame.offsetWidth / 2);
  }

  if (clientY > frame.offsetHeight / 2) {
    vertical = ((clientY - frame.offsetHeight / 2) / (frame.offsetHeight / 2)) * -1;
  } else {
    vertical = (frame.offsetHeight / 2 - clientY) / (frame.offsetHeight / 2);
  }

  textElement.style.cssText = `--horizontal: ${horizontal}; --vertical: ${vertical};`;
};

frame.addEventListener("mousemove", mouseFunction);
frame.addEventListener("touchmove", mouseFunction);
