/* ==========================================================================
   RAZORS EDGE × BUILT4VISION — "New Place, Same Edge"
   Sales-page-specific behavior. CONFIG and applyConfig() live in
   js/config.js (loaded before this file) since they're shared with
   thank-you/index.html.
   ========================================================================== */

/* ==========================================================================
   PAYMENT LINK PLACEHOLDERS
   Renders a disabled placeholder chip when a link is unset ("#"),
   or a live link once a real URL is added to CONFIG.paymentLinks.
   ========================================================================== */
function renderPaymentPlaceholders() {
  document.querySelectorAll("[data-pay]").forEach((container) => {
    const offerKey = container.dataset.pay;
    const links = CONFIG.paymentLinks[offerKey];
    if (!links) return;

    Object.entries(links).forEach(([provider, url]) => {
      const label = provider.charAt(0).toUpperCase() + provider.slice(1);
      const isLive = url && url !== "#";
      const el = document.createElement(isLive ? "a" : "span");
      el.textContent = isLive ? label : `${label} (add link)`;
      if (isLive) {
        el.href = url;
        el.rel = "noopener";
      }
      container.appendChild(el);
    });
  });
}

/* ==========================================================================
   AUDIO PLAYER
   Called once per player instance on the page. `idSuffix` targets a
   distinct set of element IDs (e.g. "-2" for the second sample), and
   `playAgainKey` scopes which [data-play-again] buttons control this
   specific instance, so multiple independent players can coexist
   without one's controls accidentally triggering another's audio.
   ========================================================================== */
