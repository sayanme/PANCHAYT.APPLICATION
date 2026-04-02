const STORAGE_SETTINGS_KEY = "panchayt_settings_v1";
const STORAGE_NOTICES_KEY = "panchayt_notices_v1";

const DEFAULT_SETTINGS = {
  gateCloseTime: "22:00",
  gymCloseTime: "21:00",
  speakerAllowedFrom: "10:00",
  limits: {
    bachelors: { maxHours: 2, curfewEnd: "23:00" },
    families: { maxHours: 4, curfewEnd: "00:00" },
  },
  rulesText: {
    bachelors: [
      "Speakers allowed only within planned time window.",
      "Maintain volume so neighbours are not disturbed.",
      "Use common spaces only after following security instructions.",
      "No loud activities after curfew time.",
    ].join("\n"),
    families: [
      "Family gatherings allowed as per curfew and duration limits.",
      "Respect quiet hours and avoid high volume.",
      "Keep community areas clean and return items on time.",
      "Follow security/management instructions during events.",
    ].join("\n"),
  },
};

function pickTodayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function setTab(tabName) {
  for (const tab of document.querySelectorAll(".tab")) {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("tab-active", isActive);
  }
  for (const panel of document.querySelectorAll(".tab-panel")) {
    const panelId = panel.id.replace("tab-", "");
    panel.hidden = panelId !== tabName;
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_SETTINGS),
      ...parsed,
      limits: {
        ...structuredClone(DEFAULT_SETTINGS.limits),
        ...(parsed.limits ?? {}),
      },
      rulesText: {
        ...structuredClone(DEFAULT_SETTINGS.rulesText),
        ...(parsed.rulesText ?? {}),
      },
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
}

