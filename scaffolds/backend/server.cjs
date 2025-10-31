const http = require('http');
const url = require('url');

const port = process.env.PORT || 3001;

// Simple in-memory sample data to emulate map_data and engagements
const sampleMapData = {
  event_id: '1',
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

const engagements = [];

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const method = req.method;
  const path = parsed.pathname;

  // GET /events/:id/map_data
  const mapDataMatch = path.match(/^\/events\/(\d+)\/map_data\/?$/);
  if (method === 'GET' && mapDataMatch) {
    // return sample map data
    return sendJson(res, 200, sampleMapData);
  }

  // POST /events/:id/engage
  const engageMatch = path.match(/^\/events\/(\d+)\/engage\/?$/);
  if (method === 'POST' && engageMatch) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const json = body ? JSON.parse(body) : {};
        const record = {
          id: engagements.length + 1,
          event_id: engageMatch[1],
          timestamp: new Date().toISOString(),
          payload: json
        };
        engagements.push(record);
        console.log('[engage] new record:', record);
        return sendJson(res, 201, { success: true, record });
      } catch (err) {
        return sendJson(res, 400, { error: 'invalid json' });
      }
    });
    return;
  }

  // Fallback
  sendJson(res, 404, { error: 'not found' });
});

server.listen(port, () => {
  console.log(`Minimal NavEaze backend running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET /events/:id/map_data');
  console.log('  POST /events/:id/engage');
});

// Export for testability
module.exports = { server, sampleMapData, engagements };
