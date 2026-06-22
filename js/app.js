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
  if (id === "posts") {
    populatePostsScreen();
  }

  // Handle global navbar visibility and active tabs
  const globalNav = document.getElementById("global-nav");
  if (globalNav) {
    const navScreens = ["home", "posts", "collab", "collab-entry", "settings", "draft", "published", "nudge"];
    if (navScreens.includes(id)) {
      globalNav.style.display = "flex";
      // collab and collab-entry both highlight the Collab tab (data-goto="collab-entry")
      const tabId = id === "collab" ? "collab-entry" : id;
      globalNav.querySelectorAll(".nav-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.goto === tabId);
      });
    } else {
      globalNav.style.display = "none";
    }
  }
  // Reset collab entry to default state on each visit; stop any running QR timer
  _stopCollabQrTimer();
  if (id === "collab-entry") {
    document.getElementById("collab-entry-default")?.style.setProperty("display", "");
    document.getElementById("collab-entry-qr")?.style.setProperty("display", "none");
    document.getElementById("collab-entry-kw")?.style.setProperty("display", "none");
  }
  // Connect screen has real backend — initialise on every visit
  if (id === "connect") Connect.init();
  // Reset to General tab and refresh privacy data each time settings is opened
  if (id === "settings") {
    document.querySelectorAll('.settings-inner-tab').forEach(t => t.classList.toggle('active', t.dataset.settingsTab === 'general'));
    const genPanel = document.getElementById('settings-tab-general');
    const pvtPanel = document.getElementById('settings-tab-privacy');
    if (genPanel) genPanel.hidden = false;
    if (pvtPanel) pvtPanel.hidden = true;
    _refreshPrivacyTab();
  }
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

  // Widen the inner container for the two-column payoff layout
  const inner = document.querySelector(".onboarding-inner");
  if (inner) inner.classList.add("payoff-wide");

  const answers = _collectOnboardingAnswers();
  const pillars = answers.pillars.length > 0 ? answers.pillars : demoData.user.pillars;
  window.userSelectedPillars = pillars;

  let persona, positioning, tone;

  if (fromPersonaData) {
    persona      = fromPersonaData.persona_summary || "";
    positioning  = fromPersonaData.positioning     || "";
    tone         = fromPersonaData.tone            || answers.tone || "Direct";
    window.personaData = fromPersonaData;
  } else {
    const role  = answers.role  || "Professional";
    const field = answers.field || "Tech";
    const goals = answers.wants;
    tone        = answers.tone  || "Direct";
    persona     = `${role} building in ${field}`;
    const goalText = goals.length > 0 ? ` to attract ${goals.join(" and ")}` : "";
    positioning = `I share my journey in ${field}${goalText} — keeping it ${tone.toLowerCase()} and authentic.`;
  }

  const personaEl = document.getElementById("payoff-persona") || profile.querySelector(".profile-persona");
  if (personaEl) personaEl.textContent = persona;

  const posEl = document.getElementById("payoff-positioning") || profile.querySelector(".profile-positioning");
  if (posEl) posEl.textContent = positioning;

  const metaEl = document.getElementById("payoff-meta") || profile.querySelector(".profile-meta");
  if (metaEl) {
    metaEl.innerHTML = "";
    pillars.forEach(p => {
      const span = document.createElement("span");
      span.className = `chip chip-${p.toLowerCase()} selected`;
      span.style = "font-size:11px;padding:2px 10px;pointer-events:none;";
      span.textContent = p;
      metaEl.appendChild(span);
    });
  }

  const autofillNote = document.getElementById("profile-autofill-note");
  if (autofillNote) autofillNote.style.display = fromPersonaData ? "flex" : "none";
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

    const { data: { session } } = await strideSupabase.auth.getSession();
    const linkedInToken = session?.provider_token;
    if (!linkedInToken) {
      _showPublishError("Your LinkedIn session has expired. Please sign out and sign back in to reconnect.");
      return;
    }

    let pubData;
    try {
      const pubRes = await fetch("/api/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text, linkedInToken }),
      });
      pubData = await pubRes.json();
    } catch {
      _showPublishError("Could not reach the server. Check your connection and try again.");
      return;
    }

    if (!pubData.ok) {
      if (pubData.error === "REVOKED_TOKEN") {
        _showPublishError("Your LinkedIn session has expired. Please sign out and sign back in to reconnect.");
      } else {
        _showPublishError("Could not publish to LinkedIn. Please try again.");
      }
      return;
    }

    // ── Step 3: Success ───────────────────────────────────────────────────
    const pillar = document.querySelector('#screen-draft .chip.selected')?.textContent?.trim() || 'General';
    savePostToSupabase(text, pillar);
    setLastPostUrl(pubData.postUrl || '');
    showScreen("published");
    setTimeout(runPublishedAnimation, 100);

  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
}

let _collabQrTimer = null;

function _stopCollabQrTimer() {
  if (_collabQrTimer) { clearInterval(_collabQrTimer); _collabQrTimer = null; }
}

function wireCollabEntry() {
  const _adjWords = ["swift","tiger","azure","bright","coral","ember","frost","golden","jade","lunar"];
  const _nounWords = ["launch","signal","spark","pilot","stream","bridge","summit","orbit","forge","crest"];

  function genRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  function genKeyword() {
    const a = _adjWords[Math.floor(Math.random() * _adjWords.length)];
    const n = _nounWords[Math.floor(Math.random() * _nounWords.length)];
    return `${a}-${n}`;
  }

  function startQrCountdown() {
    _stopCollabQrTimer();
    let secs = 3 * 60;
    const cdEl   = document.getElementById("collab-qr-countdown");
    const ttlRow = document.getElementById("collab-qr-ttl-row");
    const waitEl = document.getElementById("collab-qr-waiting");
    const expEl  = document.getElementById("collab-qr-expired");
    const qrBox  = document.getElementById("collab-qr-box");

    function fmt(s) {
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    }
    function tick() {
      secs--;
      if (secs <= 0) {
        _stopCollabQrTimer();
        if (cdEl)   { cdEl.textContent = "0:00"; cdEl.classList.add("collab-ttl-urgent"); }
        if (ttlRow) ttlRow.style.display = "none";
        if (waitEl) waitEl.style.display = "none";
        if (expEl)  expEl.style.display  = "";
        if (qrBox)  qrBox.classList.add("collab-qr-expired");
        return;
      }
      if (cdEl) {
        cdEl.textContent = fmt(secs);
        cdEl.classList.toggle("collab-ttl-urgent", secs < 30);
      }
    }
    if (cdEl) { cdEl.textContent = fmt(secs); cdEl.classList.remove("collab-ttl-urgent"); }
    _collabQrTimer = setInterval(tick, 1000);
  }

  function showQrState(code) {
    _stopCollabQrTimer();
    // Reset to pre-expired UI
    const cdEl   = document.getElementById("collab-qr-countdown");
    const ttlRow = document.getElementById("collab-qr-ttl-row");
    const waitEl = document.getElementById("collab-qr-waiting");
    const expEl  = document.getElementById("collab-qr-expired");
    const qrBox  = document.getElementById("collab-qr-box");
    if (cdEl)   { cdEl.textContent = "3:00"; cdEl.classList.remove("collab-ttl-urgent"); }
    if (ttlRow) ttlRow.style.display = "";
    if (waitEl) waitEl.style.display = "";
    if (expEl)  expEl.style.display  = "none";
    if (qrBox)  qrBox.classList.remove("collab-qr-expired");
    document.getElementById("collab-room-code").textContent = code;
    document.getElementById("collab-entry-default").style.display = "none";
    document.getElementById("collab-entry-qr").style.display      = "";
    document.getElementById("collab-entry-kw").style.display      = "none";
    startQrCountdown();
  }

  document.getElementById("btn-collab-qr")?.addEventListener("click", () => {
    showQrState(genRoomCode());
  });

  document.getElementById("btn-collab-qr-regen")?.addEventListener("click", () => {
    showQrState(genRoomCode());
  });

  document.getElementById("btn-collab-keyword")?.addEventListener("click", () => {
    const kw  = genKeyword();
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expTime = exp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const expDate = exp.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    const expEl = document.getElementById("collab-kw-expiry");
    document.getElementById("collab-keyword").textContent = kw;
    if (expEl) expEl.textContent = `Expires ${expDate} at ${expTime}`;
    document.getElementById("collab-entry-default").style.display = "none";
    document.getElementById("collab-entry-qr").style.display      = "none";
    document.getElementById("collab-entry-kw").style.display      = "";
  });

  const backToDefault = () => {
    _stopCollabQrTimer();
    document.getElementById("collab-entry-default").style.display = "";
    document.getElementById("collab-entry-qr").style.display      = "none";
    document.getElementById("collab-entry-kw").style.display      = "none";
  };
  document.getElementById("btn-collab-qr-back")?.addEventListener("click", backToDefault);
  document.getElementById("btn-collab-kw-back")?.addEventListener("click", backToDefault);
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
          redirectTo: window.location.origin,
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
    window._sb = strideSupabase;
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
  const { data: { session } } = await strideSupabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await strideSupabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error?.code === 'PGRST116') {
    const meta = session.user.user_metadata || {};
    await strideSupabase.from('profiles').insert({
      id: session.user.id,
      email: session.user.email,
      full_name: meta.full_name || meta.name || '',
      avatar_url: meta.avatar_url || meta.picture || '',
    });
    return await loadProfile();
  }

  if (error) { console.error('loadProfile error:', error.message); return null; }
  return data;
}

function getSelectedChips(stepId) {
  return Array.from(document.querySelectorAll(`#${stepId} .chip.selected`))
    .map(el => el.textContent.trim());
}

