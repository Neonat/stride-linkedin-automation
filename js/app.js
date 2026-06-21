/* Stride — App Logic & Demo Data */

/* ─────────────────────────────────────────
   DEMO DATA
───────────────────────────────────────── */
const demoData = {
  landing: {
    headline: "Your story is already happening.\nStride helps you share it.",
    subline: "Build your personal brand one moment at a time — without the blank page.",
    problems: [
      { text: "Moments pass and you forget to post about them." },
      { text: "You worry you'll sound try-hard or like AI wrote it." },
      { text: "You open a blank post and close it five minutes later." },
    ],
    howItWorks: [
      "Set your pillars once — we learn what you want to be known for.",
      "Stride catches your moments from your calendar and activity.",
      "It drafts posts in your voice so you just review and publish.",
    ],
    features: [
      { title: "Moment capture + streak",    desc: "Never miss a post-worthy moment again." },
      { title: "Drafts that sound like you", desc: "No AI-speak, no buzzwords, just your voice." },
      { title: "Collab posts with a friend", desc: "Co-author a post and reach both audiences." },
    ],
  },

  onboarding: {
    role:    "Student",
    field:   "AI",
    wants:   ["Internships", "Collaborations"],
    tone:    "Direct",
    pillars: ["Technical", "Leadership", "Community"],
  },

  profile: {
    persona:     "Final-year CS student building in AI",
    positioning: "I share what I learn at the intersection of engineering and real-world impact — so others can move faster.",
    tone:        "Direct",
    pillars:     ["Technical", "Leadership", "Community"],
  },

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
  document.body.classList.toggle("on-landing", id === "landing");
  if (id === "home") {
    renderHomePillars();
    renderHomePersonaCard(window.personaData, null);
  }
  if (id === "admin") {
    loadLinkedInStats();
  }

  // Handle global navbar visibility and active tabs
  const globalNav = document.getElementById("global-nav");
  if (globalNav) {
    const navScreens = ["home", "posts", "collab", "settings"];
    if (navScreens.includes(id)) {
      globalNav.style.display = "flex";
      globalNav.querySelectorAll(".nav-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.goto === id);
      });
    } else {
      globalNav.style.display = "none";
    }
  }
  // Connect screen has real backend — initialise on every visit
  if (id === "connect") Connect.init();
}

/* ─────────────────────────────────────────
   ONBOARDING — 5 steps + paste power-up + profile payoff
───────────────────────────────────────── */
let currentStep = 1;
const TOTAL_STEPS = 5;
const SINGLE_SELECT_STEPS = new Set([1]); // role — auto-advance

// Holds the last persona returned from /api/persona so the home screen can display it
window.personaData = null;

function goToStep(n) {
  document.querySelectorAll(".onboarding-step").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".step-dot").forEach((d, i) => {
    d.classList.toggle("active", i + 1 === n);
  });

  const stepLabel = document.getElementById("onboarding-step-label");
  if (stepLabel && n <= TOTAL_STEPS) {
    stepLabel.textContent = `Step ${n} of 5`;
  }

  const header = document.querySelector(".onboarding-header");
  if (header && n <= TOTAL_STEPS) {
    header.style.display = "flex";
  }

  const backBtn = document.getElementById("btn-onboarding-back");
  if (backBtn) {
    backBtn.style.visibility = n > 1 && n <= TOTAL_STEPS ? "visible" : "hidden";
  }

  if (n > TOTAL_STEPS) {
    showPasteStep();
    return;
  }
  const step = document.getElementById("onboarding-step-" + n);
  if (step) step.classList.add("active");
  currentStep = n;
}

function nextStep() {
  goToStep(currentStep + 1);
}

// Show the paste power-up step (after step 5, before profile payoff)
function showPasteStep() {
  document.querySelectorAll(".onboarding-step").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".step-dot").forEach(d => d.classList.remove("active"));

  const header = document.querySelector(".onboarding-header");
  if (header) header.style.display = "none";

  const pasteStep = document.getElementById("onboarding-paste");
  if (pasteStep) pasteStep.classList.add("active");
}

// Collect current onboarding selections
function _collectOnboardingAnswers() {
  const getSelection = (stepId) => {
    const step = document.getElementById(stepId);
    if (!step) return [];
    return Array.from(step.querySelectorAll(".chip.selected")).map(c => c.textContent.trim());
  };
  return {
    role:    getSelection("onboarding-step-1")[0] || "",
    field:   getSelection("onboarding-step-2").join(", "),
    wants:   getSelection("onboarding-step-3"),
    tone:    getSelection("onboarding-step-4").join(", "),
    pillars: getSelection("onboarding-step-5"),
  };
}

// Auto-fill a single-select step with a value (animates the selection)
function _autofillSingleSelect(stepId, value) {
  const step = document.getElementById(stepId);
  if (!step || !value) return;
  const chips = step.querySelectorAll(".chip");
  chips.forEach(c => c.classList.remove("selected", "chip-autofilled"));
  const match = Array.from(chips).find(
    c => c.textContent.trim().toLowerCase() === value.toLowerCase()
  );
  if (match) {
    match.classList.add("selected", "chip-autofilled");
    setTimeout(() => match.classList.remove("chip-autofilled"), 700);
  } else if (chips.length > 0) {
    // Pick first chip if no match (fallback)
    chips[0].classList.add("selected");
  }
}

