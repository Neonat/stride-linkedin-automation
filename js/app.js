/* Stride — App Logic & Demo Data */

/* ─────────────────────────────────────────
   DEMO DATA
───────────────────────────────────────── */
const demoData = {
  user: {
    name: "Alex Tan",
    initials: "AT",
    pillars: ["Technical", "Leadership", "Community"],
  },
  event: {
    name: "NTU Hack4Good",
    ago: "3 days ago",
  },
  streak: {
    days: 4,
  },
  pillarCoverage: [
    { name: "Technical",  pct: 80, gap: false },
    { name: "Leadership", pct: 20, gap: true,  gapMsg: "No leadership post in 6 weeks" },
    { name: "Community",  pct: 55, gap: false },
  ],
  draft: {
    hooks: [
      "I stayed up until 2 AM debugging a payment bug — and then I found out it was a missing semicolon.",
      "72 hours. 4 engineers. One hackathon. Here's what we built (and what broke spectacularly).",
      "Most people think hackathons are about the idea. They're wrong. Here's the real lesson I took home.",
    ],
    selectedHook: 0,
    storyBullets: [
      "Our team of 4 tackled food insecurity data for 47 community kitchens across Singapore.",
      "We built a real-time dashboard that flagged surplus inventory before it expired — cutting waste by 30%.",
      "Presented to a panel of NGO leads and walked away with the Social Impact award.",
    ],
    takeaway: "The best technical solutions aren't the most complex — they're the ones that solve a real human problem in the simplest possible way.",
    ctaOptions: ["Follow", "Comment", "DM"],
    selectedCta: 1,
  },
  analytics: {
    impressions: 340,
    reactions: 12,
  },
  collab: {
    partner: {
      name: "Priya Nair",
      initials: "PN",
    },
    userBullets: [
      "Led the backend architecture for real-time data syncing.",
      "Coordinated with 3 NGO partners to validate our data model.",
      "Shipped an MVP in under 36 hours under zero sleep.",
    ],
    partnerBullets: [
      "Designed the entire frontend UI/UX in Figma before writing a line of code.",
      "Built accessible, mobile-first components from scratch.",
      "Delivered the final pitch deck and live demo — won Social Impact.",
    ],
  },
  admin: {
    orgName: "NTU Computing",
    metrics: {
      activeUsers: 38,
      postsThisWeek: 24,
      avgStreak: 5.2,
      pillarCoverage: "71%",
    },
    cohort: [
      { name: "Shen Wei",      initials: "SW", posts: 3, streak: 9,  pillar: "Technical" },
      { name: "Priya Nair",    initials: "PN", posts: 2, streak: 7,  pillar: "Creative" },
      { name: "Alex Tan",      initials: "AT", posts: 2, streak: 4,  pillar: "Leadership" },
      { name: "Raj Mehta",     initials: "RM", posts: 1, streak: 3,  pillar: "Community" },
      { name: "Lim Hui Ting",  initials: "LH", posts: 1, streak: 2,  pillar: "Research" },
      { name: "Kevin Ooi",     initials: "KO", posts: 0, streak: 1,  pillar: "Technical" },
      { name: "Sarah Binte",   initials: "SB", posts: 0, streak: 0,  pillar: "Community" },
      { name: "Marcus Ang",    initials: "MA", posts: 4, streak: 12, pillar: "Leadership" },
    ],
  },
};

/* ─────────────────────────────────────────
   SCREEN ROUTER
───────────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById("screen-" + id);
  if (target) {
    target.classList.add("active");
    window.scrollTo(0, 0);
  }
}

/* ─────────────────────────────────────────
   ONBOARDING
───────────────────────────────────────── */
let currentStep = 1;
const totalSteps = 3;

function goToStep(n) {
  document.querySelectorAll(".onboarding-step").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".step-dot").forEach((d, i) => {
    d.classList.toggle("active", i + 1 === n);
  });
  const step = document.getElementById("onboarding-step-" + n);
  if (step) step.classList.add("active");
  currentStep = n;
}

function nextStep() {
  if (currentStep < totalSteps) {
    goToStep(currentStep + 1);
  } else {
    showScreen("home");
  }
}

/* Pillar chip multi-select */
function initPillarChips() {
  document.querySelectorAll(".onboarding-chips .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
    });
  });
}

/* Personality slider gradient update */
function initSlider() {
  const slider = document.getElementById("personality-slider");
  if (!slider) return;
  slider.addEventListener("input", () => {
    const pct = slider.value + "%";
    slider.style.background =
      `linear-gradient(to right, var(--color-stride-blue) ${pct}, var(--color-pale-blue) ${pct})`;
  });
}

/* ─────────────────────────────────────────
   DRAFT EDITOR
───────────────────────────────────────── */
function initDraftEditor() {
  // Hook selection
  document.querySelectorAll(".hook-card").forEach((card, i) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".hook-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      demoData.draft.selectedHook = i;
    });
  });

  // CTA chip selection
  document.querySelectorAll(".cta-chips .chip").forEach((chip, i) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".cta-chips .chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
      demoData.draft.selectedCta = i;
    });
  });
}

/* ─────────────────────────────────────────
   PUBLISHED — animated counters
───────────────────────────────────────── */
function animateCounter(el, target, duration) {
  let start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

function runPublishedAnimation() {
  const imp = document.getElementById("stat-impressions");
  const rea = document.getElementById("stat-reactions");
  if (imp) animateCounter(imp, demoData.analytics.impressions, 1200);
  if (rea) animateCounter(rea, demoData.analytics.reactions, 900);
}

/* ─────────────────────────────────────────
   DEV MENU
───────────────────────────────────────── */
function initDevMenu() {
  const toggle = document.getElementById("dev-menu-toggle");
  const panel  = document.getElementById("dev-menu-panel");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("open");
  });

  document.addEventListener("click", () => panel.classList.remove("open"));

  document.querySelectorAll(".dev-menu-item").forEach(item => {
    item.addEventListener("click", () => {
      const screen = item.dataset.screen;
      panel.classList.remove("open");
      if (screen === "published") {
        showScreen("published");
        setTimeout(runPublishedAnimation, 100);
      } else {
        showScreen(screen);
      }
    });
  });
}

/* ─────────────────────────────────────────
   WIRE BUTTONS
───────────────────────────────────────── */
function wireButtons() {
  // Onboarding advance buttons
  document.querySelectorAll("[data-next-step]").forEach(btn => {
    btn.addEventListener("click", nextStep);
  });

  // Generic screen-nav buttons
  document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.goto;
      if (target === "published") {
        showScreen("published");
        setTimeout(runPublishedAnimation, 100);
      } else {
        showScreen(target);
      }
    });
  });
}

/* ─────────────────────────────────────────
   BOOT
───────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  goToStep(1);
  initPillarChips();
  initSlider();
  initDraftEditor();
  initDevMenu();
  wireButtons();
  showScreen("onboarding");
});