function loadNotices() {
  try {
    const raw = localStorage.getItem(STORAGE_NOTICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveNotices(notices) {
  localStorage.setItem(STORAGE_NOTICES_KEY, JSON.stringify(notices));
}

function parseDateAndTime(dateISO, timeHHMM) {
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  const [hh, mm] = timeHHMM.split(":").map((x) => Number(x));
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function compareTimeHHMM(a, b) {
  // returns true if a <= b (as time-of-day)
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return ah * 60 + am <= bh * 60 + bm;
}

function addMinutes(dt, minutes) {
  return new Date(dt.getTime() + minutes * 60 * 1000);
}

function formatHM(dt) {
  try {
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatClockCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function applySettingsToUI(settings) {
  document.getElementById("gateCloseTime").value = settings.gateCloseTime;
  document.getElementById("gymCloseTime").value = settings.gymCloseTime;
  document.getElementById("speakerAllowedFrom").value = settings.speakerAllowedFrom;

  document.getElementById("bMaxHours").value = settings.limits.bachelors.maxHours;
  document.getElementById("bCurfewEnd").value = settings.limits.bachelors.curfewEnd;
  document.getElementById("fMaxHours").value = settings.limits.families.maxHours;
  document.getElementById("fCurfewEnd").value = settings.limits.families.curfewEnd;

  document.getElementById("bachelorsRulesInput").value = settings.rulesText.bachelors;
  document.getElementById("familiesRulesInput").value = settings.rulesText.families;

  document.getElementById("bachelorsRules").textContent = settings.rulesText.bachelors;
  document.getElementById("familiesRules").textContent = settings.rulesText.families;
}

function computeStatus(settings) {
  const now = new Date();
  const todayISO = pickTodayISODate();

  const gateClose = parseDateAndTime(todayISO, settings.gateCloseTime);
  const gymClose = parseDateAndTime(todayISO, settings.gymCloseTime);

  const gatePill = document.getElementById("gatePill");
  const gymPill = document.getElementById("gymPill");
  const gateValue = document.getElementById("gateValue");
  const gymValue = document.getElementById("gymValue");
  const gateHint = document.getElementById("gateHint");
  const gymHint = document.getElementById("gymHint");

  // Gate
  if (now.getTime() <= gateClose.getTime()) {
    const msLeft = gateClose.getTime() - now.getTime();
    gatePill.textContent = "OPEN";
    gatePill.className = "pill pill-blue";
    gateValue.textContent = `Closes at ${settings.gateCloseTime} (${formatClockCountdown(msLeft)} left)`;
    gateHint.textContent = "Countdown updates every second.";
  } else {
    gatePill.textContent = "CLOSED";
    gatePill.className = "pill";
    const closedSince = now.getTime() - gateClose.getTime();
    gateValue.textContent = `Closed since ${formatHM(gateClose)} (${formatClockCountdown(closedSince)} ago)`;
    gateHint.textContent = "Opens tomorrow based on your settings.";
  }

  // Gym
  if (now.getTime() <= gymClose.getTime()) {
    const msLeft = gymClose.getTime() - now.getTime();
    gymPill.textContent = "OPEN";
    gymPill.className = "pill pill-purple";
    gymValue.textContent = `Closes at ${settings.gymCloseTime} (${formatClockCountdown(msLeft)} left)`;
    gymHint.textContent = "Countdown updates every second.";
  } else {
    gymPill.textContent = "CLOSED";
    gymPill.className = "pill pill-purple";
    const closedSince = now.getTime() - gymClose.getTime();
    gymValue.textContent = `Closed since ${formatHM(gymClose)} (${formatClockCountdown(closedSince)} ago)`;
    gymHint.textContent = "Opens tomorrow based on your settings.";
  }
}

function computePartyVerdict(settings, role, partyDateISO, startTimeHHMM, durationMin) {
  const maxHours = settings.limits[role].maxHours;
  const curfewEndTime = settings.limits[role].curfewEnd;
  const allowedFrom = settings.speakerAllowedFrom;

  const partyStart = parseDateAndTime(partyDateISO, startTimeHHMM);
  const proposedEnd = addMinutes(partyStart, durationMin);

  // Curfew end can be next-day if curfew time is "earlier" than start time.
  let curfewEnd = parseDateAndTime(partyDateISO, curfewEndTime);
  if (!compareTimeHHMM(startTimeHHMM, curfewEndTime)) {
    // if startTime > curfewEndTime, assume curfew ends next day
    curfewEnd = addMinutes(curfewEnd, 24 * 60);
  }

  const allowedFromDateTime = parseDateAndTime(partyDateISO, allowedFrom);
  const maxDurationMs = maxHours * 60 * 60 * 1000;

  const issues = [];
  if (partyStart.getTime() < allowedFromDateTime.getTime()) {
    issues.push(`Speakers allowed from ${allowedFrom} (you started at ${startTimeHHMM}).`);
  }

  if (proposedEnd.getTime() - partyStart.getTime() > maxDurationMs + 1) {
    issues.push(`Max duration for ${role === "bachelors" ? "bachelors" : "families"} is ${maxHours} hours.`);
  }

  if (proposedEnd.getTime() > curfewEnd.getTime()) {
    issues.push(`Must end by curfew: ${formatHM(curfewEnd)}.`);
  }

  const verdict = issues.length === 0 ? "ALLOWED" : "NOT ALLOWED";
  const details = [
    `Role: ${role}`,
    `Allowed from: ${allowedFrom}`,
    `Curfew ends at: ${curfewEndTime}`,
    `Max duration: ${maxHours} hours`,
    `Proposed: ${startTimeHHMM} to ${formatHM(proposedEnd)}`,
  ];

  return { verdict, issues, details };
}

function renderPartyResult(result) {
  const planResult = document.getElementById("planResult");
  const planDetails = document.getElementById("planDetails");

  if (result.verdict === "ALLOWED") {
    planResult.innerHTML = `<span style="color: #6ee7ff; font-weight: 1000;">✅ ${result.verdict}</span>`;
  } else {
    planResult.innerHTML = `<span style="color: #fca5a5; font-weight: 1000;">❌ ${result.verdict}</span>`;
  }

  const lines = result.details ?? [];
  const why =
    result.issues.length > 0
      ? `<div style="margin-top: 8px;"><b>Why:</b><br/>- ${result.issues.join(
          "<br/>- "
        )}</div>`
      : `<div style="margin-top: 8px;">Looks good. Follow society instructions and keep volume reasonable.</div>`;

  planDetails.innerHTML = `<div><b>Details:</b><br/>${lines.join("<br/>")}</div>${why}`;
}

function renderNotices(notices) {
  const list = document.getElementById("noticeList");
  const empty = document.getElementById("noticeEmpty");

  list.innerHTML = "";
  empty.style.display = notices.length === 0 ? "block" : "none";

  const sorted = [...notices].sort((a, b) => b.createdAt - a.createdAt);
  for (const n of sorted) {
    const li = document.createElement("li");
    li.className = "noticeItem";

    const title = document.createElement("div");
    title.className = "noticeTitle";
    title.textContent = n.title;

    const meta = document.createElement("div");
    meta.className = "noticeMeta";
    const when = new Date(n.createdAt).toLocaleString();
    meta.textContent = `${when} • For: ${n.for ?? "all"}`;

    const msg = document.createElement("div");
    msg.className = "noticeMsg";
    msg.textContent = n.message;

    li.appendChild(title);
    li.appendChild(meta);
    li.appendChild(msg);
    list.appendChild(li);
  }
}

const settings = loadSettings();
applySettingsToUI(settings);

// Default date/time in Party Planner
document.getElementById("partyDate").value = pickTodayISODate();
document.getElementById("partyStart").value = new Date().toTimeString().slice(0, 5);
document.getElementById("partyDurationMin").value = 90;

// Tabs
for (const tab of document.querySelectorAll(".tab")) {
  tab.addEventListener("click", () => setTab(tab.dataset.tab));
}

// Timing status
computeStatus(settings);
setInterval(() => computeStatus(loadSettings()), 1000);

// Party planner
function planNow() {
  const role = document.getElementById("roleSelect").value;
  const partyDateISO = document.getElementById("partyDate").value || pickTodayISODate();
  const startTimeHHMM = document.getElementById("partyStart").value;
  const durationMin = Number(document.getElementById("partyDurationMin").value);

  const resultEl = document.getElementById("planResult");
  if (!startTimeHHMM || !Number.isFinite(durationMin) || durationMin <= 0) {
    resultEl.textContent = "Please enter a valid start time and duration (minutes).";
    return;
  }

  const verdict = computePartyVerdict(settings, role, partyDateISO, startTimeHHMM, durationMin);
  renderPartyResult(verdict);
}

document.getElementById("planBtn").addEventListener("click", planNow);
document.getElementById("planResetBtn").addEventListener("click", () => {
  document.getElementById("roleSelect").value = "bachelors";
  document.getElementById("partyDate").value = pickTodayISODate();
  document.getElementById("partyStart").value = new Date().toTimeString().slice(0, 5);
  document.getElementById("partyDurationMin").value = 90;
  document.getElementById("planResult").innerHTML =
    "Enter details and click <b>Check</b>.";
  document.getElementById("planDetails").textContent = "Allowed rules will be shown here.";
});

// Save timings
document.getElementById("saveTimingsBtn").addEventListener("click", () => {
  settings.gateCloseTime = document.getElementById("gateCloseTime").value;
  settings.gymCloseTime = document.getElementById("gymCloseTime").value;
  settings.speakerAllowedFrom = document.getElementById("speakerAllowedFrom").value;
  saveSettings(settings);
  applySettingsToUI(settings);
  computeStatus(settings);
});

document.getElementById("resetTimingsBtn").addEventListener("click", () => {
  if (!confirm("Reset all timings to defaults?")) return;
  const next = structuredClone(DEFAULT_SETTINGS);
  Object.assign(settings, next);
  saveSettings(settings);
  applySettingsToUI(settings);
  computeStatus(settings);
});

// Save limits
document.getElementById("saveLimitsBtn").addEventListener("click", () => {
  settings.limits.bachelors.maxHours = Number(document.getElementById("bMaxHours").value);
  settings.limits.bachelors.curfewEnd = document.getElementById("bCurfewEnd").value;
  settings.limits.families.maxHours = Number(document.getElementById("fMaxHours").value);
  settings.limits.families.curfewEnd = document.getElementById("fCurfewEnd").value;

  // Basic validation
  if (!Number.isFinite(settings.limits.bachelors.maxHours) || settings.limits.bachelors.maxHours <= 0) {
    alert("Bachelor max duration must be > 0.");
    return;
  }
  if (!Number.isFinite(settings.limits.families.maxHours) || settings.limits.families.maxHours <= 0) {
    alert("Family max duration must be > 0.");
    return;
  }

  saveSettings(settings);
  applySettingsToUI(settings);
});

// Save rules text
document.getElementById("saveRulesBtn").addEventListener("click", () => {
  settings.rulesText.bachelors = document.getElementById("bachelorsRulesInput").value;
  settings.rulesText.families = document.getElementById("familiesRulesInput").value;
  saveSettings(settings);
  applySettingsToUI(settings);
});

// Notices
const notices = loadNotices();
renderNotices(notices);

function addNotice() {
  const title = document.getElementById("noticeTitle").value.trim();
  const message = document.getElementById("noticeMessage").value.trim();
  const forRole = document.getElementById("noticeFor").value;

  if (!title || !message) {
    alert("Please enter title and message.");
    return;
  }

  notices.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: Date.now(),
    title,
    message,
    for: forRole,
  });

  saveNotices(notices);
  renderNotices(notices);

  document.getElementById("noticeTitle").value = "";
  document.getElementById("noticeMessage").value = "";
}

document.getElementById("addNoticeBtn").addEventListener("click", addNotice);
document.getElementById("clearNoticesBtn").addEventListener("click", () => {
  if (!confirm("Clear all notices?")) return;
  const next = [];
  saveNotices(next);
  notices.length = 0;
  renderNotices(notices);
});

// Initial party result prompt
document.getElementById("planResult").innerHTML = "Enter details and click <b>Check</b>.";

// ---------------------------
// Help Desk Chatbot + Tickets
// ---------------------------

const STORAGE_APARTMENT_NO_KEY = "panchayt_apartmentNo_v1";

const TICKET_DB_NAME = "panchayt_ticket_db";
const TICKET_DB_VERSION = 1;
const TICKET_STORE = "tickets";

const chatMessagesEl = document.getElementById("chatMessages");
const chatInputEl = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const photoInputEl = document.getElementById("photoInput");
const micBtn = document.getElementById("micBtn");
const apartmentNoEl = document.getElementById("apartmentNo");
const attachmentHintEl = document.getElementById("attachmentHint");

const ticketListEl = document.getElementById("ticketList");
const ticketEmptyEl = document.getElementById("ticketEmpty");
const ticketDetailsEl = document.getElementById("ticketDetails");
const clearTicketsBtn = document.getElementById("clearTicketsBtn");

let attachmentsBuffer = [];
let ticketAttachmentUrls = [];

function addChatMessage(text, who) {
  const msg = document.createElement("div");
  msg.className = `chatBubble ${who}`;
  msg.textContent = text;
  chatMessagesEl.appendChild(msg);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function safeLower(s) {
  return String(s ?? "").trim().toLowerCase();
}

function inferCategoryAndTypeAndUrgency(text) {
  const t = safeLower(text);

  const categoryByKeyword = [
    { keys: ["ac", "air conditioner", "cooler"], cat: "AC/Cooler" },
    { keys: ["fridge", "refrigerator"], cat: "Fridge/Refrigerator" },
    { keys: ["washing machine", "wm", "wash machine"], cat: "Washing Machine" },
    { keys: ["fan"], cat: "Fan" },
    { keys: ["electricity", "power", "electric", "current", "voltage", "switch"], cat: "Electricity" },
    { keys: ["geyser", "heater", "room heater"], cat: "Geyser/Heater" },
    { keys: ["water", "leak", "pipeline", "pipe", "plumber", "tap"], cat: "Water/Plumbing" },
    { keys: ["clean", "cleaning", "garbage", "dust", "odor", "smell"], cat: "Cleanliness" },
    { keys: ["gate", "security", "guard", "lock"], cat: "Gate/Security" },
    { keys: ["gym"], cat: "Gym" },
    { keys: ["party", "speaker", "music"], cat: "Party/Speaker" },
    { keys: ["wifi", "internet"], cat: "Internet/Wi-Fi" },
  ];

  let category = "Other";
  for (const item of categoryByKeyword) {
    if (item.keys.some((k) => t.includes(k))) {
      category = item.cat;
      break;
    }
  }

  let type = "issue";
  if (/(need|want|require|request|please install|please fix|buy)/i.test(text)) {
    // Still could be issue, but treat as request if they are asking for something
    type = "request";
  }
  if (/(not working|broken|doesn't work|doesnt work|leak|sparking|no power|problem)/i.test(text)) {
    type = "issue";
  }

  let urgency = "normal";
  if (/(urgent|asap|immediately|right now|within 1 hour|fire|sparks)/i.test(text)) {
    urgency = "high";
  }

  return { category, type, urgency };
}

function openTicketDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB not supported in this browser."));
      return;
    }

    const req = indexedDB.open(TICKET_DB_NAME, TICKET_DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TICKET_STORE)) {
        const store = db.createObjectStore(TICKET_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by_createdAt", "createdAt", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open ticket database.")); // eslint-disable-line no-undef
  });
}

async function ticketAdd(ticket) {
  const db = await openTicketDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(TICKET_STORE, "readwrite");
      const store = tx.objectStore(TICKET_STORE);
      store.add(ticket);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Failed to add ticket.")); // eslint-disable-line no-undef
    });
  } finally {
    db.close();
  }
}

