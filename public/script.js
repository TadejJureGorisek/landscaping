// ── Before/After sliders ──────────────────────────────
document.querySelectorAll("[data-slider]").forEach(slider => {
  const before = slider.querySelector(".ba-before");
  const handle = slider.querySelector(".ba-handle");
  before.style.clipPath = "inset(0 50% 0 0)";
  handle.style.left = "50%";
  let drag = false;
  const setPos = x => {
    const r = slider.getBoundingClientRect();
    const p = Math.max(2, Math.min(98, ((x - r.left) / r.width) * 100));
    before.style.clipPath = `inset(0 ${100-p}% 0 0)`;
    handle.style.left = p + "%";
  };
  slider.addEventListener("mousedown", e => { drag=true; setPos(e.clientX); e.preventDefault(); });
  window.addEventListener("mousemove", e => { if(drag) setPos(e.clientX); });
  window.addEventListener("mouseup", () => drag=false);
  slider.addEventListener("touchstart", e => { drag=true; setPos(e.touches[0].clientX); }, {passive:true});
  window.addEventListener("touchmove", e => { if(drag) setPos(e.touches[0].clientX); }, {passive:true});
  window.addEventListener("touchend", () => drag=false);
});

// ── Mobile menu ───────────────────────────────────────
document.getElementById("menuBtn").addEventListener("click", () =>
  document.getElementById("navLinks").classList.toggle("open"));
document.getElementById("navLinks").querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () => document.getElementById("navLinks").classList.remove("open")));

// ── Service configs ───────────────────────────────────
const SERVICES = {
  lawn:  { base: 0.25, type: "area",  name: "Košenje trave",       icon: "🌿", unit: "m²" },
  hedge: { base: 3.00, type: "area",  name: "Striženje živice",    icon: "✂️", unit: "tm" },
  edge:  { base: 20,   type: "fixed", name: "Rob trava/tlakovci",  icon: "⚠️" },
  waste: { base: 30,   type: "fixed", name: "Odvoz na deponijo",   icon: "🚛" },
  snow:  { base: 5.00, type: "area",  name: "Kidanje snega",       icon: "❄️", unit: "m²" },
  shrub: { base: 10,   type: "count", name: "Obrezovanje grmovja", icon: "🌳", unit: "kos" },
};

const state = {
  active: {},
  mults: { lawn:1, hedge:1, snow:1, shrub:1 },
  travel: 0,
  travelKm: 0,
  selectedPlan: null,
  activeTier: {},
  customSvcs: {},
  customFreq: 1,
};

// ── Custom frequency toggle ───────────────────────────
document.querySelectorAll(".custom-freq-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelectorAll(".custom-freq-btn").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    state.customFreq = parseInt(btn.dataset.freq);
    Object.keys(state.customSvcs).forEach(id => updateCustomPrice(id));
  });
});

// ── Enkratna: toggle cards ────────────────────────────
document.querySelectorAll(".svc-card").forEach(card => {
  const id = card.id.replace("svc-","");
  card.querySelector(".svc-header").addEventListener("click", () => {
    if (state.active[id]) { delete state.active[id]; card.classList.remove("on"); }
    else { state.active[id] = true; card.classList.add("on"); }
    updateQuote();
  });
  card.querySelectorAll(".svc-opt").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      card.querySelectorAll(".svc-opt").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      state.mults[id] = parseFloat(btn.dataset.mult) || 1;
      updateQuote();
    });
  });
  const inp = card.querySelector(".svc-input");
  if (inp) inp.addEventListener("input", updateQuote);
});

