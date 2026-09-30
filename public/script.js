const calmMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Toggle buttons keep their visual state (.on / .active) and aria-pressed in sync.
const press = (b, on) => {
  b.classList.toggle(b.classList.contains("calc-tab") ? "active" : "on", on);
  b.setAttribute("aria-pressed", String(on));
};

// ── Before/After sliders (mouse, touch and keyboard) ──
document.querySelectorAll("[data-slider]").forEach(slider => {
  const before = slider.querySelector(".ba-before");
  const handle = slider.querySelector(".ba-handle");
  let cur = 50;
  const apply = p => {
    p = Math.max(2, Math.min(98, p));
    cur = p;
    before.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
    handle.style.left = p + "%";
    const r = Math.round(p);
    slider.setAttribute("aria-valuenow", r);
    slider.setAttribute("aria-valuetext", `${r} % pred, ${100 - r} % po`);
  };
  const setPos = x => { const r = slider.getBoundingClientRect(); apply(((x - r.left) / r.width) * 100); };
  apply(50);
  let drag = false;
  slider.addEventListener("mousedown", e => { drag = true; setPos(e.clientX); e.preventDefault(); });
  window.addEventListener("mousemove", e => { if (drag) setPos(e.clientX); });
  window.addEventListener("mouseup", () => drag = false);
  slider.addEventListener("touchstart", e => { drag = true; setPos(e.touches[0].clientX); }, { passive: true });
  window.addEventListener("touchmove", e => { if (drag) setPos(e.touches[0].clientX); }, { passive: true });
  window.addEventListener("touchend", () => drag = false);
  slider.addEventListener("keydown", e => {
    const k = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -10, PageUp: 10 }[e.key];
    if (k !== undefined) apply(cur + k);
    else if (e.key === "Home") apply(2);
    else if (e.key === "End") apply(98);
    else return;
    e.preventDefault();
  });
});

// ── Mobile menu ───────────────────────────────────────
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const setMenu = open => { navLinks.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open)); };
menuBtn.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("click", e => {
  if (navLinks.classList.contains("open") && !e.target.closest("#navLinks, #menuBtn")) setMenu(false);
});
navLinks.addEventListener("focusout", e => {
  if (!navLinks.contains(e.relatedTarget) && e.relatedTarget !== menuBtn) setMenu(false);
});

// ── Header turns solid once the hero scrolls away ────
const siteHeader = document.getElementById("siteHeader");
const hero = document.getElementById("domov");
new IntersectionObserver(([e]) => siteHeader.classList.toggle("solid", !e.isIntersecting),
  { rootMargin: "-80px 0px 0px 0px" }).observe(hero);

// ── Scroll reveal ─────────────────────────────────────
const revealIO = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
}), { rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll(".reveal").forEach(el => revealIO.observe(el));

// ── Motion: one pause control for the marquee and the hero video ──
const root = document.documentElement;
const motionToggle = document.getElementById("motionToggle");
const isPaused = () => root.classList.contains("motion-paused");
function setMotion(paused) {
  root.classList.toggle("motion-paused", paused);
  motionToggle.setAttribute("aria-pressed", String(paused));
  motionToggle.setAttribute("aria-label", paused ? "Predvajaj animacijo" : "Ustavi animacijo");
  if (heroVideo && heroVideo.src) paused ? heroVideo.pause() : heroVideo.play().catch(() => {});
  try { localStorage.setItem("motionPaused", paused ? "1" : "0"); } catch (_) {}
}
motionToggle.addEventListener("click", () => setMotion(!isPaused()));

// ── Hero video: loaded after the page, never for reduced motion / data saver ──
// Phones and tablets get the portrait loop, everything wider the landscape one.
const heroVideo = document.querySelector(".hero-video");
const saveData = navigator.connection && navigator.connection.saveData;
try { if (localStorage.getItem("motionPaused") === "1") setMotion(true); } catch (_) {}
if (heroVideo && !calmMotion && !saveData) {
  window.addEventListener("load", () => {
    const portrait = matchMedia("(max-width: 960px)").matches && heroVideo.dataset.srcPortrait;
    heroVideo.src = portrait ? heroVideo.dataset.srcPortrait : heroVideo.dataset.src;
    heroVideo.addEventListener("playing", () => heroVideo.classList.add("playing"), { once: true });
    if (!isPaused()) heroVideo.play().catch(() => {});
    // Pause while the hero is off screen; never resume if the visitor paused motion.
    new IntersectionObserver(([e]) => {
      e.isIntersecting && !isPaused() ? heroVideo.play().catch(() => {}) : heroVideo.pause();
    }).observe(hero);
  });
}

// ── Before/after tabs ─────────────────────────────────
const baTabs = [...document.querySelectorAll(".ba-tab")];
function selectBaTab(i, focus) {
  baTabs.forEach((t, j) => {
    const on = j === i;
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.querySelector(`[data-ba-panel="${j}"]`).classList.toggle("on", on);
  });
  if (focus) baTabs[i].focus();
}
baTabs.forEach((t, i) => {
  t.addEventListener("click", () => selectBaTab(i));
  t.addEventListener("keydown", e => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (step) { e.preventDefault(); selectBaTab((i + step + baTabs.length) % baTabs.length, true); }
  });
});
// Lazy images inside hidden panels never load on their own: warm them up just before the gallery is reached.
const baStage = document.querySelector(".ba-stage");
if (baStage) new IntersectionObserver((es, io) => {
  if (es.some(e => e.isIntersecting)) {
    document.querySelectorAll(".ba-item img").forEach(i => i.loading = "eager");
    io.disconnect();
  }
}, { rootMargin: "600px 0px" }).observe(baStage);

