// Serves a production build (dist/ride/browser, or the folder given) for the Playwright behaviour specs as the static
// host serves it (ADR 0043, L2-149 AC1): it reads the `staticwebapp.config.json` the build carries and follows it, so
// every spec runs the app under the headers a rider gets (L2-131, L2-009 AC2). Of that file it follows
// `globalHeaders`, `routes` (the first route that matches adds its `headers` over the global ones), `mimeTypes` and
// `navigationFallback`: an address that matches no file is answered with the file `rewrite` names, unless a pattern
// of `exclude` matches it, which is 404. A pattern is a path in which `*` stands for any characters and `{a,b}` for
// one of the names listed. It redirects nothing: the redirect from plain http is the host's own (docs/deployment.md).
// Usage: node scripts/serve-dist.mjs [port] [folder]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(
  new URL(`../${(process.argv[3] ?? 'dist/ride/browser').replace(/\/?$/, '/')}`, import.meta.url),
);
const port = Number(process.argv[2] ?? 4300);
const host = JSON.parse(await readFile(join(root, 'staticwebapp.config.json'), 'utf8'));

/** A pattern of the host's configuration as a test of a path. */
function pattern(text) {
  const source = text
    .replace(/[.+?^$()|[\]\\]/g, '\\$&')
    .replace(/\{([^}]*)\}/g, (_, names) => `(?:${names.split(',').join('|')})`)
    .replace(/\*/g, '.*');
  return new RegExp(`^${source}$`);
}

const routes = (host.routes ?? []).map((route) => ({
  matches: pattern(route.route),
  headers: route.headers ?? {},
}));
const excluded = (host.navigationFallback?.exclude ?? []).map(pattern);
const fallback = host.navigationFallback?.rewrite;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  ...host.mimeTypes,
};

async function file(path) {
  try {
    return (await stat(path)).isFile() ? path : null;
  } catch {
    return null;
  }
}

/** The headers the configuration gives `pathname`: the global ones, then those of the first route that matches. */
function headers(pathname) {
  return {
    ...host.globalHeaders,
    ...routes.find((route) => route.matches.test(pathname))?.headers,
  };
}

createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const candidate = normalize(join(root, pathname));
  const found =
    candidate.startsWith(root) || candidate + sep === root ? await file(candidate) : null;
  const falls = !found && fallback && !excluded.some((exclude) => exclude.test(pathname));
  const path = found ?? (falls ? join(root, fallback) : null);
  try {
    if (!path) throw new Error('not found');
    const body = await readFile(path);
    res.writeHead(200, {
      ...headers(pathname),
      'content-type': types[extname(path)] ?? 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { ...host.globalHeaders, 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} on http://127.0.0.1:${port}`));
