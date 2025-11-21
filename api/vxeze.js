let cache = {}; // Lưu dữ liệu RAM – không ghi file

export default function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({ count: Object.keys(cache).length, data: cache });
    }

    if (req.method === "POST") {
      if (req.body.delete_key) {
        const k = req.body.delete_key;
        delete cache[k];
        return res.status(200).json({ success: true, deleted: k });
      }

      const { key, hiwd, discord_id_user, credit, codes_used } = req.body || {};
      if (!key || !discord_id_user) {
        return res.status(400).json({ error: "Missing key or discord_id_user" });
      }

      cache[key] = {
        discord_id_user,
        hiwd: hiwd || "insigned",
        credit: credit || 0,
        codes_used: codes_used || [],
        create_time: new Date().toISOString()
      };

      return res.status(200).json({ success: true, data: cache[key] });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