// ── Privacy modal ─────────────────────────────────────
// Opening moves focus into the dialog and makes the page behind it inert; closing hands focus back.
const privacyModal = document.getElementById("privacyModal");
const pageRegions = document.querySelectorAll("body > header, body > main, body > footer");
let modalReturnFocus = null;
function openModal() {
  modalReturnFocus = document.activeElement;
  privacyModal.classList.add("open");
  pageRegions.forEach(el => el.inert = true);
  privacyModal.querySelector(".modal-x").focus();
}
function closeModal() {
  if (!privacyModal.classList.contains("open")) return;
  privacyModal.classList.remove("open");
  pageRegions.forEach(el => el.inert = false);
  modalReturnFocus?.focus();
}
document.querySelectorAll("[data-modal-open]").forEach(el =>
  el.addEventListener("click", e => { e.preventDefault(); openModal(); }));
document.querySelectorAll("[data-modal-close]").forEach(el => el.addEventListener("click", closeModal));
privacyModal.addEventListener("click", e => { if (e.target === privacyModal) closeModal(); });
window.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (navLinks.classList.contains("open")) { setMenu(false); menuBtn.focus(); }
  closeModal();
});

// ── Location field: short placeholder on phones, the examples move below the field ──
const locInp = document.getElementById("inpLocation");
const locFull = locInp.placeholder;
const locMq = matchMedia("(max-width: 540px)");
const syncLocPh = () => { locInp.placeholder = locMq.matches ? "Vaša ulica ali kraj" : locFull; };
locMq.addEventListener("change", syncLocPh);
syncLocPh();

// ── Service configs — the ONE source of truth ─────────
// base   = € per unit (or the flat price when type is "fixed")
// min    = minimum charge in € once the service is selected (edge: ≤ 20 tm costs 20 €)
// minQty = smallest quantity charged; an empty field counts as this (waste: 1 drive)
const SERVICES = {
  lawn:  { base: 0.25, type: "area",  name: "Košenje trave",       icon: "🌿", sym: "plant",     unit: "m²" },
  hedge: { base: 2.00, type: "area",  name: "Striženje živice",    icon: "✂️", sym: "scissors",  unit: "tm" },
  edge:  { base: 1.00, type: "area",  name: "Rob trava/tlakovci",  icon: "🧱", sym: "wall",      unit: "tm", min: 20 },
  waste: { base: 30,   type: "count", name: "Odvoz na deponijo",   icon: "🚛", sym: "truck",     unit: "vožnja", minQty: 1 },
  snow:  { base: 5.00, type: "area",  name: "Kidanje snega",       icon: "❄️", sym: "snowflake", unit: "m²" },
  shrub: { base: 10,   type: "count", name: "Obrezovanje grmovja", icon: "🌳", sym: "tree",      unit: "kos" },
};
// icon = emoji for the inquiry email; sym = the page's SVG sprite symbol (#i-<sym>).
const ico = sym => `<svg class="ico" aria-hidden="true"><use href="#i-${sym}"/></svg>`;