// Auto-fill a multi-select step with an array of values
function _autofillMultiSelect(stepId, values) {
  const step = document.getElementById(stepId);
  if (!step || !values || !values.length) return;
  const norm = values.map(v => v.toLowerCase());
  step.querySelectorAll(".chip").forEach(c => {
    const matches = norm.includes(c.textContent.trim().toLowerCase());
    c.classList.toggle("selected", matches);
    if (matches) {
      c.classList.add("chip-autofilled");
      setTimeout(() => c.classList.remove("chip-autofilled"), 700);
    }
  });
}

// Apply persona data to the onboarding steps (auto-fill animation)
async function _applyPersonaAutofill(data) {
  const role    = (data.roles    || [])[0] || "";
  const field   = (data.fields   || [])[0] || "";
  const pillars = data.suggested_pillars || [];
  const tone    = data.tone || "";

  // Stagger the autofill so the user can see it happening step-by-step
  _autofillSingleSelect("onboarding-step-1", role);
  await _sleep(180);
  _autofillMultiSelect("onboarding-step-2", data.fields || []);
  await _sleep(180);
  _autofillMultiSelect("onboarding-step-4", tone ? [tone] : []);
  await _sleep(180);
  _autofillMultiSelect("onboarding-step-5", pillars);
}

function _sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Show the profile payoff card (after steps or after paste)
function showProfileCard(fromPersonaData) {
  document.querySelectorAll(".onboarding-step").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".step-dot").forEach(d => d.classList.remove("active"));

  const header = document.querySelector(".onboarding-header");
  if (header) header.style.display = "none";

  const profile = document.getElementById("onboarding-profile");
  if (!profile) return;
  profile.classList.add("active");

  const answers = _collectOnboardingAnswers();
  const pillars = answers.pillars.length > 0 ? answers.pillars : demoData.user.pillars;
  window.userSelectedPillars = pillars;

  let persona, positioning, tone;

  const autofillNote = document.getElementById("profile-autofill-note");
  if (fromPersonaData) {
    // Persona came from the API — use it directly
    persona      = fromPersonaData.persona_summary || "";
    positioning  = fromPersonaData.positioning     || "";
    tone         = fromPersonaData.tone            || answers.tone || "Direct";
    window.personaData = fromPersonaData;
    if (autofillNote) autofillNote.style.display = "flex";
  } else {
    // Build a local fallback from onboarding selections
    const role  = answers.role  || "Professional";
    const field = answers.field || "Tech";
    const goals = answers.wants;
    tone        = answers.tone  || "Direct";
    persona     = `${role} building in ${field}`;
    const goalText = goals.length > 0 ? ` to attract ${goals.join(" and ")}` : "";
    positioning = `I share my journey in ${field}${goalText} — keeping it ${tone.toLowerCase()} and authentic.`;
    if (autofillNote) autofillNote.style.display = "none";
  }

  const personaEl = profile.querySelector(".profile-persona");
  if (personaEl) personaEl.textContent = persona;

  const posEl = profile.querySelector(".profile-positioning");
  if (posEl) posEl.textContent = positioning;

  const metaEl = profile.querySelector(".profile-meta");
  if (metaEl) {
    metaEl.innerHTML = "";
    pillars.forEach(p => {
      const span = document.createElement("span");
      span.className = `chip chip-${p.toLowerCase()} selected`;
      span.style = "font-size:11px;padding:2px 10px;pointer-events:none;";
      span.textContent = p;
      metaEl.appendChild(span);
    });
    const toneSpan = document.createElement("span");
    toneSpan.className = "profile-tone-label";
    toneSpan.textContent = tone;
    metaEl.appendChild(toneSpan);
  }
}

// Wire up the resume upload step
function initPasteStep() {
  const submitBtn = document.getElementById("btn-paste-submit");
  const loading   = document.getElementById("paste-loading");
  const errorEl   = document.getElementById("paste-error");
  const fileInput = document.getElementById("onboarding-file-input");

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      let pasted = "";
      if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
          pasted = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result || "");
            reader.onerror = () => resolve("");
            reader.readAsText(fileInput.files[0]);
          });
        } catch {
          pasted = "";
        }
      }
      const answers = _collectOnboardingAnswers();

      if (loading) loading.hidden = false;
      if (errorEl) errorEl.hidden = true;
      submitBtn.disabled = true;

      try {
        const resp = await fetch("/api/persona", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pastedText: pasted,
            role:    answers.role,
            field:   answers.field,
            wants:   answers.wants,
            tone:    answers.tone,
            pillars: answers.pillars,
          }),
        });
        let data;
        try { data = await resp.json(); }
        catch { data = { ok: false, error: "Unexpected server response." }; }

        if (!data.ok) {
          if (errorEl) {
            errorEl.textContent = data.error || "Something went wrong. Try again.";
            errorEl.hidden = false;
          }
          return;
        }

        await _applyPersonaAutofill(data);
        showProfileCard(data);

      } catch (err) {
        if (errorEl) {
          errorEl.textContent = "Could not reach the server. Check your connection.";
          errorEl.hidden = false;
        }
      } finally {
        if (loading) loading.hidden = true;
        submitBtn.disabled = false;
      }
    });
  }
}

function renderHomePillars() {
  const pillarContainer = document.querySelector("#screen-home .pillar-row");
  if (!pillarContainer) return;

  const userPillars = window.userSelectedPillars || demoData.user.pillars;
  pillarContainer.innerHTML = "";

  userPillars.forEach(pillarName => {
    let data = demoData.pillarCoverage.find(p => p.name === pillarName);
    if (!data) {
      data = { name: pillarName, pct: Math.floor(Math.random() * 40) + 20, gap: false };
    }

    const html = `
      <div class="pillar-item">
        <div class="pillar-item-header" style="display:flex; justify-content:space-between; width:100%;">
          <span class="pillar-item-label">${data.name}</span>
          <span class="pillar-item-pct">${data.pct}%</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${data.pct}%; ${data.gap ? 'background:var(--color-red);' : ''}"></div>
        </div>
        ${data.gap ? `
        <div class="pillar-item-footer" style="display:flex; align-items:center; gap:var(--space-2); margin-top:4px;">
          <span class="badge badge-warning">
            <span class="icon" style="margin-right:2px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>
            Gap
          </span>
          <p class="text-caption text-muted" style="margin:0;">${data.gapMsg || 'Needs more content'}</p>
        </div>` : ''}
      </div>
    `;
    pillarContainer.insertAdjacentHTML('beforeend', html);
  });
}

