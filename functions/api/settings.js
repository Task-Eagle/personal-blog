import { error, json, readJson } from "../_lib/http.js";
import { requireAdmin } from "../_lib/auth.js";

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare("SELECT key, value FROM settings").all();
  const settings = { site_name: "Field Notes", tagline: "A small personal blog." };
  for (const row of results || []) settings[row.key] = row.value;
  return json(settings);
}

export async function onRequestPut(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const body = await readJson(context.request);
  if (!body) return error("Invalid JSON.", 400);

  const allowed = ["site_name", "tagline"];
  const updates = [];
  for (const key of allowed) {
    if (typeof body[key] === "string") {
      const value = body[key].trim();
      if (!value) return error(`${key} cannot be empty.`, 400);
      if (value.length > 120) return error(`${key} is too long.`, 400);
      updates.push([key, value]);
    }
  }
  if (updates.length === 0) return error("No settings to update.", 400);

  const stmts = updates.map(([key, value]) =>
    context.env.DB.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).bind(key, value)
  );
  await context.env.DB.batch(stmts);

  const { results } = await context.env.DB.prepare("SELECT key, value FROM settings").all();
  const settings = {};
  for (const row of results || []) settings[row.key] = row.value;
  return json(settings);
}