// Subscription = the one-off price × this. 2×/month doubles the work and adds a 10% loyalty discount.
const SUB_DISCOUNT = { 1: 0.85, 2: 0.85 * 2 * 0.90 };

const fmtEur  = n => n.toFixed(2).replace(".", ",");
const fmtRate = n => Number.isInteger(n) ? `${n} €` : `${fmtEur(n)} €`;

// Slovene has singular / dual / plural / genitive-plural forms for "drive".
function unitLabel(svc, qty) {
  if (svc.unit !== "vožnja") return svc.unit;
  const n = Math.round(qty) % 100;
  if (n === 1) return "vožnja";
  if (n === 2) return "vožnji";
  if (n === 3 || n === 4) return "vožnje";
  return "voženj";
}

// The quantity actually charged: never negative, whole numbers for counted units (1,5 drives = 2),
// and at least minQty. The price AND the unit label both use it, so they cannot disagree.
function effQty(svc, qty) {
  let q = Math.max(0, qty || 0);
  if (svc.type === "count") q = Math.ceil(q);
  if (svc.minQty && q < svc.minQty) q = svc.minQty;
  return q;
}

// One-off price of a service. Returns the cost plus two human strings:
//   detail — the full calculation ("15 tm × 1 € · min. 20 €"), used in the quote and the email
//   short  — the quantity, plus the minimum when it applied ("15 tm · min. 20 €"), used by the custom rows
function priceOnce(id, qty, mult = 1) {
  const svc = SERVICES[id];
  if (svc.type === "fixed") return { cost: svc.base, detail: "Fiksna cena", short: "fiksno" };

  const q = effQty(svc, qty);
  let cost = q * svc.base * mult;
  const belowMin = !!svc.min && cost < svc.min;
  if (belowMin) cost = svc.min;

  const multLabel = mult !== 1 ? ` × ${fmtEur(mult)}` : "";
  const minLabel  = `min. ${svc.min} €`;
  const qtyLabel  = `${q} ${unitLabel(svc, q)}`;
  if (q === 0) {
    // Nothing entered yet: a service with a minimum is charged that minimum, anything else waits for a quantity.
    const text = svc.min ? minLabel : `vnesite ${svc.unit}`;
    return { cost, detail: text, short: text };
  }
  return {
    cost,
    detail: `${qtyLabel} × ${fmtRate(svc.base)}${multLabel}${belowMin ? ` · ${minLabel}` : ""}`,
    short:  belowMin ? `${qtyLabel} · ${minLabel}` : qtyLabel,
  };
}

// Unit labels marked data-unit-for follow the number typed (1 vožnja, 2 vožnji, 5 voženj).
// Called from updateQuote(), which every input, toggle and reset path ends in.
function syncUnitLabels() {
  document.querySelectorAll("[data-unit-for]").forEach(span => {
    const svc = SERVICES[span.dataset.svc];
    span.textContent = unitLabel(svc, effQty(svc, qtyOf(span.dataset.unitFor)));
  });
}

const qtyOf = inputId => parseFloat(document.getElementById(inputId)?.value) || 0;

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

// Enter / Space on the div-based switches and checkboxes behaves like a click.
const onActivate = (el, fn) => el.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
});

// ── Custom frequency toggle ───────────────────────────
document.querySelectorAll(".custom-freq-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelectorAll(".custom-freq-btn").forEach(b => press(b, b === btn));
    state.customFreq = parseInt(btn.dataset.freq);
    Object.keys(state.customSvcs).forEach(id => updateCustomPrice(id));
  });
});

