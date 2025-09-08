// /api/places.js - server-assisted Place Autocomplete (keeps key private)
export default async function handler(req, res) {
  try{
    const { q = '', session = '' } = req.query;
    if(!q) return res.status(200).json({ predictions: [] });

    const key = process.env.GEO_API_KEY;
    if(!key) return res.status(500).json({ error: 'Missing GEO_API_KEY' });

    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', q);
    url.searchParams.set('language', 'en');
    url.searchParams.set('types', '(cities)'); // prefer cities/localities
    if(session) url.searchParams.set('sessiontoken', session);
    url.searchParams.set('key', key);

    const r = await fetch(url, { method:'GET' });
    const j = await r.json();
    const predictions = (j.predictions || []).map(p => ({
      description: p.description,
      place_id: p.place_id
    }));
    res.status(200).json({ predictions });
  }catch(err){
    console.error(err);
    res.status(200).json({ predictions: [] });
  }
}
