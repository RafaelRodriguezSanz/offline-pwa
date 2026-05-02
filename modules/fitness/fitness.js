/**
 * modules/fitness/fitness.js
 */

let allExercises = [];
let svgFront = null;
let svgBack = null;

export async function initFitness(container, preloadedHtml) {
  container.innerHTML = preloadedHtml || "<h2>Cargando Fitness...</h2>";

  const daysContainer = container.querySelector("#fitness-days");
  const listContainer = container.querySelector("#exercises-list");

  // Load both SVG views once
  try {
    const [frontRes, backRes] = await Promise.all([
      fetch("./static/body_front.svg"),
      fetch("./static/body_back.svg"),
    ]);
    svgFront = await frontRes.text();
    svgBack = await backRes.text();
  } catch (err) {
    console.error("Failed to load body map SVGs:", err);
  }

  // Load exercises
  try {
    const exRes = await fetch("./static/exercises.jsonl", {
      headers: { "Accept": "text/plain" }
    });
    const exText = await exRes.text();
    allExercises = exText
      .split("\n")
      .filter(l => l.trim() !== "")
      .reduce((acc, line, i) => {
        try { acc.push(JSON.parse(line)); }
        catch (e) { console.error(`exercises.jsonl línea ${i + 1}:`, e.message); }
        return acc;
      }, []);
  } catch (err) {
    console.error("Failed to load exercises:", err);
  }

  // Days filter
  const dayBtns = daysContainer.querySelectorAll(".day-btn");
  dayBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      dayBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderExercises(btn.dataset.day, listContainer);
    });
  });

  renderExercises("Lunes", listContainer);
}

function renderExercises(day, listContainer) {
  listContainer.innerHTML = "";

  const dayExercises = allExercises.filter(ex => ex.days.includes(day));

  dayExercises.forEach(ex => {
    const card = document.createElement("div");
    card.className = "exercise-card";

    const details = ex.reps ?? ex.time ?? "";

    card.innerHTML = `
      <div class="exercise-info">
        <div class="exercise-name">${ex.name}</div>
        <div class="exercise-details">${details}</div>
      </div>
      <div class="exercise-body-maps">
        <div class="exercise-body-map exercise-body-map--front">${svgFront ?? ""}</div>
        <div class="exercise-body-map exercise-body-map--back">${svgBack ?? ""}</div>
      </div>
    `;

    // Mark the relevant muscle paths in both SVG thumbnails
    if (ex.muscles) {
      ex.muscles.forEach(id => {
        card.querySelectorAll(`#${id}`).forEach(el => el.classList.add("muscle-active"));
      });
    }

    // Click to toggle active
    card.addEventListener("click", () => {
      const wasActive = card.classList.contains("active");
      listContainer.querySelectorAll(".exercise-card").forEach(c => c.classList.remove("active"));
      if (!wasActive) card.classList.add("active");
    });

    listContainer.appendChild(card);
  });
}
