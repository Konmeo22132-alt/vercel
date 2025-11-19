import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "keys.json");
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}, null, 2));

    const loadData = () => JSON.parse(fs.readFileSync(filePath, "utf8"));
    const saveData = (data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    const cleanup = () => {
      const data = loadData();
      const now = Date.now();
      let changed = false;
      for (const [key, obj] of Object.entries(data)) {
        const exp = new Date(obj.expire_at).getTime();
        if (now > exp) {
          delete data[key];
          changed = true;
        }
      }
      if (changed) saveData(data);
    };

    cleanup();

    if (req.method === "GET") {
      const data = loadData();
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { key, hiwd, discord_id_user, credit, codes_used } = req.body || {};
      if (!key || !discord_id_user) return res.status(400).json({ error: "Missing key or discord_id_user" });

      const data = loadData();
      data[key] = {
        discord_id_user,
        hiwd: hiwd || null,
        credit: credit || 0,
        codes_used: codes_used || [],
        create_time: new Date().toISOString(),
        expire_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString()
      };

      saveData(data);
      return res.status(200).json({ success: true, data: data[key] });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
