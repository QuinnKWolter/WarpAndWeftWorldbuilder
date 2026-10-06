import { createServer } from 'node:http';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 3000);
const canonical = process.env.ORIGIN ? new URL(process.env.ORIGIN) : undefined;
if (canonical && !['http:', 'https:'].includes(canonical.protocol))
  throw new Error('ORIGIN must be an HTTP or HTTPS origin.');
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('PORT must be between 1 and 65535.');
// Adapter-node 6 assumes HTTPS without a protocol header. These headers are owned and overwritten by this launcher.
process.env.PROTOCOL_HEADER = 'x-storygraph-protocol';
process.env.HOST_HEADER = 'x-storygraph-host';
process.env.PORT_HEADER = '';
process.env.BODY_SIZE_LIMIT ??= '20M';
const { handler } = await import('../build/handler.js');
const server = createServer((request, response) => {
  request.headers['x-storygraph-protocol'] = canonical?.protocol.slice(0, -1) ?? 'http';
  request.headers['x-storygraph-host'] = canonical?.host ?? request.headers.host;
  handler(request, response);
});
server.listen(port, host, () =>
  console.log(`Warp & Weft Worldbuilder listening on http://${host}:${port}`)
);
function stop() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 10000).unref();
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