async function ticketList(limit = 20) {
  const db = await openTicketDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(TICKET_STORE, "readonly");
      const store = tx.objectStore(TICKET_STORE);
      const index = store.index("by_createdAt");
      const req = index.openCursor(null, "prev");
      const items = [];

      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || items.length >= limit) {
          resolve(items);
          return;
        }
        items.push(cursor.value);
        cursor.continue();
      };
      req.onerror = () => reject(req.error ?? new Error("Failed to list tickets.")); // eslint-disable-line no-undef
    });
  } finally {
    db.close();
  }
}

async function ticketGet(id) {
  const db = await openTicketDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(TICKET_STORE, "readonly");
      const store = tx.objectStore(TICKET_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error ?? new Error("Failed to get ticket.")); // eslint-disable-line no-undef
    });
  } finally {
    db.close();
  }
}

async function ticketDelete(id) {
  const db = await openTicketDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(TICKET_STORE, "readwrite");
      const store = tx.objectStore(TICKET_STORE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Failed to delete ticket.")); // eslint-disable-line no-undef
    });
  } finally {
    db.close();
  }
}

async function ticketClearAll() {
  const db = await openTicketDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(TICKET_STORE, "readwrite");
      const store = tx.objectStore(TICKET_STORE);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Failed to clear tickets.")); // eslint-disable-line no-undef
    });
  } finally {
    db.close();
  }
}

