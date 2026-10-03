const { StorageService, BridgeEngine, IntentService, TutorService, OfflineContentService } = LanternServices;
const screen = document.getElementById("screen");
const appNav = document.getElementById("appNav");
const lanternSurface = document.getElementById("lanternSurface");
const webArea = document.getElementById("webArea");
const address = document.getElementById("address");
const progress = document.getElementById("progress");
const tabsEl = document.getElementById("tabs");
const aiPanel = document.getElementById("aiPanel");
const aiInput = document.getElementById("aiInput");
const aiState = document.getElementById("aiState");
const messages = document.getElementById("messages");
const modalLayer = document.getElementById("modalLayer");
const safetyPill = document.getElementById("safetyPill");

let state = StorageService.load();
let route = state.profile ? "home" : "onboarding";
let onboardingStep = 0;
let explorerIndex = 0;
let draft = { name: "", grade: "7", curriculum: "CBSE", interests: [], learningGoals: [], preferredFormats: [], familyGoals: [] };
let tabs = [];
let activeId = null;
let nextId = 1;
let activeRecommendation = null;

const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
const label = (items, id) => items.find(item => item.id === id)?.label || id;
const currentTab = () => tabs.find(tab => tab.id === activeId);
const save = () => StorageService.save(state);
const iconFor = id => LanternData.interests.find(item => item.id === id)?.icon || "✦";
const titleCase = value => value.replace(/(^|\s)\S/g, match => match.toUpperCase());

function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function navItems() {
  return [
    ["home", "⌂", "Home"], ["growth", "⌁", "Growth Map"], ["quiz", "?", "Quick Quiz"],
    ["offline", "⇩", "Offline"], ["parent", "◫", "Parent View"]
  ];
}

function renderNav() {
  appNav.style.display = state.profile ? "flex" : "none";
  appNav.innerHTML = state.profile ? `
    <div class="nav-logo"><span class="brand-mark">L</span></div>
    <div class="nav-links">${navItems().map(([id, icon, text]) => `
      <button class="nav-link ${route === id ? "active" : ""}" data-route="${id}" title="${text}"><span>${icon}</span><em>${text}</em></button>`).join("")}
    </div>
    <button class="nav-link nav-profile ${route === "profile" ? "active" : ""}" data-route="profile" title="Learning profile">
      <span>${esc(state.profile.name.charAt(0).toUpperCase())}</span><em>Profile</em>
    </button>` : "";
}

function go(nextRoute) {
  route = nextRoute;
  renderApp();
}

function renderApp() {
  renderNav();
  document.getElementById("profileMenu").textContent = state.profile?.name?.charAt(0).toUpperCase() || "?";
  const views = { home: renderHome, growth: renderGrowth, quiz: renderQuiz, offline: renderOffline, parent: renderParent, profile: renderProfile };
  if (!state.profile || route === "onboarding") renderOnboarding();
  else (views[route] || renderHome)();
}

