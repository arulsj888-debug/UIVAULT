const themeToggleButton = document.getElementById("theme-toggle-btn");
const docElement = document.documentElement;

function updateTheme(isDarkMode) {
  docElement.classList.toggle("dark", isDarkMode);
  themeToggleButton.setAttribute("aria-checked", isDarkMode);
  const newLabel = isDarkMode ? "切换到亮色主题" : "切换到暗色主题";
  themeToggleButton.setAttribute("aria-label", newLabel);
  try {
    localStorage.setItem("app-theme", isDarkMode ? "dark" : "light");
  } catch (e) {
    console.warn("Could not save theme to localStorage.", e);
  }
}

function handleThemeToggleClick() {
  docElement.classList.add("is-animating");
  const isDarkMode = docElement.classList.contains("dark");
  updateTheme(!isDarkMode);
}

function handleTransitionEnd() {
  docElement.classList.remove("is-animating");
}

function initializeTheme() {
  try {
    const saved = localStorage.getItem("app-theme");
    if (saved === "dark") docElement.classList.add("dark");
  } catch (e) {
    console.warn("Could not read theme from localStorage.", e);
  }
  const isDarkMode = docElement.classList.contains("dark");
  updateTheme(isDarkMode);
}

themeToggleButton.addEventListener("click", handleThemeToggleClick);

const themeContainer = document.querySelector(".theme-toggle__container");
themeContainer.addEventListener("transitionend", handleTransitionEnd);

initializeTheme();