// ── Enkratna: toggle cards ────────────────────────────
document.querySelectorAll(".svc-card").forEach(card => {
  const id = card.id.replace("svc-","");
  const header = card.querySelector(".svc-header");
  header.addEventListener("click", () => {
    if (state.active[id]) { delete state.active[id]; card.classList.remove("on"); }
    else { state.active[id] = true; card.classList.add("on"); }
    header.setAttribute("aria-checked", String(!!state.active[id]));
    updateQuote();
  });
  onActivate(header, () => header.click());
  card.querySelectorAll(".svc-opt").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      card.querySelectorAll(".svc-opt").forEach(b => press(b, b === btn));
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
// What each plan caps at, and any extra perks it lists.
const PLAN_DEFS = {
  basic: { caps: { lawn: "do 250 m²", hedge: "do 15 tm" }, extra: [] },
  pro:   { caps: { lawn: "do 500 m²", hedge: "do 20 tm" }, extra: ["Prednostna obravnava"] },
};
// Which services each tier bundles, and how often the recurring ones happen.
const TIER_SERVICES = {
  standard: ["lawn"],
  plus:     ["lawn", "edge", "waste"],
  gold:     ["lawn", "edge", "waste", "hedge"],
  premium:  ["lawn", "edge", "waste", "hedge"],
};
const TIER_FREQ = { standard: 1, plus: 1, gold: 1, premium: 2 };
const RECURRING = new Set(["lawn", "hedge"]);
const TIER_LABEL = { standard: "Standard", plus: "Plus", gold: "Gold", premium: "Premium" };

function tierRows(planId, tier) {
  const caps = PLAN_DEFS[planId].caps, freq = TIER_FREQ[tier];
  return TIER_SERVICES[tier].map(id => {
    const svc = SERVICES[id];
    const label = caps[id] ? `${svc.name} (${caps[id]})` : svc.name;
    return { icon: svc.icon, sym: svc.sym, label, note: RECURRING.has(id) ? `${freq}×/mes` : "" };
  });
}
function tierFeatures(planId, tier) {
  return [...tierRows(planId, tier).map(r => r.label), `${TIER_FREQ[tier]}× mesečno`, ...PLAN_DEFS[planId].extra];
}
// Paints a plan card's price + feature list for a tier (also used on load and reset).
function renderTier(planId, tier) {
  const priceEl = document.getElementById(planId + "PriceDisplay");
  if (priceEl) priceEl.innerHTML = `${TIER_PRICES[planId][tier]} €<span>/mesec</span>`;
  const featuresEl = document.getElementById(planId + "Features");
  if (featuresEl) featuresEl.innerHTML = tierFeatures(planId, tier).map(f => `<li>${f}</li>`).join("");
}
["basic", "pro"].forEach(pid => renderTier(pid, "standard"));

function selectPlan(card) {
  document.querySelectorAll(".plan-card").forEach(c => c.classList.remove("on"));
  card.classList.add("on");
  state.selectedPlan = card;
}

function calcCustomSub(svcId) {
  const once = priceOnce(svcId, qtyOf("cVal-" + svcId)).cost;
  return Math.round(once * SUB_DISCOUNT[state.customFreq] * 100) / 100;
}

// Repaints one custom row's price, then ALWAYS the headline total and the quote —
// a deselected service must drop out of both (it used to return early and leave them stale).
function updateCustomPrice(svcId) {
  const priceEl = document.getElementById("cPrice-" + svcId);
  if (priceEl) {
    const sub = state.customSvcs[svcId] ? calcCustomSub(svcId) : 0;
    priceEl.textContent = !state.customSvcs[svcId] ? "dodaj"
      : sub > 0 ? `${fmtEur(sub)} €/mes` : `vnesite ${SERVICES[svcId].unit}`;
  }
  const total = Math.round(Object.keys(state.customSvcs).reduce((sum, id) => sum + calcCustomSub(id), 0) * 100) / 100;
  document.getElementById("customPriceDisplay").innerHTML =
    total > 0 ? `${fmtRate(total)}<span>/mesec</span>` : `0 €<span>/mesec</span>`;
  updateQuote();
}

document.querySelectorAll(".plan-card").forEach(card => {
  const planId = card.dataset.plan;

  card.addEventListener("click", e => {
    if (e.target.closest(".plan-subtab") || e.target.closest(".custom-svc") || e.target.closest(".custom-inp")) return;
    selectPlan(card);
    updateQuote();
  });

  // Subtabs (Basic & Pro)
  card.querySelectorAll(".plan-subtab").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      card.querySelectorAll(".plan-subtab").forEach(b => press(b, b === btn));
      const tier = btn.dataset.tier;
      state.activeTier[planId] = tier;
      renderTier(planId, tier);
      selectPlan(card);
      updateQuote();
    });
  });

  // Custom service toggles
  card.querySelectorAll(".custom-svc").forEach(csvc => {
    const svcId = csvc.dataset.svc;
    const check = csvc.querySelector(".custom-svc-check");

    // Toggle on click anywhere except the quantity row (input + unit label). The .on class also reveals that row (CSS).
    csvc.addEventListener("click", e => {
      if (e.target.closest(".custom-svc-input")) return;
      e.stopPropagation();
      if (state.customSvcs[svcId]) { delete state.customSvcs[svcId]; csvc.classList.remove("on"); }
      else { state.customSvcs[svcId] = true; csvc.classList.add("on"); }
      check.setAttribute("aria-checked", String(!!state.customSvcs[svcId]));
      if (state.selectedPlan !== card) selectPlan(card);
      updateCustomPrice(svcId);
    });
    onActivate(check, () => csvc.click());

    // Input change
    const inp = document.getElementById("cVal-" + svcId);
    if (inp) {
      inp.addEventListener("input", e => { e.stopPropagation(); updateCustomPrice(svcId); });
      inp.addEventListener("click", e => e.stopPropagation());
    }
  });
});

