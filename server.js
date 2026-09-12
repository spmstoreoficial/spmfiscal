// ==============================================================================
// SPM STORE SISTEMA FISCAL - ENTRYPOINT DE PRODUÇÃO (NODE.JS ESM)
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const candidateServerPaths = [
  path.join(__dirname, 'dist', 'server.cjs'),
  path.join(__dirname, 'server.cjs'),
  path.join(process.cwd(), 'dist', 'server.cjs')
];

const serverPath = candidateServerPaths.find(p => fs.existsSync(p));

if (serverPath) {
  console.log(`[SPM Store Fiscal] Iniciando servidor de produção via: ${serverPath}`);
  require(serverPath);
} else {
  console.error('[ERRO CRÍTICO] O arquivo "dist/server.cjs" não foi encontrado.');
  console.error('Execute "npm run build" antes de iniciar o servidor em produção.');
  process.exit(1);
}
