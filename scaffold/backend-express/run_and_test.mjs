import 'dotenv/config';
import http from 'http';

// Import the server module which starts listening when imported
import './server.js';

const PORT = process.env.PORT || 3003;

function fetchMap() {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: PORT, path: '/events/1/map_data' }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

(async () => {
  try {
    // small delay to allow server to start
    await new Promise(r => setTimeout(r, 300));
    const result = await fetchMap();
    console.log('GET /events/1/map_data =>', result.status);
    console.log(result.body);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();
