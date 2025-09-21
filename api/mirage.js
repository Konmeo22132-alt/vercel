let cache = [];

export default function handler(req, res) {
  if (req.method === "POST") {
    const jobs = Array.isArray(req.body) ? req.body : [req.body];

    jobs.forEach(job => {
      cache.push({
        ...job,
        expireTime: Date.now() + 2 * 60 * 1000 
      });
    });

    return res.status(200).json({ message: "Jobs added", count: cache.length });
  }

  if (req.method === "GET") {
    const now = Date.now();
    cache = cache.filter(job => job.expireTime > now);

    return res.status(200).json(cache);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