// ── Naročnina: plan cards ─────────────────────────────
const TIER_PRICES = {
  basic: { standard: 50, plus: 90, gold: 120, premium: 220 },
  pro:   { standard: 95, plus: 135, gold: 180, premium: 320 },
};
const TIER_FEATURES = {
  basic: {
    standard: ['Košenje trave (do 250 m²)', '1× mesečno'],
    plus:     ['Košenje trave (do 250 m²)', 'Rob trava/tlakovci', 'Odvoz na deponijo', '1× mesečno'],
    gold:     ['Košenje trave (do 250 m²)', 'Rob trava/tlakovci', 'Odvoz na deponijo', 'Striženje živice (do 15 tm)', '1× mesečno'],
    premium:  ['Košenje trave (do 250 m²)', 'Rob trava/tlakovci', 'Odvoz na deponijo', 'Striženje živice (do 15 tm)', '2× mesečno'],
  },
  pro: {
    standard: ['Košenje trave (do 500 m²)', '1× mesečno', 'Prednostna obravnava'],
    plus:     ['Košenje trave (do 500 m²)', 'Rob trava/tlakovci', 'Odvoz na deponijo', '1× mesečno', 'Prednostna obravnava'],
    gold:     ['Košenje trave (do 500 m²)', 'Rob trava/tlakovci', 'Odvoz na deponijo', 'Striženje živice (do 20 tm)', '1× mesečno', 'Prednostna obravnava'],
    premium:  ['Košenje trave (do 500 m²)', 'Rob trava/tlakovci', 'Odvoz na deponijo', 'Striženje živice (do 20 tm)', '2× mesečno', 'Prednostna obravnava'],
  },
};
const TIER_ROWS = {
  basic: {
    standard: [{icon:'🌿', label:'Košenje trave (do 250 m²)', note:'1×/mes'}],
    plus:     [{icon:'🌿', label:'Košenje trave (do 250 m²)', note:'1×/mes'}, {icon:'⚠️', label:'Rob trava/tlakovci', note:''}, {icon:'🚛', label:'Odvoz na deponijo', note:''}],
    gold:     [{icon:'🌿', label:'Košenje trave (do 250 m²)', note:'1×/mes'}, {icon:'⚠️', label:'Rob trava/tlakovci', note:''}, {icon:'🚛', label:'Odvoz na deponijo', note:''}, {icon:'✂️', label:'Striženje živice (do 15 tm)', note:'1×/mes'}],
    premium:  [{icon:'🌿', label:'Košenje trave (do 250 m²)', note:'2×/mes'}, {icon:'⚠️', label:'Rob trava/tlakovci', note:''}, {icon:'🚛', label:'Odvoz na deponijo', note:''}, {icon:'✂️', label:'Striženje živice (do 15 tm)', note:'2×/mes'}],
  },
  pro: {
    standard: [{icon:'🌿', label:'Košenje trave (do 500 m²)', note:'1×/mes'}],
    plus:     [{icon:'🌿', label:'Košenje trave (do 500 m²)', note:'1×/mes'}, {icon:'⚠️', label:'Rob trava/tlakovci', note:''}, {icon:'🚛', label:'Odvoz na deponijo', note:''}],
    gold:     [{icon:'🌿', label:'Košenje trave (do 500 m²)', note:'1×/mes'}, {icon:'⚠️', label:'Rob trava/tlakovci', note:''}, {icon:'🚛', label:'Odvoz na deponijo', note:''}, {icon:'✂️', label:'Striženje živice (do 20 tm)', note:'1×/mes'}],
    premium:  [{icon:'🌿', label:'Košenje trave (do 500 m²)', note:'2×/mes'}, {icon:'⚠️', label:'Rob trava/tlakovci', note:''}, {icon:'🚛', label:'Odvoz na deponijo', note:''}, {icon:'✂️', label:'Striženje živice (do 20 tm)', note:'2×/mes'}],
  },
};

// Custom: rates per unit
const CUSTOM_RATES = {
  lawn:  { rate: 0.25, type: 'area',  unit: 'm²',  label: 'Košenje trave',       icon: '🌿' },
  hedge: { rate: 3.00, type: 'area',  unit: 'tm',  label: 'Striženje živice',    icon: '✂️' },
  edge:  { rate: 20,   type: 'fixed', unit: null,  label: 'Rob trava/tlakovci',  icon: '⚠️' },
  waste: { rate: 30,   type: 'fixed', unit: null,  label: 'Odvoz na deponijo',   icon: '🚛' },
  snow:  { rate: 5.00, type: 'area',  unit: 'm²',  label: 'Kidanje snega',       icon: '❄️' },
  shrub: { rate: 10,   type: 'count', unit: 'kos', label: 'Obrezovanje grmovja', icon: '🌳' },
};