// ── Tabs ──────────────────────────────────────────────
let mode = "once";
const tabOnce = document.getElementById("tabOnce");
const tabSub = document.getElementById("tabSub");
tabOnce.addEventListener("click", () => {
  // The plan selection is kept (not nulled) so the highlighted card and the quote still agree on the way back.
  mode = "once";
  press(tabOnce, true); press(tabSub, false);
  document.getElementById("panelOnce").style.display = "";
  document.getElementById("panelSub").style.display = "none";
  updateQuote();
});
tabSub.addEventListener("click", () => {
  mode = "sub";
  Object.keys(state.active).forEach(k => delete state.active[k]);
  document.querySelectorAll(".svc-card").forEach(c => c.classList.remove("on"));
  document.querySelectorAll(".svc-header").forEach(h => h.setAttribute("aria-checked", "false"));
  press(tabSub, true); press(tabOnce, false);
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
locInp.addEventListener("input", function() {
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

// ── Screen-reader announcements + inline form errors ──
let announceTimer;
function announce(msg, delay = 700) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    const s = document.getElementById("quoteStatus");
    s.textContent = "";
    requestAnimationFrame(() => { s.textContent = msg; });
  }, delay);
}
const formErr = document.getElementById("formErr");
const contactErr = document.getElementById("contactErr");
const inpContact = document.getElementById("inpContact");
function showFormErr(msg, target) {
  formErr.textContent = msg;
  formErr.hidden = false;
  if (target) target.scrollIntoView({ block: "center", behavior: calmMotion ? "auto" : "smooth" });
}
function clearFormErr() { formErr.hidden = true; formErr.textContent = ""; }
function clearContactErr() {
  contactErr.hidden = true; contactErr.textContent = "";
  inpContact.removeAttribute("aria-invalid"); inpContact.removeAttribute("aria-describedby");
}
inpContact.addEventListener("input", clearContactErr);

// ── Quote ─────────────────────────────────────────────
function updateQuote() {
  syncUnitLabels();
  clearFormErr();
  const el = document.getElementById("quoteBody");
  const empty = msg => { el.innerHTML = `<p class="quote-empty">${msg}</p>`; announce(msg); };

  if (mode === "once") {
    const keys = Object.keys(state.active);
    if (!keys.length) return empty("Izberite vsaj eno storitev.");

    let rows = "", total = 0;
    keys.forEach(id => {
      const svc = SERVICES[id];
      const { cost, detail } = priceOnce(id, qtyOf("val-" + id), state.mults[id] || 1);
      total += cost;
      rows += `<div class="quote-row">
        <span>${ico(svc.sym)}<span>${svc.name}<span class="quote-row-sub">${detail}</span></span></span>
        <span class="quote-val ${cost===0?"dash":""}">${cost > 0 ? fmtEur(cost) + " €" : "-"}</span>
      </div>`;
    });
    if (state.travel > 0) {
      total += state.travel;
      rows += `<div class="quote-row"><span>${ico("car")}<span>Potni stroški</span></span><span class="quote-val">${fmtEur(state.travel)} €</span></div>`;
    }
    el.innerHTML = `<div class="quote-rows">${rows}</div><hr class="quote-divider"/>
      <div class="quote-total"><span>Skupaj ocena</span><span class="quote-total-val">${fmtEur(total)} €</span></div>`;
    announce(`Skupaj ocena: ${fmtEur(total)} €`);

  } else {
    if (!state.selectedPlan) return empty("Izberite naročniški paket.");
    const planId = state.selectedPlan.dataset.plan;
    let rows = "", total = 0;

    if (planId === "custom") {
      const svcs = Object.keys(state.customSvcs);
      if (!svcs.length) return empty("Izberite storitve v Custom paketu.");
      const freqNote = `${state.customFreq}× mesečno`;
      svcs.forEach(id => {
        const svc = SERVICES[id];
        const sub = calcCustomSub(id);
        const { short } = priceOnce(id, qtyOf("cVal-" + id));
        rows += `<div class="quote-row">
          <span>${ico(svc.sym)}<span>${svc.name}<span class="quote-row-sub">${short}, ${freqNote}</span></span></span>
          <span class="quote-val ${sub===0?"dash":""}">${sub > 0 ? fmtEur(sub) + " €/mes" : "-"}</span>
        </div>`;
        total += sub;
      });
    } else {
      const tier = state.activeTier[planId] || "standard";
      const price = TIER_PRICES[planId]?.[tier] ?? 0;
      total = price;
      tierRows(planId, tier).forEach(r => {
        rows += `<div class="quote-row">
          <span>${ico(r.sym)}<span>${r.label}${r.note ? `<span class="quote-row-sub">${r.note}</span>` : ""}</span></span>
          <span class="quote-val faint">vključeno</span>
        </div>`;
      });
      rows += `<div class="quote-row quote-row-sum">
        <span>${ico("package")}<span>Skupaj paket</span></span><span class="quote-val">${fmtEur(price)} €/mes</span>
      </div>`;
    }

    if (state.travel > 0) {
      rows += `<div class="quote-row"><span>${ico("car")}<span>Potni stroški</span></span><span class="quote-val">${fmtEur(state.travel)} €</span></div>`;
      total += state.travel;
    }

    el.innerHTML = `<div class="quote-rows">${rows}</div><hr class="quote-divider"/>
      <div class="quote-total"><span>Skupaj ocena</span>
      <span class="quote-total-val">${fmtEur(total)} €<span class="quote-total-unit">/mes</span></span></div>`;
    announce(`Skupaj ocena: ${fmtEur(total)} € na mesec`);
  }
}

// ── Submit ────────────────────────────────────────────
document.getElementById("btnSubmit").addEventListener("click", submitForm);
document.getElementById("btnReset").addEventListener("click", resetAll);

async function submitForm() {
  if (mode === "once" && !Object.keys(state.active).length) {
    showFormErr("Izberite vsaj eno storitev.", document.querySelector(".svc-grid"));
    document.querySelector(".svc-header").focus({ preventScroll: true });
    return;
  }
  if (mode === "sub" && !state.selectedPlan) {
    showFormErr("Izberite naročniški paket.", document.querySelector(".plan-grid"));
    document.querySelector(".plan-subtab").focus({ preventScroll: true });
    return;
  }
  if (mode === "sub" && state.selectedPlan.dataset.plan === "custom" && !Object.keys(state.customSvcs).length) {
    showFormErr("Izberite storitve v Custom paketu.", document.querySelector(".custom-services"));
    document.querySelector(".custom-svc-check").focus({ preventScroll: true });
    return;
  }

  const contact = inpContact.value.trim();
  if (!contact) {
    contactErr.textContent = "Prosimo, vnesite e-mail ali telefonsko številko.";
    contactErr.hidden = false;
    inpContact.setAttribute("aria-invalid", "true");
    inpContact.setAttribute("aria-describedby", "contactErr");
    inpContact.focus();
    return;
  }

  const location = locInp.value.trim();
  const btn = document.getElementById("btnSubmit");
  const idleHTML = btn.innerHTML;
  btn.textContent = "Pošiljanje...";
  btn.disabled = true;

  // Build storitve array for email
  const storitve = [];
  let skupaj = 0;

  if (mode === "once") {
    Object.keys(state.active).forEach(id => {
      const svc = SERVICES[id];
      const { cost, detail } = priceOnce(id, qtyOf("val-" + id), state.mults[id] || 1);
      skupaj += cost;
      storitve.push({ naziv: `${svc.icon} ${svc.name}`, podrobnosti: detail, cena: fmtEur(cost) + " €" });
    });
  } else {
    const planId = state.selectedPlan.dataset.plan;
    if (planId === "custom") {
      const discountNote = `×85%${state.customFreq === 2 ? " ×2 ×90%" : ""}`;
      Object.keys(state.customSvcs).forEach(id => {
        const svc = SERVICES[id];
        const sub = calcCustomSub(id);
        const { short } = priceOnce(id, qtyOf("cVal-" + id));
        skupaj += sub;
        storitve.push({ naziv: `${svc.icon} ${svc.name}`, podrobnosti: `${short} · ${state.customFreq}×/mes · ${discountNote}`, cena: fmtEur(sub) + " €/mes" });
      });
    } else {
      const tier = state.activeTier[planId] || "standard";
      const price = TIER_PRICES[planId]?.[tier] ?? 0;
      skupaj = price;
      tierRows(planId, tier).forEach(r => storitve.push({ naziv: `${r.icon} ${r.label}`, podrobnosti: r.note || "", cena: "vključeno" }));
      storitve.push({ naziv: "📦 Skupaj paket", podrobnosti: `${planId} — ${tier}`, cena: fmtEur(price) + " €/mes" });
    }
  }

  if (state.travel > 0) {
    skupaj += state.travel;
    storitve.push({ naziv: "🚗 Potni stroški", podrobnosti: `~${state.travelKm} km`, cena: fmtEur(state.travel) + " €" });
  }

  const nacin = mode === "once"
    ? "Enkratna storitev"
    : (() => {
        const planId = state.selectedPlan?.dataset.plan || "";
        if (planId === "custom") return `Naročnina — Custom (${state.customFreq}× mesečno)`;
        const tier = state.activeTier[planId] || "standard";
        return `Naročnina — ${planId.charAt(0).toUpperCase() + planId.slice(1)} / ${TIER_LABEL[tier] || tier}`;
      })();

  try {
    const res = await fetch("/api/povprasevanje", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kontakt: contact, lokacija: location, nacin, storitve, potniStroski: state.travel || null, skupaj: fmtEur(skupaj) })
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || "Napaka pri pošiljanju.");
    document.getElementById("quoteBody").innerHTML =
      `<p class="quote-success">${ico("check")}Hvala! Javili se vam bomo v&nbsp;kratkem.</p>`;
    announce("Hvala! Javili se vam bomo v kratkem.", 0);
    btn.innerHTML = "Poslano" + ico("check");
    setTimeout(() => {
      resetAll();
      btn.innerHTML = idleHTML;
      btn.disabled = false;
    }, 3000);
  } catch (err) {
    showFormErr(err.message || "Pri pošiljanju je prišlo do napake. Poskusite znova.");
    btn.innerHTML = idleHTML;
    btn.disabled = false;
  }
}

