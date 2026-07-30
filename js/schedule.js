/* ==========================================================================
   SCHEDULE PAGE
   Generates a small set of proposed intro-meeting times (Eastern Time),
   at least MIN_NOTICE_HOURS out, across the next SLOT_DAYS weekdays, at
   the fixed times of day in SLOT_TIMES. No calendar backend — the
   customer's pick is sent as a plain email via mailto: for manual
   confirmation, so there's no double-booking risk to manage here.
   ========================================================================== */

const MIN_NOTICE_HOURS = 12;
const SLOT_DAYS = 3;
const SLOT_TIMES = [
  { hour: 10, minute: 30 },
  { hour: 14, minute: 30 },
];

function easternOffset(forDateUTCNoon) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).formatToParts(forDateUTCNoon);
  const tzName = parts.find((p) => p.type === "timeZoneName").value;
  return tzName === "EDT" ? "-04:00" : "-05:00";
}

function easternDate(year, month, day, hour, minute) {
  const noonUTCGuess = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const offset = easternOffset(noonUTCGuess);
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${offset}`;
  return new Date(iso);
}

function isWeekday(year, month, day) {
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dow >= 1 && dow <= 5;
}

function addDays(year, month, day, amount) {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + amount);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function generateSlotDays() {
  const now = new Date();
  const earliest = new Date(now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000);

  // Start from "today" in Eastern calendar terms.
  const todayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  let cursor = {
    year: Number(todayParts.find((p) => p.type === "year").value),
    month: Number(todayParts.find((p) => p.type === "month").value),
    day: Number(todayParts.find((p) => p.type === "day").value),
  };

  const days = [];
  let guard = 0;

  while (days.length < SLOT_DAYS && guard < 21) {
    guard += 1;
    if (isWeekday(cursor.year, cursor.month, cursor.day)) {
      const slots = SLOT_TIMES.map(({ hour, minute }) =>
        easternDate(cursor.year, cursor.month, cursor.day, hour, minute)
      ).filter((d) => d.getTime() >= earliest.getTime());

      if (slots.length > 0) {
        days.push({ dateForLabel: easternDate(cursor.year, cursor.month, cursor.day, 12, 0), slots });
      }
    }
    cursor = addDays(cursor.year, cursor.month, cursor.day, 1);
  }

  return days;
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatTimeLabel(date) {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
    }).format(date) + " ET"
  );
}

function renderSlots() {
  const grid = document.getElementById("slot-grid");
  if (!grid) return;

  const days = generateSlotDays();
  grid.innerHTML = "";

  days.forEach((day, dayIndex) => {
    const dayEl = document.createElement("div");
    dayEl.className = "slot-day";

    const dayLabel = document.createElement("p");
    dayLabel.className = "slot-day__label";
    dayLabel.textContent = formatDayLabel(day.dateForLabel);
    dayEl.appendChild(dayLabel);

    const optionsEl = document.createElement("div");
    optionsEl.className = "slot-day__options";

    day.slots.forEach((slotDate, slotIndex) => {
      const id = `slot-${dayIndex}-${slotIndex}`;
      const label = document.createElement("label");
      label.className = "slot-option";
      label.setAttribute("for", id);

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "slot";
      input.id = id;
      input.value = `${formatDayLabel(day.dateForLabel)} at ${formatTimeLabel(slotDate)}`;
      input.required = true;

      const span = document.createElement("span");
      span.textContent = formatTimeLabel(slotDate);

      label.appendChild(input);
      label.appendChild(span);
      optionsEl.appendChild(label);
    });

    dayEl.appendChild(optionsEl);
    grid.appendChild(dayEl);
  });

  if (days.length === 0) {
    grid.innerHTML = '<p class="slot-empty">No times available right now — email us directly to set one up.</p>';
  }
}

function initScheduleForm() {
  const form = document.getElementById("schedule-form");
  const success = document.getElementById("schedule-success");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("sf-name").value.trim();
    const business = document.getElementById("sf-business").value.trim();
    const email = document.getElementById("sf-email").value.trim();
    const selected = form.querySelector('input[name="slot"]:checked');
    if (!selected) return;

    const subject = `Intro meeting request — ${business || name}`;
    const bodyLines = [
      `Name: ${name}`,
      `Business: ${business}`,
      `Email: ${email}`,
      ``,
      `Requested time: ${selected.value}`,
      ``,
      `(Sent from the ${CONFIG.businessName} onboarding page — please confirm this time works.)`,
    ];
    const mailto = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailto;

    form.hidden = true;
    success.hidden = false;
    const chosenTimeEl = document.getElementById("schedule-success-time");
    if (chosenTimeEl) chosenTimeEl.textContent = selected.value;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  initAnimations();
  renderSlots();
  initScheduleForm();
});