function populateDashboard(profile, session) {
  const name = profile.full_name || session?.user?.email || 'You';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Replace all hardcoded "AT" initials
  document.querySelectorAll('.avatar').forEach(el => {
    if (el.textContent.trim() === 'AT') el.textContent = initials;
  });

  // Replace all hardcoded "Alex Tan" text nodes
  document.querySelectorAll('p, span, div').forEach(el => {
    if (el.children.length === 0 && el.textContent.trim() === 'Alex Tan') {
      el.textContent = name;
    }
  });

  // Google profile photo in nav avatar
  if (profile.avatar_url) {
    document.querySelectorAll('.avatar').forEach(el => {
      if (el.textContent.trim() === initials) {
        el.innerHTML = `<img src="${profile.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      }
    });
  }

  // Named IDs from profile hero card
  const heroName = document.getElementById('profile-hero-name');
  const heroEmail = document.getElementById('profile-hero-email');
  const heroPositioning = document.getElementById('profile-hero-positioning');
  const heroPills = document.getElementById('profile-hero-pills');

  if (heroName) heroName.textContent = name;
  if (heroEmail) heroEmail.textContent = profile.email || '';
  if (heroPositioning) heroPositioning.textContent = profile.positioning || '';
  if (heroPills && profile.pillars?.length) {
    heroPills.innerHTML = profile.pillars
      .map(p => `<span class="chip chip-technical" style="font-size:11px;padding:2px 10px;">${p}</span>`)
      .join('');
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

// ── Loading + reveal animation ─────────────────────────────────────────────
// ── Footprint dot-matrix loader — generated procedurally from geometry ────────
function initFootprintLoader() {
  const grid = document.getElementById('fp-grid');
  if (!grid || grid.childElementCount > 0) return; // already built
  const inside = (x, y) => {
    const fe   = ((x-62)**2)/1600 + ((y-76)**2)/1600   <= 1;
    const he   = ((x-66)**2)/900  + ((y-184)**2)/1444  <= 1;
    const arch = x > 50 && x < 96 && y >= 112 && y <= 152;
    const toes = [[36,28,10],[51,18,11],[66,15,12],[81,18,11],[95,27,10]];
    return fe || he || arch || toes.some(([tx,ty,tr]) => (x-tx)**2+(y-ty)**2 <= tr*tr);
  };
  const frag = document.createDocumentFragment();
  for (let y = 6; y <= 216; y += 9) {
    for (let x = 2; x <= 118; x += 9) {
      if (!inside(x, y)) continue;
      const d = document.createElement('span');
      d.className = 'fp-dot';
      d.style.left  = (x - 3.5) + 'px';
      d.style.top   = (y - 3.5) + 'px';
      d.style.animationDelay = (Math.random() * 1.25).toFixed(3) + 's';
      frag.appendChild(d);
    }
  }
  grid.appendChild(frag);
}

async function playLoadingAndReveal(session) {
  const overlay = document.getElementById('screen-loading');
  if (!overlay) return;
  initFootprintLoader();
  overlay.style.display = 'flex';
  overlay.style.opacity = '1';

  const msgEl   = document.getElementById('loading-message');
  const spinner  = document.getElementById('loading-spinner');
  const allSet   = document.getElementById('loading-all-set');

  const messages = [
    'Persona initialising…',
    'Analysing your pillars…',
    'Calibrating your tone…',
    'Mapping your career arc…',
    'Syncing your calendar…',
    'Building your momentum…',
    'Taking the final step…',
  ];

  if (msgEl) {
    for (const msg of messages) {
      msgEl.style.opacity = '0';
      await new Promise(r => setTimeout(r, 150));
      msgEl.textContent = msg;
      msgEl.style.opacity = '1';
      await new Promise(r => setTimeout(r, 620));
    }
    msgEl.style.display = 'none';
  }
  if (spinner) spinner.style.display = 'none';
  if (allSet)  allSet.style.display  = 'flex';
  await new Promise(r => setTimeout(r, 1100));

  // Fade out overlay
  overlay.style.transition = 'opacity 0.5s ease';
  overlay.style.opacity = '0';
  await new Promise(r => setTimeout(r, 500));
  overlay.style.display = 'none';
  // Reset for next time
  if (msgEl)   { msgEl.style.display = ''; msgEl.textContent = ''; msgEl.style.opacity = '1'; }
  if (spinner) spinner.style.display = '';
  if (allSet)  allSet.style.display  = 'none';
  overlay.style.transition = '';
  overlay.style.opacity = '1';

  // Load user data then show app
  updateUserUI(session.user);
  const profile = await loadProfile();
  if (profile) {
    window._currentProfile = profile;
    populateDashboard(profile, session);
    loadCalendarEvents().then(events => {
      renderCalendarEvents(events);
      const nudge = document.getElementById('gcal-nudge-card');
      if (nudge) nudge.style.display = 'none';
    });
    loadUserPosts().then(posts => { window._linkedInPosts = posts; });
    showScreen('home');
  } else {
    showScreen('onboarding');
  }
}

// ── Update login button connected states ───────────────────────────────────
function updateLoginButtonStates({ hasGoogle, hasLinkedIn }) {
  const gBtn  = document.getElementById('btn-google-signin');
  const liBtn = document.getElementById('btn-linkedin-signin');
  const gTxt  = document.getElementById('google-btn-text');
  const liTxt = document.getElementById('linkedin-btn-text');
  const sub   = document.getElementById('login-subtext');

  if (gBtn && gTxt) {
    if (hasGoogle) {
      gBtn.classList.add('btn-connected');
      gTxt.textContent = 'Google connected';
    } else {
      gBtn.classList.remove('btn-connected');
      gTxt.textContent = 'Continue with Google';
    }
  }
  if (liBtn && liTxt) {
    if (hasLinkedIn) {
      liBtn.classList.add('btn-connected');
      liTxt.textContent = 'LinkedIn connected';
    } else {
      liBtn.classList.remove('btn-connected');
      liTxt.textContent = 'Continue with LinkedIn';
    }
  }
  if (sub) {
    if (hasLinkedIn && hasGoogle)
      sub.textContent = 'Both connected ✓ — signing you in…';
    else if (hasLinkedIn)
      sub.textContent = 'LinkedIn connected ✓ — signing you in…';
    else if (hasGoogle)
      sub.textContent = 'Google Calendar connected ✓ — now sign in with LinkedIn to publish.';
    else
      sub.textContent = 'Sign in with LinkedIn to continue.';
  }
}

// ── Route after auth ────────────────────────────────────────────────────────
async function _routeSession(session, { playLoading = false } = {}) {
  window._currentSession = session;
  if (!session) { showScreen('landing'); return; }

  const identities  = session.user?.identities || [];
  // hasLinkedIn: true when LinkedIn is either the primary session provider OR a linked
  // identity on the account. The identities check is needed because Supabase keeps
  // app_metadata.provider as 'google' when LinkedIn is linked to an existing Google
  // account (same email), so checking only app_metadata.provider always returns false.
  const hasLinkedIn = session.user?.app_metadata?.provider === 'linkedin_oidc' ||
                      identities.some(i => i.provider === 'linkedin_oidc');
  const hasGoogle   = identities.some(i => i.provider === 'google');

  if (hasLinkedIn) {
    if (playLoading) {
      await playLoadingAndReveal(session);
    } else {
      // Returning visit already done loading - go straight to home/onboarding
      updateUserUI(session.user);
      const profile = await loadProfile();
      if (profile) {
        window._currentProfile = profile;
        populateDashboard(profile, session);
        loadCalendarEvents().then(events => {
          renderCalendarEvents(events);
          const nudge = document.getElementById('gcal-nudge-card');
          if (nudge) nudge.style.display = 'none';
        });
        loadUserPosts().then(posts => { window._linkedInPosts = posts; });
        showScreen('home');
      } else {
        showScreen('onboarding');
      }
    }
  } else {
    updateLoginButtonStates({ hasGoogle, hasLinkedIn });
    showScreen('login');
  }
}

async function checkSessionAndRoute({ forceLogin = false } = {}) {
  const sb = await initSupabase();
  if (!sb) { showScreen('landing'); return; }

  // Use onAuthStateChange as the primary session detection mechanism.
  // INITIAL_SESSION fires after the Supabase client processes the #access_token
  // hash on OAuth redirect — getSession() called before that completes returns null.
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
      const identities  = session?.user?.identities || [];
      const hasLinkedIn = session?.user?.app_metadata?.provider === 'linkedin_oidc' ||
                          identities.some(i => i.provider === 'linkedin_oidc');
      const hasGoogle   = identities.some(i => i.provider === 'google');

      if (!session) {
        // No session on initial load — show landing
        showScreen('landing');
        return;
      }

      if (forceLogin && event === 'INITIAL_SESSION') {
        // Returning from OAuth redirect — flash login screen showing connected state
        updateLoginButtonStates({ hasGoogle, hasLinkedIn });
        showScreen('login');
        if (hasLinkedIn) {
          setTimeout(() => _routeSession(session, { playLoading: true }), 1500);
        }
        // Google only: stay on login so user can sign in with LinkedIn
        return;
      }

      const wasOnLogin = document.getElementById('screen-login')?.classList.contains('active');
      await _routeSession(session, { playLoading: hasLinkedIn && wasOnLogin });
    }
    if (event === 'SIGNED_OUT') {
      window._currentSession = null;
      window._currentProfile = null;
      updateLoginButtonStates({ hasGoogle: false, hasLinkedIn: false });
      showScreen('login');
    }
  });
}

/* ─────────────────────────────────────────
   BOOT
───────────────────────────────────────── */
async function loadCalendarEvents() {
  if (!strideSupabase) return [];
  if (localStorage.getItem('stride-gcal-disconnected') === 'true') return [];
  const { data: { session } } = await strideSupabase.auth.getSession();
  const token = session?.provider_token;
  if (!token) return [];
  try {
    const now = new Date().toISOString();
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&orderBy=startTime&singleEvents=true&timeMin=${now}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.items || [];
  } catch (e) {
    console.error('Calendar fetch failed:', e);
    return [];
  }
}

function renderCalendarEvents(events) {
  const container = document.getElementById('upcoming-events-list');
  if (!container) return;

  if (localStorage.getItem('stride-gcal-disconnected') === 'true') {
    container.innerHTML = `<p class="text-caption text-muted" style="text-align:center;padding:var(--space-3) 0;">Google Calendar disconnected. <a href="#" id="dashboard-gcal-reconnect" style="color:var(--color-stride-blue);text-decoration:none;font-weight:600;">Reconnect</a></p>`;
    document.getElementById('dashboard-gcal-reconnect')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await _reconnectGcal();
    });
    return;
  }
  if (!events.length) {
    container.innerHTML = '<p class="text-caption text-muted">No upcoming events found.</p>';
    return;
  }
  container.innerHTML = events.slice(0, 3).map(event => {
    const start = event.start?.dateTime || event.start?.date;
    const date = start ? new Date(start).toLocaleDateString('en-SG', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: event.start?.dateTime ? 'numeric' : undefined,
      minute: event.start?.dateTime ? '2-digit' : undefined,
    }) : '';
    const safeSummary = (event.summary || '').replace(/'/g, "\\'");
    return `
      <div style="display:flex;gap:var(--space-3);align-items:flex-start;padding:var(--space-3) 0;border-bottom:0.5px solid var(--border-default);">
        <div style="flex-shrink:0;width:36px;height:36px;border-radius:var(--border-radius-sm);background:var(--color-background-info);display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-info)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:14px;font-weight:500;margin:0;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${event.summary || 'Untitled event'}</p>
          <p class="text-caption text-muted" style="margin:2px 0 0;">${date}</p>
        </div>
        <button class="btn btn-ghost btn-inline" style="font-size:12px;flex-shrink:0;"
          onclick="captureEventAsMoment('${safeSummary}','${start || ''}')">+ Capture</button>
      </div>`;
  }).join('');
}

function captureEventAsMoment(title, date) {
  const titleInput = document.getElementById('moment-title');
  const dateInput = document.getElementById('moment-date');
  if (titleInput) titleInput.value = title;
  if (dateInput && date) dateInput.value = date.split('T')[0];
  openMomentModal();
}

async function savePostToSupabase(postText, pillar) {
  if (!strideSupabase) return;
  const { data: { session } } = await strideSupabase.auth.getSession();
  if (!session) return;
  await strideSupabase.from('posts').insert({
    user_id: session.user.id,
    text: postText,
    pillar: pillar || 'General',
    created_at: new Date().toISOString(),
    likes: 0, comments: 0, shares: 0,
  });
}

async function loadUserPosts() {
  if (!strideSupabase) return [];
  const { data: { session } } = await strideSupabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await strideSupabase
    .from('posts').select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  if (error) { console.error('loadUserPosts:', error.message); return []; }
  return data || [];
}

async function populatePostsScreen() {
  const container = document.getElementById('posts-list');
  if (!container) return;
  const posts = await loadUserPosts();
  if (!posts.length) {
    container.innerHTML = '<p class="text-body text-muted" style="text-align:center;padding:var(--space-8);">No posts yet — publish your first one!</p>';
    return;
  }
  container.innerHTML = posts.map(post => {
    const date = new Date(post.created_at).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
    const preview = (post.text || '').slice(0, 200) + ((post.text || '').length > 200 ? '...' : '');
    return `
      <div class="card" style="margin-bottom:var(--space-4);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-3);">
          <div style="display:flex;align-items:center;gap:var(--space-3);">
            <div class="avatar">AT</div>
            <div>
              <p style="font-weight:600;font-size:14px;margin:0;">You</p>
              <p class="text-caption text-muted" style="margin:0;">${date}</p>
            </div>
          </div>
          <span class="chip chip-${(post.pillar||'technical').toLowerCase()}" style="font-size:11px;padding:2px 8px;">${post.pillar||'General'}</span>
        </div>
        <p style="font-size:14px;line-height:1.5;margin-bottom:var(--space-4);">${preview}</p>
        <div style="display:flex;gap:var(--space-6);color:var(--text-muted);font-size:13px;font-weight:500;">
          <span>👍 ${post.likes||0}</span><span>💬 ${post.comments||0}</span><span>↗ ${post.shares||0}</span>
        </div>
      </div>`;
  }).join('');
}

function buildPersonaPrompt(profile) {
  const name = profile.full_name || 'Me';
  const role = profile.role || '';
  const field = Array.isArray(profile.field) ? profile.field.join(', ') : (profile.field || '');
  const goals = Array.isArray(profile.goals) ? profile.goals.join(', ') : (profile.goals || '');
  const tone = Array.isArray(profile.tone) ? profile.tone.join(', ') : (profile.tone || '');
  const pillars = Array.isArray(profile.pillars) ? profile.pillars.join(', ') : (profile.pillars || '');
  const positioning = profile.positioning || '';
  return `You are a personal brand writing assistant for ${name}.

ABOUT ME:
${positioning}

ROLE: ${role}
FIELD / ASPIRATIONS: ${field}
GOALS: ${goals}

MY CONTENT PILLARS:
${pillars}

MY TONE OF VOICE:
${tone}

INSTRUCTIONS:
- Write all content in first person, as if I am speaking
- Match my tone: ${tone}
- Every post should connect to at least one of my pillars: ${pillars}
- Avoid corporate buzzwords, AI-speak, or anything that sounds generic
- Posts should feel personal, specific, and like something I would actually say
- LinkedIn post format: hook (1-2 lines) → story (3-5 bullet points or short paragraphs) → call to action

When I give you a topic or event, draft a LinkedIn post in my voice.`.trim();
}

/* ─────────────────────────────────────────
   DATA & PRIVACY TAB
───────────────────────────────────────── */
async function _refreshPrivacyTab() {
  if (!strideSupabase) return;
  const { data: { session } } = await strideSupabase.auth.getSession();
  const user = session?.user;
  const meta = user?.user_metadata || {};

  // LinkedIn user info
  const name  = meta.full_name || meta.name || user?.email || '—';
  const email = user?.email || '—';
  const avatarUrl = meta.avatar_url || meta.picture || '';
  const nameEl   = document.getElementById('dp-linkedin-name');
  const emailEl  = document.getElementById('dp-linkedin-email');
  const avatarEl = document.getElementById('dp-linkedin-avatar');
  if (nameEl)   nameEl.textContent  = name;
  if (emailEl)  emailEl.textContent = email;
  if (avatarEl && avatarUrl) {
    avatarEl.style.backgroundImage = `url(${avatarUrl})`;
    avatarEl.style.backgroundSize  = 'cover';
    avatarEl.style.backgroundPosition = 'center';
    avatarEl.textContent = '';
  } else if (avatarEl) {
    const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.textContent = initials || 'LI';
  }

  // Google Calendar status
  const gcalStatus  = document.getElementById('dp-gcal-status');
  const disconnectBtn = document.getElementById('btn-disconnect-gcal');
  const reconnectMsg  = document.getElementById('dp-gcal-reconnect');
  const isGcalDisconnected = localStorage.getItem('stride-gcal-disconnected') === 'true';
  if (gcalStatus) {
    if (isGcalDisconnected) {
      gcalStatus.textContent = 'Disconnected';
      if (disconnectBtn) disconnectBtn.disabled = true;
      if (reconnectMsg)  reconnectMsg.hidden = false;
    } else if (session?.provider_token) {
      gcalStatus.textContent = 'Connected ✓';
      gcalStatus.style.color = '#27AE60';
      if (disconnectBtn) disconnectBtn.disabled = false;
      if (reconnectMsg)  reconnectMsg.hidden = true;
    } else {
      gcalStatus.textContent = 'Not connected';
      if (disconnectBtn) disconnectBtn.disabled = true;
      if (reconnectMsg)  reconnectMsg.hidden = true;
    }
  }
}

async function _reconnectGcal() {
  localStorage.removeItem('stride-gcal-disconnected');
  if (!strideSupabase) return;
  localStorage.setItem('stride-oauth-pending', '1');
  const { error } = await strideSupabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/calendar.readonly',
      redirectTo: window.location.origin,
    },
  });
  if (error) console.error('Google Calendar reconnect error:', error.message);
}

function showSuccessModal() {
  const overlay = document.getElementById('success-modal-overlay')
  if (overlay) overlay.style.display = 'flex'

  const colors = ['#1A5F8A', '#27AE60', '#EF9F27', '#ffffff', '#E24B4A', '#7F77DD']

  confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors })

  setTimeout(() => {
    confetti({ particleCount: 120, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, colors })
    confetti({ particleCount: 120, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors })
  }, 300)

  setTimeout(() => {
    confetti({ particleCount: 80, spread: 120, origin: { y: 0.3 }, colors, scalar: 1.4 })
  }, 700)

  setTimeout(() => {
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 }, colors })
  }, 1100)
}

function setLastPostUrl(url) {
  sessionStorage.setItem('stride-last-post-url', url || 'https://www.linkedin.com/feed/')
}

function playIntroAnimation() {
  return new Promise(resolve => {
    const intro = document.getElementById('intro-animation');
    if (!intro) { resolve(); return; }

    const CHILD_SRC = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAW8AAAMgCAYAAADsreOEAAAQAElEQVR4Aezdi5rbtpIuUGfe/533dLnNRC1TEi+4FIDlb9OSKBIorCL/Zjo5c/7vlz8ECBAgMJyA8B6uZccK/t+FP8dGdhQBAhkEhHeGLtyo4VVGXxny1Vix/8p4ziFwSMBBlwSE9yW2fidFkD5urSp5nDPet5rXPAQI7AsI732XVHsjLLctS2FbPdtrlrrUQWAVAeGdtNNbKMZr0hJ/lBV1xvZj53IfLJhAOwHh3c760EwRgLEdOjjhQVH7tiUsT0kEphEQ3klaOWPgzbimJJeLMgj8Wjq8t3B5fG19TWxzt573w3xFv15hjUXBDEbggMCy4R2Bsufzav/esXf2xTyx3RljtHNjvbGNVrd6CWQUWDa83zWjdsDUHv/d2jJ8F+uPLUMtaiAwqsD04X21MbXCpda4V9fZ87ywiK1nDeYmMKqA8H7TudLBUnq8N6UP9VW4xDZU0Yol0FlAeH9oQIlQiTFi+zDV8l+HUWzLQwCYTKDOcoT3Adc7gXLn3AOlTXlImMU25eIsikAhAeF9EFKYHIQqeFiYx1ZwSEMRmEZAeFdspeApgxuOsZUZzSg3BJyaSEB4n2jGmQA5c+yJEpY+lOnS7bf4JwHh/QTy6eORADlyzKd5fL8vELax7X9rL4F1BIT3hV4LjwtohU+JHsR2dVjnERhdYNnw/ufrT+nmRZjEVnpc470WCO/YXh/hGwJzCiwb3nfb+RwYz5/vju/8cwL8z3k5enyBpcP76+H7nzstjMDYtjvj3DrXyf8K6MW/FN4sILB0eC/Q3yWXGCG+5MIteimB5cP77tP3UlfLQIuNAI9toJKVSuCUQKLwPlV30YMFeFHOVIMJ8FTtUExBAeFdENNQOQUEeM6+qOqegPD+4+fp+w/EpC8R4LFNujzLKiQw0jDCe6RuqfW2gAC/TWiAJAJLh3fcyI9bkp4oo7JA9LzyFIYnUF1gufCOG3fbquuaIK1AXANpiytRmDGmF1givONG3bbpO2qBhwXimjh8sAMJJBOYOrzj5owtmblyEgm4PhI1QymnBKYM77ghYzsl4eCkAvXLcq3UNzZDeYHpwtuNWP4iWWFE180KXZ5rjdOEd9x8sc3VHqtpKeD6aaltrrsCU4T3IDfd3V45v4GAa6kBsimKCAwf3m62IteBQQgQGExg6PAW3INdbYOU67oapFGLl3kpvDOYucEydGHeGlxf8/Z2lpUNGd5urFkuP+sgQOCqwHDhLbivttp5BGYSsJbhwlvLCLQQ8H8iuIWyOe4IDBXeLZ6646aN7Q6qcwkQIFBbYJjwrhncEdbbtoHH5+29VwIVBQxN4JLAMOF9aXUHTnoV0jV/WBwoyyGdBfS/cwNM/1FgiPB2I33sowMIEFhMYIjwrtUTT91lZWcbzUPDbB2daz3pw9sNNNcFZzUECJQRSB/eZZZpFALXBDw8XHNzVn2B1OFd88Z5+yuT+u5mIECAwC2B1OF9a2VOJlBIoOZDRKESDbOgQNrwdsMseDVaMgECm8DH17Th/bHyCgf4gVEB1ZAECFQRSBneQrRKrw1KgMBEAinDu7bvq39ZWXte448r4IHieu+cWUdgyfCuQ2lUAgQItBNIF969nnB6zduu1WYiQGAmgXThPROutUwmYDkEEgkI70TNUAoBAgSOCqQKb7+6ONo2xxEgsLpAqvDu1Yz1fmj0kh57XtfJ2P2brXrhPVtHrYcAgSUE0oS3p5olrjeLJECgkECa8L64ntun+aFxm9AABAh0EFg+vDuYm5IAAQK3BVKEt6ff2300AAECvQQ6zZsivDut/ZcfGr3kzUuAwF2BpcP7Lp7zCRAg0EtAePeSNy+BdAIKGkmge3j3+tVFr3lHujjUSoBAXoHu4Z2XRmUECBDIK7BkeHvqzntBFqqsyjD+P/GowmrQiwJLhvdFK6cRIEAgjYDwTtMKhRAgQOC4QNfw9uuLz41yBAECBPYEuob3XkH2ESBAgMBnAeH92cgRBH75l5UugmwC7cI728rVQ4AAgYEFhPfAzVM6AQLrCnQLb/+yct2LbrSV+5XJaB17We9UX3QL76kULYYAAQKNBYR3Y3DTjSXgqXusfq1UrfBeqdvWOo2AhRAQ3q4BAi8EPHW/gLE7hYDwTtEGRRAgQOCcgPA+5+Xo0gJJx/PUnbQxyvpXoEt4+88E//X3hgABApcEuoT3pUqdRKCRgKfuRtCmuSUgvG/xPZ7sPQECBNoJCO921mYaQMBT9wBNUuJvAeH9m8FfBAgQGEtgL7zHWoFqCRAgsKCA8F6w6Za8L+BXJvsu9uYUEN45+6IqAmsLWP1HAeH9kcgBBAgQyCcgvPP1REUdBPzKpAO6KW8JNA9v/68rb/XLycMJKJhAHYHm4V1nGUYlQIDAWgLCe61+Wy0BApMICO9JGtlgGaYgQCCRgPBO1AylECBA4KiA8D4q5TgCBAgkElgyvBP5KyWJgP8KKkkjlHFYQHgfpnIgAQIE8ggI7z+98P9I4w/Ewi+evhdufvOl359QeP8xjBtXgP/B8EKAQHoB4f3UIgH+BLLYx/ghvtiSLXdQAeG90zgBvoNiF4F9AXs7CQjvF/AC/AXMArs9fS/Q5AmWKLwfmvjqphXkD0jeEiCQQkB4v2nDY2jH+9jeHO6rwQWUT2AkAeF9oFuPT+QR4LEdOM0hAws89nzgZSh9YgHh/dTc55v2VVC/2v80nI8ECBCoIiC8b7CmDfAba3LqfwLPP8j/+8Y7Av0FhHf/HqiAAAECpwWah/cIT6ueuE5fR1OeMMK1OiW8RR0SaB7eh6r696Acb9zEOfqgCgIE/hMQ3v9ZeEfgt0D8sI7t9wd/EUgqILxfNObIr04+HRMBENuLKexOJhC9ii1ZWcrpLJB1euFdqTNCoBJshWGjV7FVGNqQBKoJCO83tJ+erN+c+uMrwfCDI9UHvUnVDsWcEBDeJ7AeDz0b7ELiUS/H++V6koNdFYUEhPcHyLMhHcMJhVCwESBQU0B4H9C9EuAHhnUIAQIELgsI7wt0V8PcE/kF7N1T7u/Ui/uGjyPEPbFtj/v33m/Hba97x9j3WUB4fzZyBAECJwS2UI7Xx9Pic2yP++J97HvcYp/ts4Dw/mz044i4yH7s8IHA4gLv7on4btuOMm3Hx+vRc1Y8TngX6PrjP4I/vt8b+un7vUPsI0Dgj0AE+PP256vlX4T3wUtgu4AOHu6wpALxwzO2pOUNV1bcF62Ljjkft9bzZ5lPeN/shCC4Cdjg9OjRtjWYzhSNBR6DPN43nr7bdMXCu9sKTEyAQBeBrEEZdW1bF5hGkwrvRtCm6ScQN3K/2eeceRTTqHPbZuuE8L7R0fhH8SunXz3vylzOIbCOwPuVbiEer++PHONb4V24T7NcGIVZDDeRwAzXeKwhtpHbIrxH7p7aDwn4J51DTEseFAEe24iLF94XuyYQLsI1Pm3QPjVWOj7dqEH3aYWxrtg+HVfz+5h/b3s1p/B+JWP/8AKCe/gWNl9AhGeNSWPcT9vZeYX3WbGv459DIZrytdv/Egk89yhRacOWssp1HuuM7W6jYoxtuzrWu+tYeF9Vdd4hgR4Hvbvge9RjzjEFIngzVy68C3VHYBSCvDmMPtwEfHF69iB7Ufbt3bHu2M4OdOWc5zk+XcvC+1mswOcSjStQxnJDfLrYlwOx4GICGe/p5uGdEeFQh18cFOsRGi9w7J5CIK7xKRZycxFHHY4e966cI5nSPLzfFTzCd+9Q3303wtpGrpH9yN0bp/YI5tgyVCy8b3ZBaNwEdHpqgSxBlQ2ppsubTPnBILx/cHz+8Ni0x/fbmRv83nfbMV4JEBhfYO8e39tXa6XCu5ascQkMLtAyiEalCqPYStW/PfwdGa9peJdc5JHF9Tpma8Aq6+3lvM27eW+fvd4XqH3t3q8w1wjhFdudqs5ex03De29hZwveG6PHvmjUu9rffdejXnMSIDCXQPfwHpEzgvtI3RHgR489Mp5jCLQQcM22UP45R2TFzz2fPzUL770L4krBn5eU64hY4/Panz/nqvh8NbHGd9v5EY+fEfMeP7rCkYYk0EmgWXg/r2/Um+5K3XHObIG99TPWtr1/9RrHbNurY+zPITDrdZpDd7+KuDf2v3m/t1t4vy9rvm+3Bs10c2xrOtOtOGfbzpy3d2yMs7ffPgIrCDQJ7+fAGv2mi/pjm+sCab+aMNy2s7PHeWfPcfx7gef79P3Rvi0hcOc6bhLe7xbpgnmnk/e7Oxfd3qpivOft+bjH75+/85nAagLVw/s5nOMG7Ince/6eax9t7ujV4zZa/SPV+3yfjlT7qLXGtX2n9urhfae4i+d+PO0u2scJXhzgBnkBY3dXAddlV/7LkzcN716heVnHiQQIEKggUCILq4b340/0EsVWMDQkgaUFHu/RpSFKL77BeNXC20XRoHumIEBgOIFSD7LVwvtR9FWxPQP+VU2PdXtPYGaBnvffzK6t1lYlvF0Uf7ePyd8m9owgoMaSAiUfGquE9+NiSxb7OK73BAhcF/Awcd3u6pmls7B4eD9eFKWLvYpW8rzH9ZUc11gECBA4I1A0vB+D7VNwPx57pmDH5hAYsH854BJUoXftm/ApD69UVDS8twJqFLqN3fv1ytrcLL27Zn4C8wkUC+8toK6EWyvWzLW1Mig5z9bzkmMaq66AntX13Ru9Vu4UCe/tgqhV5B7IyvsyrT16H1ummtSyL6BP+y6j7r0d3nFBRGjHdhQhzjl67OjHrbLWWGdso/dL/QRKCpzJxbPz3g7vmsWdXYzj+wsI8P492KtAX/ZUxt53O7xvLX/yk1e9YVZd9+SXs+WdFKj9YNs8vN3YJ6+AQQ/X5zyN04s8vShZSfPwLln8mbFq/xR8rsUN8yziM4GUAlWKapE3TcNboFW5TtIOqt/9W6MH/XtQq4Km4V1rEdnGdcNk64h6CLQTaPHUHasR3qFgqybgB1k12r8Gft7B/llkrs/NwrvnhdTqJ2FcGj3XGfNn3Jhk7Iqaagi0zJom4T3LzduyMTUuLGOuIzDLPbdOx86vtEl4ny9rzDPcMIX6ZphbAq7DW3yXT279cFc9vHtfSK1BL3d+8hN7XweT81reggLVw3sVU+G0Sqdzr9N12Kc/PR4Sq4Z35gvpbG3XmtPnQso661nzrOtQF4FHgV7ZUC283aiP7fV+E4jrIrbts9dyAlzLWY4wUpXwznIRtfqJmGW9I1xwW41htm3bPq8ERhNolTF7LkfDe+/c3X1xQ+5+8WJnz8W/KOmv3SPU+FfRA+2Iaya2gUpOVyq/dC2pXlDR8N67gCL4Yttbyav9e8eW3LdX59XxS451tYZZzgvLx22WdVnHnAK98mvTLBbecdNtg8ZrLCy2eP9uez7v3bFnvjsy95HxSo1zZC7HELgiUOseulJL1XMM/kOgSHg/XzxHAu/IMT8q9WE5gefrajmAAwtmdACpwiEZ8utWeMeFE9tmEwuKbfv86nU75vHcasCEUgAAEABJREFUV8eW3n9mzq3OVzWcGevVGPa/F2D83se36wpcDu/HmypCLrYjjEePOzJWzWNGqbOmgbFrCZQZ9/EeLDOiUY4IZMmG0+EdF0xssYBtO7rgOH47NsbY3pd+fZznceyacz7O431ZAX0r62m0OQROh3cEY2x3lt/jZjwz59313bFxLoEjAmeu5yPjOeaYQKZsOB3ex5b4+qjsF93R5mRfx+sOFP2m2WC8m1GbaBCBpuHd4gbcC98W8w7Sb2VOIOB67tPEvWzpU8n3rE3COy622L6nbPv3mXmzNaetVP7ZzvQy/2quVcjgmtuMZ1UN77jQYusFd2Zuwd2rS+fmPdPTcyM7msBrgYz5UCW84waL7ZkiALbt+bvSn/fmfzVH1PTqO/sJZBE4c01nqXmGOrLmQ9HwjosrtseGxcK37XF/zffPNbybK2p7973v8gmc6W++6lVE4JXAuf23wjtuosdtmzoCcdu2fY+vcc7j55Lvz4wdNV6Z+8wcV8Z3DoFnAdfcs0ibz1czokV1p8I7LqDHLRa2t7UofG+OrZa97573xbHP+3weRyCuw3GqVSmB8gKnwjsC73ErX06ZET/VGN+XmckoBOoLDPiDqj5Kgxmy58Sp8G7gVXyK5wY8fy4+oQGbCawQaiussdkFM9lEU4X3pwtdcE929X4t51PPvw7xPwKnBUbIiqnC+12HRmjGu/p910eg56x+MPXUzz939/AuHap7F3zpOfK3da0K93q+loDVlhQYJS+6hPczzvPnko0wFoERBfxAGrFrbWvuEt57SywZ4C78HeHJd+n55A1utLySOVS75DThHQsNuNji/d3NzXxX0Pm9BFy7veTHmrd7eO9dqJkDfK/esVo+b7V6M29vW6ysVO60qDXm6B7eUcTeFpCx/f3duT1xQ8d27ixHE+gj4Frt4z7irN3C+2gwx3Gx3cWNmyK2u+M4P7fAyD0eufbcV8Xn6kpkzOdZyh7RLbzPLiNwYzt73vPxcYM8b8/H+EyAAIF3Ahm+6xreV8I4ztm2O4DbGPF6Zxzn5hOIH875qnpf0Yg1v1/RON+OmgFdw/tuewP9cXs33uNx8f7dsb4jQGANgZGzoHt4B16pp44Y69W2xqVolZtAqWtqG6/ma9daay7M2FUFuod31dUZnEByAcHdr0HxoNdv9vszpwjv0RHvt8EIBAgQOCeQIrzPlexoAnsCf+/L/lSbvb6/RefZM8MDo/Ce53q0EgIEFhIQ3gs1e8WlZn26zVrXCtfIDE/d0SfhHQq5NtVMLiC4J29wo+UJ70bQpiFAoL/ALE/dISm8Q8FGoJGAp+5G0AtMUzW8F/CzxAEEBOYATWpQ4kxP3cElvEPBRqCBgB8iDZAXmkJ4L9RsSyWwnsD3imd76o5VCe9QsBGoLOCpuzLwgsML7wWbbsltBQR3W+/n2WZ86o41Cu9QsBHIL6BCAj8EhPcPDh9mFej19Ntr3ln7eHZdsz51h4PwDgUbgQoCgrsC6okhZw7uYBDeoWBrKmAyAgTuCwjv+4ZGIPCXgKfuv0ia7pj9qTswhXco2AgQIDCYgPC+0zDnEtgR8NS9g9Jw1wpP3cEpvEPBRqCQgOAuBGmYjwLC+yORAwgQGEVglafu6Mef8I63NgIE7gh46r6j59yzAsL7rJjjhxUQrsO27lDhKz11B4jwDgUbgQICER6xFRhqySEs+pyA8D7n5WgCHwUiwGP7eKADigms6C28i10+BiLwUyACZdt+fuMTgfsCwvu+oREI/BTY+STEd1AK7QrbQkMNNYzwHqpdih1dIIImttHXof7+AsK7fw9U0FAgy39xEgEeW8OlTznVyobCe8pLutSijEOAQFYB4X2yMyv/pD9J5fAPAln+KeBDmWm/Xv1eFN5pL02FzSwguGfubpu1rRLebTTNMoRA7+DsPf8QTfpQ5OpP3cEjvEPBRqCRgOC+Dy24vw2F97fDqb9dPKe4HPxHQHD/gVj1pfC6hXdhUMMR2BMQ3Hsq9t0REN539Jw7rEDLMG0517ANOVi4f+r9D0p4/2dx6p2L6BTXsgfPGdzLtjPVwoV3qnYoZiYBwV22mx6YfnoK758ePi0kUDNca469UIss9Y2A8H6D8+krTwKfhNJ/r8BBBNxrfzdKeP9tYg+BywLxxB3b5QGc+JeA4P6L5PcO4f2b4fpfLqzrdhnOFLQZuqCGKwLC+4pawnOU1F/AD4LyPfBw9NpUeL+28Q2BwwKC+zCVAwsJCO8CkJ4OCiB2HOJu8N49v+PSU0/tvnrfnnzh/b5e3xJIJSC467RDcH92Fd6fjQ4d4WI7xDTNQRHasU2zoEQLcS8da4bwPubkqMkFzgTxmWMnZyu+vCTBXXxdNQYU3jVUjTmtgOCu09oI7djqjD7nqMK7YF9dfAUxEw4luOs0xX1zzVV4X3Nz1oQC78L53XeZKbLXJrivd0h4X7dz5iICgrt8oyO0Yys/8jojCu/CvXZBFgbtPJzgLtuAuD9iKzvqmqMJ7zX7Pt6qG1W8hXW8xtZo2umnicCObfqFNlyg8G6IbaoxBIR2mT5FWG9bmRGN8iggvB81Cr2PC7bQUIYhMIxAXPeP2zCFD1qo8G7eOBMSGF/gMaS39+OvaqwVCO+x+qVaAt0EtpCO125FmPhfAeH9L0XZNy7wsp5G6ycQ13Js/Sow857AnfDeG88+AgQmEhDaeZspvPP2RmUEuglEaMfWrQATfxQQ3h+JHEBgLYGhQnut1vxYrfD+wVH2g5ugrKfR6gu4Zusbl5pBeJeSNA6BwQUE91gNFN5j9Uu10wr0XZjg7ut/ZXbhfUXNOQQmEYjQjm2S5Sy1DOFdud1ujMrAhr8s4Nq8TJfiROGdog1TFWExAwgI7gGa9KFE4f0ByNcEZhMQ3HN0VHjP0UerIHBIQHAfYhriIOH9pk2lvnLDlJI0zh0B1+EdvXznCu98PVERgeICgrs4afcBhXf3FiiAQD2BCO3Y6s1g5LoCr0cX3q9tfENgaAGhPXT7PhYvvD8SlTnAjVTG0SjHBFxvx5xGPkp4j9w9tRPYEUga3DuV2nVHQHjf0XMugWQCgjtZQyqWI7wr4hqaQCuBCO3YWs1nnv4Cwrt/D1QwmEC2coV2to60qUd4t3H+PYub7DeDvwoKuKYKYg42lPAerGHKJbAJCO5NYs1X4b1m379X7e9hBQT3sK0rVrjwLkZpIAJtBAR3G+fsswjvxh1y4zUGn2w6189kDb2xnEnC+4aAUwkMIBChHdsApSqxkYDwbgRtGgJXBYT2Vbm5zxPec/fX6gYXENzjNLB1pcK7tfjXfG7ILwT/+yjgOvlItPQBwnvp9lt8VgHBnbUzeeoS3nl6oRICvwW6B/fvKvyVXUB4Z++Q+pYRiNCObZkFW+gtAeF9i+/6yW7S63Yznul6mLGrddckvOv6Gr2rwBiTC+4x+pStSuGdrSPqWUpAcC/V7qKLFd5FOQ1G4LiA4D5u5ci/BYT33ybN9py4eZvVZKL6AtH32OrPZIaZBYT3zN21tnQCQjtdS4YtSHgP2zqFjyYguEfrWO56m4d3bo721bmh25v3mFGfe6jPPafwnru/VtdZIEI7ts5lmH5CAeE9YVMtKYeA0M7Rh7+rmGOP8J6jj1aRTEBwJ2vIhOUI7wRNdaMnaEKhEqKXsRUazjAEXgoI75c0viBwTqBDaJ8r0NFTCQjvqdppMQQIrCIgvFfptHUSIDCVgPBO0s7V/5E7SRuUQWAYAeE9TKsUSoAAgf8EhPd/Ft4RIEBgGAHhXbpVxiNAgEADAeHdAPnoFH7vfVTKcQQICG/XAAECBAYUeBPeA65GyQQIEFhEQHgv0mjLrC/wv68/9WcxA4FvAeH97eBvAgQSCijptYDwfm3T5Rv/0rILu0kJDCcgvIdrmYIJECDw65fwdhUQaCFgDgKFBYR3YVDDESBAoIWA8G6hbA4CBAgUFhDehUHnH84KCRDIICC8M3RBDQQIEDgpILxPgjmcAAECGQRWDu8M/mogQIDAJQHhfYnNSQQIEOgrILz7+pt9MoH/ff2ZbEmWU1PgxtjC+waeUwkQINBLQHj3kjcvAQIEbggI7xt4NU79+qfu/9UY15gE6goYvbWA8G4tbj4CBAgUEBDeBRANQYAAgdYCwru1uPmyC6iPwBACwjtRm/y+O1EzlEIguYDwTt4g5REgQGBPQHjvqUyyzzIIEJhXQHgn6a1fmSRphDIIDCIgvAdplDIJECDwKDBGeD9W7D0BAgQI/BLeCS4CvzJJ0ISCJehnQUxDvRQQ3i9pfEHguoAAv26X9Mx0ZQnvdC1REAECBD4LCO/PRlWP8IRWlbfr4HrblX/6yYV3pxbHjR1bp+lNu7CApc8hILw79FFod0A3JYHJBIT3ZA21HAIE1hAQ3mv0ec5VWhWBhQWE98LNt3QCBMYVEN7j9k7lBAgsLCC8UzRfEQQIEDgnILzPeTmaAAECKQSEd+M2+M8EG4N3nk6/Ozdg4ulLh/fEVPeX5ka+b2gEAgS+BYT3t0P1vwV3dWITEFhKQHg3aLfgboCceAr9b9ycRaYT3pUb7catDGx4AosKCO+KjRfcFXEHG9q1MFjDBihXeFdqkpu1EuxSw1osgdcCwvu1zeVvBPdlOicSIHBQQHgfhHIYgbsCfqjfFXT+o4DwftQo8N4Nuoto5x8B18cfCC+3BYT3bcL/BnBj/mfhHQECdQWEdyFfwV0I0jAECBwSEN6HmP47aO+d4N5Tse+VgOvllYz9ZwSE9xktxxIgQCCJgPC+2QhPUTcBFz3ddbNo44ss+3sQ4f3tcOlvN+AlNicRIFBAQHgXQDQEgSsCfvhfUXPOJiC8N4mTr268k2AOJ/C3gD03BIT3BTzBfQHNKQQIFBUQ3kU5DUbgnIAHgXNejv5PQHj/Z3HonZvtENNyB1kwgdYCwvuEuOA+geVQAgSqCgjvqrwGJ/BZwEPBZyNH/C0gvP822d2zzA22u3o7CRDIJiC8D3REcB9AcggBAk0FhHdTbpMR2BfwgLDvYu9rgYnD+/Wiz3zjpjqj5VgCBFoJCO9W0uYhQIBAQQHh/QbTU/cbHF8VF3C9FSftPmDNAoR3TV1jEyBAoJKA8H4B6ynoBYzdBAikEBDeO20Q3DsodjURSHvtNVm9Sc4ICO8zWo4lQIBAEgHh/dQITz5PID4SIJBSQHinbIui6gnkH9kDRP4eZahQeD90wU3zgOEtAQKpBYR36vYojgABAvsCwvuPy4BP3X8q9zKjgOtxxq6WXZPwLutpNAIECDQREN5fzJ5yvhD8jwCBoQRShPdQYoolQIBAAoHlw9tTd4KrUAm7Aq7NXRY7/wgsH95/HLwQILC0wHiLXzq8PdmMd8GuVrFrdLWOH1/v0uF9nMmRBAgQyCWwbHh7osl1IaqmmICBFhFYNrwX6a9lEiAwqcCS4e2pe9Kr2bIILCSwZHgv1N+hl6r4bwEPG98O/v4pIKeBZMMAABAASURBVLx/evhEgACBIQSWC29PMUNcl4okQOCDwHLh/cGjztdGJXBTwEPHTcAJT18qvN0AE17BlkRgUYGlwnvRHls2AQITCpwM73EFPHWP2zuVfwu4hr8d/P0tsEx4fy/X3wQIEJhDYInw9sQyx8VqFQRCwPYtsER4fy/V3wTGF/AgMn4PS61g+vB2sZe6VIxDgEAmgenDOxO2Wgj8EPCBwA2BqcPbU/eNK8OpBAikFpg6vFPLK47ARQEPJRfhJjtNeE/W0D7LMSsBAq0Fpg1vTyetLyXzESDQUmDa8G6JaC4CrQU8nLQWzzfflOF948LO1yEVESBAYEdgyvDeWaddBAgQmEpguvD21D3V9WkxBNYTOLji6cL74LodRmB4AQ8qw7fw1gKmCm8X861rwckECAwkMFV4D+SuVAILCFhiTYFpwttTd83LxNgECGQTmCa8s8Gqh0ALAQ8tLZRzzjFFeLuAc15cE1VlKQTSCUwR3ulUFUSAAIHKAsK7MrDhCRAgUENg+PD2K5Nzl4Wj5xNwD8zX0yMrGj68jyzSMQQIEJhNYOjw9sQx2+VoPQQIHBUYN7yPrtBxBAgQmFBg2PD21D3h1WhJBAgcFhg2vA+v0IEEFhDwMNOlyV0nHTK8XahdrxmTEyCQQGDI8E7gpgQCBAh0FRDeXflNTiCHgCrGExguvP3KZLyLTMVtBNwbbZyzzDJceGeBUwcBAgR6CgwV3p4sel4qg8ytTAKLCAwV3ov0xDIJECDwUWCY8PbU/bGXDiDwy32yzkUwTHiv05JtpV4JECDwWmCI8PY08bqBviFAYE2BIcJ7zdZYNQECBF4LtAjv17P7hgCB4gL+SbU4acoB04e3CzHldaMoAgQ6C6QP784+pidAYAaBCdeQOrw9dU94xVkSAQJFBFKHd5EVGoTAggIefOZvetrwdvHNf/FZ4RUB5xD4Fkgb3t/l+ZsAAQIE9gSE956KfQQIEEgukDK8/cok+VVTpjyjVBZwH1UG7jx8yvDubGJ6AgQIpBdIF96eFtJfMwokQCCBQLrwTmByugQnECBAoLVAqvD21N26/eYjQGBUgVThPSqiuglkFfBAlLUz9+v6Gd73x7s8govsMp0TCRBYUCBNeC9ob8kECBC4LCC8L9M5kQCBCgKGPCiQIrz9yuRgtxxG4IKA++sC2gCnpAjvAZyUSIAAgVQC3cPbU0Gq60ExBQUMRaCmQPfwrrk4YxMgQGBWAeE9a2eti8CDgH/CfcCY5G3X8HZBDXIVKZMAgXQCXcM7nYaCCBAgMIhAt/D21D3IFaJMAgRSCnQL7z4aZiWwroAHprl63yW8XURzXURWQ4BAe4Eu4d1+mWYkQIBADoFSVQjvUpLGIUCAQEOB5uHtVyYNu2sqAk8C7r8nkIE/Ng/vga2UToDAo4D3XQWahref+l17bXICBCYSaBreE7lZCgECBLoKNAtvT91d+2zytwJrfelenKPfzcJ7Di6rIECAQA6BJuHtJ32OZquCAIF5BJqE9zxc6VeiQAIEFhEQ3os02jIJPAr4p+FHjTHfVw9vF8mYF4aqCRDILVA9vK8u33kECBAg8Fqganh76n4N7xsCBAjcEaga3ncKcy4BAnUFPFx98s39fbXwdmHkbrzqCBAYW6BaeI/NonoCBAjkFhDeufujOgIlBIwxoUCV8PYrkwmvFEuaUsC9Om5bq4T3uBwqJ0CAwBgCxcPbT/IxGj9qleomQOBboHh4fw/rbwIECBCoKVA0vD1112yVsQnUEXDf1nGtPWrR8K5d7FTjWwwBAgRuCAjvG3hOJUCAQC+BYuHtH716tdC8BAisKFAgvFdks2YCcwl4+Bqvn0XCW+PHa7yKCRAYW6BIeI9NoHoCBEYXWLH+2+HtqXvFy8aaCRDoLXA7vHsvwPwECJQR8CBWxrHVKLfCW7Nbtck8ywhYKIGDArfC++AcDiNAgACBwgLCuzCo4QgQINBC4HJ4+5VJi/aMPIfaRxRwX4/TtUvhrcHjNFilBAjMKXApvOeksCoCBAiMI3A6vBd86h6nmyolUEDAPV4AscEQp8O7QU2mIECAAIEPAqfC20/kD5q+JkCAQA2BnTFPhffO+XYRIECAQAeBw+HtqbtDd0xJoJOA+70T/IlpD4f3iTEdSoAAgRcCdpcSOBTefgqX4jYOAQIEyggcCu8yUxmFAAECBEoJfAxvT92lqI0zmcD0y3Hv527xx/DOXb7qCBAgsKbA2/D2k3fNi8KqCRDIL/A2vPOXr8ISAsYgQGA8gZfh7al7vGaqmEBpATlQWrTceC/Du9wURiJAgACB0gJzhXdpHeMRIEAgqYDwTtoYZREgQOCdgPB+p+M7AgR++b33qYug2cEvw/ufP3+aVWIiAgQIEDgs8DK8txH+ZPg/22evBAgQINBf4GN4byUK8U3CK4E1BB5X6Vcnjxo53h8O7xzlqoIAAQIEQuBUePvpG2Q2AgQI9Bc4Fd79y1UBgQsCTiki4OGtCGOxQYR3MUoDESBAoJ2A8G5nbSYCBAgUExDexShbDGQOAgQIfAucCm//ueA3mr8JrCrg9955On8qvLeyhfgm4ZUAAQJ9BC6F91bqjRDfhvBKgAABAhcEboX3Nt8W4tvrtt8rAQIECNQRKBLez6VtIb69Pn/vMwEC4wpM83vvcVvwu/Iq4f175Ie/thB/fH342lsCBAgQOCnQJLz3anoM8u393nH2ESBAgMDfAt3C++9Sfv3aQnx7/eUPAQIHBByyokCq8H5uwBbi2+vz9z4TIEBgVYHU4f3clC3E4/X5O58JECCwksBQ4f3YmAjw2B73eT+8gAUQIHBQYNjw3tYnwDcJrwQIrCQwfHhHsyLAY4v3NgIE6gq41+r6Hh19ivDeFhsXVWzb556v5iYwo4D7K09XpwrvjTUusNi2z14JELgv4J66b1hyhCnDewOKi+1x2/Z7JUDguMB2Dx0/w5EtBD6Hd4sqGs2xXYR7r41KMA2BYQS2+2SYghcrdKnwftfb7UKt/fquBt8RCIFX12B8V3N7nrfmXMa+LyC87xsagUATgedwffc5Cnr3/d53cU7STVk7AsJ7B8UuAqMLRDiPvgb1vxcQ3u99in7r/w5yUU6DEVhaQHgv3X6Lby1gPgKlBIR3KUnjNBWIXwuc2ZoWZzICDQSEdwNkU5wTOBLK50b89fv/Vvyv5H+2dScvU3lJBIR3kkYMV8aABUc4Zik7annestSmjjEEhHejPvmXlY2gP0zzHJjx+cMpt76O8fe2W4M6mcCXgPD+QvC/tQX2wrXUvrVlrb6mgPD+VZPX2AQIEKgjILzruBqVAAECVQWEd1VegxMgQOCzwJUjhPcVNecQIECgs4Dw7twA0xMgQOCKgPC+onbyHP+Z4Ekwh48roPJmAsK7GbWJCBAgUE5AeJezNFIBgfjvqwsMYwgC0wsI7+lbbIHXBJxFILeA8M7dH9URIEBgV0B477LYSYAAgdwCwjt3f0pUZwwCBCYUEN4TNnXUJfmXlaN2Tt09BIR3D3VzEiBA4KbAUOF9c61OJ0CAwDQCwnuaVo69EL8yGbt/qm8vILzbm5uRAIFhBfIULrwr98L/XZPKwIYnsKiA8F608ZmW7VcmmbqhllEEhPconVIngbICRhtcQHgP3sDRy/fUPXoH1d9LQHj3kjcvAQIEbggI7xt4Ts0hoAoCKwoI74pd91+avMf1K5P3Pr4l8E5AeL/T8R0BAgSSCgjvTI1ZqBZP3Qs121KrCAjvKqwGJUCAQF0B4V3J1++7K8EalgCB3wKVwvv32P4isCvgVya7LHYSOCUgvE9xOZgAAQI5BIR3hT74lUkFVEMSOCkw++HCe/YOJ1ufX5kka4hyhhUQ3sO2TuEECKwsILwLd9+vTAqDGu7XLwYEdgSE9w6KXQQIEMguILyzd0h9BAgQ2BEQ3jsoV3f5lcknOd8TIFBKQHiXkjQOAQIEGgoI74bYpiJAgEApAeF9TfKvs/zK5C8SOwgQqCggvCviGpoAAQK1BIR3LVnjEiBAoKLA/1Uce5mh/cpkmVZbKIE0Ap6807RCIQQIEDguILyPWzmSAIEqAga9IiC8r6g557KAXzFdpnMigR8CwvsHx/kPwui8mTMIELgvILzvGxqBwCbglUAzAeHdjNpEBAgQKCcgvMtZGokAAQLNBIT3DeqZf999g8WpBAg0EBDeDZBNQYAAgdICwru0qPEIECDQQGD+8G6AaIpzAn7ddM7L0QT2BIT3nsqBfQLoAJJDCBCoJiC8q9EamAABAr8FqvwlvKuwGpQAAQJ1BYR3XV+jEyBAoIqA8K7CalACcwpYVR4B4X2hF/5l5QU0pxAgUFRAeBflNBgBAgTaCAjvNs5mySagHgKDCwjvwRuofAIE1hQQ3mv2vfuq/XuD7i1QwOACwnvwBv76ZQEECKwoILxX7Lo1EyAwvIDwHr6FFkCAwIoCmcJ7RX9rJkCAwCUB4X2JzUkECBDoKyC8+/qbnQCBTAID1SK8TzbLf+J2EszhBAhUERDeVVgNSoAAgboCwruur9EJdBIw7ewCwnv2DlsfAQJTCgjvKdtqUQQIzC4gvGfv8PjrswICBHYEhPcOil0ECBDILiC8s3dIfQQIENgREN47KLV2GZcAAQKlBIR3KUnjnBbw/+DpNJkTCPwrILz/pfCGAAEC4whcC+9x1le80n++/hQf1IAECBA4KSC8T4I5nAABAhkEhHeGLqiBAIGzAssfL7yXvwQAECAwooDwHrFraiZAYHkB4b38JQCgt4D5CVwREN5X1JxDgACBzgLCu3MDTE+AAIErAsL7ippz9gXsJUCgmYDwbkZtIgIECJQTEN7lLI1EgACBZgLCe5faTgIECOQWEN65+6M6AgQI7AoI710WOwkQINBX4NPswvuT0M73/3z92dltFwECBJoJCO9m1CYiQIBAOQHhXc7SSAQI7AnYV0VAeFdhNSgBAgTqCgjvur5GJ0CAQBUB4V2F1aBzClgVgTwCwjtPL1RCgACBwwLC+zCVAwkQIJBHQHjn6UXLSsxFgMDgAsL7YgP/+fpz8VSnESBA4LaA8L5NaAACBAi0Fxg+vNuTmZEAAQL9BYR3/x6ogAABAqcFhPdpMicQIEDgUaDPe+Hdx92sBAgQuCUgvG/w/fP158bpTiVAgMBlAeF9mc6JBKYTsKCBBIT3QM1SKgECBDYB4b1JeCVAgMBAAsJ7oGYp9biAIwnMLiC8Z++w9REgMKWA8L7Z1n++/twcourpX+X9/l/VSQxOgEBzAeHdnPzkhA4nQIDAjoDw3kGxiwABAtkFhHf2DqmPAAECOwINw3tndruaCcQvvptNdmKi/339OXG4QwkQ+CMgvP9A3HnJGox31uRcAgRyCwjv3P1RHQECBQVmGkp4z9RNayFAYBkB4b1Mqy2UAIGZBIT3TN38sBa/m/8ANNLXal1eQHgvfwkAIEBgRAHhXahrnmoLQRqGAIGkdDNPAAAGX0lEQVRDAsL7EJOD6gkYmQCBKwLC+4qacwgQINBZQHh3bkDr6f16p7W4+QjUERDe5VyNdFHgf19/Lp7qNALLCgjvZVtv4QQIjCwgvAt2z68kCmIaigCBtwK74f32DF8SIECAQHcB4d29Be0L8E8I7c3NSKC0gPAuLWo8AgQKCBjik4Dw/iTkewIECCQUEN4Jm7JiSf/7+rPiuq2ZwFUB4X1V7sV5fp/8Ambd3VZOoIqA8K7Cmn9QP2Ty90iFBN4JCO93Or4jQIBAUgHhnbQxGctSEwECeQSEd55eLF/J17+z/N/yCAAIHBQQ3gehHEaAAIFMAmuGd6YOqIUAAQIXBIT3BTSnECBAoLeA8K7QgUz/Gd673yNnqnNrw7t6t2O8EphA4PYShPdtQgMQIECgvYDwbm9uRgIECNwWEN63CQ1QWsCvTkqL1h3P6H0EhHcfd7MSIEDgloDwvsU3xsmeZMfokyoJnBEQ3me0HNtMoMsPnGarMxGB+wLC+76hEQgQINBcQHg3J+8z4YhPsiPW3Ke7Zl1RQHhP2XWLIkBgdgHhPXuHB1+fp+/BG6j8agLCuxptvoEFYb6eqIjAVYHs4X11Xc6bSMAPnYmaaSnFBIR3McoxBhKEY/RJlQQ+CQjvT0K+TyHgh06KNqxZRNJVC+8KjckeNNnre9WSUet+tR77CdwREN539AY+N4IwttGWMGLNoxmrdwwB4T1Gn1T5ICDAHzBOvXXwTALCe6ZuLrQWAb5Qsy11V0B477Jc3ylUrtudPZP1WTHHzyQgvGfq5jpr+XelAvxfCm8WExDeizV8xuUK8Bm7ak2fBIT3J6ET3wuRE1iFDw372AoPazgCaQWEd+fWmL6sgAAv62m0vALCu1BvhEYhyALDRC9iKzCUIQikFRDeaVujsLsCEeCx3R3H+QQyCpQL74yra1STgGgEfXGa6E9sF093GoGUAsI7ZVsUVUMgAjy2GmMbk0BrAeF9U1wY3ATscHr0LLYOU5uyrsBSowvvpdptsY8CEeCxPe7znsAoAsL7Rqfc+DfwEp0afYwtUUlKIfBRQHh/JHLAKgIR4LFlWK8aCHwSEN6fhF587yZ/ATPB7uhtbJ+WEsds26djfU+gtIDwLi1qvGkE9oJ52xevjwuNz9v2uN97ArUEhPcF2bhJL5y25ikTrDr6vW1HlnPm2CPjOYbAnoDw3lOxj0ABgQjxAsMYgsCugPDeZXm90w352sY3BAi0ExDeh60dSOC8QPywf97Oj+IMAn8LCO+/TewhUFXgOcy3z1UnNfh0AsL7REvjJjtxuEMJnBKI6+t5OzWAg6cXeFyg8H7U8J5AMgFhnqwhicoR3omaoRQCnwS2MP90nO/nFxDe8/fYCicUGD7EJ+xJ6yUJ79bi5iNQUCBCvOBwhhpIQHgP1CylEtgTEOB7KvPvE97z99gKqwrkGFyA5+hDyyqEd0ttcxEgQKCQgPA+COnJ5iCUw7oJuEa70XeZWHh3YU85qaIIEBhIQHgP1CylEiBAYBMQ3puEVwITCPjVyQRNPLiEKcP74NodRoAAgWEFhPewrVM4gX0BT9/7LrPtFd6zddR6CBBIIFC/BOFd39gMBAgQKC4gvIuTGpBAfwG/Ounfg9oVCO/awsYnMLaA6pMKCO+Djfnn68/BQx1GgACB6gLCuzqxCQi0F/h61vin/axmbCkgvFtqm6urwCqTC+41Oi281+izVS4iILgXafTXMoX3F4L/ERhdIEI7ttHXof7jAsL7uFWeI1VC4I9ABHZsfz56WUhAeC/UbEudRyACO7Z5VmQlZwWE91kxxxPoJBBhvW2dSjBtIoHO4Z1I4kApceMcOMwhBIoIxPX2uBUZ1CDTCAjvaVppIaMLPAZ1vB99PeqvKyC8T/q6qU6COXxXIK6j5233QDurC4w6gfAetXPqTinwHMivPqcsXlFDCQjvC+3absgLpzplUIGt559eB12esgcUEN43mrZ3I98YzqlJBaLPSUv7WZZPSwkI78Ltjhv91VZ4KsNVFtj6WHkawxO4JCC8L7FdO2kLg7Ov12Zz1hWBx95cOd85BFoJCO9W0jfmeQyUI+9vTJXk1HZlPHu2m9lMBO4JCO97finPfg6kI59TLqRQUe/WX2gKwxBoLiC8m5PnnPBdwG3f5az8u6qtxr3X7yP8TWAugf8HAAD//9wrF1QAAAAGSURBVAMAYO02aOYLp4EAAAAASUVORK5CYII=';
    const TEEN_SRC  = 'data:image/png;base64,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';
    const BLUE = '#1746C8';
    const DUR  = 8.7;
    const RINGS = [BLUE, '#ffffff', BLUE, '#ffffff', BLUE];
    const RING_START = 0.45, RING_GAP = 0.13, RING_DUR = 0.62;

    const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
    const easeOutQuad = t => t * (2 - t);
    const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    const easeOutCubic = t => (--t) * t * t + 1;
    const clampT = (v, a, b) => Math.max(a, Math.min(b, v));
    function interp(inp, out, ease, t) {
      if (t <= inp[0]) return out[0];
      if (t >= inp[inp.length-1]) return out[out.length-1];
      for (let i = 0; i < inp.length-1; i++) {
        if (t >= inp[i] && t <= inp[i+1]) {
          const span = inp[i+1] - inp[i];
          const local = span === 0 ? 0 : (t - inp[i]) / span;
          return out[i] + (out[i+1] - out[i]) * ease(local);
        }
      }
      return out[out.length-1];
    }

    // Build overlay DOM
    Object.assign(intro.style, {
      position: 'fixed', inset: '0', zIndex: '9999',
      pointerEvents: 'auto', overflow: 'hidden',
      background: '#ffffff', display: 'block',
    });

    // Clip container
    const clipDiv = document.createElement('div');
    Object.assign(clipDiv.style, { position: 'absolute', inset: '0' });
    intro.appendChild(clipDiv);

    // Spark
    const spark = document.createElement('div');
    Object.assign(spark.style, {
      position: 'absolute', top: '50%', left: '50%',
      width: '80px', height: '80px',
      marginLeft: '-40px', marginTop: '-40px',
      borderRadius: '50%', background: BLUE,
      transform: 'scale(0)',
    });
    clipDiv.appendChild(spark);

    // Ring divs
    const ringEls = RINGS.map(c => {
      const d = document.createElement('div');
      Object.assign(d.style, {
        position: 'absolute', top: '50%', left: '50%',
        width: '80px', height: '80px',
        marginLeft: '-40px', marginTop: '-40px',
        borderRadius: '50%', background: c,
        transform: 'scale(0)', display: 'none',
      });
      clipDiv.appendChild(d);
      return d;
    });

    // Figure container
    const figWrap = document.createElement('div');
    Object.assign(figWrap.style, {
      position: 'absolute', zIndex: '20',
      display: 'none',
    });
    clipDiv.appendChild(figWrap);

    const imgBase = { position: 'absolute', left: '50%', bottom: '0', transform: 'translateX(-50%)', width: 'auto', display: 'block' };

    const imgChild = document.createElement('img');
    Object.assign(imgChild.style, imgBase);
    imgChild.src = CHILD_SRC;
    figWrap.appendChild(imgChild);

    const imgTeen = document.createElement('img');
    Object.assign(imgTeen.style, imgBase);
    imgTeen.src = TEEN_SRC;
    figWrap.appendChild(imgTeen);

    // Tagline
    const tagEl = document.createElement('div');
    Object.assign(tagEl.style, {
      position: 'absolute', left: '6vw', top: '50%',
      width: '46vw', zIndex: '30',
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      fontWeight: '600', letterSpacing: '-0.035em',
      color: '#ffffff', lineHeight: '1.0',
      opacity: '0', display: 'none',
    });
    tagEl.textContent = 'Take your career in Stride.';
    clipDiv.appendChild(tagEl);

    // Scroll-to-close
    const CLOSE_AT = 6.55;
    let startTs = null, offsetT = 0, tNow = 0, done = false, rafId = null;

    const onScrollIntent = () => {
      if (!done && tNow < CLOSE_AT) {
        offsetT += (CLOSE_AT - tNow);
      }
    };
    window.addEventListener('wheel', onScrollIntent, { passive: true });
    window.addEventListener('touchmove', onScrollIntent, { passive: true });

    // Replay support
    const onReplay = () => {
      startTs = null; offsetT = 0; tNow = 0; done = false;
      Object.assign(intro.style, { display: 'block', background: '#ffffff' });
      step(performance.now());
    };
    window.addEventListener('stride-replay', onReplay);

    // Click to skip
    intro.addEventListener('click', () => {
      if (!done && tNow < CLOSE_AT) onScrollIntent();
    });

    function finish() {
      done = true;
      intro.style.display = 'none';
      intro.innerHTML = '';
      document.body.style.overflow = '';
      window.removeEventListener('wheel', onScrollIntent);
      window.removeEventListener('touchmove', onScrollIntent);
      window.removeEventListener('stride-replay', onReplay);
      if (rafId) cancelAnimationFrame(rafId);
      resolve();
    }

    function step(ts) {
      if (startTs == null) startTs = ts;
      tNow = (ts - startTs) / 1000 + offsetT;
      if (tNow >= DUR) { finish(); return; }

      const W = window.innerWidth, H = window.innerHeight;
      const diag = Math.sqrt(W * W + H * H);
      const RING_COVER = (diag * 1.2) / 80;

      // Background
      intro.style.background = tNow < 1.6 ? '#ffffff' : 'transparent';
      document.body.style.overflow = 'hidden';

      // Clip path
      let clipR = 125;
      if (tNow >= 6.7 && tNow <= 7.6) {
        clipR = interp([6.7, 7.6], [125, 0], easeInOutCubic, tNow);
      } else if (tNow > 7.6) {
        clipR = 0;
      }
      const cp = 'circle(' + clipR + '% at 77% 50%)';
      clipDiv.style.clipPath = cp;
      clipDiv.style.webkitClipPath = cp;

      // Spark (visible t < 0.5)
      if (tNow < 0.5) {
        spark.style.display = 'block';
        const sc = easeOutBack(clampT(tNow / 0.4, 0, 1));
        spark.style.transform = 'scale(' + sc + ')';
      } else {
        spark.style.display = 'none';
      }

      // Rings
      RINGS.forEach((c, i) => {
        const start = RING_START + i * RING_GAP;
        if (tNow < start) { ringEls[i].style.display = 'none'; return; }
        ringEls[i].style.display = 'block';
        const lt = clampT((tNow - start) / RING_DUR, 0, 1);
        const sc = easeOutQuad(lt) * RING_COVER;
        ringEls[i].style.transform = 'scale(' + sc + ')';
        ringEls[i].style.zIndex = String(i + 1);
      });

      // Figure
      const figVisible = tNow > 1.55 && tNow < 7.7;
      if (figVisible) {
        figWrap.style.display = 'block';
        const figX = interp([1.6, 3.6], [-0.12 * W, 0.77 * W], easeInOutSine, tNow);
        const figH = clampT(interp([1.6, 3.6], [0.26 * H, 0.60 * H], easeInOutSine, tNow), 0.26 * H, 0.60 * H);
        figWrap.style.left = figX + 'px';
        figWrap.style.bottom = (0.09 * H) + 'px';
        figWrap.style.height = figH + 'px';
        figWrap.style.transform = 'translateX(-50%)';
        imgChild.style.height = figH + 'px';
        imgTeen.style.height = figH + 'px';
        const pw = clampT((tNow - 1.6) / 2.0, 0, 1);
        let childOpa = 1;
        if (pw > 0.46) childOpa = 0;
        else if (pw > 0.34) childOpa = (0.46 - pw) / 0.12;
        imgChild.style.opacity = String(childOpa);
        imgTeen.style.opacity = String(1 - childOpa);
      } else {
        figWrap.style.display = 'none';
      }

      // Tagline
      if (tNow > 3.85) {
        tagEl.style.display = 'block';
        const tagP = clampT((tNow - 3.9) / 0.5, 0, 1);
        const tagSize = clampT(H * 0.092, 40, 104);
        tagEl.style.fontSize = tagSize + 'px';
        tagEl.style.opacity = String(tagP);
        const tagY = (1 - easeOutCubic(tagP)) * 30;
        tagEl.style.transform = 'translateY(calc(-50% + ' + tagY + 'px))';
      } else {
        tagEl.style.display = 'none';
      }

      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
  });
}

window._resetIntro = () => { localStorage.removeItem('stride-visited'); location.reload(); };

document.addEventListener("DOMContentLoaded", async () => {
  const isFirstVisit = !localStorage.getItem('stride-visited');
  if (isFirstVisit) {
    localStorage.setItem('stride-visited', 'true');
    await playIntroAnimation();
  }

  // Detect OAuth errors returned in the URL (e.g. Google access_denied)
  const _oauthParams = new URLSearchParams(window.location.search);
  const _oauthError  = _oauthParams.get('error') || new URLSearchParams(window.location.hash.slice(1)).get('error');
  if (_oauthError === 'access_denied') {
    // Clean up the URL without reloading
    history.replaceState(null, '', window.location.pathname);
    // Show on the login screen after init
    requestAnimationFrame(() => {
      const sub = document.getElementById('login-subtext');
      if (sub) sub.textContent = 'Google sign-in was blocked — the app hasn’t been verified by Google yet. Use LinkedIn to sign in instead.';
    });
  }

  // Returning users see "Log in" instead of "Start free" on the landing CTA
  if (!isFirstVisit) {
    const navCta = document.getElementById('btn-landing-nav-cta');
    if (navCta) { navCta.textContent = 'Log in'; navCta.dataset.goto = 'login'; }
  }

  goToStep(1);
  initOnboarding();
  initFootprintLoader();
  initSlider();
  initDraftEditor();
  initDevMenu();
  initThemeToggle();
  initMomentModal();
  wireButtons();
  wireCollabEntry();
  document.getElementById("btn-refresh-linkedin")?.addEventListener("click", loadLinkedInStats);
  document.getElementById("btn-open-streak")?.addEventListener("click", () => {
    window.open("https://calendar.google.com", "_blank", "noopener,noreferrer");
  });

  // Wire "See my post" button on published screen
  document.getElementById('btn-see-post')?.addEventListener('click', () => {
    const url = sessionStorage.getItem('stride-last-post-url') || 'https://www.linkedin.com/feed/'
    window.open(url, '_blank')
    sessionStorage.setItem('stride-show-confetti', 'true')
  })

  // Fire confetti modal on return from LinkedIn
  if (sessionStorage.getItem('stride-show-confetti') === 'true') {
    sessionStorage.removeItem('stride-show-confetti')
    setTimeout(showSuccessModal, 400)
  }

  // Dismiss success modal
  document.getElementById('btn-success-dismiss')?.addEventListener('click', () => {
    const overlay = document.getElementById('success-modal-overlay')
    if (overlay) overlay.style.display = 'none'
  })

  // Profile payoff → login
  document.getElementById('btn-take-stride')?.addEventListener('click', async () => {
    await saveOnboardingProfile({
      role:        getSelectedChips('onboarding-step-1'),
      field:       getSelectedChips('onboarding-step-2'),
      goals:       getSelectedChips('onboarding-step-3'),
      tone:        getSelectedChips('onboarding-step-4'),
      pillars:     getSelectedChips('onboarding-step-5'),
      positioning: document.getElementById('payoff-positioning')?.textContent || '',
    });
    showScreen('login');
  });

  // Google sign-in (or link if already signed in with LinkedIn)
  document.getElementById('btn-google-signin')?.addEventListener('click', async () => {
    const sb = await initSupabase();
    if (!sb) return;
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user?.app_metadata?.provider === 'google') return; // Google already the active provider
    const opts = {
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.readonly',
        redirectTo: window.location.origin,
      },
    };
    localStorage.setItem('stride-oauth-pending', '1');
    const { error } = await sb.auth.signInWithOAuth(opts);
    if (error) {
      console.error('Google auth error:', error.message);
      const sub = document.getElementById('login-subtext');
      if (sub) sub.textContent = 'Google sign-in failed: ' + error.message;
    }
  });

  // LinkedIn sign-in (or link if already signed in with Google)
  document.getElementById('btn-linkedin-signin')?.addEventListener('click', async () => {
    const sb = await initSupabase();
    if (!sb) {
      const sub = document.getElementById('login-subtext');
      if (sub) sub.textContent = 'Could not connect to server. Please try again.';
      return;
    }
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user?.app_metadata?.provider === 'linkedin_oidc') return; // Already the active provider
    const opts = {
      provider: 'linkedin_oidc',
      options: { redirectTo: window.location.origin },
    };
    localStorage.setItem('stride-oauth-pending', '1');
    const { error } = await sb.auth.signInWithOAuth(opts);
    if (error) {
      console.error('LinkedIn auth error:', error.message);
      const sub = document.getElementById('login-subtext');
      if (sub) sub.textContent = 'LinkedIn sign-in failed: ' + error.message;
    }
  });

  // Settings logout button
  document.getElementById('btn-settings-logout')?.addEventListener('click', async () => {
    if (strideSupabase) await strideSupabase.auth.signOut();
    // SIGNED_OUT event handler resets button states and routes to login
  });

  // Settings inner tabs (General / Data & Privacy)
  document.querySelectorAll('.settings-inner-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.settings-inner-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.settingsTab;
      document.getElementById('settings-tab-general').hidden  = (target !== 'general');
      document.getElementById('settings-tab-privacy').hidden  = (target !== 'privacy');
    });
  });

  // Disconnect Google Calendar — sets a local flag; does not sign the user out
  document.getElementById('btn-disconnect-gcal')?.addEventListener('click', () => {
    localStorage.setItem('stride-gcal-disconnected', 'true');
    const statusEl = document.getElementById('dp-gcal-status');
    if (statusEl) statusEl.textContent = 'Disconnected';
    const disconnectBtn = document.getElementById('btn-disconnect-gcal');
    if (disconnectBtn) disconnectBtn.disabled = true;
    const reconnectMsg = document.getElementById('dp-gcal-reconnect');
    if (reconnectMsg) reconnectMsg.hidden = false;
    // Update the dashboard calendar card
    const evList = document.getElementById('upcoming-events-list');
    if (evList) evList.innerHTML = '<p class="text-caption text-muted" style="text-align:center;padding:var(--space-4) 0;">Google Calendar disconnected. <a href="#" id="dashboard-gcal-reconnect" style="color:var(--color-stride-blue);">Reconnect</a></p>';
    document.getElementById('dashboard-gcal-reconnect')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await _reconnectGcal();
    });
  });

  // Reconnect Google Calendar from privacy tab
  document.getElementById('btn-reconnect-gcal')?.addEventListener('click', async () => {
    await _reconnectGcal();
  });

  // Export my data
  document.getElementById('btn-export-data')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-export-data');
    if (!strideSupabase) return;
    btn.disabled = true;
    btn.textContent = 'Exporting…';
    try {
      const { data: { session } } = await strideSupabase.auth.getSession();
      if (!session) { btn.textContent = 'Export my data'; btn.disabled = false; return; }
      const uid = session.user.id;
      const [profileRes, postsRes] = await Promise.all([
        strideSupabase.from('profiles').select('*').eq('id', uid).single(),
        strideSupabase.from('posts').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      ]);
      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data || null,
        posts:   postsRes.data  || [],
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stride-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      btn.textContent = 'Export my data';
      btn.disabled = false;
    }
  });

  // Delete my account — show confirmation modal
  document.getElementById('btn-delete-account')?.addEventListener('click', () => {
    document.getElementById('modal-delete-account').hidden = false;
  });
  document.getElementById('btn-delete-cancel')?.addEventListener('click', () => {
    document.getElementById('modal-delete-account').hidden = true;
  });
  document.getElementById('btn-delete-confirm')?.addEventListener('click', async () => {
    const confirmBtn = document.getElementById('btn-delete-confirm');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting…';
    try {
      if (strideSupabase) {
        const { data: { session } } = await strideSupabase.auth.getSession();
        if (session) {
          const uid = session.user.id;
          await strideSupabase.from('posts').delete().eq('user_id', uid);
          await strideSupabase.from('profiles').delete().eq('id', uid);
        }
        await strideSupabase.auth.signOut();
      }
      document.getElementById('modal-delete-account').hidden = true;
      window._currentSession = null;
      window._currentProfile = null;
      localStorage.removeItem('stride-gcal-disconnected');
      showScreen('login');
    } catch (err) {
      console.error('Delete account error:', err);
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete my account';
    }
  });

  // Export persona button
  document.getElementById('btn-export-persona')?.addEventListener('click', async () => {
    const feedback = document.getElementById('export-persona-feedback');
    const profile = window._currentProfile;
    if (!profile) {
      if (feedback) feedback.textContent = 'No profile found — complete onboarding first.';
      return;
    }
    const prompt = buildPersonaPrompt(profile);
    try {
      await navigator.clipboard.writeText(prompt);
      if (feedback) { feedback.textContent = '✓ Copied! Paste it into Claude or ChatGPT.'; setTimeout(() => { feedback.textContent = ''; }, 3000); }
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      if (feedback) { feedback.textContent = '✓ Copied!'; setTimeout(() => { feedback.textContent = ''; }, 3000); }
    }
  })

  // "Try a demo version" — skip onboarding, go straight to home dashboard
  document.getElementById('btn-try-demo')?.addEventListener('click', () => {
    showScreen('home');
  });

  // "Replay animation" button on landing hero — call directly since the
  // stride-replay listener is removed when the intro animation finishes
  document.getElementById('btn-replay-anim')?.addEventListener('click', () => {
    playIntroAnimation();
  });

  if (isFirstVisit) {
    // Don't unconditionally show landing — route based on session state
    // (same as every other visit; if no session, checkSessionAndRoute shows landing)
    checkSessionAndRoute();
  } else {
    const fromOAuth = !!localStorage.getItem('stride-oauth-pending');
    if (fromOAuth) localStorage.removeItem('stride-oauth-pending');
    checkSessionAndRoute({ forceLogin: fromOAuth });
  }
});
