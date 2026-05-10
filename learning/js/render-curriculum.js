import { CURRICULUM } from './curriculum-data.js';

/**
 * Renders the entire curriculum dynamically from the CURRICULUM data object.
 * This ensures that adding/reordering modules only requires updating the data file.
 */
export function renderCurriculum() {
  const root = document.getElementById('curriculum-root');
  if (!root) return;

  root.innerHTML = '';
  let globalModuleCounter = 1;

  CURRICULUM.forEach(track => {
    const trackEl = document.createElement('div');
    trackEl.className = 'track';
    trackEl.setAttribute('data-label-class', track.labelClass);
    trackEl.id = `track-${track.labelClass}`;

    // Track Label (Area X)
    const labelEl = document.createElement('div');
    labelEl.className = `track-label ${track.labelClass}`;
    labelEl.innerHTML = `● ${track.labelText}`;
    if (track.labelClass === 'bio-label') {
        labelEl.style.color = '#9c27b0';
    }

    // Track Header
    const headerEl = document.createElement('div');
    headerEl.className = 'track-header';
    headerEl.innerHTML = `
      <div class="track-label-row" style="display:flex; justify-content:space-between; align-items:center;">
        <div class="track-title">${track.title}</div>
        <div class="progress-text" id="prog-text-${track.labelClass}">0%</div>
      </div>
      <div class="progress-container">
        <div class="progress-bar" id="prog-bar-${track.labelClass}"></div>
      </div>
      <div class="track-desc">${track.desc}</div>
    `;

    // Modules Grid
    const gridEl = document.createElement('div');
    gridEl.className = 'modules-grid';

    track.modules.forEach(module => {
      const moduleId = `m${globalModuleCounter}`;
      
      const itemEl = document.createElement('div');
      itemEl.className = 'module-item';
      
      const tagsHtml = module.tags.map(tag => `
        <span class="tag ${tag.class}" ${track.labelClass === 'bio-label' ? 'style="color:#9c27b0; border-color:rgba(156,39,176,0.2); background:rgba(156,39,176,0.05);"' : ''}>
          ${tag.text}
        </span>
      `).join('');

      // card-num is intentionally empty to be populated by CSS Counters
      itemEl.innerHTML = `
        <a data-module-id="${moduleId}" href="${module.url}" class="module-card ${module.class}" ${track.labelClass === 'bio-label' ? 'style="border-left-color: #9c27b0;"' : ''}>
          <div class="card-num"></div>
          <div class="card-body">
            <div class="card-title">${module.title}</div>
            <div class="card-desc">${module.desc}</div>
          </div>
          <div class="card-tags">${tagsHtml}</div>
        </a>
        <div class="card-read-toggle" data-module-id="${moduleId}" title="Marcar como leído"></div>
      `;

      gridEl.appendChild(itemEl);
      globalModuleCounter++;
    });

    trackEl.appendChild(labelEl);
    trackEl.appendChild(headerEl);
    trackEl.appendChild(gridEl);
    root.appendChild(trackEl);
  });

  // Update stats
  const totalModules = globalModuleCounter - 1;
  const statTotal = document.querySelector('.stat-total-modules');
  if (statTotal) statTotal.textContent = totalModules;
  
  const footerP = document.querySelector('.page-footer p');
  if (footerP) footerP.innerHTML = `${totalModules} módulos · cada HTML es autocontenido y funciona offline`;

  console.log(`[Curriculum] Rendered ${totalModules} modules.`);
  
  // Dispatch event so progress.js knows it can start
  window.dispatchEvent(new CustomEvent('curriculumRendered'));
}

// Auto-run on load
document.addEventListener('DOMContentLoaded', renderCurriculum);
