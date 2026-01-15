import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const { keyname, uid, recaptchaToken } = req.body || {};
  if (!keyname || !uid || !recaptchaToken) {
    return res.status(400).json({ ok: false, error: "missing_fields" });
  }

  const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
  const HMAC_SECRET = process.env.HMAC_SECRET;

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
  } catch (e) {
    return res.status(502).json({ ok: false, error: "verify_failed" });
  }

  if (!v.success) {
    return res.status(403).json({ ok: false, error: "captcha_failed", details: v["error-codes"] || [] });
  }

  const ts = Math.floor(Date.now() / 1000);
  const msg = `${keyname}|${uid}|${ts}`;
  const hmac = crypto.createHmac("sha256", HMAC_SECRET).update(msg).digest("hex");

  return res.status(200).json({
    ok: true,
    code: `${keyname}:${ts}.${hmac}`,
    ts,
  });
}