function renderOnboarding() {
  appNav.style.display = "none";
  const steps = ["About you", "Interests", "Goals", "Learning style", "Explorer"];
  const progressIndex = Math.min(onboardingStep, 4);
  const top = `<div class="onboarding-top"><div class="onboarding-brand"><span class="brand-mark">L</span><b>Project Lantern</b></div><div class="step-dots">${steps.map((step, index) => `<span class="${index <= progressIndex ? "done" : ""}">${index + 1}<small>${step}</small></span>`).join("")}</div></div>`;

  if (onboardingStep === 0) {
    screen.innerHTML = `<div class="onboarding-page intro-page">${top}<div class="intro-orbit"><span>✦</span><i class="orbit-one"></i><i class="orbit-two"></i></div><span class="eyebrow">YOUR CURIOSITY, CONNECTED</span><h1>Turn what you love into<br><strong>something you can learn.</strong></h1><p>Lantern connects your interests to science, maths, coding and more—while you stay in control.</p><div class="intro-actions"><button class="primary-button large" data-onboard-next>Build my Lantern</button><button class="text-button" data-demo-profile>Try with a demo profile</button></div><small class="privacy-note">◉ Your learning profile stays on this device.</small></div>`;
    return;
  }

  if (onboardingStep === 1) {
    screen.innerHTML = `<div class="onboarding-page">${top}<div class="onboarding-card narrow"><span class="eyebrow">LET'S START SIMPLE</span><h1>What should Lantern call you?</h1><p>You can use your first name or a nickname.</p><form id="profileBasics" class="form-stack"><label>Your name<input id="childName" maxlength="24" required value="${esc(draft.name)}" placeholder="e.g. Arjun"></label><div class="form-row"><label>Class / grade<select id="childGrade">${[5,6,7,8,9,10].map(grade => `<option ${String(grade) === draft.grade ? "selected" : ""}>${grade}</option>`).join("")}</select></label><label>Curriculum<select id="childCurriculum">${["CBSE", "ICSE", "State Board", "Other"].map(item => `<option ${item === draft.curriculum ? "selected" : ""}>${item}</option>`).join("")}</select></label></div><button class="primary-button large">Continue</button></form></div></div>`;
    return;
  }

  if (onboardingStep === 2) {
    screen.innerHTML = `<div class="onboarding-page">${top}<div class="onboarding-card"><span class="eyebrow">PICK AT LEAST THREE</span><h1>What makes you curious?</h1><p>Choose anything you enjoy. You can change these later.</p><div class="choice-grid interests-grid">${LanternData.interests.map(item => `<button class="choice-card ${draft.interests.includes(item.id) ? "selected" : ""}" data-interest="${item.id}"><span>${item.icon}</span><b>${item.label}</b><i>✓</i></button>`).join("")}</div><div class="onboarding-footer"><small>${draft.interests.length} selected</small><button class="primary-button" data-onboard-next ${draft.interests.length < 3 ? "disabled" : ""}>Choose learning goals</button></div></div></div>`;
    return;
  }

  if (onboardingStep === 3) {
    screen.innerHTML = `<div class="onboarding-page">${top}<div class="onboarding-card"><span class="eyebrow">YOUR DIRECTION</span><h1>Where would you like to grow?</h1><p>These goals shape recommendations. They never limit what you can explore.</p><div class="goal-grid">${LanternData.goals.map(item => `<button class="goal-card ${draft.learningGoals.includes(item.id) ? "selected" : ""}" data-goal="${item.id}"><span>${item.id === "science" ? "⚗" : item.id === "mathematics" ? "∑" : item.id === "coding" ? "</>" : "↗"}</span><div><b>${item.label}</b><small>${goalDescription(item.id)}</small></div><i>✓</i></button>`).join("")}</div><div class="onboarding-footer"><button class="back-button" data-onboard-back>Back</button><button class="primary-button" data-onboard-next ${draft.learningGoals.length < 1 ? "disabled" : ""}>Continue</button></div></div></div>`;
    return;
  }

  if (onboardingStep === 4) {
    screen.innerHTML = `<div class="onboarding-page">${top}<div class="onboarding-card narrow"><span class="eyebrow">HOW YOU LIKE TO LEARN</span><h1>Pick your favourite formats.</h1><p>Lantern will mix things up, but show more of what works for you.</p><div class="format-list">${LanternData.formats.map(format => `<button class="format-choice ${draft.preferredFormats.includes(format) ? "selected" : ""}" data-format="${format}"><span>${formatIcon(format)}</span><b>${format}</b><i>✓</i></button>`).join("")}</div><div class="onboarding-footer"><button class="back-button" data-onboard-back>Back</button><button class="primary-button" data-onboard-next ${draft.preferredFormats.length < 1 ? "disabled" : ""}>Meet the Explorer</button></div></div></div>`;
    return;
  }

  if (onboardingStep === 5) {
    screen.innerHTML = `<div class="onboarding-page explorer-intro">${top}<div class="compass-mark">⌁</div><span class="eyebrow">THE LANTERN EXPLORER</span><h1>No grades. No labels.</h1><p>These short situations help Lantern understand how you like to investigate, reason and learn.</p><div class="ethics-note"><span>✓</span><div><b>You’re in control</b><small>This is not a personality test. We only save useful learning signals, and you can change your answers later.</small></div></div><button class="primary-button large" data-start-explorer>Start 8 questions</button></div>`;
    return;
  }

  renderExplorerQuestion(top);
}

function renderExplorerQuestion(top) {
  const item = LanternData.explorerQuestions[explorerIndex];
  screen.innerHTML = `<div class="onboarding-page">${top}<div class="question-shell"><div class="question-progress"><span>QUESTION ${explorerIndex + 1} OF ${LanternData.explorerQuestions.length}</span><div><i style="width:${((explorerIndex + 1) / LanternData.explorerQuestions.length) * 100}%"></i></div></div><span class="scenario-tag">WHAT WOULD YOU DO?</span><h1>${esc(item.question)}</h1><div class="answer-list">${item.answers.map((answer, index) => `<button data-answer="${index}"><span>${String.fromCharCode(65 + index)}</span>${esc(answer)}</button>`).join("")}</div><p class="question-footnote">There isn’t one perfect answer. Choose what feels most like you.</p></div></div>`;
}

function goalDescription(id) {
  return ({ science: "Explore how our world works", mathematics: "Build confidence with patterns", english: "Read, write and express ideas", coding: "Create with logic and code", reading: "Discover more through stories", nature: "Learn from the living world", "critical-thinking": "Question, compare and reason" })[id] || "Grow through curiosity";
}

function formatIcon(format) {
  return ({ "Short videos": "▶", Stories: "▤", Experiments: "⚗", "Visual guides": "◫", Quizzes: "?", Projects: "⌁" })[format] || "✦";
}

function completeOnboarding() {
  state.profile = { id: `child-${Date.now()}`, ...draft, createdAt: new Date().toISOString() };
  state.familyGoals = [...draft.learningGoals];
  state.learning.recentActivity.unshift({ type: "profile", title: "Created a learning profile", at: new Date().toISOString() });
  state.learning.learningMinutes = 12;
  save();
  route = "home";
  renderApp();
  showToast(`Welcome to Lantern, ${state.profile.name}!`);
}

function seedDemo() {
  draft = { name: "Arjun", grade: "7", curriculum: "CBSE", interests: ["cars", "space", "robotics", "gaming"], learningGoals: ["science", "mathematics", "coding"], preferredFormats: ["Visual guides", "Projects", "Quizzes"], familyGoals: ["science", "mathematics", "coding"] };
  onboardingStep = 5;
  renderOnboarding();
}

