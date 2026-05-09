/**
 * learning.js
 */

export async function initLearning(container, html) {
  container.innerHTML = html;

  const btnEnter = container.querySelector("#btn-enter-learning");
  if (btnEnter) {
    btnEnter.addEventListener("click", () => {
      window.location.href = "./learning/index.html";
    });
    
    // Add hover effect
    btnEnter.addEventListener("mouseenter", () => {
      btnEnter.style.transform = "scale(1.05)";
    });
    btnEnter.addEventListener("mouseleave", () => {
      btnEnter.style.transform = "scale(1)";
    });
  }
}
