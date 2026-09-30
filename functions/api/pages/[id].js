import { error, json, readJson } from "../../_lib/http.js";
import { isAdmin, requireAdmin } from "../../_lib/auth.js";
import { excerptFrom, publicPage, uniqueSlug } from "../../_lib/pages.js";

async function findPage(db, idOrSlug) {
  return db
    .prepare("SELECT * FROM pages WHERE id = ? OR slug = ?")
    .bind(idOrSlug, idOrSlug)
    .first();
}

export async function onRequestGet(context) {
  const { id } = context.params;
  const row = await findPage(context.env.DB, id);
  if (!row) return error("Post not found.", 404);

  const admin = await isAdmin(context);
  if (!row.published && !admin) return error("Post not found.", 404);

  return json({ page: publicPage(row) });
}

export async function onRequestPut(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const existing = await findPage(context.env.DB, context.params.id);
  if (!existing) return error("Post not found.", 404);

  const body = await readJson(context.request);
  if (!body) return error("Invalid JSON.", 400);

  const title =
    typeof body.title === "string" ? body.title.trim() : existing.title;
  const content =
    typeof body.content === "string" ? body.content : existing.content;
  if (!title) return error("Title is required.", 400);
  if (title.length > 200) return error("Title is too long.", 400);
  if (content.length > 200_000) return error("Post is too long.", 400);

  let slug = existing.slug;
  if (typeof body.slug === "string" && body.slug.trim()) {
    slug = await uniqueSlug(context.env.DB, body.slug, existing.id);
  }

  const published =
    body.published === false || body.published === 0
      ? 0
      : body.published === true || body.published === 1
        ? 1
        : existing.published;

  const excerpt = excerptFrom(content, title);
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    `UPDATE pages
     SET slug = ?, title = ?, content = ?, excerpt = ?, published = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(slug, title, content, excerpt, published, now, existing.id)
    .run();

  const row = await context.env.DB.prepare("SELECT * FROM pages WHERE id = ?")
    .bind(existing.id)
    .first();
  return json({ page: publicPage(row) });
}

export async function onRequestDelete(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const existing = await findPage(context.env.DB, context.params.id);
  if (!existing) return error("Post not found.", 404);

  await context.env.DB.prepare("DELETE FROM pages WHERE id = ?")
    .bind(existing.id)
    .run();

  return json({ ok: true, id: existing.id });
}