function renderHome() {
  const profile = state.profile;
  const recommendations = BridgeEngine.recommendations(profile, state.learning.dismissedRecommendations).slice(0, 5);
  const current = recommendations[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const challenge = LanternData.challenges[new Date().getDate() % LanternData.challenges.length];
  screen.innerHTML = `<div class="content-page home-page">
    <header class="content-header"><div><span class="eyebrow">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</span><h1>${greeting}, ${esc(profile.name)} <span>✦</span></h1><p>What are you curious about today?</p></div><button class="streak-pill"><span>◒</span><b>${Math.max(1, state.learning.recentActivity.length)} day</b> curiosity streak</button></header>
    <form class="intent-bar" id="intentForm"><span class="intent-spark">✦</span><input id="intentInput" placeholder="Ask anything, explore something, or paste a website..."><div class="intent-examples"><span>Try:</span><button type="button" data-fill-intent="Why doesn't the Moon fall?">Why questions</button><button type="button" data-fill-intent="Create a learning path about game coding">Learning path</button></div><button class="intent-submit">Ask Lantern <b>→</b></button></form>
    <div class="home-grid">
      <section class="section-block continue-block"><div class="section-heading"><div><span class="eyebrow">CONTINUE EXPLORING</span><h2>Your current path</h2></div><button data-route="growth">View map →</button></div>
        <div class="path-card"><div class="path-art art-${current?.colorIndex || 0}"><span>${iconFor(current?.linkedInterest || "cars")}</span><i></i><i></i></div><div class="path-info"><div class="path-meta"><span>${label(LanternData.interests, current?.linkedInterest || "cars")}</span><small>3 OF 5 STEPS</small></div><h3>${esc(current?.title || "How race cars stick to the road")}</h3><p>${esc(current?.summary || "Explore the science hiding inside something you love.")}</p><div class="path-line"><i style="width:58%"></i></div><button class="primary-button compact" data-explore="${current?.id || "cars-science-0"}">Continue learning</button></div></div>
      </section>
      <section class="section-block challenge-block"><div class="challenge-top"><span class="challenge-icon">?</span><div><span class="eyebrow">TODAY'S CHALLENGE</span><small>2 min · ${esc(challenge.topic)}</small></div></div><h3>${esc(challenge.text)}</h3><button class="secondary-button" data-challenge="${esc(challenge.hint)}">Reveal a hint</button></section>
    </div>
    <section class="section-block discover"><div class="section-heading"><div><span class="eyebrow">DISCOVER SOMETHING</span><h2>Picked for your curiosity</h2></div><button data-refresh-recs>Something different ↻</button></div><div class="recommendation-row">${recommendations.slice(0, 4).map(renderRecommendationCard).join("")}</div></section>
    <section class="section-block map-preview"><div class="section-heading"><div><span class="eyebrow">YOUR GROWTH MAP</span><h2>See how ideas connect</h2></div><button data-route="growth">Open full map →</button></div>${renderMiniMap()}</section>
  </div>`;
}

function renderRecommendationCard(item) {
  return `<article class="recommendation-card color-${item.colorIndex}"><div class="recommendation-art"><span>${iconFor(item.linkedInterest)}</span><small>${esc(item.contentType)}</small></div><div class="recommendation-body"><span class="topic-label">${esc(item.topic)}</span><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p><div class="recommendation-meta"><span>${esc(item.difficulty)}</span><button data-why="${item.id}">Why this?</button></div><div class="card-actions"><button class="primary-button compact" data-explore="${item.id}">Explore</button><button class="dismiss-button" data-dismiss="${item.id}" title="Not interested">×</button></div></div></article>`;
}

function renderMiniMap() {
  const graphs = BridgeEngine.graph(state.profile).slice(0, 3);
  return `<div class="mini-map"><div class="map-root">${esc(state.profile.name)}<small>My curiosity</small></div>${graphs.map((graph, index) => `<div class="map-branch branch-${index}"><i></i><div class="interest-node"><span>${iconFor(graph.interest)}</span>${esc(graph.label)}</div><b>→</b><div class="concept-node ${graph.concepts[0].status}">${esc(graph.concepts[0].name)}</div><b>→</b><div class="concept-node ${graph.concepts[1].status}">${esc(graph.concepts[1].name)}</div></div>`).join("")}</div>`;
}

function renderGrowth() {
  const graphs = BridgeEngine.graph(state.profile);
  const learned = Object.values(state.learning.conceptProgress).filter(value => value === "learned").length;
  screen.innerHTML = `<div class="content-page growth-page"><header class="content-header"><div><span class="eyebrow">GROWTH MAP</span><h1>Your curiosity has roots.</h1><p>Follow the connections from things you love to ideas you’re learning.</p></div><div class="map-stats"><div><b>${graphs.reduce((sum, graph) => sum + graph.concepts.length, 0)}</b><small>concepts discovered</small></div><div><b>${learned + 3}</b><small>learned</small></div></div></header><div class="legend">${["learned", "exploring", "discovered", "recommended", "revisit"].map(status => `<span><i class="${status}"></i>${titleCase(status)}</span>`).join("")}</div><div class="growth-canvas">${graphs.map((graph, index) => `<section class="growth-row"><div class="growth-interest interest-${index % 4}"><span>${iconFor(graph.interest)}</span><b>${esc(graph.label)}</b><small>Interest</small></div><div class="growth-track">${graph.concepts.map((concept, conceptIndex) => `<button class="growth-node ${concept.status}" data-concept="${esc(concept.name)}" style="--delay:${conceptIndex}"><i>${conceptIndex + 1}</i><b>${esc(concept.name)}</b><small>${titleCase(concept.status)}</small></button>`).join("<span class='connector'>→</span>")}</div></section>`).join("")}</div><div class="map-note"><span>✦</span><p><b>Your map grows with you.</b><br>Explore a recommendation, answer a quiz or ask Lantern a question to add progress—never hidden labels.</p></div></div>`;
}

function renderQuiz() {
  screen.innerHTML = `<div class="content-page quiz-page"><header class="content-header"><div><span class="eyebrow">QUICK QUIZ</span><h1>Check what stuck.</h1><p>No grades—just a quick way to strengthen your memory.</p></div><div class="quiz-score"><b>${state.learning.quizResults.filter(result => result.correct).length}</b><span>answers strengthened</span></div></header><div class="quiz-shell" id="quizShell">${renderQuizQuestion(0)}</div></div>`;
}

function renderQuizQuestion(index) {
  const item = LanternData.quiz[index];
  if (!item) return `<div class="quiz-complete"><span>✦</span><h2>Nice exploring!</h2><p>Your Growth Map has been updated with what you practised.</p><button class="primary-button" data-route="growth">See my Growth Map</button></div>`;
  return `<div class="quiz-progress"><span>${index + 1} / ${LanternData.quiz.length}</span><div><i style="width:${(index / LanternData.quiz.length) * 100}%"></i></div></div><span class="scenario-tag">${esc(item.concept)}</span><h2>${esc(item.question)}</h2><div class="quiz-options">${item.answers.map((answer, answerIndex) => `<button data-quiz-answer="${answerIndex}" data-quiz-index="${index}"><span>${String.fromCharCode(65 + answerIndex)}</span>${esc(answer)}</button>`).join("")}</div><p class="quiz-feedback" id="quizFeedback"></p>`;
}

function renderOffline() {
  screen.innerHTML = `<div class="content-page offline-page"><header class="content-header"><div><span class="eyebrow">OFFLINE LEARNING</span><h1>Curiosity that travels.</h1><p>Download trusted learning packs for journeys, patchy internet or focused time.</p></div><div class="offline-badge"><span>⇩</span><div><b>Works without internet</b><small>Mock content packs for this prototype</small></div></div></header><div class="channel-grid">${LanternData.offlineChannels.map(channel => { const status = OfflineContentService.status(state, channel.id); return `<article class="channel-card" style="--accent:${channel.accent}"><div class="channel-icon">${channel.icon}</div><div class="channel-main"><span class="eyebrow">LEARNING CHANNEL</span><h2>${channel.title}</h2><p>${channel.description}</p><small>${channel.counts}</small></div><div class="channel-action"><small>${channel.size}</small><button class="${status}" data-download="${channel.id}" ${status === "downloading" ? "disabled" : ""}>${status === "downloaded" ? "✓ Downloaded" : status === "downloading" ? "Downloading…" : "⇩ Download"}</button></div></article>`; }).join("")}</div><div class="offline-note"><span>i</span><p>Downloaded packs are designed as curated learning material. In a production release, updates would be signed and verified before installation.</p></div></div>`;
}

function renderParent() {
  const explored = new Set([...state.learning.exploredTopics, ...BridgeEngine.graph(state.profile).flatMap(graph => graph.concepts.slice(0, 2).map(item => item.name))]);
  const interestRows = state.profile.interests.slice(0, 4).map((id, index) => ({ id, minutes: Math.max(12, 48 - index * 9), percent: 92 - index * 14 }));
  screen.innerHTML = `<div class="content-page parent-page"><header class="parent-header"><div><span class="eyebrow">PARENT VIEW · THIS WEEK</span><h1>${esc(state.profile.name)}’s learning, at a glance.</h1><p>Learning signals—not private conversations or a raw browsing history.</p></div><button class="secondary-button" data-route="profile">Manage family goals</button></header><div class="parent-summary">${[[Math.max(14, explored.size), "Concepts explored", "+4 this week"], [state.learning.questionsAsked + 8, "Questions asked", "Private by default"], [state.learning.quizResults.length + 3, "Quizzes attempted", "Practice, not grades"], [state.learning.learningMinutes + 74, "Learning minutes", "Across Lantern"]].map(([value, title, note]) => `<div><b>${value}</b><span>${title}</span><small>${note}</small></div>`).join("")}</div><div class="parent-grid"><section class="parent-panel"><div class="section-heading"><div><span class="eyebrow">CURIOSITY IN MOTION</span><h2>Interests explored</h2></div></div><div class="interest-bars">${interestRows.map(item => `<div><span class="bar-icon">${iconFor(item.id)}</span><div><b>${label(LanternData.interests, item.id)}</b><i><em style="width:${item.percent}%"></em></i></div><strong>${item.minutes}m</strong></div>`).join("")}</div><div class="new-curiosity"><span>✦</span><div><small>NEW CURIOSITY</small><b>${state.learning.exploredTopics.at(-1) || "Ocean ecosystems"}</b></div></div></section><section class="parent-panel"><div class="section-heading"><div><span class="eyebrow">LEARNING SIGNALS</span><h2>What’s developing</h2></div></div><div class="signal-list"><div><span class="signal-icon strong">✓</span><p><b>Making connections</b><small>Links interests to ${state.profile.learningGoals.map(id => label(LanternData.goals, id)).slice(0, 2).join(" and ")}.</small></p></div><div><span class="signal-icon">⌁</span><p><b>Source evaluation</b><small>Practised comparing publishers and looking for evidence.</small></p></div><div><span class="signal-icon revisit">↻</span><p><b>Ready to revisit</b><small>${state.learning.quizResults.some(item => !item.correct) ? "One quiz concept could use another look." : "Air pressure would benefit from a quick recall."}</small></p></div></div></section></div><section class="parent-panel goals-panel"><div><span class="eyebrow">FAMILY LEARNING GOALS</span><h2>Guidance that stays visible</h2><p>These directions influence recommendations, and Lantern always explains when they do.</p></div><div class="family-goal-pills">${state.familyGoals.map(id => `<span>${label(LanternData.goals, id)}</span>`).join("")}</div><button class="secondary-button" data-route="profile">Edit goals</button></section><div class="privacy-banner"><span>◉</span><div><b>Designed for guidance, not surveillance</b><p>Lantern does not show raw browsing history or private tutor conversations here. Educational summaries use explicit learning activity only.</p></div></div></div>`;
}

function renderProfile() {
  screen.innerHTML = `<div class="content-page profile-page"><header class="content-header"><div><span class="eyebrow">LEARNING PROFILE</span><h1>${esc(state.profile.name)}’s Lantern</h1><p>Change what shapes recommendations at any time.</p></div></header><div class="profile-layout"><section class="profile-panel"><h2>Profile</h2><div class="profile-summary"><span>${esc(state.profile.name.charAt(0).toUpperCase())}</span><div><b>${esc(state.profile.name)}</b><small>Class ${state.profile.grade} · ${esc(state.profile.curriculum)}</small></div></div><button class="danger-link" data-reset-profile>Start onboarding again</button></section><section class="profile-panel wide"><h2>Interests</h2><p>What ${esc(state.profile.name)} wants to explore.</p><div class="editable-pills">${LanternData.interests.map(item => `<button class="${state.profile.interests.includes(item.id) ? "selected" : ""}" data-profile-interest="${item.id}">${item.icon} ${item.label}</button>`).join("")}</div><h2>Family learning goals</h2><p>Selected goals are always visible in recommendation explanations.</p><div class="editable-pills goals">${LanternData.goals.map(item => `<button class="${state.familyGoals.includes(item.id) ? "selected" : ""}" data-family-goal="${item.id}">${item.label}</button>`).join("")}</div></section></div></div>`;
}

function openWhy(id) {
  const item = BridgeEngine.recommendations(state.profile).find(recommendation => recommendation.id === id);
  if (!item) return;
  modalLayer.innerHTML = `<div class="modal-card"><button class="modal-close" data-close-modal>×</button><span class="reason-icon">✦</span><span class="eyebrow">WHY YOU’RE SEEING THIS</span><h2>${esc(item.title)}</h2><div class="reason-flow"><span>${iconFor(item.linkedInterest)} ${label(LanternData.interests, item.linkedInterest)}</span><b>+</b><span>↗ ${label(LanternData.goals, item.linkedGoal)}</span><b>→</b><span>⚗ ${esc(item.topic)}</span></div><p>${esc(item.reason)}</p>${item.parentInfluenced ? `<div class="parent-reason">Family goal: ${label(LanternData.goals, item.linkedGoal)}</div>` : ""}<div class="modal-actions"><button class="primary-button" data-explore="${item.id}">Explore this</button><button class="secondary-button" data-dismiss="${item.id}">Not interested</button></div><small>You can change interests and learning goals from your profile.</small></div>`;
  modalLayer.classList.add("open");
}

function exploreRecommendation(id) {
  const item = BridgeEngine.recommendations(state.profile).find(recommendation => recommendation.id === id);
  if (!item) return;
  activeRecommendation = item;
  if (!state.learning.exploredTopics.includes(item.topic)) state.learning.exploredTopics.push(item.topic);
  state.learning.conceptProgress[item.topic] = "exploring";
  state.learning.learningMinutes += 6;
  state.learning.recentActivity.unshift({ type: "lesson", title: item.title, topic: item.topic, at: new Date().toISOString() });
  save();
  modalLayer.innerHTML = `<div class="modal-card lesson-modal"><button class="modal-close" data-close-modal>×</button><div class="lesson-hero color-${item.colorIndex}"><span>${iconFor(item.linkedInterest)}</span><small>${esc(item.topic)} · ${esc(item.difficulty)}</small><h2>${esc(item.title)}</h2></div><div class="lesson-body"><span class="eyebrow">THE BIG IDEA</span><p>${esc(item.summary)} Let’s connect it to something you already know.</p><div class="lesson-example"><span>TRY THIS</span><p>${lessonPrompt(item.topic)}</p></div><div class="lesson-actions"><button class="primary-button" data-lesson-complete>Got it — update my map</button><button class="secondary-button" data-ask-topic="${esc(item.title)}">Ask Lantern</button></div></div></div>`;
  modalLayer.classList.add("open");
}

function lessonPrompt(topic) {
  if (/aerodynamic|pressure/i.test(topic)) return "Hold a strip of paper under your lower lip and blow across the top. Which way does it move—and why?";
  if (/orbit|gravity/i.test(topic)) return "Swing a small object safely on a string. Which motion is like gravity, and which is like sideways speed?";
  if (/logic|loop|coding/i.test(topic)) return "Write three repeatable rules for a character moving through a maze.";
  return "Sketch the idea with three labels, then explain it in one sentence without looking back.";
}

function closeModal() { modalLayer.classList.remove("open"); modalLayer.innerHTML = ""; }

function toggleAI(force) {
  const open = force ?? !aiPanel.classList.contains("open");
  aiPanel.classList.toggle("open", open);
  if (open) aiInput.focus();
}

function addMessage(who, html, rich = false) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${who === "Lantern" ? "lantern" : "user"}`;
  bubble.innerHTML = `<b>${who}</b><div>${rich ? html : `<p>${esc(html)}</p>`}</div>`;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

async function askLantern(text) {
  const input = text.trim();
  if (!input) return;
  addMessage("You", input);
  aiInput.value = "";
  state.learning.questionsAsked += 1;
  state.learning.recentActivity.unshift({ type: "question", title: "Asked a learning question", at: new Date().toISOString() });
  save();
  const intent = IntentService.classify(input);
  aiState.textContent = `${titleCase(intent.toLowerCase())} · Thinking…`;
  if (intent === "QUIZ") {
    window.setTimeout(() => { addMessage("Lantern", `<p>Let’s practise instead of just rereading.</p><button class="inline-action" data-route="quiz">Start a 3-question quiz →</button>`, true); aiState.textContent = "Learning guide"; }, 350);
    return;
  }
  const endpoint = localStorage.getItem("lanternEndpoint");
  if (endpoint) {
    const system = `You are Lantern, a teaching-oriented tutor for a class ${state.profile?.grade || 7} child. Ask what they think, then give a hint, a simple explanation, an example and an optional challenge. Never infer personality or sensitive traits. Keep it concise.`;
    try {
      const answer = await window.nova.askAI({ endpoint, apiKey: localStorage.getItem("lanternKey"), model: localStorage.getItem("lanternModel"), messages: [{ role: "system", content: system }, { role: "user", content: input }] });
      addMessage("Lantern", answer);
      aiState.textContent = "Learning guide";
      return;
    } catch { /* Use the local teaching fallback below. */ }
  }
  const reply = TutorService.localReply(input, state.profile);
  window.setTimeout(() => {
    addMessage("Lantern", `<p>${esc(reply.lead)}</p><div class="tutor-step"><span>HINT</span>${esc(reply.hint)}</div><div class="tutor-step"><span>EXPLANATION</span>${esc(reply.explanation)}</div><div class="tutor-step"><span>EXAMPLE</span>${esc(reply.example)}</div><div class="tutor-challenge"><span>TRY THIS</span>${esc(reply.challenge)}</div>`, true);
    aiState.textContent = "Learning guide";
  }, 450);
}

function isUrl(value) { return /^(https?:\/\/|file:\/\/|about:|localhost:)/i.test(value) || /^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(value); }
function normalize(value) {
  const input = value.trim();
  if (!input) return "lantern://home";
  return isUrl(input) ? (/^https?:\/\//i.test(input) ? input : `https://${input}`) : `https://www.google.com/search?q=${encodeURIComponent(input)}`;
}

