import { getCookie, verifySession, COOKIE_NAME } from "../lib/auth.js";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const ok = verifySession(getCookie(req, COOKIE_NAME));
  return res.status(ok ? 200 : 401).json({ authenticated: ok });
}