function renderTicketDetails(ticket) {
  for (const url of ticketAttachmentUrls) URL.revokeObjectURL(url);
  ticketAttachmentUrls = [];

  if (!ticket) {
    ticketDetailsEl.textContent = "Select a ticket from the list.";
    return;
  }

  const when = new Date(ticket.createdAt).toLocaleString();
  const typeLabel = ticket.type === "request" ? "REQUEST" : "ISSUE";
  const attachments = Array.isArray(ticket.attachments) ? ticket.attachments : [];

  let attachmentsHtml = "";
  if (attachments.length > 0) {
    attachmentsHtml = `<div class="attachments">`;
    for (const a of attachments) {
      const url = URL.createObjectURL(a.blob);
      ticketAttachmentUrls.push(url);
      attachmentsHtml += `<img class="thumb" alt="attachment" src="${url}" />`;
    }
    attachmentsHtml += `</div>`;
  }

  const summary = ticket.description ?? "";
  ticketDetailsEl.innerHTML = `
    <div><b>Ticket ID:</b> ${ticket.id}</div>
    <div><b>When:</b> ${when}</div>
    <div><b>Apartment:</b> ${ticket.apartmentNo ?? "—"}</div>
    <div><b>Type:</b> ${typeLabel}</div>
    <div><b>Category:</b> ${ticket.category ?? "Other"}</div>
    <div><b>Urgency:</b> ${ticket.urgency ?? "normal"}</div>
    <div style="margin-top: 8px;"><b>Message:</b><br/>${summary}</div>
    <div>${attachmentsHtml}</div>
  `;
}