function renderTabs() {
  tabsEl.innerHTML = "";
  tabs.forEach(tab => {
    const element = document.createElement("div");
    element.className = `tab ${tab.id === activeId ? "active" : ""}`;
    element.innerHTML = `<span class="tab-dot">${tab.view ? "○" : "✦"}</span><span>${esc(tab.title)}</span><button>×</button>`;
    element.onclick = event => event.target.tagName === "BUTTON" ? closeTab(tab.id) : switchTab(tab.id);
    tabsEl.appendChild(element);
  });
}

function createTab() {
  const tab = { id: nextId++, url: "lantern://home", title: "Lantern", view: null };
  tabs.push(tab);
  switchTab(tab.id);
}

function switchTab(id) {
  activeId = id;
  const tab = currentTab();
  if (!tab) return;
  tabs.forEach(item => { if (item.view) item.view.style.display = item.id === id ? "flex" : "none"; });
  lanternSurface.style.display = tab.view ? "none" : "flex";
  webArea.style.display = tab.view ? "block" : "none";
  address.value = tab.view ? tab.url : "";
  safetyPill.textContent = tab.view ? "Check site signals" : "Lantern home";
  safetyPill.classList.toggle("web", Boolean(tab.view));
  renderTabs();
  if (!tab.view) renderApp();
}

