import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), "keys.json");

  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}, null, 2));

  const loadKeys = () => JSON.parse(fs.readFileSync(filePath, "utf8"));
  const saveKeys = (data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  const cleanupExpired = () => {
    const data = loadKeys();
    const now = Date.now();
    const expireMs = 6 * 3600 * 1000; // 6 giờ
    let changed = false;
    for (const [k, v] of Object.entries(data)) {
      const created = new Date(v.create_time).getTime();
      if (now - created >= expireMs) {
        delete data[k];
        changed = true;
      }
    }
    if (changed) saveKeys(data);
  };

  cleanupExpired();

  if (req.method === "GET") {
    const data = loadKeys();
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    try {
      const { key, create_time, hiwd, discord_id_user } = req.body || {};
      if (!key || !discord_id_user)
        return res.status(400).json({ error: "Missing required fields" });

      const data = loadKeys();
      data[key] = {
        time: "6",
        create_time: create_time || new Date().toISOString(),
        hiwd,
        discord_id_user,
        expire_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString()
      };
      saveKeys(data);

      return res.status(200).json({
        success: true,
        message: "Key saved successfully (expires in 6 hours)",
        data: data[key]
      });
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
