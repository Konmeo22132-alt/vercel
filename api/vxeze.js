let cache = {}; // Lưu tạm trong memory – Vercel serverless reset khi sleep

function safeError(res, message, err) {
  return res.status(500).json({
    error: message,
    details: err?.message || err || 'Unknown error'
  });
}

function cleanupExpired() {
  const now = Date.now();
  const expireMs = 6 * 3600 * 1000; // 6 giờ
  for (const [key, data] of Object.entries(cache)) {
    const created = new Date(data.create_time).getTime();
    if (now - created >= expireMs) delete cache[key]; // Tự động xoá key hết hạn
  }
}

export default function handler(req, res) {
  try {
    cleanupExpired();

    // 📌 GET – Xem data API
    if (req.method === 'GET') {
      if (req.query.raw === 'true') {
        return res.status(200).json(cache); // XEM FULL DATA
      }

      const userId = req.query.user;
      if (userId) {
        const userData = Object.values(cache).filter(x => x.discord_id_user === userId);
        return res.status(200).json(userData);
      }

      return res.status(200).json({
        count: Object.keys(cache).length,
        keys: Object.keys(cache).slice(0, 10)
      });
    }

    // 📌 POST – Lưu key từ bot
    if (req.method === 'POST') {
      const { key, create_time, hiwd, discord_id_user } = req.body || {};

      if (!key || !discord_id_user) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      cache[key] = {
        time: '6',
        create_time: create_time || new Date().toISOString(),
        hiwd,
        discord_id_user,
        expire_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString()
      };

      return res.status(200).json({
        success: true,
        message: 'Key saved successfully (expires in 6 hours)',
        data: cache[key]
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return safeError(res, 'API crashed', err);
  }
}