function closeTab(id) {
  const index = tabs.findIndex(tab => tab.id === id);
  if (index < 0) return;
  tabs[index].view?.remove();
  const wasActive = id === activeId;
  tabs.splice(index, 1);
  if (!tabs.length) createTab();
  else if (wasActive) switchTab(tabs[Math.max(0, index - 1)].id);
  else renderTabs();
}

function navigate(tab, raw) {
  if (!tab) return;
  const url = normalize(raw);
  tab.url = url;
  tab.title = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Web"; } })();
  if (!tab.view) {
    tab.view = document.createElement("webview");
    tab.view.setAttribute("allowpopups", "");
    tab.view.setAttribute("partition", "persist:lantern");
    tab.view.src = url;
    tab.view.addEventListener("did-start-loading", () => { progress.style.width = "45%"; });
    tab.view.addEventListener("did-stop-loading", () => { progress.style.width = "100%"; window.setTimeout(() => { progress.style.width = "0"; }, 220); syncTab(tab); });
    tab.view.addEventListener("did-navigate", () => syncTab(tab));
    tab.view.addEventListener("did-navigate-in-page", () => syncTab(tab));
    tab.view.addEventListener("page-title-updated", event => { tab.title = event.title || tab.title; renderTabs(); });
    webArea.appendChild(tab.view);
  } else tab.view.loadURL(url);
  switchTab(tab.id);
}