function calcCustomOnce(svcId) {
  const cfg = CUSTOM_RATES[svcId];
  if (cfg.type === 'fixed') return cfg.rate;
  const inp = document.getElementById('cVal-' + svcId);
  const qty = parseFloat(inp?.value) || 0;
  return qty * cfg.rate;
}

function calcCustomSub(svcId) {
  const once = calcCustomOnce(svcId);
  const freq = state.customFreq;
  // 1x: ×85%, 2x: ×2×85%×90% (double frequency, -10% loyalty discount)
  const discount = freq === 2 ? 0.85 * 2 * 0.90 : 0.85;
  return Math.round(once * discount * 100) / 100;
}

function updateCustomPrice(svcId) {
  const cfg = CUSTOM_RATES[svcId];
  const priceEl = document.getElementById('cPrice-' + svcId);
  if (!priceEl) return;
  if (!state.customSvcs[svcId]) { priceEl.textContent = '—'; return; }
  const once = calcCustomOnce(svcId);
  const sub = calcCustomSub(svcId);
  const freq = state.customFreq;
  const freqLabel = freq === 2 ? '×2×85%×90%' : '×85%';
  if (cfg.type === 'fixed') {
    priceEl.textContent = `${once} € ${freqLabel} = ${sub} €/mes`;
  } else {
    const inp = document.getElementById('cVal-' + svcId);
    const qty = parseFloat(inp?.value) || 0;
    priceEl.textContent = qty > 0
      ? `${qty} ${cfg.unit} × ${cfg.rate} € ${freqLabel} = ${sub} €/mes`
      : `vnesite ${cfg.unit}`;
  }
  const total = Object.keys(state.customSvcs).reduce((sum, id) => sum + calcCustomSub(id), 0);
  document.getElementById("customPriceDisplay").innerHTML =
    total > 0 ? `${Math.round(total)} €<span>/mesec</span>` : `— €<span>/mesec</span>`;
  updateQuote();
}

document.querySelectorAll(".plan-card").forEach(card => {
  const planId = card.dataset.plan;

  card.addEventListener("click", e => {
    if (e.target.closest(".plan-subtab") || e.target.closest(".custom-svc") || e.target.closest(".custom-inp")) return;
    document.querySelectorAll(".plan-card").forEach(c => c.classList.remove("on"));
    card.classList.add("on");
    state.selectedPlan = card;
    updateQuote();
  });

  // Subtabs (Basic & Pro)
  card.querySelectorAll(".plan-subtab").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      card.querySelectorAll(".plan-subtab").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      const tier = btn.dataset.tier;
      state.activeTier[planId] = tier;
      // Update price display
      const price = TIER_PRICES[planId]?.[tier];
      const displayEl = document.getElementById(planId + "PriceDisplay");
      if (displayEl && price !== undefined) displayEl.innerHTML = `${price} €<span>/mesec</span>`;
      // Update features list
      const featuresEl = document.getElementById(planId + "Features");
      if (featuresEl && TIER_FEATURES[planId]?.[tier]) {
        featuresEl.innerHTML = TIER_FEATURES[planId][tier].map(f => `<li>${f}</li>`).join("");
      }
      document.querySelectorAll(".plan-card").forEach(c => c.classList.remove("on"));
      card.classList.add("on");
      state.selectedPlan = card;
      updateQuote();
    });
  });

  // Custom service toggles
  card.querySelectorAll(".custom-svc").forEach(csvc => {
    const svcId = csvc.dataset.svc;
    const cfg = CUSTOM_RATES[svcId];

    // Toggle on header click (not on input)
    csvc.addEventListener("click", e => {
      if (e.target.closest(".custom-inp")) return;
      e.stopPropagation();
      if (state.customSvcs[svcId]) {
        delete state.customSvcs[svcId];
        csvc.classList.remove("on");
        const inputWrap = document.getElementById("cInput-" + svcId);
        if (inputWrap) inputWrap.style.display = "none";
      } else {
        state.customSvcs[svcId] = true;
        csvc.classList.add("on");
        const inputWrap = document.getElementById("cInput-" + svcId);
        if (inputWrap) inputWrap.style.display = "flex";
      }
      updateCustomPrice(svcId);
      if (state.selectedPlan !== card) {
        document.querySelectorAll(".plan-card").forEach(c => c.classList.remove("on"));
        card.classList.add("on");
        state.selectedPlan = card;
      }
    });

    // Input change
    const inp = document.getElementById("cVal-" + svcId);
    if (inp) {
      inp.addEventListener("input", e => {
        e.stopPropagation();
        updateCustomPrice(svcId);
      });
      inp.addEventListener("click", e => e.stopPropagation());
    }
  });
});