// Render the living persona card on the home screen
function renderHomePersonaCard(data, whatChanged) {
  const card = document.getElementById("home-persona-card");
  if (!card) return;

  if (!data) { card.style.display = "none"; return; }

  const summaryEl    = document.getElementById("home-persona-summary");
  const posEl        = document.getElementById("home-persona-positioning");
  const metaEl       = document.getElementById("home-persona-meta");
  const changedEl    = document.getElementById("home-persona-changed");
  const changedText  = document.getElementById("home-persona-changed-text");
  const updatedBadge = document.getElementById("home-persona-updated");

  if (summaryEl)   summaryEl.textContent   = data.persona_summary  || "";
  if (posEl)       posEl.textContent       = data.positioning       || "";

  if (metaEl) {
    metaEl.innerHTML = "";
    const pillars = Array.isArray(data.suggested_pillars) ? data.suggested_pillars : (data.pillars || []);
    pillars.forEach(p => {
      const span = document.createElement("span");
      span.className = `chip chip-${p.toLowerCase()} selected`;
      span.style = "font-size:11px;padding:2px 10px;pointer-events:none;";
      span.textContent = p;
      metaEl.appendChild(span);
    });
    if (data.tone) {
      const toneSpan = document.createElement("span");
      toneSpan.className = "profile-tone-label";
      toneSpan.textContent = data.tone;
      metaEl.appendChild(toneSpan);
    }
  }

  if (whatChanged && changedEl && changedText) {
    changedText.textContent = whatChanged;
    changedEl.style.display = "flex";
    if (updatedBadge) updatedBadge.style.display = "inline-flex";
    // Auto-hide the "what changed" note after 8 seconds
    setTimeout(() => {
      changedEl.style.display = "none";
      if (updatedBadge) updatedBadge.style.display = "none";
    }, 8000);
  }

  card.style.display = "";
}

function updateContinueBtn(stepEl) {
  const btn = stepEl.querySelector("[data-next-step]");
  if (!btn) return;
  const hasSelected = stepEl.querySelectorAll(".chip.selected").length > 0;
  btn.disabled = !hasSelected;
}

function initSingleSelectStep(stepEl) {
  stepEl.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      stepEl.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
      updateContinueBtn(stepEl);
    });
  });
  updateContinueBtn(stepEl);
}

function initMultiSelectStep(stepEl) {
  stepEl.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      updateContinueBtn(stepEl);
    });
  });
  updateContinueBtn(stepEl);
}

