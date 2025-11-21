// vxeze.js (vercel)

import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "keys.json");
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}, null, 2));

    const load = () => JSON.parse(fs.readFileSync(filePath, "utf8"));
    const save = (data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    if (req.method === "GET") {
      return res.status(200).json({ count: Object.keys(load()).length, data: load() });
    }

    if (req.method === "POST") {
      const { key, hiwd, discord_id_user, credit, codes_used } = req.body || {};
      if (!key || !discord_id_user) return res.status(400).json({ error: "Missing key or discord_id_user" });

      const data = load();
      data[key] = {
        discord_id_user,
        hiwd: hiwd || null,
        credit: credit || 0,
        codes_used: codes_used || [],
        create_time: new Date().toISOString()
      };
      save(data);
      return res.status(200).json({ success: true, data: data[key] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
