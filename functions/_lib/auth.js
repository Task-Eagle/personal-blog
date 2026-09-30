import { error, json } from "./http.js";

const COOKIE = "blog_admin";
const WEEK = 60 * 60 * 24 * 7;

function secretFrom(env) {
  return env.AUTH_SECRET || env.ADMIN_PASSWORD || "";
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export async function makeToken(env) {
  const exp = Math.floor(Date.now() / 1000) + WEEK;
  const payload = `v1.${exp}`;
  const sig = await hmacHex(secretFrom(env), payload);
  return `${payload}.${sig}`;
}

export async function tokenValid(env, token) {
  if (!token || !secretFrom(env)) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ver, expStr, sig] = parts;
  if (ver !== "v1") return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmacHex(secretFrom(env), `${ver}.${expStr}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

export async function isAdmin(context) {
  const token = parseCookies(context.request)[COOKIE];
  return tokenValid(context.env, token);
}

export async function requireAdmin(context) {
  if (!context.env.ADMIN_PASSWORD) {
    return error("ADMIN_PASSWORD is not set on this project.", 500);
  }
  if (!(await isAdmin(context))) {
    return error("Sign in required.", 401);
  }
  return null;
}

function cookieFlags() {
  return "Path=/; HttpOnly; Secure; SameSite=Lax";
}

export async function loginResponse(env, password) {
  if (!env.ADMIN_PASSWORD) {
    return error("ADMIN_PASSWORD is not set on this project.", 500);
  }
  if (typeof password !== "string" || password.length === 0) {
    return error("Password required.", 400);
  }
  if (password !== env.ADMIN_PASSWORD) {
    return error("Wrong password.", 401);
  }
  const token = await makeToken(env);
  return json(
    { ok: true },
    200,
    { "Set-Cookie": `${COOKIE}=${encodeURIComponent(token)}; Max-Age=${WEEK}; ${cookieFlags()}` }
  );
}

export function logoutResponse() {
  return json(
    { ok: true },
    200,
    { "Set-Cookie": `${COOKIE}=; Max-Age=0; ${cookieFlags()}` }
  );
}
