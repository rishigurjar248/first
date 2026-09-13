import crypto from "node:crypto";
import { createSession, sessionCookie } from "../lib/auth.js";

function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const ah = crypto.createHash("sha256").update(a, "utf8").digest();
  const bh = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(ah, bh);
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const configuredEmail = process.env.ADMIN_EMAIL;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!configuredEmail || !configuredPassword || !sessionSecret) {
    return res.status(500).json({ error: "Admin authentication is not configured." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  const valid = email === configuredEmail.trim().toLowerCase() && sameSecret(password, configuredPassword);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  res.setHeader("Set-Cookie", sessionCookie(createSession()));
  return res.status(200).json({ authenticated: true });
}