function syncTab(tab) {
  try {
    tab.url = tab.view.getURL();
    tab.title = tab.view.getTitle() || tab.title;
    if (tab.id === activeId) address.value = tab.url;
    renderTabs();
  } catch { /* Webview may be changing process. */ }
}

screen.addEventListener("click", event => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.route) return go(target.dataset.route);
  if ("onboardNext" in target.dataset) { onboardingStep += 1; return renderOnboarding(); }
  if ("onboardBack" in target.dataset) { onboardingStep = Math.max(1, onboardingStep - 1); return renderOnboarding(); }
  if ("demoProfile" in target.dataset) return seedDemo();
  if (target.dataset.interest) { toggleArray(draft.interests, target.dataset.interest); return renderOnboarding(); }
  if (target.dataset.goal) { toggleArray(draft.learningGoals, target.dataset.goal); draft.familyGoals = [...draft.learningGoals]; return renderOnboarding(); }
  if (target.dataset.format) { toggleArray(draft.preferredFormats, target.dataset.format); return renderOnboarding(); }
  if ("startExplorer" in target.dataset) { onboardingStep = 6; explorerIndex = 0; return renderOnboarding(); }
  if (target.dataset.answer !== undefined) return openConfidence(Number(target.dataset.answer));
  if (target.dataset.fillIntent) { document.getElementById("intentInput").value = target.dataset.fillIntent; document.getElementById("intentInput").focus(); return; }
  if (target.dataset.why) return openWhy(target.dataset.why);
  if (target.dataset.explore) return exploreRecommendation(target.dataset.explore);
  if (target.dataset.dismiss) return dismissRecommendation(target.dataset.dismiss);
  if (target.dataset.challenge) return showToast(`Hint: ${target.dataset.challenge}`);
  if ("refreshRecs" in target.dataset) { state.learning.dismissedRecommendations.push(BridgeEngine.recommendations(state.profile, state.learning.dismissedRecommendations)[0]?.id); save(); return renderHome(); }
  if (target.dataset.concept) return showToast(`${target.dataset.concept}: ${titleCase(target.querySelector("small").textContent)}`);
  if (target.dataset.quizAnswer !== undefined) return answerQuiz(Number(target.dataset.quizIndex), Number(target.dataset.quizAnswer), target);
  if (target.dataset.download) return downloadChannel(target.dataset.download);
  if (target.dataset.profileInterest) { toggleArray(state.profile.interests, target.dataset.profileInterest); save(); return renderProfile(); }
  if (target.dataset.familyGoal) { toggleArray(state.familyGoals, target.dataset.familyGoal); state.profile.familyGoals = [...state.familyGoals]; if (!state.profile.learningGoals.includes(target.dataset.familyGoal)) state.profile.learningGoals.push(target.dataset.familyGoal); save(); return renderProfile(); }
  if ("resetProfile" in target.dataset) return resetProfile();
});