function renderTicketList(items) {
  ticketListEl.innerHTML = "";
  ticketEmptyEl.style.display = items.length === 0 ? "block" : "none";

  for (const t of items) {
    const li = document.createElement("li");
    li.className = "ticketItem";

    const main = document.createElement("div");
    main.className = "ticketMain";

    const title = document.createElement("div");
    title.className = "ticketTitle";
    const typeLabel = t.type === "request" ? "REQUEST" : "ISSUE";
    title.textContent = `${typeLabel} • ${t.category ?? "Other"}`;

    const meta = document.createElement("div");
    meta.className = "ticketMeta";
    const when = new Date(t.createdAt).toLocaleString();
    meta.textContent = `${when} • Apt: ${t.apartmentNo ?? "—"} • Attachments: ${
      Array.isArray(t.attachments) ? t.attachments.length : 0
    }`;

    const summary = document.createElement("div");
    summary.className = "ticketSummary";
    summary.textContent = (t.description ?? "").slice(0, 180) || "—";

    main.appendChild(title);
    main.appendChild(meta);
    main.appendChild(summary);

    const actions = document.createElement("div");
    actions.className = "ticketActions";

    const viewBtn = document.createElement("button");
    viewBtn.className = "btn btn-secondary btn-small";
    viewBtn.type = "button";
    viewBtn.textContent = "View";
    viewBtn.addEventListener("click", async () => {
      const full = await ticketGet(t.id);
      renderTicketDetails(full);
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-secondary btn-small";
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this ticket?")) return;
      await ticketDelete(t.id);
      const next = await ticketList(20);
      renderTicketList(next);
      renderTicketDetails(null);
    });

    actions.appendChild(viewBtn);
    actions.appendChild(delBtn);

    li.appendChild(main);
    li.appendChild(actions);
    ticketListEl.appendChild(li);
  }
}