function initOnboarding() {
  [1].forEach(n => {
    const el = document.getElementById("onboarding-step-" + n);
    if (el) initSingleSelectStep(el);
  });
  [2, 3, 4, 5].forEach(n => {
    const el = document.getElementById("onboarding-step-" + n);
    if (el) initMultiSelectStep(el);
  });

  // Dynamic subtext for career aspirations step
  const step2 = document.getElementById("onboarding-step-2");
  if (step2) {
    const updateFieldSubtext = () => {
      const count = step2.querySelectorAll(".chip.selected").length;
      const subtextEl = document.getElementById("field-selection-subtext");
      if (!subtextEl) return;
      if (count === 1) subtextEl.textContent = "Let's work on one goal at a time.";
      else if (count >= 2) subtextEl.textContent = "Keep your options open — explore different interests.";
      else subtextEl.textContent = "";
    };
    step2.querySelectorAll(".chip").forEach(c => c.addEventListener("click", updateFieldSubtext));
  }

  const backBtn = document.getElementById("btn-onboarding-back");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (currentStep > 1) goToStep(currentStep - 1);
    });
  }

  initPasteStep();
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

  // Generate button
  const genBtn = document.getElementById("btn-generate");
  if (genBtn) genBtn.addEventListener("click", generateDraft);

  // Photo upload wiring
  const photoUpload = document.getElementById("photo-upload");
  const changePhotoOverlay = document.querySelector(".visual-thumb-overlay");
  if (changePhotoOverlay && photoUpload) {
    changePhotoOverlay.addEventListener("click", () => photoUpload.click());
    photoUpload.addEventListener("change", () => {
      const file = photoUpload.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const gradDiv = document.querySelector(".visual-thumb > div");
        if (gradDiv) {
          gradDiv.style.backgroundImage = `url(${e.target.result})`;
          gradDiv.style.backgroundSize = "cover";
          gradDiv.style.backgroundPosition = "center";
          gradDiv.innerHTML = "";
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

/* ─────────────────────────────────────────
   DRAFT GENERATOR — calls /api/draft
───────────────────────────────────────── */
async function generateDraft() {
  // Collect hook
  const hookEl = document.querySelector(".hook-card.selected");
  const hook = hookEl ? hookEl.textContent.trim() : "";
  if (!hook) {
    setDraftState("error", "Please select a hook first.");
    return;
  }

  // Collect story bullets from editable textareas
  const storyBullets = Array.from(
    document.querySelectorAll(".story-bullet-textarea")
  ).map(t => t.value.trim()).filter(Boolean);
  if (storyBullets.length === 0) {
    setDraftState("error", "Please fill in at least one story bullet.");
    return;
  }

  // CTA
  const ctaEl = document.querySelector(".cta-chips .chip.selected");
  const cta = ctaEl ? ctaEl.textContent.trim() : "Follow";

  // Tone from onboarding data; pillar from the navbar chip
  const tone = (demoData.onboarding && demoData.onboarding.tone) || "Direct";
  const pillarEl = document.querySelector("#screen-draft .navbar .chip");
  const pillar = pillarEl ? pillarEl.textContent.trim() : "Community";

  setDraftState("generating");

  try {
    const resp = await fetch("/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hook, storyBullets, cta, tone, pillar }),
    });

    let data;
    try { data = await resp.json(); }
    catch { data = { ok: false, error: "Server returned an unexpected response." }; }

    if (data.ok) {
      demoData.draft.generatedText = data.draft;
      setDraftState("ready", data.draft);
    } else {
      setDraftState("error", data.error || "Something went wrong. Try again.");
    }
  } catch {
    setDraftState("error", "Could not reach the server. Check your connection.");
  }
}

function setDraftState(state, content) {
  const generating = document.getElementById("draft-generating");
  const placeholder = document.getElementById("draft-placeholder");
  const output     = document.getElementById("draft-output");
  const errorEl    = document.getElementById("draft-error");
  const btn        = document.getElementById("btn-generate");

  // Reset to neutral
  if (generating) generating.hidden = true;
  if (placeholder) placeholder.hidden = true;
  if (output)      output.hidden = true;
  if (errorEl)     errorEl.hidden = true;
  if (btn)         btn.disabled = false;

  if (state === "generating") {
    if (generating) generating.hidden = false;
    if (btn)        btn.disabled = true;
  } else if (state === "ready") {
    if (output) {
      output.hidden = false;
      output.value = content || "";
      // auto-size to content
      output.style.height = "auto";
      output.style.height = output.scrollHeight + "px";
    }
  } else if (state === "error") {
    if (placeholder) placeholder.hidden = false; // keep hint visible
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = content || "An error occurred.";
    }
  } else {
    // "idle" — just show placeholder
    if (placeholder) placeholder.hidden = false;
  }
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
   THEME TOGGLE (dark mode)
───────────────────────────────────────── */
function initThemeToggle() {
  const toggles = [
    document.getElementById("theme-toggle"),
    document.getElementById("theme-toggle-settings")
  ];
  
  const root = document.documentElement;

  toggles.forEach(toggle => {
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("stride-theme", next);
    });
  });
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
      } else if (screen === "onboarding") {
        showScreen("onboarding");
        goToStep(1);
      } else {
        showScreen(screen);
      }
    });
  });
}

/* ─────────────────────────────────────────
   WIRE BUTTONS & API CALLS
───────────────────────────────────────── */
async function fetchDraftFromBackend(btn) {
  const originalText = btn.textContent;
  btn.textContent = "Generating...";
  btn.disabled = true;
  try {
    const res = await fetch("http://localhost:8000/api/draft/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_description: "Hack4Good",
        user_context: demoData.profile
      })
    });
    if (res.ok) {
      const draft = await res.json();
      console.log("Draft received:", draft);
    }
  } catch (e) {
    console.warn("Backend not running, falling back to local demoData");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
    showScreen("draft");
  }
}

function _showPublishError(msg) {
  const el = document.getElementById("publish-error");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function _clearPublishError() {
  const el = document.getElementById("publish-error");
  if (el) { el.hidden = true; el.textContent = ""; }
}

async function publishToLinkedIn(btn) {
  _clearPublishError();

  // Get the current draft text — must be generated before publishing
  const draftEl = document.getElementById("draft-output");
  const text = draftEl ? draftEl.value.trim() : "";
  if (!text) {
    _showPublishError("Generate your post first, then publish.");
    return;
  }

  const originalHtml = btn.innerHTML;
  const spinner = `<span style="display:inline-block;width:12px;height:12px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin-right:8px;"></span>`;
  btn.disabled = true;

  try {
    // ── Step 1: Safety check (non-blocking — log only) ───────────────────
    btn.innerHTML = spinner + "Checking…";
    try {
      const safetyRes = await fetch("/api/safety_check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const safetyData = await safetyRes.json();
      if (!safetyData.safe) {
        console.log("Safety check flagged post:", safetyData.categories);
      }
    } catch (err) {
      console.log("Safety check skipped:", err.message);
    }

    // ── Step 2: Publish to LinkedIn ───────────────────────────────────────
    btn.innerHTML = spinner + "Publishing…";
    let pubData;
    try {
      const pubRes = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      pubData = await pubRes.json();
    } catch {
      _showPublishError("Could not reach the server. Check your connection and try again.");
      return;
    }

    if (!pubData.ok) {
      _showPublishError(`Publish failed: ${pubData.error || "Unknown error"}`);
      return;
    }

    // ── Step 3: Success ───────────────────────────────────────────────────
    showScreen("published");
    setTimeout(runPublishedAnimation, 100);

  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
}

function wireButtons() {
  // Add simple spin keyframes if not exists
  if (!document.getElementById('spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  document.querySelectorAll("[data-next-step]").forEach(btn => {
    btn.addEventListener("click", nextStep);
  });

  document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.goto;
      
      if (target === "draft") {
        fetchDraftFromBackend(btn);
      } else if (target === "published") {
        // Collab screen bypasses the full publish flow
        if (btn.closest("#screen-collab")) {
          showScreen("published");
          setTimeout(runPublishedAnimation, 100);
        } else {
          publishToLinkedIn(btn);
        }
      } else if (target === "onboarding") {
        showScreen("onboarding");
        goToStep(1);
      } else if (target === "home" && btn.closest("#onboarding-profile")) {
        localStorage.setItem("stride-onboarded", "true");
        saveOnboardingProfile({
          role:        getSelectedChips("onboarding-step-1"),
          field:       getSelectedChips("onboarding-step-2"),
          goals:       getSelectedChips("onboarding-step-3"),
          tone:        getSelectedChips("onboarding-step-4"),
          pillars:     getSelectedChips("onboarding-step-5"),
          positioning: document.querySelector(".profile-positioning")?.textContent || "",
        });
        showScreen("home");
      } else {
        showScreen(target);
      }
    });
  });
}