// ── Tabs ──────────────────────────────────────────────
let mode = "once";
document.getElementById("tabOnce").addEventListener("click", () => {
  mode = "once"; state.selectedPlan = null;
  document.getElementById("tabOnce").classList.add("active");
  document.getElementById("tabSub").classList.remove("active");
  document.getElementById("panelOnce").style.display = "";
  document.getElementById("panelSub").style.display = "none";
  updateQuote();
});
document.getElementById("tabSub").addEventListener("click", () => {
  mode = "sub";
  Object.keys(state.active).forEach(k => delete state.active[k]);
  document.querySelectorAll(".svc-card").forEach(c => c.classList.remove("on"));
  document.getElementById("tabSub").classList.add("active");
  document.getElementById("tabOnce").classList.remove("active");
  document.getElementById("panelSub").style.display = "";
  document.getElementById("panelOnce").style.display = "none";
  updateQuote();
});

// ── Location / travel cost ────────────────────────────
// 0.60 €/km × 2 (round trip). Maribor area = free (< 5 km).
// Distances from Maribor city centre (km, approximate road distance)
const DISTANCES = {
  "maribor": 0, "hoče": 7, "miklavž": 9, "miklavž na dravskem polju": 9,
  "rače": 11, "frame": 11, "starše": 14, "pragersko": 18,
  "ruše": 14, "smolnik": 17, "lovrenc na pohorju": 28,
  "pesnica": 14, "pesnica pri mariboru": 14, "šentilj": 20,
  "kungota": 18, "sveta trojica": 22, "sveta trojica v slovenskih goricah": 22,
  "lenart": 20, "lenart v slovenskih goricah": 20,
  "benedikt": 25, "sv. benedikt": 25,
  "ptuj": 25, "hajdina": 20, "kidričevo": 27, "cirkulane": 38,
  "ormož": 42, "središče ob dravi": 47, "ljutomer": 37,
  "murska sobota": 58, "lendava": 72, "gornja radgona": 35,
  "radenci": 30, "apače": 28,
  "slovenska bistrica": 24, "oplotnica": 20, "makole": 32,
  "majšperk": 34, "videm": 30, "vidma pri ptuju": 28,
  "juršinci": 38, "gorišnica": 33,
  "slovenj gradec": 50, "dravograd": 45, "radlje ob dravi": 38,
  "muta": 40, "vuzenica": 35, "podvelka": 32,
  "celje": 76, "velenje": 62, "žalec": 66,
  "polzela": 60, "šempeter v savinjski dolini": 68,
  "ljubljana": 130, "kranj": 155, "koper": 215,
  "nova gorica": 200, "novo mesto": 160,
};

let travelDebounce;
document.getElementById("inpLocation").addEventListener("input", function() {
  clearTimeout(travelDebounce);
  travelDebounce = setTimeout(() => calcTravel(this.value), 600);
});