screen.addEventListener("submit", event => {
  event.preventDefault();
  if (event.target.id === "profileBasics") {
    draft.name = document.getElementById("childName").value.trim();
    draft.grade = document.getElementById("childGrade").value;
    draft.curriculum = document.getElementById("childCurriculum").value;
    if (draft.name) { onboardingStep = 2; renderOnboarding(); }
  }
  if (event.target.id === "intentForm") handleIntent(document.getElementById("intentInput").value);
});

function toggleArray(array, value) {
  const index = array.indexOf(value);
  if (index >= 0) array.splice(index, 1); else array.push(value);
}

function openConfidence(answerIndex) {
  const question = LanternData.explorerQuestions[explorerIndex];
  modalLayer.innerHTML = `<div class="modal-card confidence-card"><span class="eyebrow">ONE QUICK FOLLOW-UP</span><h2>How confident are you?</h2><p>This helps Lantern separate a strong answer from a guess. It never changes a grade.</p><div class="confidence-scale">${[20, 40, 60, 80, 100].map(value => `<button data-confidence="${value}" data-selected-answer="${answerIndex}"><span>${value}%</span><i style="height:${value * .55}px"></i></button>`).join("")}</div><button class="text-button" data-confidence="0" data-selected-answer="${answerIndex}">Not sure yet</button></div>`;
  modalLayer.classList.add("open");
}

