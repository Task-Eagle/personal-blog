import { json } from "../_lib/http.js";
import { isAdmin } from "../_lib/auth.js";

export async function onRequestGet(context) {
  return json({ admin: await isAdmin(context) });
}
