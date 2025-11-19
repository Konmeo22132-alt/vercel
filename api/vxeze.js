let cache = {};

export default function handler(req, res) {
  try {
    const now = Date.now();
    for (const [key, obj] of Object.entries(cache)) {
      const exp = new Date(obj.expire_at).getTime();
      if (now > exp) delete cache[key];
    }

    if (req.method === "GET") {
      return res.status(200).json({ count: Object.keys(cache).length, data: cache });
    }

    if (req.method === "POST") {
      const { key, hiwd, discord_id_user, credit, codes_used } = req.body || {};
      if (!key || !discord_id_user) return res.status(400).json({ error: "Missing key or discord_id_user" });

      cache[key] = {
        discord_id_user,
        hiwd: hiwd || null,
        credit: credit || 0,
        codes_used: codes_used || [],
        create_time: new Date().toISOString(),
        expire_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString()
      };

      return res.status(200).json({ success: true, data: cache[key] });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
