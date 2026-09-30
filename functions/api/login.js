import { error, readJson } from "../_lib/http.js";
import { loginResponse } from "../_lib/auth.js";

export async function onRequestPost(context) {
  const body = await readJson(context.request);
  if (!body) return error("Invalid JSON.", 400);
  return loginResponse(context.env, body.password);
}