window.handleLogin = async function() {
  const btn = document.getElementById("btn-login-submit");
  const err = document.getElementById("login-error");
  const user = document.getElementById("login-email").value;
  const pass = document.getElementById("login-password").value;
  
  btn.textContent = "Signing In...";
  err.style.display = "none";
  
  try {
    const res = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log("Logged in as", data.user.name);
      showScreen("onboarding");
      goToStep(1);
    } else {
      err.textContent = "Invalid credentials. Try demo / password.";
      err.style.display = "block";
    }
  } catch (e) {
    // Graceful degradation for frontend-only demo
    console.warn("Backend not running, bypassing login locally.");
    showScreen("onboarding");
    goToStep(1);
  } finally {
    btn.textContent = "Sign In";
  }
};

window.toggleProfileMenu = function(e) {
  e.stopPropagation();
  const menu = e.currentTarget.nextElementSibling;
  
  // Close any other open menus
  document.querySelectorAll(".profile-menu.open").forEach(m => {
    if (m !== menu) m.classList.remove("open");
  });
  
  menu.classList.toggle("open");
};

window.handleLogout = function() {
  console.log("User logged out");
  // Hide all open menus
  document.querySelectorAll(".profile-menu.open").forEach(m => m.classList.remove("open"));
  
  // Clear mock session
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
  
  // Return to login screen
  showScreen("login");
};

// Close menu when clicking anywhere else
document.addEventListener("click", () => {
  document.querySelectorAll(".profile-menu.open").forEach(m => m.classList.remove("open"));
});

