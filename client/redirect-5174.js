import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(302, { Location: `http://localhost:5173${req.url}` });
  res.end();
});

server.on('error', (err) => {
  console.log('[Redirect 5174] Port busy or error:', err.message);
});

server.listen(5174, '127.0.0.1', () => {
  console.log('[Redirect 5174] Active: http://localhost:5174 -> http://localhost:5173');
});
