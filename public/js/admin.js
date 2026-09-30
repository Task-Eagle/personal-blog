import {
  paintChrome,
  getJson,
  sendJson,
  formatDate,
  escapeHtml,
  renderMarkdown,
} from "./common.js";

await paintChrome();

const loginPanel = document.querySelector("[data-login]");
const dashPanel = document.querySelector("[data-dash]");
const editorPanel = document.querySelector("[data-editor]");
const flash = document.querySelector("[data-flash]");
const listEl = document.querySelector("[data-admin-list]");
const previewEl = document.querySelector("[data-preview]");

const titleInput = document.querySelector("#title");
const slugInput = document.querySelector("#slug");
const contentInput = document.querySelector("#content");
const publishedInput = document.querySelector("#published");
const siteNameInput = document.querySelector("#site_name");
const taglineInput = document.querySelector("#tagline");
const editorHeading = document.querySelector("[data-editor-heading]");

let editingId = null;

function showFlash(message, kind = "ok") {
  flash.className = `flash ${kind}`;
  flash.textContent = message;
  flash.hidden = !message;
}

function show(view) {
  loginPanel.hidden = view !== "login";
  dashPanel.hidden = view !== "dash" && view !== "editor";
  editorPanel.hidden = view !== "editor";
}

async function refreshMe() {
  const me = await getJson("/api/me");
  if (!me.admin) {
    show("login");
    return false;
  }
  show(editingId || editorPanel.hidden === false ? "editor" : "dash");
  return true;
}

async function loadSettingsForm() {
  const s = await getJson("/api/settings");
  siteNameInput.value = s.site_name || "";
  taglineInput.value = s.tagline || "";
}

async function loadList() {
  const { pages } = await getJson("/api/pages?all=1");
  if (!pages.length) {
    listEl.innerHTML = `<div class="empty">No posts yet.</div>`;
    return;
  }
  listEl.innerHTML = pages
    .map(
      (p) => `
      <div class="admin-item">
        <div>
          <strong>${escapeHtml(p.title)}</strong>
          <span class="badge ${p.published ? "" : "draft"}">${
            p.published ? "Published" : "Draft"
          }</span>
          <div class="hint">/${escapeHtml(p.slug)} · ${formatDate(p.updated_at)}</div>
        </div>
        <div class="row">
          <button class="btn secondary" data-edit="${p.id}">Edit</button>
          <button class="btn danger" data-delete="${p.id}" data-title="${escapeHtml(
            p.title
          )}">Delete</button>
        </div>
      </div>`
    )
    .join("");
}

function resetEditor() {
  editingId = null;
  titleInput.value = "";
  slugInput.value = "";
  contentInput.value = "";
  publishedInput.checked = true;
  previewEl.innerHTML = "";
  editorHeading.textContent = "New post";
}

function fillEditor(page) {
  editingId = page.id;
  titleInput.value = page.title;
  slugInput.value = page.slug;
  contentInput.value = page.content;
  publishedInput.checked = Boolean(page.published);
  previewEl.innerHTML = renderMarkdown(page.content);
  editorHeading.textContent = "Edit post";
}

contentInput.addEventListener("input", () => {
  previewEl.innerHTML = renderMarkdown(contentInput.value);
});

document.querySelector("[data-login-form]").addEventListener("submit", async (e) => {
  e.preventDefault();
  showFlash("");
  const password = document.querySelector("#password").value;
  try {
    await sendJson("/api/login", "POST", { password });
    show("dash");
    await loadSettingsForm();
    await loadList();
  } catch (err) {
    showFlash(err.message, "err");
  }
});

document.querySelector("[data-logout]").addEventListener("click", async () => {
  await sendJson("/api/logout", "POST");
  resetEditor();
  show("login");
});

document.querySelector("[data-new]").addEventListener("click", () => {
  resetEditor();
  show("editor");
});

document.querySelector("[data-cancel]").addEventListener("click", () => {
  resetEditor();
  show("dash");
});

document.querySelector("[data-settings-form]").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await sendJson("/api/settings", "PUT", {
      site_name: siteNameInput.value,
      tagline: taglineInput.value,
    });
    showFlash("Site name updated.");
    await paintChrome();
  } catch (err) {
    showFlash(err.message, "err");
  }
});

document.querySelector("[data-editor-form]").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    title: titleInput.value,
    slug: slugInput.value,
    content: contentInput.value,
    published: publishedInput.checked,
  };
  try {
    if (editingId) {
      await sendJson(`/api/pages/${editingId}`, "PUT", payload);
      showFlash("Post saved.");
    } else {
      const { page } = await sendJson("/api/pages", "POST", payload);
      editingId = page.id;
      slugInput.value = page.slug;
      showFlash("Post created.");
    }
    await loadList();
    await paintChrome();
    show("dash");
    resetEditor();
  } catch (err) {
    showFlash(err.message, "err");
  }
});

listEl.addEventListener("click", async (e) => {
  const editId = e.target.getAttribute("data-edit");
  const deleteId = e.target.getAttribute("data-delete");
  if (editId) {
    const { page } = await getJson(`/api/pages/${editId}`);
    fillEditor(page);
    show("editor");
  }
  if (deleteId) {
    const title = e.target.getAttribute("data-title") || "this post";
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
    try {
      await sendJson(`/api/pages/${deleteId}`, "DELETE");
      showFlash("Post deleted.");
      await loadList();
      await paintChrome();
    } catch (err) {
      showFlash(err.message, "err");
    }
  }
});

try {
  if (await refreshMe()) {
    await loadSettingsForm();
    await loadList();
    show("dash");
  }
} catch {
  show("login");
}