function calcTravel(val) {
  const key = val.trim().toLowerCase();
  const el = document.getElementById("travelCost");
  if (!key) { el.classList.remove("show"); state.travel = 0; state.travelKm = 0; updateQuote(); return; }

  let km = null, matchedTown = "";
  for (const [town, dist] of Object.entries(DISTANCES)) {
    if (key === town || key.startsWith(town) || town.startsWith(key) && key.length >= 4) {
      km = dist; matchedTown = town; break;
    }
  }
  // Fuzzy: check if key is contained in a town name or vice versa
  if (km === null) {
    for (const [town, dist] of Object.entries(DISTANCES)) {
      if (town.includes(key) || key.includes(town) && key.length >= 4) {
        km = dist; matchedTown = town; break;
      }
    }
  }

  if (km !== null) {
    if (km <= 5) {
      // Maribor area — free
      state.travel = 0; state.travelKm = km;
      document.getElementById("travelLabel").textContent = `Maribor okolica (~${km} km)`;
      document.getElementById("travelVal").textContent = "Brezplačno";
      el.classList.add("show");
    } else {
      const travel = Math.round(km * 0.60 * 2);
      state.travel = travel; state.travelKm = km;
      document.getElementById("travelLabel").textContent = `Potni stroški (~${km} km × 2 × 0,60 €)`;
      document.getElementById("travelVal").textContent = `+ ${travel} €`;
      el.classList.add("show");
    }
  } else if (key.length >= 3) {
    state.travel = 20; state.travelKm = 0;
    document.getElementById("travelLabel").textContent = "Potni stroški (okvirna ocena)";
    document.getElementById("travelVal").textContent = "+ 20 €";
    el.classList.add("show");
  } else {
    el.classList.remove("show");
    state.travel = 0; state.travelKm = 0;
  }
  updateQuote();
}

// ── Quote ─────────────────────────────────────────────
function updateQuote() {
  const el = document.getElementById("quoteBody");

  if (mode === "once") {
    const keys = Object.keys(state.active);
    if (!keys.length) { el.innerHTML = '<p class="quote-empty">Izberite vsaj eno storitev.</p>'; return; }

    let rows = "", total = 0;
    keys.forEach(id => {
      const svc = SERVICES[id];
      let cost = 0, detail = "";
      if (svc.type === "fixed") {
        cost = svc.base; detail = "Fiksna cena";
      } else {
        const inp = document.getElementById("val-" + id);
        const qty = parseFloat(inp?.value) || 0;
        const mult = state.mults[id] || 1;
        cost = qty * svc.base * mult;
        const multLabel = mult !== 1 ? ` × ${mult.toFixed(2)}` : "";
        detail = `${qty} ${svc.unit} × ${svc.base} €${multLabel}`;
      }
      total += cost;
      const valStr = cost > 0 ? cost.toFixed(2) + " €" : "—";
      rows += `<div class="quote-row">
        <span>${svc.icon} ${svc.name}<br><span class="quote-row-sub">${detail}</span></span>
        <span class="quote-val ${cost===0?"dash":""}">${valStr}</span>
      </div>`;
    });
    if (state.travel > 0) {
      total += state.travel;
      rows += `<div class="quote-row"><span>🚗 Potni stroški</span><span class="quote-val">${state.travel} €</span></div>`;
    }
    el.innerHTML = `<div class="quote-rows">${rows}</div><hr class="quote-divider"/>
      <div class="quote-total"><span>Skupaj ocena</span><span class="quote-total-val">${total.toFixed(2)} €</span></div>`;

  } else {
    if (!state.selectedPlan) { el.innerHTML = '<p class="quote-empty">Izberite naročniški paket.</p>'; return; }
    const planId = state.selectedPlan.dataset.plan;
    let rows = "", total = 0;

    if (planId === "custom") {
      const svcs = Object.keys(state.customSvcs);
      if (!svcs.length) { el.innerHTML = '<p class="quote-empty">Izberite storitve v Custom paketu.</p>'; return; }
      const freq = state.customFreq;
      const freqLabel = freq === 2 ? '2×/mes · ×2×85%×90%' : '1×/mes · ×85%';
      svcs.forEach(id => {
        const cfg = CUSTOM_RATES[id];
        const once = calcCustomOnce(id);
        const sub = calcCustomSub(id);
        const inp = document.getElementById('cVal-' + id);
        const qty = inp ? (parseFloat(inp.value) || 0) : 0;
        const detail = cfg.type === 'fixed'
          ? `${once} € · ${freqLabel}`
          : qty > 0 ? `${qty} ${cfg.unit} × ${cfg.rate} € · ${freqLabel}` : `vnesite ${cfg.unit}`;
        rows += `<div class="quote-row">
          <span>${cfg.icon} ${cfg.label}<br><span class="quote-row-sub">${detail}</span></span>
          <span class="quote-val ${sub===0?'dash':''}">${sub > 0 ? sub.toFixed(2)+' €/mes' : '—'}</span>
        </div>`;
        total += sub;
      });
    } else {
      const tier = state.activeTier[planId] || "standard";
      const price = TIER_PRICES[planId]?.[tier] ?? 0;
      const tierRows = TIER_ROWS[planId]?.[tier] ?? [];
      total = price;
      tierRows.forEach(r => {
        rows += `<div class="quote-row">
          <span>${r.icon} ${r.label}${r.note ? `<br><span class="quote-row-sub">${r.note}</span>` : ''}</span>
          <span class="quote-val" style="opacity:0.5">—</span>
        </div>`;
      });
      rows += `<div class="quote-row" style="border-top:1px solid #1a5c36;padding-top:7px;margin-top:3px;">
        <span>📦 Skupaj paket</span><span class="quote-val">${price} €/mes</span>
      </div>`;
    }

    if (state.travel > 0) {
      rows += `<div class="quote-row"><span>🚗 Potni stroški</span><span class="quote-val">${state.travel} €</span></div>`;
      total += state.travel;
    }

    el.innerHTML = `<div class="quote-rows">${rows}</div><hr class="quote-divider"/>
      <div class="quote-total"><span>Skupaj ocena</span>
      <span class="quote-total-val">${total} €<span style="font-size:0.9rem;color:#8fbc8f;font-weight:400">/mes</span></span></div>`;
  }
}