function initPlayer({ idSuffix = "", playAgainKey = "main", previewStartSeconds = 0, previewEndSeconds = null } = {}) {
  const audio = document.getElementById(`anthem-audio${idSuffix}`);
  const playToggle = document.getElementById(`play-toggle${idSuffix}`);
  const restartBtn = document.getElementById(`restart-btn${idSuffix}`);
  const seek = document.getElementById(`seek${idSuffix}`);
  const volume = document.getElementById(`volume${idSuffix}`);
  const timeElapsed = document.getElementById(`time-elapsed${idSuffix}`);
  const timeTotal = document.getElementById(`time-total${idSuffix}`);
  const fallback = document.getElementById(`player-fallback${idSuffix}`);
  const waveBase = document.getElementById(`wave-base${idSuffix}`);
  const waveProgress = document.getElementById(`wave-progress${idSuffix}`);
  if (!audio || !playToggle) return;

  const iconPlay = playToggle.querySelector(".icon--play");
  const iconPause = playToggle.querySelector(".icon--pause");

  const SEEK_MAX = Number(seek.max);
  let duration = 0;
  let seeking = false;

  // Preview window: only this slice of the file plays here. The unclipped
  // file is only ever linked from the post-purchase page.
  const previewStart = previewStartSeconds || 0;
  const previewEnd = typeof previewEndSeconds === "number" ? previewEndSeconds : null;
  const previewEnabled = previewEnd !== null && previewEnd > previewStart;

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  // Deterministic pseudo-random bar heights for a stylized waveform look
  // (this is a decorative visualization, not an analysis of the actual audio).
  function buildWaveform() {
    const barCount = 56;
    let seedVal = 42;
    const rand = () => {
      seedVal = (seedVal * 9301 + 49297) % 233280;
      return seedVal / 233280;
    };

    [waveBase, waveProgress].forEach((layer) => {
      layer.innerHTML = "";
    });

    for (let i = 0; i < barCount; i++) {
      const height = 22 + Math.round(rand() * 78);
      const barBase = document.createElement("span");
      barBase.style.height = `${height}%`;
      waveBase.appendChild(barBase);

      const barProgress = document.createElement("span");
      barProgress.style.height = `${height}%`;
      waveProgress.appendChild(barProgress);
    }
  }

  function setProgress(fraction) {
    const pct = Math.max(0, Math.min(1, fraction)) * 100;
    waveProgress.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
  }

  function setPlayingUI(isPlaying) {
    // Toggle via inline style rather than the `hidden` attribute/property —
    // inline style always wins the cascade, regardless of any stylesheet
    // or UA quirk that might otherwise leave both icons visible.
    iconPlay.style.display = isPlaying ? "none" : "block";
    iconPause.style.display = isPlaying ? "block" : "none";
    playToggle.setAttribute("aria-label", isPlaying ? "Pause the anthem" : "Play the anthem");
  }

  function play() {
    if (previewEnabled && (audio.currentTime < previewStart || audio.currentTime >= previewEnd)) {
      audio.currentTime = previewStart;
    }
    audio.play().catch(() => {
      /* Playback can be blocked until a user gesture; the click itself is the gesture. */
    });
  }

  buildWaveform();
  setPlayingUI(false);

  playToggle.addEventListener("click", () => {
    if (audio.paused) {
      play();
    } else {
      audio.pause();
    }
  });

  document.querySelectorAll(`[data-play-again="${playAgainKey}"]`).forEach((btn) => {
    btn.addEventListener("click", () => play());
  });

  restartBtn.addEventListener("click", () => {
    audio.currentTime = previewStart;
    setProgress(0);
    seek.value = 0;
    timeElapsed.textContent = formatTime(0);
  });

  let resetPendingAfterPause = false;

  audio.addEventListener("play", () => setPlayingUI(true));
  audio.addEventListener("pause", () => {
    setPlayingUI(false);
    // Only seek back to the preview start once pause has genuinely taken
    // effect — seeking immediately alongside pause() can race the "resume
    // after seek" behavior a playing element applies when its seek settles,
    // undoing the pause.
    if (resetPendingAfterPause) {
      resetPendingAfterPause = false;
      audio.currentTime = previewStart;
      setProgress(0);
      seek.value = 0;
      timeElapsed.textContent = formatTime(0);
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    duration = previewEnabled ? previewEnd - previewStart : audio.duration || 0;
    timeTotal.textContent = formatTime(duration);
    if (previewEnabled) audio.currentTime = previewStart;
  });

  audio.addEventListener("timeupdate", () => {
    if (seeking) return;

    if (previewEnabled && audio.currentTime >= previewEnd) {
      resetPendingAfterPause = true;
      audio.pause();
      return;
    }

    const elapsed = previewEnabled ? Math.max(0, audio.currentTime - previewStart) : audio.currentTime;
    timeElapsed.textContent = formatTime(elapsed);
    if (duration > 0) {
      const fraction = elapsed / duration;
      seek.value = String(Math.round(fraction * SEEK_MAX));
      setProgress(fraction);
    }
  });

  audio.addEventListener("ended", () => {
    setProgress(0);
    seek.value = 0;
  });

  audio.addEventListener("error", () => {
    fallback.hidden = false;
    playToggle.disabled = true;
    document.querySelectorAll(`[data-play-again="${playAgainKey}"]`).forEach((btn) => {
      btn.disabled = true;
    });
  });

  seek.addEventListener("input", () => {
    seeking = true;
    const fraction = Number(seek.value) / SEEK_MAX;
    setProgress(fraction);
    timeElapsed.textContent = formatTime(fraction * duration);
  });

  seek.addEventListener("change", () => {
    if (duration > 0) {
      const offset = previewEnabled ? previewStart : 0;
      audio.currentTime = offset + (Number(seek.value) / SEEK_MAX) * duration;
    }
    seeking = false;
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
  });
  audio.volume = Number(volume.value);
}

/* ==========================================================================
   CONTACT PANEL
   ========================================================================== */
function initContactPanel() {
  const panel = document.getElementById("contact-panel");
  const form = document.getElementById("contact-form");
  const success = document.getElementById("contact-success");
  const offerSelect = document.getElementById("cf-offer");
  let lastFocused = null;

  function openPanel(offerKey) {
    lastFocused = document.activeElement;
    if (offerKey) offerSelect.value = offerKey;
    form.hidden = false;
    success.hidden = true;
    panel.hidden = false;
    document.body.style.overflow = "hidden";
    const firstField = document.getElementById("cf-name");
    if (firstField) firstField.focus();
  }

  function closePanel() {
    panel.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  document.querySelectorAll("[data-offer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const offerKey = btn.dataset.offer;
      const stripeLink = CONFIG.paymentLinks[offerKey] && CONFIG.paymentLinks[offerKey].stripe;
      // Once a real Stripe link exists for this offer, skip the inquiry
      // form entirely and go straight to checkout. The form stays as a
      // fallback for any offer that doesn't have a live link yet.
      if (stripeLink && stripeLink !== "#") {
        window.location.href = stripeLink;
      } else {
        openPanel(offerKey);
      }
    });
  });

  document.querySelectorAll("[data-close-panel]").forEach((el) => {
    el.addEventListener("click", closePanel);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) closePanel();
  });

  // Placeholder submit handler — wire form.dataset.formEndpoint up to a real
  // form service (Formspree, Netlify Forms, etc.) to receive submissions.
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.hidden = true;
    success.hidden = false;
  });
}

/* ==========================================================================
   SCROLL CUES
   ========================================================================== */
function initScrollCues() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-scroll-to]").forEach((el) => {
    el.addEventListener("click", () => {
      const target = document.querySelector(el.dataset.scrollTo);
      if (target) {
        target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      }
    });
  });
}

/* ==========================================================================
   INIT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  renderPaymentPlaceholders();
  initPlayer({
    idSuffix: "",
    playAgainKey: "main",
    previewStartSeconds: CONFIG.previewStartSeconds,
    previewEndSeconds: CONFIG.previewEndSeconds,
  });
  initPlayer({
    idSuffix: "-2",
    playAgainKey: "second",
    previewStartSeconds: CONFIG.secondPreviewStartSeconds,
    previewEndSeconds: CONFIG.secondPreviewEndSeconds,
  });
  initContactPanel();
  initAnimations();
  initScrollCues();
});
