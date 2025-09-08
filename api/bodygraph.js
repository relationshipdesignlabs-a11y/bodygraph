export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { birthdate, birthtime, location } = req.body || {};
    if (!birthdate || !birthtime || !location) {
      return res.status(400).json({ error: 'Missing birthdate, birthtime, or location.' });
    }
    const upstream = 'https://api.humandesignapi.nl/v1/bodygraphs';
    const r = await fetch(upstream, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'HD-Api-Key': process.env.HD_API_KEY,
        'HD-Geocode-Key': process.env.GEO_API_KEY
      },
      body: JSON.stringify({ birthdate, birthtime, location })
    });
    const text = await r.text();
    // Try to proxy content-type through
    const ct = r.headers.get('content-type') || 'application/json';
    res.setHeader('content-type', ct);
    return res.status(r.status).send(text);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