modalLayer.addEventListener("click", event => {
  if (event.target === modalLayer || event.target.closest("[data-close-modal]")) return closeModal();
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.confidence !== undefined) {
    const question = LanternData.explorerQuestions[explorerIndex];
    state.explorerAnswers.push({ questionId: question.id, signal: question.signal, answerIndex: Number(target.dataset.selectedAnswer), confidence: Number(target.dataset.confidence) });
    state.learning.confidenceHistory.push(Number(target.dataset.confidence));
    closeModal();
    explorerIndex += 1;
    if (explorerIndex >= LanternData.explorerQuestions.length) completeOnboarding(); else renderOnboarding();
  }
  if (target.dataset.explore) { closeModal(); exploreRecommendation(target.dataset.explore); }
  if (target.dataset.dismiss) { closeModal(); dismissRecommendation(target.dataset.dismiss); }
  if ("lessonComplete" in target.dataset) {
    if (activeRecommendation) state.learning.conceptProgress[activeRecommendation.topic] = "learned";
    save(); closeModal(); showToast("Growth Map updated");
  }
  if (target.dataset.askTopic) { closeModal(); toggleAI(true); askLantern(`Help me understand: ${target.dataset.askTopic}`); }
});

function dismissRecommendation(id) {
  if (!state.learning.dismissedRecommendations.includes(id)) state.learning.dismissedRecommendations.push(id);
  save();
  closeModal();
  if (route === "home") renderHome();
  showToast("Got it — we’ll show something different");
}

function answerQuiz(index, answerIndex, button) {
  const item = LanternData.quiz[index];
  const correct = answerIndex === item.correct;
  button.parentElement.querySelectorAll("button").forEach(option => option.disabled = true);
  button.classList.add(correct ? "correct" : "incorrect");
  button.parentElement.children[item.correct].classList.add("correct");
  document.getElementById("quizFeedback").innerHTML = correct ? "<b>That’s it.</b> You connected the idea correctly." : "<b>Good try.</b> Notice the highlighted answer, then explain it in your own words.";
  state.learning.quizResults.push({ concept: item.concept, correct, at: new Date().toISOString() });
  state.learning.conceptProgress[item.concept] = correct ? "learned" : "revisit";
  save();
  window.setTimeout(() => { document.getElementById("quizShell").innerHTML = renderQuizQuestion(index + 1); }, 1300);
}

function downloadChannel(id) {
  OfflineContentService.start(state, id, status => {
    save();
    renderOffline();
    if (status === "downloaded") showToast("Learning pack ready offline");
  });
  renderOffline();
}

function resetProfile() {
  StorageService.reset();
  state = LanternServices.blankState();
  draft = { name: "", grade: "7", curriculum: "CBSE", interests: [], learningGoals: [], preferredFormats: [], familyGoals: [] };
  onboardingStep = 0;
  route = "onboarding";
  renderApp();
}

function handleIntent(input) {
  const intent = IntentService.classify(input);
  if (intent === "NAVIGATE") return navigate(currentTab(), input);
  if (intent === "SEARCH") return navigate(currentTab(), input.replace(/^search( for)?\s*/i, ""));
  if (intent === "QUIZ") return go("quiz");
  toggleAI(true);
  askLantern(input);
}

document.addEventListener("click", event => {
  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget && !screen.contains(routeTarget)) go(routeTarget.dataset.route);
});

document.getElementById("newTab").onclick = createTab;
document.getElementById("back").onclick = () => { const tab = currentTab(); if (tab?.view?.canGoBack()) tab.view.goBack(); };
document.getElementById("forward").onclick = () => { const tab = currentTab(); if (tab?.view?.canGoForward()) tab.view.goForward(); };
document.getElementById("reload").onclick = () => currentTab()?.view?.reload();
document.getElementById("home").onclick = document.getElementById("brandHome").onclick = () => {
  const tab = currentTab();
  if (tab?.view) { tab.view.remove(); tab.view = null; tab.url = "lantern://home"; tab.title = "Lantern"; }
  route = state.profile ? "home" : "onboarding";
  switchTab(tab.id);
};
document.getElementById("profileMenu").onclick = () => state.profile && go("profile");
document.getElementById("aiToggle").onclick = () => toggleAI();
document.getElementById("closeAI").onclick = () => toggleAI(false);
document.getElementById("aiForm").onsubmit = event => { event.preventDefault(); askLantern(aiInput.value); };
document.querySelectorAll("[data-ai]").forEach(button => button.onclick = () => askLantern(button.dataset.ai));
document.getElementById("addressForm").onsubmit = event => { event.preventDefault(); handleIntent(address.value); };
document.getElementById("settingsBtn").onclick = () => {
  document.getElementById("endpoint").value = localStorage.getItem("lanternEndpoint") || "";
  document.getElementById("model").value = localStorage.getItem("lanternModel") || "";
  document.getElementById("apiKey").value = localStorage.getItem("lanternKey") || "";
  document.getElementById("settings").classList.add("open");
};
document.getElementById("settingsClose").onclick = () => document.getElementById("settings").classList.remove("open");
document.getElementById("saveSettings").onclick = () => {
  localStorage.setItem("lanternEndpoint", document.getElementById("endpoint").value.trim());
  localStorage.setItem("lanternModel", document.getElementById("model").value.trim());
  localStorage.setItem("lanternKey", document.getElementById("apiKey").value);
  document.getElementById("settings").classList.remove("open");
  showToast("AI settings saved on this device");
};

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") { event.preventDefault(); address.focus(); address.select(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "t") { event.preventDefault(); createTab(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "w") { event.preventDefault(); closeTab(activeId); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "j") { event.preventDefault(); toggleAI(); }
});

createTab();
