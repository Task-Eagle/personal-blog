import { paintChrome, formatDate, escapeHtml } from "./common.js";

const listEl = document.querySelector("[data-post-list]");

const { settings, pages } = await paintChrome("home");
document.title = settings.site_name;
document.querySelector("[data-hero-title]").textContent = settings.site_name;
document.querySelector("[data-hero-tagline]").textContent = settings.tagline;

if (!pages.length) {
  listEl.innerHTML = `<div class="empty">No posts yet. Open Admin to write the first one.</div>`;
} else {
  listEl.innerHTML = pages
    .map(
      (p) => `
      <a class="post-card" href="/post.html?slug=${encodeURIComponent(p.slug)}">
        <div class="meta">${formatDate(p.created_at)}</div>
        <h2>${escapeHtml(p.title)}</h2>
        <p class="excerpt">${escapeHtml(p.excerpt || "")}</p>
      </a>`
    )
    .join("");
}
