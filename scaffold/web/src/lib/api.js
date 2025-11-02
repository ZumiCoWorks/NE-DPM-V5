// Small API helper for the MapEditor to call the Express backend.
const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3003';

export async function getMapData(eventId) {
  const res = await fetch(`${BASE}/events/${eventId}/map_data`);
  if (!res.ok) throw new Error('Failed to fetch map data');
  return res.json();
}

export async function createEventMap({ event_id, storage_url }) {
  const res = await fetch(`${BASE}/event_maps`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event_id, storage_url }) });
  if (!res.ok) throw new Error('Failed to create map');
  return res.json();
}

export async function createPoi(poi) {
  const res = await fetch(`${BASE}/pois`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(poi) });
  if (!res.ok) throw new Error('Failed to create poi');
  return res.json();
}

export async function createPath(path) {
  const res = await fetch(`${BASE}/paths`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(path) });
  if (!res.ok) throw new Error('Failed to create path');
  return res.json();
}
