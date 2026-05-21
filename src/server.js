import http from 'http';
import { config } from './config/index.js';

/**
 * Starts a basic HTTP server for health checks and keep-alive pings (useful for platforms like Render).
 * @returns {http.Server} The HTTP server instance.
 */
export function startServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Discord Bot is Online and Monitoring Voice Channels.');
  });

  server.listen(config.port, () => {
    console.log(`Web server listening on port ${config.port}`);
  });

  return server;
}
export default startServer;