async function submitForm() {
  if (mode === "once" && !Object.keys(state.active).length) { alert("Izberite vsaj eno storitev."); return; }
  if (mode === "sub" && !state.selectedPlan) { alert("Izberite naročniški paket."); return; }

  const contact = document.getElementById("inpContact").value.trim();
  if (!contact) { alert("Prosimo, vnesite e-mail ali telefonsko številko."); return; }

  const location = document.getElementById("inpLocation").value.trim();
  const btn = document.querySelector(".btn-submit");
  btn.textContent = "Pošiljanje...";
  btn.disabled = true;

  // Build storitve array for email
  const storitve = [];
  let skupaj = 0;

  if (mode === "once") {
    Object.keys(state.active).forEach(id => {
      const svc = SERVICES[id];
      let cena = 0, podrobnosti = "";
      if (svc.type === "fixed") {
        cena = svc.base; podrobnosti = "fiksno";
      } else {
        const inp = document.getElementById("val-" + id);
        const qty = parseFloat(inp?.value) || 0;
        const mult = state.mults[id] || 1;
        cena = qty * svc.base * mult;
        podrobnosti = `${qty} ${svc.unit} × ${svc.base} €` + (mult !== 1 ? ` × ${mult}` : "");
      }
      skupaj += cena;
      storitve.push({ naziv: `${svc.icon} ${svc.name}`, podrobnosti, cena: cena.toFixed(2) + " €" });
    });
  } else {
    const planId = state.selectedPlan.dataset.plan;
    if (planId === "custom") {
      Object.keys(state.customSvcs).forEach(id => {
        const cfg = CUSTOM_RATES[id];
        const sub = calcCustomSub(id);
        skupaj += sub;
        storitve.push({ naziv: `${cfg.icon} ${cfg.label}`, podrobnosti: `${state.customFreq}×/mes · ×85%${state.customFreq===2?" ×2×90%":""}`, cena: sub.toFixed(2) + " €/mes" });
      });
    } else {
      const tier = state.activeTier[planId] || "standard";
      const price = TIER_PRICES[planId]?.[tier] ?? 0;
      skupaj = price;
      const rows = TIER_ROWS[planId]?.[tier] ?? [];
      rows.forEach(r => storitve.push({ naziv: `${r.icon} ${r.label}`, podrobnosti: r.note || "", cena: "—" }));
      storitve.push({ naziv: "📦 Skupaj paket", podrobnosti: `${planId} — ${tier}`, cena: price + " €/mes" });
    }
  }

  if (state.travel > 0) {
    skupaj += state.travel;
    storitve.push({ naziv: "🚗 Potni stroški", podrobnosti: `~${state.travelKm} km`, cena: state.travel + " €" });
  }

  const nacin = mode === "once" ? "Enkratna storitev" : `Naročnina — ${state.selectedPlan?.dataset.plan?.toUpperCase() || ""}`;

  try {
    const res = await fetch("/api/povprasevanje", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kontakt: contact, lokacija: location, nacin, storitve, potniStroski: state.travel || null, skupaj: skupaj.toFixed(2) })
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || "Napaka pri pošiljanju.");
    document.getElementById("quoteBody").innerHTML =
      '<p style="text-align:center;color:#4caf50;font-weight:700;padding:12px 0;font-size:1rem;">✓ Hvala! Javili se vam bomo v kratkem.</p>';
    btn.textContent = "Poslano ✓";
    setTimeout(() => {
      resetAll();
      const freshBtn = document.querySelector(".btn-submit");
      if (freshBtn) { freshBtn.textContent = "Pošlji povpraševanje ↗"; freshBtn.disabled = false; }
    }, 3000);
  } catch (err) {
    alert(err.message || "Pri pošiljanju je prišlo do napake. Poskusite znova.");
    btn.textContent = "Pošlji povpraševanje ↗";
    btn.disabled = false;
  }
}

