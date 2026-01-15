import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const { keyname, uid, recaptchaToken } = req.body || {};
  if (!keyname || !uid || !recaptchaToken) {
    return res.status(400).json({ ok: false, error: "missing_fields" });
  }

  const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET; // v3 secret
  const HMAC_SECRET = process.env.HMAC_SECRET;           // giống bên bot
  const SCORE_MIN = parseFloat(process.env.RECAPTCHA_SCORE_MIN || "0.5"); // 0.3~0.7 tùy bạn

  if (!RECAPTCHA_SECRET || !HMAC_SECRET) {
    return res.status(500).json({ ok: false, error: "missing_env" });
  }

  const verifyUrl =
    "https://www.google.com/recaptcha/api/siteverify" +
    `?secret=${encodeURIComponent(RECAPTCHA_SECRET)}` +
    `&response=${encodeURIComponent(recaptchaToken)}`;

  let v;
  try {
    const resp = await fetch(verifyUrl, { method: "POST" });
    v = await resp.json();
  } catch {
    return res.status(502).json({ ok: false, error: "verify_failed" });
  }

  if (!v.success) {
    return res.status(403).json({ ok: false, error: "captcha_failed", details: v["error-codes"] || [] });
  }

  // reCAPTCHA v3 trả score + action (nếu bạn set action ở client)
  const score = typeof v.score === "number" ? v.score : -1;
  const action = (v.action || "").toString();

  if (action !== "proof") {
    return res.status(403).json({ ok: false, error: "bad_action", action });
  }

  if (!(score >= SCORE_MIN)) {
    return res.status(403).json({ ok: false, error: "low_score", score, min: SCORE_MIN });
  }

  const ts = Math.floor(Date.now() / 1000);
  const msg = `${keyname}|${uid}|${ts}`;
  const hmac = crypto.createHmac("sha256", HMAC_SECRET).update(msg).digest("hex");

  return res.status(200).json({
    ok: true,
    code: `${keyname}:${ts}.${hmac}`,
    ts,
    score,
  });
}