async function refreshTickets() {
  const items = await ticketList(20);
  renderTicketList(items);
}

let draft = null;
function resetDraft() {
  draft = null;
}

function getCurrentApartmentNo() {
  return apartmentNoEl.value.trim();
}

function setAttachmentHint() {
  const count = attachmentsBuffer.length + (draft?.attachments?.length ? draft.attachments.length : 0);
  if (attachmentsBuffer.length > 0) {
    attachmentHintEl.textContent = `Attached: ${attachmentsBuffer.length} photo(s).`;
  } else if (draft?.attachments?.length > 0) {
    attachmentHintEl.textContent = `Attached to draft: ${draft.attachments.length} photo(s).`;
  } else {
    attachmentHintEl.textContent = "Upload photos (optional). Voice input will convert to text if supported.";
  }
}

function startOrUpdateDraftFromText(userText) {
  const apartmentNo = getCurrentApartmentNo();
  const inferred = inferCategoryAndTypeAndUrgency(userText);

  draft = {
    createdAt: Date.now(), // used for ticket save
    apartmentNo,
    type: inferred.type,
    category: inferred.category,
    urgency: inferred.urgency,
    description: userText,
    attachments: attachmentsBuffer.slice(),
  };

  attachmentsBuffer = [];
  photoInputEl.value = "";

  return draft;
}

function formatDraftSummary(d) {
  const typeLabel = d.type === "request" ? "REQUEST" : "ISSUE";
  return [
    `Summary`,
    `Type: ${typeLabel}`,
    `Category: ${d.category}`,
    `Urgency: ${d.urgency}`,
    `Apartment: ${d.apartmentNo || "(missing)"}`,
    `Message: ${d.description}`,
    ``,
    `Reply "save" to store this ticket, or "edit" to change it.`,
  ].join("\n");
}

async function submitTicketFromDraft() {
  if (!draft) {
    addChatMessage("I don't have anything to save yet. Tell me your issue/request first.", "bot");
    return;
  }

  const apartmentNo = (draft.apartmentNo ?? "").trim();
  if (!apartmentNo) {
    addChatMessage("Please enter your Flat/House number so I can save the ticket.", "bot");
    return;
  }

  const description = (draft.description ?? "").trim();
  if (!description) {
    addChatMessage("Please tell me the details of the issue/request before saving.", "bot");
    return;
  }

  const payload = {
    createdAt: draft.createdAt ?? Date.now(),
    apartmentNo,
    type: draft.type ?? "issue",
    category: draft.category ?? "Other",
    urgency: draft.urgency ?? "normal",
    description,
    attachments: draft.attachments ?? [],
  };

  await ticketAdd(payload);
  resetDraft();
  setAttachmentHint();

  addChatMessage("Saved! ✅ Your ticket is stored. Check the list on the right.", "bot");
  await refreshTickets();
  renderTicketDetails(null);
}

