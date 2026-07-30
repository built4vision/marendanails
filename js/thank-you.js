/* ==========================================================================
   THANK-YOU PAGE
   CONFIG and applyConfig() come from js/config.js (loaded first).
   Each deliverable checks whether its file actually exists before
   showing a download button — files added later just start working,
   nothing to switch on manually.
   ========================================================================== */

async function fileExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch (err) {
    return false;
  }
}

async function initDeliverables() {
  const items = document.querySelectorAll("[data-deliverable]");

  await Promise.all(
    Array.from(items).map(async (item) => {
      const key = item.dataset.deliverable;
      const configSrc = CONFIG[key];
      const action = item.querySelector("[data-deliverable-action]");
      if (!configSrc || !action) return;

      // CONFIG paths are root-relative (written for index.html at the site
      // root); this page lives one level deeper at thank-you/, so resolve
      // against "../" rather than assuming the config value works as-is.
      const src = "../" + configSrc;

      const available = await fileExists(src);
      if (available) {
        const link = document.createElement("a");
        link.className = "btn btn--primary";
        link.href = src;
        link.setAttribute("download", "");
        link.textContent = "Download";
        action.replaceChildren(link);
      } else {
        const pending = document.createElement("span");
        pending.className = "deliverable__pending";
        pending.textContent = "Being prepared";
        action.replaceChildren(pending);
      }
    })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  initAnimations();
  initDeliverables();
});
