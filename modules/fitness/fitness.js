/**
 * modules/fitness/fitness.js
 */

let allExercises = [];

export async function initFitness(container, preloadedHtml) {
  container.innerHTML = preloadedHtml || "<h2>Cargando Fitness...</h2>";

  const mapWrapper = container.querySelector("#body-map-wrapper");
  const daysContainer = container.querySelector("#fitness-days");
  const listContainer = container.querySelector("#exercises-list");

  // Load SVG
  try {
    const svgRes = await fetch("./static/body.svg");
    const svgText = await svgRes.text();
    mapWrapper.innerHTML = svgText;
  } catch (err) {
    console.error("Failed to load body map SVG:", err);
  }

  // Load Exercises
  try {
    const exRes = await fetch("./static/exercises.jsonl");
    const exText = await exRes.text();
    const lines = exText.split("\n").filter(l => l.trim() !== "");
    allExercises = lines.map(l => JSON.parse(l));
  } catch (err) {
    console.error("Failed to load exercises:", err);
  }

  // Setup Days Filter
  const dayBtns = daysContainer.querySelectorAll(".day-btn");
  dayBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      dayBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderExercises(btn.dataset.day, listContainer, mapWrapper);
    });
  });

  // Render initial (Lunes)
  renderExercises("Lunes", listContainer, mapWrapper);
}

function renderExercises(day, listContainer, mapWrapper) {
  listContainer.innerHTML = "";
  clearHighlights(mapWrapper);

  const dayExercises = allExercises.filter(ex => ex.days.includes(day));

  dayExercises.forEach(ex => {
    const card = document.createElement("div");
    card.className = "exercise-card";
    
    const details = ex.reps ? ex.reps : ex.time;
    
    card.innerHTML = `
      <div class="exercise-name">${ex.name}</div>
      <div class="exercise-details"><span>${details}</span></div>
    `;

    // Highlight on hover/click
    card.addEventListener("mouseenter", () => highlightMuscles(ex.muscles, mapWrapper));
    card.addEventListener("mouseleave", () => clearHighlights(mapWrapper));
    card.addEventListener("click", () => {
      // Toggle active class on card
      document.querySelectorAll(".exercise-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      highlightMuscles(ex.muscles, mapWrapper, true);
    });

    listContainer.appendChild(card);
  });
}

let activeMuscles = [];

function highlightMuscles(muscleIds, mapWrapper, isClick = false) {
  if (!isClick) {
    clearHighlights(mapWrapper);
  } else {
    // If it's a click, we first clear then set the active ones
    clearHighlights(mapWrapper);
    activeMuscles = muscleIds;
  }

  const idsToHighlight = isClick ? activeMuscles : muscleIds;

  idsToHighlight.forEach(id => {
    const el = mapWrapper.querySelector(`#${id}`);
    if (el) {
      el.classList.add("muscle-active");
    }
  });
}

function clearHighlights(mapWrapper) {
  const highlighted = mapWrapper.querySelectorAll(".muscle-active");
  highlighted.forEach(el => el.classList.remove("muscle-active"));
}
