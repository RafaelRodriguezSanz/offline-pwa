/**
 * investments.js — Investments Tracker with UI (Unidad de Inversión) index.
 * Consumes UI values for Uruguay.
 */

const PRINCIPAL = 2000000;
const ANNUAL_INTEREST_RATE = 0.0075; // 0.75%
const TERM_DAYS = 365;

// Real UI values for Uruguay (May 2026)
let LATEST_UI_VALUE = 6.5344; // UI Value at May 11, 2026
const UI_START_MAY_6 = 6.5311; // UI Value at May 6, 2026
export async function initInvestments(container, html) {
  container.innerHTML = html;
  
  // Fixed dates: May 6, 2026 to May 6, 2027
  const startDate = new Date(2026, 4, 6); // May is index 4
  const endDate = new Date(2027, 4, 6);

  document.getElementById("inv-start-date").textContent = startDate.toLocaleDateString('es-UY');
  document.getElementById("inv-end-date").textContent = endDate.toLocaleDateString('es-UY');

  // Initial update
  await updateInvestmentUI();

  document.getElementById("btn-update-inv").addEventListener("click", async () => {
    const btn = document.getElementById("btn-update-inv");
    btn.textContent = "Obteniendo UI...";
    btn.disabled = true;
    
    await fetchLatestUI();
    await updateInvestmentUI();
    
    btn.textContent = "Sincronizar Datos";
    btn.disabled = false;
  });
}

/**
 * Attempts to fetch the latest UI value from a public API.
 */
async function fetchLatestUI() {
  try {
    console.log("[Investments] Fetching UI from uy.dolarapi.com...");
    
    // We use DolarAPI for Uruguay which is public and supports CORS
    const response = await fetch("https://uy.dolarapi.com/v1/cotizaciones/ui");
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("[Investments] API payload:", data);

    // Accept a few common payload shapes to avoid breaking on minor API changes.
    const rawValue =
      data?.compra ??
      data?.venta ??
      data?.valor ??
      (Array.isArray(data)
        ? (data[0]?.compra ?? data[0]?.venta ?? data[0]?.valor)
        : undefined);

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid data structure from API: ${JSON.stringify(data)}`);
    }

    LATEST_UI_VALUE = parsed;
    console.log("[Investments] Official UI Value fetched:", LATEST_UI_VALUE);
  } catch (err) {
    console.warn("[Investments] Failed to fetch real-time UI, using fallback:", err);
    // Maintain LATEST_UI_VALUE as it was (last known good value)
  }
}

async function updateInvestmentUI() {
  const uiStart = UI_START_MAY_6;
  const uiCurrent = LATEST_UI_VALUE;
  
  // Logic: 
  // 1. Initial Principal in UI (at start date)
  const principalInUI = PRINCIPAL / uiStart;
  
  // 2. Interest in UI (Total for the term: 0.75% of principal_UI)
  const totalInterestUI = principalInUI * ANNUAL_INTEREST_RATE;
  
  // 3. Time progress (from May 6 to today)
  const today = new Date();
  const start = new Date(2026, 4, 6);
  
  const diffTime = Math.abs(today - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const progressRatio = Math.min(diffDays / TERM_DAYS, 1);
  
  // 4. Current Balance in Pesos = (Principal_UI + (Interest_UI * Time_Ratio)) * Current_UI_Price
  const currentTotal = (principalInUI + (totalInterestUI * progressRatio)) * uiCurrent;
  const totalGain = currentTotal - PRINCIPAL;
  const dailyGain = totalGain / diffDays;

  // Update UI Elements
  animateValue("inv-total-display", currentTotal);
  animateValue("inv-gain-display", totalGain, "+ ");
  animateValue("inv-daily-display", dailyGain);
  
  document.getElementById("inv-days-display").textContent = `Día ${diffDays} de ${TERM_DAYS}`;
  document.getElementById("inv-progress-bar").style.width = `${progressRatio * 100}%`;
  
  // Show UI value in the daily card footer
  const dailyFooter = document.querySelector(".daily .card-footer");
  if (dailyFooter) {
    dailyFooter.textContent = `UI hoy: ${uiCurrent.toFixed(4)}`;
  }
}

function animateValue(id, value, prefix = "") {
  const el = document.getElementById(id);
  if (!el) return;
  
  const formatter = new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 2
  });

  el.textContent = prefix + formatter.format(value).trim();
}
