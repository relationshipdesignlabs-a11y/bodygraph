// /api/place-details.js - resolve formatted address for a place_id
export default async function handler(req, res) {
  try{
    const { place_id = '', session = '' } = req.query;
    if(!place_id) return res.status(200).json({});

    const key = process.env.GEO_API_KEY;
    if(!key) return res.status(500).json({ error: 'Missing GEO_API_KEY' });

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', place_id);
    url.searchParams.set('fields', 'formatted_address,address_component,geometry,utc_offset');
    if(session) url.searchParams.set('sessiontoken', session);
    url.searchParams.set('key', key);

    const r = await fetch(url, { method:'GET' });
    const j = await r.json();
    const result = j.result || {};
    res.status(200).json({ formatted_address: result.formatted_address || '', components: result.address_components || [], geometry: result.geometry || null });
  }catch(err){
    console.error(err);
    res.status(200).json({});
  }
}