function resetAll() {
  Object.keys(state.active).forEach(k => delete state.active[k]);
  state.selectedPlan = null; state.activeTier = {}; state.customSvcs = {};
  state.travel = 0; state.travelKm = 0; state.customFreq = 1;
  state.mults = { lawn:1, hedge:1, snow:1, shrub:1 };
  document.querySelectorAll(".svc-card").forEach(c => c.classList.remove("on"));
  document.querySelectorAll(".svc-header").forEach(h => h.setAttribute("aria-checked", "false"));
  document.querySelectorAll(".svc-opt").forEach(b => press(b, b.dataset.mult === "1"));
  document.querySelectorAll(".plan-card").forEach(c => c.classList.remove("on"));
  document.querySelectorAll(".custom-svc").forEach(c => c.classList.remove("on"));
  document.querySelectorAll(".custom-svc-check").forEach(c => c.setAttribute("aria-checked", "false"));
  document.querySelectorAll(".svc-input").forEach(i => i.value = "");
  locInp.value = "";
  inpContact.value = "";
  clearContactErr();
  document.getElementById("travelCost").classList.remove("show");
  ["basic", "pro"].forEach(pid => renderTier(pid, "standard"));
  document.querySelectorAll(".plan-subtab").forEach(b => press(b, b.dataset.tier === "standard"));
  document.querySelectorAll(".custom-inp").forEach(i => { i.value = ""; });
  document.querySelectorAll(".custom-svc-price").forEach(p => { p.textContent = "dodaj"; });
  document.querySelectorAll(".custom-freq-btn").forEach(b => press(b, b.dataset.freq === "1"));
  document.getElementById("customPriceDisplay").innerHTML = "0 €<span>/mesec</span>";
  updateQuote();
}
