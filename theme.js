// Load saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  document.getElementById("darkToggle").checked = true;
}

// Toggle theme
document.getElementById("darkToggle").addEventListener("change", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
});