/* ─────────────────────────────────────────
   ADMIN — LinkedIn stats
───────────────────────────────────────── */
async function loadLinkedInStats() {
  const container = document.getElementById("admin-linkedin-content");
  if (!container) return;
  container.innerHTML = '<p class="text-body text-muted">Loading…</p>';
  try {
    const res  = await fetch("/api/linkedin_stats");
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Unknown error");
    const p = data.profile || {};
    const posts = (data.posts || []);
    let html = `
      <div style="display:flex; align-items:center; gap:var(--space-3); margin-bottom:var(--space-4);">
        <div class="avatar" style="background:var(--color-deep-blue); color:#fff; font-size:16px; width:44px; height:44px;">
          ${(p.name || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
        </div>
        <div>
          <p style="font-weight:600; font-size:15px; margin:0;">${p.name || "—"}</p>
          <p class="text-caption text-muted" style="margin:2px 0 0 0;">${p.headline || ""}</p>
        </div>
      </div>`;
    if (posts.length) {
      html += `<p class="section-label" style="margin-bottom:var(--space-3);">Recent posts</p>`;
      html += `<div style="display:flex; flex-direction:column; gap:var(--space-3);">`;
      for (const post of posts) {
        const preview = post.text ? post.text.slice(0, 120) + (post.text.length > 120 ? "…" : "") : "(no text)";
        html += `
          <div style="border:1px solid var(--border-default); border-radius:var(--radius-md); padding:var(--space-3);">
            <p class="text-small" style="margin:0 0 var(--space-2) 0; color:var(--text-primary);">${preview}</p>
            <p class="text-caption text-muted" style="margin:0;">
              ${post.likes} likes &middot; ${post.comments} comments &middot; ${post.shares} shares
            </p>
          </div>`;
      }
      html += `</div>`;
    } else {
      html += `<p class="text-caption text-muted">No recent posts found.</p>`;
    }
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p class="text-caption" style="color:var(--color-red);">Could not load LinkedIn data: ${err.message}</p>`;
  }
}

/* ─────────────────────────────────────────
   CONNECT SCREEN — Supabase real backend
───────────────────────────────────────── */
const Connect = (() => {
  let _sb = null;     // Supabase JS client
  let _jwt = null;    // current user's access token
  let _profile = null;

  // ── State panel switcher ────────────────────────────────────────────────
  function _show(panelId) {
    ["connect-loading", "connect-auth", "connect-setup", "connect-main"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("active", id === panelId);
    });
  }

  // ── API helper — authenticated fetch to Python functions ────────────────
  async function _api(path, options = {}) {
    const headers = { "Content-Type": "application/json" };
    if (_jwt) headers["Authorization"] = `Bearer ${_jwt}`;
    const res = await fetch(path, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    try { return await res.json(); } catch { return { ok: false, error: "Unexpected server response" }; }
  }

  // ── Feedback helpers ────────────────────────────────────────────────────
  function _setFeedback(elId, msg, isErr = false) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg;
    el.className = "text-small " + (isErr ? "connect-feedback-err" : "connect-feedback-ok");
  }

  // ── Load connections and display ────────────────────────────────────────
  async function _loadConnections() {
    const listEl = document.getElementById("connect-connections-list");
    if (!listEl) return;

    const data = await _api("/api/connections_list");
    if (!data.ok) {
      listEl.innerHTML = `<p class="text-small connect-feedback-err">${data.error}</p>`;
      return;
    }
    if (!data.connections.length) {
      listEl.innerHTML = `<p class="text-small text-muted">
        No connections yet. Share your QR code or generate a word code to connect.
      </p>`;
      return;
    }
    listEl.innerHTML = data.connections.map(c => {
      const initials = (c.display_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      return `
        <div class="connect-person-row">
          <div class="avatar">${initials}</div>
          <div class="connect-person-info">
            <div class="connect-person-name">${_esc(c.display_name)}</div>
            ${c.headline ? `<div class="connect-person-headline">${_esc(c.headline)}</div>` : ""}
          </div>
        </div>`;
    }).join("");
  }

  // ── Escape helper (XSS-safe) ────────────────────────────────────────────
  function _esc(s) {
    return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  // ── Main screen setup ───────────────────────────────────────────────────
  function _showMain(profile) {
    _profile = profile;
    const av = document.getElementById("connect-avatar");
    if (av) {
      av.textContent = (profile.display_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    }
    _show("connect-main");
    _loadConnections();

    // Code submit (Phase 3 placeholder)
    const codeBtn = document.getElementById("connect-code-submit");
    if (codeBtn && !codeBtn._wired) {
      codeBtn._wired = true;
      codeBtn.addEventListener("click", () => {
        const code = (document.getElementById("connect-code-input")?.value || "").trim().toLowerCase();
        if (!code) return;
        _setFeedback("connect-code-msg", "Keyword code pairing is coming in Phase 3.", false);
      });
    }

    // Google Calendar connect
    const gcalBtn = document.getElementById("btn-connect-gcal");
    if (gcalBtn && !gcalBtn._wired) {
      gcalBtn._wired = true;
      gcalBtn.addEventListener("click", async () => {
        const { error } = await _sb.auth.signInWithOAuth({
          provider: "google",
          options: {
            scopes: "https://www.googleapis.com/auth/calendar.readonly",
            redirectTo: window.location.href,
          },
        });
        if (error) console.error("Google Calendar auth error:", error.message);
      });
    }
    _checkGcalStatus();

    // Sign out
    const soBtn = document.getElementById("connect-sign-out");
    if (soBtn && !soBtn._wired) {
      soBtn._wired = true;
      soBtn.addEventListener("click", async () => {
        await _sb.auth.signOut();
        _jwt = null; _profile = null;
        _show("connect-auth");
      });
    }
  }

  async function _checkGcalStatus() {
    const { data: { session } } = await _sb.auth.getSession();
    const statusEl = document.getElementById("gcal-status");
    const btnEl    = document.getElementById("btn-connect-gcal");
    if (!statusEl || !btnEl) return;
    if (session?.provider_token) {
      statusEl.textContent   = "Connected ✓";
      statusEl.style.color   = "var(--color-green)";
      btnEl.textContent      = "Reconnect";
    } else {
      statusEl.textContent   = "Not connected";
      statusEl.style.color   = "";
      btnEl.textContent      = "Connect";
    }
  }

  // ── PUBLIC: called when user navigates to Connect screen ────────────────
  async function init() {
    _show("connect-loading");

    // 1. Fetch public config and init Supabase client
    if (!_sb) {
      try {
        const cfg = await fetch("/api/config").then(r => r.json());
        if (!cfg.ok) throw new Error(cfg.error || "Config fetch failed");
        _sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      } catch (err) {
        _show("connect-auth");
        _setFeedback("connect-auth-feedback", `Could not reach server: ${err.message}`, true);
        return;
      }
    }

    // 2. Check auth state (also handles magic-link redirect fragment)
    const { data: { session } } = await _sb.auth.getSession();
    if (!session) {
      _show("connect-auth");
      _wireAuthForm();
      return;
    }
    _jwt = session.access_token;

    // 3. Fetch profile
    const profileData = await _api("/api/profile");
    if (profileData.ok) {
      _showMain(profileData.profile);
    } else if (profileData.error && profileData.error.includes("not found")) {
      _show("connect-setup");
      _wireSetupForm();
    } else {
      _show("connect-auth");
      _setFeedback("connect-auth-feedback", "Session expired. Please sign in again.", true);
      await _sb.auth.signOut();
      _jwt = null;
    }
  }

  // ── Wire Google OAuth sign-in ───────────────────────────────────────────
  function _wireAuthForm() {
    const btn = document.getElementById("connect-magic-link-btn");
    if (!btn || btn._wired) return;
    btn._wired = true;
    btn.addEventListener("click", async () => {
      const { error } = await _sb.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/calendar.readonly",
          redirectTo: "https://linked-in-trail-blazer-hackathon.vercel.app",
        },
      });
      if (error) console.error(error.message);
    });
  }

  // ── Wire first-time profile setup form ─────────────────────────────────
  function _wireSetupForm() {
    const btn = document.getElementById("setup-save-btn");
    if (!btn || btn._wired) return;
    btn._wired = true;
    btn.addEventListener("click", async () => {
      const name     = (document.getElementById("setup-name")?.value     || "").trim();
      const headline = (document.getElementById("setup-headline")?.value || "").trim();
      if (!name) { _setFeedback("setup-feedback", "Name is required.", true); return; }

      btn.disabled = true;
      _setFeedback("setup-feedback", "Saving…", false);

      const result = await _api("/api/profile", {
        method: "POST",
        body: JSON.stringify({ display_name: name, headline }),
      });

      btn.disabled = false;
      if (result.ok) {
        _showMain(result.profile);
      } else {
        _setFeedback("setup-feedback", result.error || "Save failed. Try again.", true);
      }
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────
   MOMENT CAPTURE MODAL
───────────────────────────────────────── */
function openMomentModal() {
  const overlay = document.getElementById("moment-modal-overlay");
  if (!overlay) return;
  // Set today's date as default
  const dateInput = document.getElementById("moment-date");
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  // Focus title
  setTimeout(() => {
    const t = document.getElementById("moment-title");
    if (t) t.focus();
  }, 80);
}

function closeMomentModal() {
  const overlay = document.getElementById("moment-modal-overlay");
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = "";
}

function initMomentModal() {
  // Open button (on home screen)
  const openBtn = document.getElementById("btn-capture-moment");
  if (openBtn) openBtn.addEventListener("click", openMomentModal);

  // Close button inside modal
  const closeBtn = document.getElementById("btn-moment-close");
  if (closeBtn) closeBtn.addEventListener("click", closeMomentModal);

  // Close on overlay click (outside modal card)
  const overlay = document.getElementById("moment-modal-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeMomentModal();
    });
  }

  // Kind chip selection (single-select)
  document.querySelectorAll(".moment-kind-chips .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".moment-kind-chips .chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
    });
  });

  // Pillar chip selection (single-select)
  document.querySelectorAll(".moment-pillar-chips .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".moment-pillar-chips .chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
    });
  });

  // Add bullet button
  const addBulletBtn = document.getElementById("btn-add-bullet");
  if (addBulletBtn) {
    addBulletBtn.addEventListener("click", () => {
      const wrap = document.getElementById("moment-bullets-wrap");
      if (!wrap) return;
      const row = document.createElement("div");
      row.className = "moment-bullet-row";
      row.innerHTML = `
        <span class="story-bullet-dot" style="margin-top:10px;"></span>
        <textarea class="stride-input moment-bullet-input" rows="1" placeholder="Add another detail…"></textarea>
      `;
      wrap.appendChild(row);
      const ta = row.querySelector("textarea");
      if (ta) {
        ta.focus();
        ta.addEventListener("input", _autoResizeTextarea);
      }
    });
  }

  // Auto-resize existing bullet textareas
  document.querySelectorAll(".moment-bullet-input").forEach(ta => {
    ta.addEventListener("input", _autoResizeTextarea);
  });

  // Save button
  const saveBtn = document.getElementById("btn-moment-save");
  if (saveBtn) saveBtn.addEventListener("click", _handleMomentSave);
}

function _autoResizeTextarea() {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
}

async function _handleMomentSave() {
  const titleEl   = document.getElementById("moment-title");
  const dateEl    = document.getElementById("moment-date");
  const errorEl   = document.getElementById("moment-error");
  const savingEl  = document.getElementById("moment-saving");
  const saveBtn   = document.getElementById("btn-moment-save");

  const title = (titleEl ? titleEl.value : "").trim();
  if (!title) {
    if (errorEl) { errorEl.textContent = "Give this moment a title."; errorEl.hidden = false; }
    if (titleEl) titleEl.focus();
    return;
  }

  const kindEl    = document.querySelector(".moment-kind-chips .chip.selected");
  const pillarEl  = document.querySelector(".moment-pillar-chips .chip.selected");
  const kind      = kindEl   ? kindEl.dataset.kind    : "experience";
  const pillar    = pillarEl ? pillarEl.dataset.pillar : "";

  if (!pillar) {
    if (errorEl) { errorEl.textContent = "Choose a pillar for this moment."; errorEl.hidden = false; }
    return;
  }

  const bullets = Array.from(document.querySelectorAll(".moment-bullet-input"))
    .map(t => t.value.trim())
    .filter(Boolean);

  const happenedOn = dateEl ? dateEl.value : new Date().toISOString().split("T")[0];

  if (errorEl) errorEl.hidden = true;
  if (savingEl) savingEl.hidden = false;
  if (saveBtn) saveBtn.disabled = true;

  try {
    const resp = await fetch("/api/moments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, kind, pillar, bullets, happenedOn }),
    });
    let data;
    try { data = await resp.json(); }
    catch { data = { ok: false, error: "Unexpected server response." }; }

    if (!data.ok) {
      if (errorEl) { errorEl.textContent = data.error || "Save failed. Try again."; errorEl.hidden = false; }
      return;
    }

    // Persona refresh happened server-side; update the card if data returned
    if (data.persona) {
      window.personaData = data.persona;
      renderHomePersonaCard(data.persona, data.whatChanged || "");
    }

    closeMomentModal();
    _resetMomentModal();

  } catch (err) {
    if (errorEl) { errorEl.textContent = "Could not reach the server."; errorEl.hidden = false; }
  } finally {
    if (savingEl) savingEl.hidden = true;
    if (saveBtn) saveBtn.disabled = false;
  }
}

function _resetMomentModal() {
  const titleEl = document.getElementById("moment-title");
  if (titleEl) titleEl.value = "";

  // Reset kind to first option
  const kindChips = document.querySelectorAll(".moment-kind-chips .chip");
  kindChips.forEach((c, i) => c.classList.toggle("selected", i === 0));

  // Clear pillar selection
  document.querySelectorAll(".moment-pillar-chips .chip").forEach(c => c.classList.remove("selected"));

  // Reset bullets to 2 rows
  const wrap = document.getElementById("moment-bullets-wrap");
  if (wrap) {
    wrap.innerHTML = `
      <div class="moment-bullet-row">
        <span class="story-bullet-dot" style="margin-top:10px;"></span>
        <textarea class="stride-input moment-bullet-input" rows="1" placeholder="What happened?"></textarea>
      </div>
      <div class="moment-bullet-row">
        <span class="story-bullet-dot" style="margin-top:10px;"></span>
        <textarea class="stride-input moment-bullet-input" rows="1" placeholder="What did you build or do?"></textarea>
      </div>`;
    wrap.querySelectorAll(".moment-bullet-input").forEach(ta => {
      ta.addEventListener("input", _autoResizeTextarea);
    });
  }

  const errorEl = document.getElementById("moment-error");
  if (errorEl) errorEl.hidden = true;

  const dateInput = document.getElementById("moment-date");
  if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
}


/* ─────────────────────────────────────────
   SUPABASE CLIENT + PROFILE PERSISTENCE
───────────────────────────────────────── */
let strideSupabase = null;

async function initSupabase() {
  if (strideSupabase) return strideSupabase;
  try {
    const cfg = await fetch("/api/config").then(r => r.json());
    if (!cfg.ok || !cfg.supabaseUrl) return null;
    strideSupabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  } catch {
    strideSupabase = null;
  }
  return strideSupabase;
}

async function saveOnboardingProfile(answers) {
  const sb = strideSupabase;
  if (!sb) return;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;
  const { error } = await sb.from("profiles").upsert({
    id:          session.user.id,
    email:       session.user.email,
    full_name:   session.user.user_metadata?.full_name,
    avatar_url:  session.user.user_metadata?.avatar_url,
    role:        answers.role,
    field:       answers.field,
    goals:       answers.goals,
    tone:        answers.tone,
    pillars:     answers.pillars,
    positioning: answers.positioning,
  });
  if (error) console.error("Failed to save profile:", error.message);
}

async function loadProfile() {
  const sb = strideSupabase;
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data, error } = await sb
    .from("profiles").select("*")
    .eq("id", session.user.id).single();
  if (error || !data) return null;
  return data;
}

function getSelectedChips(stepId) {
  return Array.from(document.querySelectorAll(`#${stepId} .chip.selected`))
    .map(el => el.textContent.trim());
}

function populateDashboard(profile, session) {
  const name = profile.full_name || session.user.email || "You";
  const initials = name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  const navAv = document.getElementById("nav-avatar");
  if (navAv) {
    if (profile.avatar_url) {
      navAv.innerHTML = `<img src="${profile.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
      navAv.textContent = initials;
    }
  }

  const settAv = document.getElementById("settings-avatar");
  if (settAv) settAv.textContent = initials;

  const settName = document.getElementById("settings-name");
  if (settName) settName.textContent = name;

  const collabAv = document.getElementById("collab-user-avatar");
  if (collabAv) collabAv.textContent = initials;

  const collabName = document.getElementById("collab-user-name");
  if (collabName) collabName.textContent = name;

  const heroAv = document.getElementById("profile-hero-avatar");
  if (heroAv) heroAv.textContent = initials;

  const heroName = document.getElementById("profile-hero-name");
  if (heroName) heroName.textContent = name;

  const heroEmail = document.getElementById("profile-hero-email");
  if (heroEmail) heroEmail.textContent = profile.email || session.user.email || "";

  const heroPos = document.getElementById("profile-hero-positioning");
  if (heroPos) heroPos.textContent = profile.positioning || "";

  const heroPills = document.getElementById("profile-hero-pills");
  if (heroPills && Array.isArray(profile.pillars) && profile.pillars.length) {
    heroPills.innerHTML = profile.pillars
      .map(p => `<span class="chip chip-technical" style="font-size:11px;padding:2px 10px;">${p}</span>`)
      .join("");
  }
}

function updateUserUI(user) {
  if (!user) return;
  const meta = user.user_metadata || {};
  const fullName = meta.full_name || meta.name || user.email || "";
  const initials = fullName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const navAv = document.getElementById("nav-avatar");
  if (navAv) navAv.textContent = initials;

  const settAv = document.getElementById("settings-avatar");
  if (settAv) settAv.textContent = initials;

  const settName = document.getElementById("settings-name");
  if (settName && fullName) settName.textContent = fullName;

  const collabAv = document.getElementById("collab-user-avatar");
  if (collabAv) collabAv.textContent = initials;

  const collabName = document.getElementById("collab-user-name");
  if (collabName && fullName) collabName.textContent = fullName;
}

async function checkSessionAndRoute() {
  const sb = await initSupabase();
  if (!sb) {
    showScreen("landing");
    return;
  }

  // Clear any stale non-Google sessions
  let { data: { session } } = await sb.auth.getSession();
  if (session && !session.provider_token) {
    await sb.auth.signOut();
    session = null;
  }

  if (session) {
    updateUserUI(session.user);
    const profile = await loadProfile();
    if (profile) {
      populateDashboard(profile, session);
      showScreen("home");
    } else if (localStorage.getItem("stride-onboarded") === "true") {
      showScreen("home");
    } else {
      showScreen("onboarding");
    }
  } else {
    showScreen("landing");
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      updateUserUI(session.user);
      const profile = await loadProfile();
      if (profile) {
        populateDashboard(profile, session);
        showScreen("home");
      } else {
        showScreen("onboarding");
      }
    }
    if (event === "SIGNED_OUT") {
      showScreen("landing");
    }
  });
}

/* ─────────────────────────────────────────
   BOOT
───────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  goToStep(1);
  initOnboarding();
  initSlider();
  initDraftEditor();
  initDevMenu();
  initThemeToggle();
  initMomentModal();
  wireButtons();
  document.getElementById("btn-refresh-linkedin")?.addEventListener("click", loadLinkedInStats);
  checkSessionAndRoute();
});