function resetAll() {
  Object.keys(state.active).forEach(k => delete state.active[k]);
  state.selectedPlan = null; state.activeTier = {}; state.customSvcs = {};
  state.travel = 0; state.travelKm = 0; state.customFreq = 1;
  document.querySelectorAll(".svc-card").forEach(c => c.classList.remove("on"));
  document.querySelectorAll(".plan-card").forEach(c => c.classList.remove("on"));
  document.querySelectorAll(".custom-svc").forEach(c => c.classList.remove("on"));
  document.querySelectorAll(".svc-input").forEach(i => i.value = "");
  document.getElementById("inpLocation").value = "";
  document.getElementById("inpContact").value = "";
  document.getElementById("travelCost").classList.remove("show");
  ['basic','pro'].forEach(pid => {
    const el = document.getElementById(pid + "PriceDisplay");
    if (el) el.innerHTML = `${TIER_PRICES[pid].standard} €<span>/mesec</span>`;
    const fl = document.getElementById(pid + "Features");
    if (fl) fl.innerHTML = TIER_FEATURES[pid].standard.map(f => `<li>${f}</li>`).join("");
  });
  document.querySelectorAll(".plan-subtab").forEach(b => {
    b.classList.toggle("on", b.dataset.tier === "standard");
  });
  document.querySelectorAll(".custom-svc").forEach(c => c.classList.remove("on"));
  document.querySelectorAll(".custom-svc-input").forEach(i => { i.style.display = "none"; });
  document.querySelectorAll(".custom-inp").forEach(i => { i.value = ""; });
  document.querySelectorAll(".custom-svc-price").forEach(p => { p.textContent = "—"; });
  document.querySelectorAll(".custom-freq-btn").forEach(b => {
    b.classList.toggle("on", b.dataset.freq === "1");
  });
  document.getElementById("customPriceDisplay").innerHTML = '— €<span>/mesec</span>';
  updateQuote();
}