function handleBotFlow(userText) {
  const t = safeLower(userText);

  if (t === "save" || t === "submit") {
    submitTicketFromDraft().catch((e) => addChatMessage(e?.message ?? String(e), "bot"));
    return;
  }

  if (t === "edit" || t === "change") {
    resetDraft();
    addChatMessage("Okay. Re-type your issue/request (and add photos if needed).", "bot");
    setAttachmentHint();
    return;
  }

  const d = startOrUpdateDraftFromText(userText);
  const summary = formatDraftSummary(d);

  // If apartment missing, highlight it
  if (!d.apartmentNo) {
    addChatMessage(summary + "\n\nFirst, enter your Flat/House number, then reply 'save'.", "bot");
  } else {
    addChatMessage(summary, "bot");
  }
  setAttachmentHint();
}

function handleChatSend(textOverride) {
  const text = String(textOverride ?? chatInputEl.value).trim();
  if (!text && attachmentsBuffer.length === 0) {
    addChatMessage("Please type a message or attach a photo.", "bot");
    return;
  }
  if (!text && attachmentsBuffer.length > 0) {
    addChatMessage("Got the photo(s). Now type a short issue/request message to describe it.", "bot");
    return;
  }

  addChatMessage(text, "user");
  chatInputEl.value = "";
  setAttachmentHint();
  handleBotFlow(text);
}

// Photo attachments
photoInputEl.addEventListener("change", () => {
  const files = photoInputEl.files ? Array.from(photoInputEl.files) : [];
  if (files.length === 0) return;

  // Soft limit to avoid crashing browser storage
  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
  if (totalBytes > 12 * 1024 * 1024) {
    alert("Please attach smaller images (total <= 12MB).");
    photoInputEl.value = "";
    attachmentsBuffer = [];
    setAttachmentHint();
    return;
  }

  attachmentsBuffer = files.map((f) => ({
    fileName: f.name ?? "image",
    mimeType: f.type ?? "image/*",
    blob: f,
  }));

  setAttachmentHint();
  addChatMessage(`📷 Attached ${attachmentsBuffer.length} photo(s).`, "bot");
});

// Text send
sendChatBtn.addEventListener("click", () => handleChatSend());
chatInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleChatSend();
});

// Mic (speech to text)
let recognition = null;
let micListening = false;

function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addChatMessage("Speech-to-text not supported in this browser. Use typing instead.", "bot");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = true;
  recognition.continuous = false;

  micListening = true;
  micBtn.disabled = true;
  micBtn.textContent = "Listening…";

  let finalTranscript = "";
  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    chatInputEl.value = transcript.trim();
    finalTranscript = transcript.trim();
  };

  recognition.onerror = () => {
    micListening = false;
    micBtn.disabled = false;
    micBtn.textContent = "Speak";
    addChatMessage("Mic error. Please try again or type your message.", "bot");
  };

  recognition.onend = () => {
    micListening = false;
    micBtn.disabled = false;
    micBtn.textContent = "Speak";

    const transcript = (chatInputEl.value || "").trim();
    if (transcript) handleChatSend(transcript);
  };

  recognition.start();
}

micBtn.addEventListener("click", () => {
  if (micListening) return;
  startSpeechRecognition();
});

// Clear tickets
clearTicketsBtn.addEventListener("click", async () => {
  if (!confirm("Clear ALL saved tickets?")) return;
  await ticketClearAll();
  await refreshTickets();
  renderTicketDetails(null);
  addChatMessage("All tickets cleared.", "bot");
});

// Init chat UI
const storedApt = localStorage.getItem(STORAGE_APARTMENT_NO_KEY);
if (storedApt) apartmentNoEl.value = storedApt;

apartmentNoEl.addEventListener("change", () => {
  localStorage.setItem(STORAGE_APARTMENT_NO_KEY, apartmentNoEl.value.trim());
});

addChatMessage("Hi! Tell me your issue/request (AC, fridge, electricity, washing machine, fan, anything).", "bot");
addChatMessage("Add your Flat/House number, then type your message. After that, reply 'save' to store the ticket.", "bot");
setAttachmentHint();
refreshTickets().catch(() => {
  ticketEmptyEl.style.display = "block";
});


