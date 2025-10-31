const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3001;

// In-memory store for demo purposes
const engagements = [];

const sampleMapData = {
  map_url: 'https://example.com/maps/campus_map.png',
  pois: [
    { id: 1, name: 'Main Entrance', type: 'localization', x: 100, y: 50 },
    { id: 2, name: 'BCom Project 1', type: 'booth', x: 400, y: 300 },
    { id: 3, name: 'Hall 2 Junction', type: 'localization', x: 250, y: 200 }
  ],
  paths: [
    { start: 1, end: 3, distance: 180 },
    { start: 3, end: 2, distance: 220 }
  ]
};

function sendJSON(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      if (!body) return resolve(null);
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const method = req.method;
  const path = parsed.pathname;

  // GET /events/:id/map_data
  const mapDataMatch = path.match(/^\/events\/(\d+)\/map_data\/?$/);
  if (method === 'GET' && mapDataMatch) {
    // For demo, we ignore the :id and return sampleMapData
    return sendJSON(res, 200, sampleMapData);
  }

  // POST /events/:id/engage
  const engageMatch = path.match(/^\/events\/(\d+)\/engage\/?$/);
  if (method === 'POST' && engageMatch) {
    try {
      const body = await parseJSONBody(req);
      const eventId = engageMatch[1];
      const record = {
        id: engagements.length + 1,
        event_id: Number(eventId),
        payload: body,
        timestamp: new Date().toISOString()
      };
      engagements.push(record);
      console.log('Engagement logged:', JSON.stringify(record));
      return sendJSON(res, 201, { success: true, record });
    } catch (err) {
      return sendJSON(res, 400, { error: 'invalid_json', message: err.message });
    }
  }

  // POST /leads/scan (simple echo for demo)
  if (method === 'POST' && path === '/leads/scan') {
    try {
      const body = await parseJSONBody(req);
      // In a real server we'd call Quicket API and store the lead
      const lead = { id: Date.now(), enriched: true, source: body };
      console.log('Lead scanned (demo):', lead);
      return sendJSON(res, 201, { success: true, lead });
    } catch (err) {
      return sendJSON(res, 400, { error: 'invalid_json', message: err.message });
    }
  }

  // Fallback
  sendJSON(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`NavEaze demo server (CommonJS) running on http://localhost:${PORT}`);
});

// Export for tests (not required) - keep CJS style
module.exports = server;
