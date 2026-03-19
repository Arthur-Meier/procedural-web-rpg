import http, { IncomingMessage, ServerResponse } from "http";
import { createReadStream, existsSync, statSync } from "fs";
import { extname, join, normalize } from "path";

const PORT = Number(process.env.PORT || 4174);
const ROOT = process.cwd();

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

function sendFile(response: ServerResponse, filePath: string): void {
  const extension = extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": CONTENT_TYPES[extension] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(response);
}

const server = http.createServer((request: IncomingMessage, response: ServerResponse) => {
  const requestUrl = request.url || "/";
  const urlPath = requestUrl === "/" ? "/index.html" : requestUrl;
  const safePath = normalize(join(ROOT, decodeURIComponent(urlPath))).replace(/\\/g, "/");
  const safeRoot = ROOT.replace(/\\/g, "/");

  if (!safePath.startsWith(safeRoot)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Acesso negado.");
    return;
  }

  if (!existsSync(safePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Arquivo nao encontrado.");
    return;
  }

  const stats = statSync(safePath);
  if (stats.isDirectory()) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Diretorios nao podem ser servidos diretamente.");
    return;
  }

  sendFile(response, safePath);
});

server.listen(PORT, () => {
  console.log(`Servidor pronto em http://localhost:${PORT}`);
});
