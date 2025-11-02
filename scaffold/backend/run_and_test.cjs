// run_and_test.cjs
// Starts the demo server (by requiring server.cjs) and immediately performs
// an HTTP GET to the /events/1/map_data endpoint to verify behavior.

const http = require('http');
const PORT = process.env.PORT || 3001;

// Require the server file; it starts listening when required and exports the server instance.
const server = require('./server.cjs');

function fetchMapData() {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: 'localhost', port: PORT, path: '/events/1/map_data' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
  });
}

(async () => {
  try {
    // Wait a short moment to let the server finish starting if needed
    await new Promise(r => setTimeout(r, 200));
    const result = await fetchMapData();
    console.log('GET /events/1/map_data =>', result.statusCode);
    console.log(result.body);
  } catch (err) {
    console.error('Error fetching map data:', err);
  } finally {
    // Close the server and exit
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
    // Force exit after 2s if close hangs
    setTimeout(() => process.exit(0), 2000);
  }
})();
