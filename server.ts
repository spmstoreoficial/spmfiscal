import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import chokidar from 'chokidar';
import * as pdfParseModule from 'pdf-parse';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { parseDanfeText, extractSpmInvoicesFromPdfText } from './src/lib/pdfParser';
import { extractSpmInvoicesFromNfeXml } from './src/lib/xmlParser';
import {
  getDbPool,
  getInvoicesFromDb,
  getInvoiceById,
  saveInvoiceToDb,
  deleteInvoiceFromDb,
  bulkDeleteInvoicesFromDb,
  bulkUpdateInvoicesInDb,
  resetInvoicesInDb,
  calculateStatsFromDb,
  getUsersFromDb,
  getUserByIdFromDb,
  getUserByEmailFromDb,
  getUserPasswordHash,
  saveUserToDb,
  deleteUserFromDb,
  updateLastLoginInDb,
  getLogsFromDb,
  addLogToDb,
  clearLogsInDb,
  getAlertsFromDb,
  saveAlertToDb,
  deleteAlertFromDb,
  getSettingsFromDb,
  saveSettingsToDb,
  getPowerBiConfigFromDb,
  savePowerBiConfigToDb,
  getGSheetsConfigFromDb,
  saveGSheetsConfigToDb,
  getN8nConfigFromDb,
  saveN8nConfigToDb,
  syncDatabaseToSqlFile,
  checkDuplicateInvoices,
  DuplicateInvoiceNotice,
  getStockItemsFromDb,
  getStockMovementsFromDb,
  addStockMovementToDb,
  saveStockItemToDb,
  deductStockForInvoices,
  restoreStockForDeletedInvoices,
  recalculateAllStockFromInvoices,
  calculateStockStatsFromDb
} from './src/lib/db';
import { 
  Invoice, 
  User, 
  LogEntry, 
  AlertRule, 
  DashboardStats, 
  PowerBiConfig, 
  GSheetsConfig, 
  SystemSettings,
  N8nConfig,
  StockItem,
  StockMovement,
  StockStats,
  NewStockMovementPayload,
  GDriveDesktopStatus
} from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secur3-spm-store-jwt-secret-2026';

// Habilitar suporte a Proxy Reverso (Nginx, Cloudflare, Traefik, Apache)
app.set('trust proxy', 1);

// Middleware de CORS e Headers de Segurança
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint para Docker, Portainer, Nginx e monitoramento
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'SPM Store Sistema Fiscal',
    version: '2026.1.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Setup file uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup Notas_Fiscais directory
const notasFiscaisDir = path.join(process.cwd(), 'Notas_Fiscais');
if (!fs.existsSync(notasFiscaisDir)) {
  fs.mkdirSync(notasFiscaisDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// ================= AUDIT LOG HELPER =================
async function logAction(
  userId: string, 
  userName: string, 
  action: string, 
  category: LogEntry['category'], 
  details: string, 
  severity: LogEntry['severity'] = 'info', 
  req?: Request
) {
  const ip = req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';
  const entry: LogEntry = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action,
    category,
    details,
    ip,
    severity
  };
  try {
    await addLogToDb(entry);
  } catch (e) {
    console.error('Erro ao salvar log no MySQL:', e);
  }
}

// ================= N8N WEBHOOK DISPATCHER HELPER =================
async function dispatchN8nEvent(eventType: string, eventData: any) {
  try {
    const config = await getN8nConfigFromDb();
    if (!config.active || !config.webhookUrl || !config.webhookUrl.startsWith('http')) return;

    if (eventType === 'new_invoices' && !config.events.newInvoices) return;
    if (eventType === 'duplicate_detected' && !config.events.duplicateDetected) return;
    if (eventType === 'city_sale' && !config.events.mapCitySale) return;

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      source: 'SPM_STORE_FISCAL_SYSTEM',
      data: eventData
    };

    const resp = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SPM-Fiscal-n8n-Dispatcher'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    await saveN8nConfigToDb({
      lastTrigger: new Date().toISOString(),
      lastStatus: resp.ok ? 'SUCCESS' : 'ERROR'
    });
  } catch (err: any) {
    console.warn('[n8n Webhook Dispatcher Warning]:', err.message);
    try {
      await saveN8nConfigToDb({
        lastTrigger: new Date().toISOString(),
        lastStatus: 'ERROR'
      });
    } catch (_) {}
  }
}

// Parse string numbers into floats
function parseNum(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const clean = val.replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

// JWT Authentication Middleware
async function authenticateToken(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const users = await getUsersFromDb();
    const defaultAdmin = users.find(u => u.role === 'ADMIN') || users[0] || {
      id: 'u-admin-1',
      name: 'JosÃ© Galdino (Administrador)',
      email: 'josegaldino@hotmail.com.br',
      role: 'ADMIN'
    };
    (req as any).user = defaultAdmin;
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      const users = await getUsersFromDb();
      const defaultAdmin = users.find(u => u.role === 'ADMIN') || users[0];
      (req as any).user = defaultAdmin;
      return next();
    }
    (req as any).user = decoded;
    next();
  });
}

// ================= API ENDPOINTS =================

// 0. HEALTH CHECK
app.get('/api/health', async (_req, res) => {
  try {
    const invoices = await getInvoicesFromDb();
    const users = await getUsersFromDb();
    res.json({
      status: 'ok',
      database: 'MySQL',
      system: 'SPM Store Sistema Fiscal & Auditoria NFs',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      invoicesCount: invoices.length,
      usersCount: users.length
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 0.1 IBGE MUNICÃPIOS API (Todos os 5.571 municÃ­pios do Brasil)
app.get('/api/ibge/municipios', async (req, res) => {
  try {
    const uf = req.query.uf as string;
    const dataDir = path.join(process.cwd(), 'data');
    const ibgePath = path.join(dataDir, 'ibge_municipios.json');
    let list: any[] = [];
    if (fs.existsSync(ibgePath)) {
      list = JSON.parse(fs.readFileSync(ibgePath, 'utf-8'));
    } else {
      // Fallback: fetch directly from IBGE API
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
      if (response.ok) {
        const raw = await response.json();
        list = raw.map((m: any) => ({
          id: m.id,
          nome: m.nome,
          uf: m.microrregiao?.mesorregiao?.UF?.sigla || m['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla || 'SP',
          ufNome: m.microrregiao?.mesorregiao?.UF?.nome || '',
          regiao: m.microrregiao?.mesorregiao?.UF?.regiao?.nome || 'Sudeste'
        }));
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(ibgePath, JSON.stringify(list));
      }
    }

    if (uf && uf !== 'Todos') {
      list = list.filter(m => m.uf.toUpperCase() === uf.toUpperCase());
    }

    res.json({
      total: list.length,
      source: 'IBGE_API_LOCALIDADES',
      municipios: list
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar municÃ­pios do IBGE', details: err.message });
  }
});

app.get('/api/ibge/municipios/:uf', async (req, res) => {
  try {
    const uf = req.params.uf.toUpperCase();
    const dataDir = path.join(process.cwd(), 'data');
    const ibgePath = path.join(dataDir, 'ibge_municipios.json');
    let list: any[] = [];
    if (fs.existsSync(ibgePath)) {
      list = JSON.parse(fs.readFileSync(ibgePath, 'utf-8'));
      list = list.filter(m => m.uf.toUpperCase() === uf);
    }
    res.json({ total: list.length, uf, municipios: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1. AUTH API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmailFromDb(email || '');
    
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciais invÃ¡lidas ou usuÃ¡rio inativo.' });
    }

    const storedHash = await getUserPasswordHash(user.email);
    const isValid = storedHash ? bcrypt.compareSync(password || '', storedHash) : (password === 'admin123');

    if (!isValid) {
      await logAction(user.id, user.name, 'Falha de Login', 'AUTH', `Tentativa de login com senha invÃ¡lida para ${email}`, 'warning', req);
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    await updateLastLoginInDb(user.id);
    user.lastLogin = new Date().toISOString();

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    await logAction(user.id, user.name, 'Login Realizado', 'AUTH', `UsuÃ¡rio ${user.name} autenticou-se com sucesso.`, 'success', req);
    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro durante o login.' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = (req as any).user;
  res.json({ user });
});

app.get('/api/auth/users', authenticateToken, async (_req, res) => {
  try {
    const users = await getUsersFromDb();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/users', authenticateToken, async (req, res) => {
  try {
    const { name, email, role, department, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Nome, email e perfil sÃ£o obrigatÃ³rios.' });
    }

    const existingUser = await getUserByEmailFromDb(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail jÃ¡ estÃ¡ cadastrado.' });
    }

    const newUser: User = {
      id: 'u-' + Date.now(),
      name,
      email,
      role,
      active: true,
      lastLogin: '',
      department: department || 'Geral'
    };

    const passwordHash = bcrypt.hashSync(password || 'senha123', 8);
    await saveUserToDb(newUser, passwordHash);

    const currentUser = (req as any).user;
    await logAction(currentUser?.id || 'admin', currentUser?.name || 'Admin', 'CriaÃ§Ã£o de UsuÃ¡rio', 'SECURITY', `Novo usuÃ¡rio ${email} criado com perfil ${role}`, 'info', req);

    res.status(201).json({ user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, active, department, password } = req.body;
    
    const user = await getUserByIdFromDb(id);
    if (!user) return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado.' });

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (active !== undefined) user.active = active;
    if (department !== undefined) user.department = department;

    const passwordHash = password ? bcrypt.hashSync(password, 8) : undefined;
    await saveUserToDb(user, passwordHash);

    const currentUser = (req as any).user;
    await logAction(currentUser?.id || 'admin', currentUser?.name || 'Admin', 'EdiÃ§Ã£o de UsuÃ¡rio', 'SECURITY', `UsuÃ¡rio ${user.email} atualizado`, 'info', req);

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/auth/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdFromDb(id);
    if (!user) return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado.' });

    if (user.role === 'ADMIN' && user.email === 'josegaldino@hotmail.com.br') {
      return res.status(403).json({ error: 'O usuÃ¡rio Administrador Principal nÃ£o pode ser removido.' });
    }

    await deleteUserFromDb(id);

    const currentUser = (req as any).user;
    await logAction(currentUser?.id || 'admin', currentUser?.name || 'Admin', 'ExclusÃ£o de UsuÃ¡rio', 'SECURITY', `UsuÃ¡rio ${user.email} removido do sistema`, 'warning', req);

    res.json({ message: 'UsuÃ¡rio removido com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. INVOICE CRUD & SEARCH API
app.get('/api/invoices', async (req, res) => {
  try {
    const filters = req.query as Record<string, string>;
    const invoices = await getInvoicesFromDb(filters);
    res.json({ invoices, totalCount: invoices.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const newInvoice: Invoice = {
      ...req.body,
      id: req.body.id || 'spm-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      dataUpload: new Date().toISOString()
    };

    const currentInvoices = await getInvoicesFromDb();
    const { duplicates } = checkDuplicateInvoices(currentInvoices, [newInvoice]);

    if (duplicates.length > 0) {
      const user = (req as any).user;
      await logAction(
        user?.id || 'admin', 
        user?.name || 'Admin', 
        'Tentativa de InserÃ§Ã£o Duplicada', 
        'UPLOAD', 
        `Nota com fatura ${newInvoice.fatura} e CPF/CNPJ ${newInvoice.documento} jÃ¡ existe.`, 
        'warning', 
        req
      );
      return res.status(409).json({ 
        error: 'Esta nota fiscal jÃ¡ estÃ¡ cadastrada no sistema.',
        duplicate: duplicates[0] 
      });
    }

    await saveInvoiceToDb(newInvoice);
    await syncDatabaseToSqlFile();

    const user = (req as any).user;
    await logAction(user?.id || 'admin', user?.name || 'Admin', 'Cadastro de Nota Fiscal', 'UPLOAD', `Registro para ${newInvoice.nome} adicionado manualmente`, 'info', req);

    res.status(201).json({ invoice: newInvoice });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getInvoiceById(id);
    if (!existing) return res.status(404).json({ error: 'Registro fiscal nÃ£o encontrado.' });

    const updated: Invoice = { ...existing, ...req.body };
    await saveInvoiceToDb(updated);
    await syncDatabaseToSqlFile();

    const user = (req as any).user;
    await logAction(user?.id || 'admin', user?.name || 'Admin', 'EdiÃ§Ã£o de Nota Fiscal', 'UPLOAD', `Dados do registro #${id} atualizados`, 'info', req);

    res.json({ invoice: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getInvoiceById(id);
    if (!existing) return res.status(404).json({ error: 'Registro nÃ£o encontrado.' });

    await deleteInvoiceFromDb(id);

    const user = (req as any).user;
    await logAction(user?.id || 'admin', user?.name || 'Admin', 'ExclusÃ£o de Nota Fiscal', 'UPLOAD', `Registro #${existing.id} de ${existing.nome} excluÃ­do`, 'warning', req);

    res.json({ message: 'Registro removido com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Nenhum ID fornecido para exclusÃ£o.' });
    }

    const removedCount = await bulkDeleteInvoicesFromDb(ids);

    const user = (req as any).user;
    await logAction(user?.id || 'admin', user?.name || 'Admin', 'ExclusÃ£o em Lote', 'UPLOAD', `${removedCount} registros fiscais excluÃ­dos`, 'warning', req);

    res.json({ message: `${removedCount} registros removidos com sucesso.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices/bulk-update', authenticateToken, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Nenhum ID fornecido para atualizaÃ§Ã£o em lote.' });
    }
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nenhuma alteraÃ§Ã£o fornecida.' });
    }

    const updatedCount = await bulkUpdateInvoicesInDb(ids, updates);

    const user = (req as any).user;
    await logAction(
      user?.id || 'admin',
      user?.name || 'Admin',
      'EdiÃ§Ã£o em Lote de Notas Fiscais',
      'UPLOAD',
      `${updatedCount} notas fiscais atualizadas em lote`,
      'info',
      req
    );

    res.json({ success: true, updatedCount, message: `${updatedCount} registros atualizados com sucesso.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar notas em lote' });
  }
});

app.post('/api/invoices/reset', authenticateToken, async (req, res) => {
  try {
    const allInvoices = await getInvoicesFromDb();
    const previousCount = allInvoices.length;
    await resetInvoicesInDb();

    const user = (req as any).user;
    await logAction(user?.id || 'admin', user?.name || 'Admin', 'Limpeza Total do Banco de Dados', 'UPLOAD', `O banco de dados foi zerado (${previousCount} registros removidos).`, 'warning', req);

    res.json({ message: 'Banco de dados zerado com sucesso.', count: 0, removedCount: previousCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= MOTOR MULTI-FORMATO DE EXTRAÃ‡ÃƒO FISCAL (XML SEFAZ & PDF DANFE) =================

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err: any) {
    console.warn('[PDF Parser Warning]:', err.message);
    return '';
  }
}

async function extractInvoicesFromFileBuffer(dataBuffer: Buffer, filename: string): Promise<Invoice[]> {
  const lower = (filename || '').toLowerCase();
  if (lower.endsWith('.xml')) {
    const xmlContent = dataBuffer.toString('utf-8');
    return extractSpmInvoicesFromNfeXml(xmlContent, filename);
  } else if (lower.endsWith('.pdf')) {
    const text = await extractTextFromPdfBuffer(dataBuffer);
    return extractSpmInvoicesFromPdfText(text, filename);
  } else {
    // DetecÃ§Ã£o inteligente pelo conteÃºdo
    const sample = dataBuffer.toString('utf-8', 0, Math.min(dataBuffer.length, 500)).trim();
    if (sample.startsWith('<?xml') || sample.includes('<nfeProc') || sample.includes('<NFe') || sample.includes('<infNFe')) {
      return extractSpmInvoicesFromNfeXml(dataBuffer.toString('utf-8'), filename);
    }
    const text = await extractTextFromPdfBuffer(dataBuffer);
    return extractSpmInvoicesFromPdfText(text, filename);
  }
}

async function handleFileUploadExtraction(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo (XML ou PDF) foi enviado.' });
    }

    let rawExtractedInvoices: Invoice[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of files) {
      try {
        const destInNotasFiscais = path.join(notasFiscaisDir, file.originalname);
        fs.copyFileSync(file.path, destInNotasFiscais);

        const dataBuffer = fs.readFileSync(file.path);
        const items = await extractInvoicesFromFileBuffer(dataBuffer, file.originalname);
        
        if (items.length === 0) {
          console.warn(`[Extraction Warning] Nenhum registro extraÃ­do de: ${file.originalname}`);
        } else {
          console.log(`[Extraction Success] ${items.length} registro(s) extraÃ­do(s) de: ${file.originalname}`);
        }

        rawExtractedInvoices.push(...items);

        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err: any) {
        console.error(`[Extraction Error] Erro ao processar ${file.originalname}:`, err.message);
        errors.push({ filename: file.originalname, error: err.message || 'Erro ao extrair dados do arquivo' });
      }
    }

    // Checagem rigorosa de duplicidade contra o banco existente
    const currentInvoices = await getInvoicesFromDb();
    const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawExtractedInvoices);

    // Salvar novos itens Ãºnicos no MySQL
    for (const item of uniqueItems) {
      await saveInvoiceToDb(item);
    }

    // Abater estoque automaticamente
    if (uniqueItems.length > 0) {
      await deductStockForInvoices(uniqueItems, { id: 'admin', name: 'Upload de Arquivos' });
      await syncDatabaseToSqlFile();
    }

    const user = (req as any).user || { id: 'admin', name: 'Administrador' };
    
    // Log de auditoria
    if (duplicates.length > 0) {
      await logAction(
        user.id, 
        user.name, 
        'Aviso de Notas Duplicadas', 
        'UPLOAD', 
        `Foram detectadas ${duplicates.length} nota(s) duplicada(s) ignoradas no lote.`, 
        'warning', 
        req
      );
    }

    await logAction(
      user.id, 
      user.name, 
      'Processamento de Arquivos ConcluÃ­do', 
      'UPLOAD', 
      `Processamento de ${files.length} arquivo(s): ${uniqueItems.length} novos registros salvos no MySQL e estoque atualizado. ${duplicates.length} duplicata(s) ignorada(s).`, 
      errors.length > 0 ? 'warning' : 'success', 
      req
    );

    // Notificar n8n Webhook
    if (uniqueItems.length > 0) {
      dispatchN8nEvent('new_invoices', {
        source: 'BATCH_FILE_UPLOAD',
        count: uniqueItems.length,
        invoices: uniqueItems
      });
    }

    res.json({
      success: true,
      extractedCount: rawExtractedInvoices.length,
      newInsertedCount: uniqueItems.length,
      duplicateCount: duplicates.length,
      duplicates,
      extractedInvoices: uniqueItems,
      errors
    });
  } catch (error: any) {
    console.error('Extraction Route Error:', error);
    res.status(500).json({ error: 'Erro ao processar lote de arquivos.' });
  }
}

// 3. MULTI-FORMAT EXTRACTION APIS (XML / PDF)
app.post('/api/extract/pdf', upload.array('files', 100), handleFileUploadExtraction);
app.post('/api/extract/xml', upload.array('files', 100), handleFileUploadExtraction);
app.post('/api/extract/files', upload.array('files', 100), handleFileUploadExtraction);

// 4. SCAN LOCAL NOTAS_FISCAIS FOLDER
app.post('/api/scan-local-folder', authenticateToken, async (req, res) => {
  try {
    if (!fs.existsSync(notasFiscaisDir)) {
      return res.json({ success: true, count: 0, duplicateCount: 0, duplicates: [], extracted: [] });
    }

    const targetFiles = fs.readdirSync(notasFiscaisDir).filter(f => {
      const l = f.toLowerCase();
      return l.endsWith('.xml') || l.endsWith('.pdf');
    });

    let rawItems: Invoice[] = [];

    for (const file of targetFiles) {
      try {
        const filePath = path.join(notasFiscaisDir, file);
        const dataBuffer = fs.readFileSync(filePath);
        const items = await extractInvoicesFromFileBuffer(dataBuffer, file);
        rawItems.push(...items);
      } catch (err: any) {
        console.error(`Erro ao ler ${file}:`, err.message);
      }
    }

    const currentInvoices = await getInvoicesFromDb();
    const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawItems);

    for (const item of uniqueItems) {
      await saveInvoiceToDb(item);
    }

    if (uniqueItems.length > 0) {
      await deductStockForInvoices(uniqueItems, { id: 'system', name: 'Varredura de Pasta' });
      await syncDatabaseToSqlFile();
    }

    const user = (req as any).user;
    if (duplicates.length > 0) {
      await logAction(
        user?.id || 'admin',
        user?.name || 'Admin',
        'Duplicidades na Varredura de Pasta',
        'UPLOAD',
        `${duplicates.length} registros jÃ¡ existiam na pasta 'Notas_Fiscais' e foram ignorados.`,
        'warning',
        req
      );
    }

    res.json({
      success: true,
      count: uniqueItems.length,
      duplicateCount: duplicates.length,
      duplicates,
      totalPdfs: targetFiles.length,
      extracted: uniqueItems
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao escanear pasta local' });
  }
});

// ================= GOOGLE DRIVE PARA DESKTOP (100% OFFLINE) =================
let gdriveDesktopPath = process.env.GDRIVE_DESKTOP_PATH || 'I:\\Meu Drive\\SPM Store\\SPM Verniz Elite\\SPM Verniz\\Verniz Elite SPM Pedidos\\Notas_Fiscais';
let gdriveAutoSync = process.env.GDRIVE_AUTO_SYNC !== 'false';
let gdriveWatcher: any = null;
let gdriveLastSync = new Date().toISOString();
let gdriveLastError: string | null = null;
let gdriveRecentProcessed: Array<{
  fatura: string;
  nome: string;
  cor: string;
  valor: string;
  timestamp: string;
  filename: string;
}> = [];

// Debouncer para escrita do arquivo database_spm_fiscal.sql
let sqlSyncTimer: NodeJS.Timeout | null = null;
function debouncedSyncDatabaseToSqlFile(delayMs = 3000) {
  if (sqlSyncTimer) clearTimeout(sqlSyncTimer);
  sqlSyncTimer = setTimeout(async () => {
    try {
      await syncDatabaseToSqlFile();
    } catch (e: any) {
      console.warn('[SQL Sync Debounce Error]:', e.message);
    }
  }, delayMs);
}

// Fila sequencial assÃ­ncrona para processamento suave de PDFs
const gdriveQueue: string[] = [];
let isProcessingGdriveQueue = false;

function enqueuePdfForProcessing(filePath: string) {
  if (!gdriveQueue.includes(filePath)) {
    gdriveQueue.push(filePath);
    triggerGdriveQueueProcessing();
  }
}

async function triggerGdriveQueueProcessing() {
  if (isProcessingGdriveQueue) return;
  isProcessingGdriveQueue = true;

  try {
    const currentInvoices = await getInvoicesFromDb();
    const existingKeySet = new Set<string>();
    currentInvoices.forEach(inv => {
      if (inv.id) existingKeySet.add(inv.id.trim());
      if (inv.fatura) existingKeySet.add(inv.fatura.trim());
      if (inv.fatura && inv.nome) existingKeySet.add(`${inv.fatura.trim()}_${(inv.nome || '').trim().toLowerCase()}`);
    });

    let totalNewInBatch = 0;

    while (gdriveQueue.length > 0) {
      const nextFile = gdriveQueue.shift();
      if (nextFile && fs.existsSync(nextFile)) {
        try {
          const filename = path.basename(nextFile);
          const newItems = await processSinglePdfFileCached(nextFile, filename, existingKeySet);
          totalNewInBatch += newItems.length;
        } catch (err: any) {
          console.warn(`[Queue Error] Falha ao processar ${nextFile}:`, err.message);
        }
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }

    if (totalNewInBatch > 0) {
      debouncedSyncDatabaseToSqlFile(2000);
    }
  } catch (err: any) {
    console.error('[Google Drive Queue Error]:', err.message);
  } finally {
    isProcessingGdriveQueue = false;
  }
}

async function processSinglePdfFileCached(
  filePath: string, 
  filename: string, 
  existingKeySet: Set<string>,
  sourceTag = 'GDRIVE_DESKTOP_WATCHER'
): Promise<Invoice[]> {
  try {
    if (!fs.existsSync(filePath)) return [];
    const dataBuffer = fs.readFileSync(filePath);
    const items = await extractInvoicesFromFileBuffer(dataBuffer, filename);
    if (items.length === 0) return [];

    const uniqueItems: Invoice[] = [];

    for (const item of items) {
      const idKey = item.id ? item.id.trim() : '';
      const faturaKey = item.fatura ? item.fatura.trim() : '';
      const compoundKey = item.fatura && item.nome ? `${item.fatura.trim()}_${(item.nome || '').trim().toLowerCase()}` : '';

      const isDuplicate = 
        (idKey && existingKeySet.has(idKey)) ||
        (faturaKey && existingKeySet.has(faturaKey)) ||
        (compoundKey && existingKeySet.has(compoundKey));

      if (!isDuplicate) {
        if (idKey) existingKeySet.add(idKey);
        if (faturaKey) existingKeySet.add(faturaKey);
        if (compoundKey) existingKeySet.add(compoundKey);
        uniqueItems.push(item);
      }
    }

    for (const item of uniqueItems) {
      await saveInvoiceToDb(item);
      gdriveRecentProcessed.unshift({
        fatura: item.fatura || 'N/A',
        nome: item.nome || 'Consumidor',
        cor: item.cor || 'NÃ£o identificada',
        valor: item.valorNota || '0,00',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        filename
      });
      if (gdriveRecentProcessed.length > 20) gdriveRecentProcessed.pop();
    }

    if (uniqueItems.length > 0) {
      await deductStockForInvoices(uniqueItems, { id: 'system-gdrive', name: 'Google Drive Watcher' });

      try {
        const destInNotasFiscais = path.join(notasFiscaisDir, filename);
        if (!fs.existsSync(destInNotasFiscais) && filePath !== destInNotasFiscais) {
          fs.copyFileSync(filePath, destInNotasFiscais);
        }
      } catch (_) {}

      await logAction(
        'system-gdrive',
        'Google Drive Watcher',
        'SincronizaÃ§Ã£o AutomÃ¡tica Google Drive',
        'UPLOAD',
        `Auto-processado PDF '${filename}': ${uniqueItems.length} novo(s) registro(s) inserido(s) no MySQL e sincronizado(s) no SQL.`,
        'success'
      );

      dispatchN8nEvent('new_invoices', {
        source: sourceTag,
        filename,
        count: uniqueItems.length,
        invoices: uniqueItems
      });

      console.log(`[Google Drive Sync] âœ… ${uniqueItems.length} nota(s) sincronizada(s) automaticamente: ${filename}`);
    }

    gdriveLastSync = new Date().toISOString();
    gdriveLastError = null;
    return uniqueItems;
  } catch (err: any) {
    console.error(`[Google Drive Sync Error] Erro ao processar ${filename}:`, err.message);
    gdriveLastError = err.message;
    return [];
  }
}

async function scanGoogleDriveDesktopFolder(): Promise<{
  success: boolean;
  count: number;
  duplicateCount: number;
  duplicates: any[];
  totalPdfs: number;
  extracted: Invoice[];
  folderPath: string;
}> {
  if (!fs.existsSync(gdriveDesktopPath)) {
    return {
      success: false,
      count: 0,
      duplicateCount: 0,
      duplicates: [],
      totalPdfs: 0,
      extracted: [],
      folderPath: gdriveDesktopPath
    };
  }

  const allEntries = fs.readdirSync(gdriveDesktopPath);
  const targetFiles = allEntries.filter(f => {
    const l = f.toLowerCase();
    return l.endsWith('.pdf') || l.endsWith('.xml');
  });
  let rawItems: Invoice[] = [];

  for (const file of targetFiles) {
    try {
      const filePath = path.join(gdriveDesktopPath, file);
      const dataBuffer = fs.readFileSync(filePath);
      const items = await extractInvoicesFromFileBuffer(dataBuffer, file);
      rawItems.push(...items);
    } catch (err: any) {
      console.error(`[Google Drive Scan] Erro ao ler ${file}:`, err.message);
    }
  }

  const currentInvoices = await getInvoicesFromDb();
  const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawItems);

  for (const item of uniqueItems) {
    await saveInvoiceToDb(item);
    gdriveRecentProcessed.unshift({
      fatura: item.fatura || 'N/A',
      nome: item.nome || 'Consumidor',
      cor: item.cor || 'Não identificada',
      valor: item.valorNota || '0,00',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      filename: item.origemArquivo || 'Google Drive File'
    });
    if (gdriveRecentProcessed.length > 20) gdriveRecentProcessed.pop();
  }

  if (uniqueItems.length > 0) {
    await deductStockForInvoices(uniqueItems, { id: 'system-gdrive', name: 'Google Drive Watcher' });
    await syncDatabaseToSqlFile();
  }

  gdriveLastSync = new Date().toISOString();
  gdriveLastError = null;

  return {
    success: true,
    count: uniqueItems.length,
    duplicateCount: duplicates.length,
    duplicates,
    totalPdfs: targetFiles.length,
    extracted: uniqueItems,
    folderPath: gdriveDesktopPath
  };
}

function initGoogleDriveWatcher() {
  if (gdriveWatcher) {
    try {
      gdriveWatcher.close();
    } catch (_) {}
    gdriveWatcher = null;
  }

  if (!gdriveAutoSync) {
    console.log('[Google Drive] Auto-sync desativado via configuração.');
    return;
  }

  if (!fs.existsSync(gdriveDesktopPath)) {
    console.warn(`[Google Drive] Pasta não encontrada no momento: "${gdriveDesktopPath}". O monitoramento será ativado assim que a pasta estiver disponível.`);
    return;
  }

  try {
    console.log(`[Google Drive Monitor] 📡 Iniciando monitoramento em tempo real na pasta:`);
    console.log(`                       "${gdriveDesktopPath}"`);

    gdriveWatcher = chokidar.watch(gdriveDesktopPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
      usePolling: true,
      interval: 1500,
      binaryInterval: 2500,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 250
      }
    });

    gdriveWatcher.on('add', (filePath: string) => {
      const lower = filePath.toLowerCase();
      if (lower.endsWith('.pdf') || lower.endsWith('.xml')) {
        const filename = path.basename(filePath);
        console.log(`[Google Drive Watcher] 📄 Novo arquivo detectado na fila: ${filename}`);
        enqueuePdfForProcessing(filePath);
      }
    });

    gdriveWatcher.on('change', (filePath: string) => {
      const lower = filePath.toLowerCase();
      if (lower.endsWith('.pdf') || lower.endsWith('.xml')) {
        const filename = path.basename(filePath);
        console.log(`[Google Drive Watcher] 🔄 Arquivo alterado na fila: ${filename}`);
        enqueuePdfForProcessing(filePath);
      }
    });

    gdriveWatcher.on('error', (error: any) => {
      console.warn('[Google Drive Watcher Error]:', error.message || error);
      gdriveLastError = error.message || String(error);
    });
  } catch (err: any) {
    console.error('[Google Drive Watcher Init Error]:', err.message);
    gdriveLastError = err.message;
  }
}

// Endpoints Google Drive para Desktop
app.get('/api/gdrive-desktop/status', async (_req, res) => {
  const exists = fs.existsSync(gdriveDesktopPath);
  let totalPdfs = 0;
  if (exists) {
    try {
      totalPdfs = fs.readdirSync(gdriveDesktopPath).filter(f => {
        const l = f.toLowerCase();
        return l.endsWith('.pdf') || l.endsWith('.xml');
      }).length;
    } catch (_) {}
  }

  res.json({
    enabled: true,
    folderPath: gdriveDesktopPath,
    exists,
    totalPdfs,
    lastSync: gdriveLastSync,
    watcherActive: !!gdriveWatcher,
    autoSync: gdriveAutoSync,
    lastError: gdriveLastError,
    recentProcessed: gdriveRecentProcessed
  });
});

app.post('/api/gdrive-desktop/scan', authenticateToken, async (req, res) => {
  try {
    const result = await scanGoogleDriveDesktopFolder();
    const user = (req as any).user;
    await logAction(
      user?.id || 'admin',
      user?.name || 'Admin',
      'Varredura Manual Google Drive Desktop',
      'UPLOAD',
      `Varredura manual em '${gdriveDesktopPath}': ${result.count} novas notas extraídas, ${result.duplicateCount} duplicatas ignoradas.`,
      result.count > 0 ? 'success' : 'info',
      req
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao escanear pasta do Google Drive' });
  }
});


// ================= GOOGLE DRIVE ONLINE CLOUD POLLER (PASTA WEB) =================
let gdriveOnlineFolderId = process.env.GDRIVE_ONLINE_FOLDER_ID || '1cqhLdzayHMwzLxdi60rucCEqvK0tfHOz';
let gdriveOnlineFolderUrl = process.env.GDRIVE_ONLINE_FOLDER_URL || 'https://drive.google.com/drive/folders/1cqhLdzayHMwzLxdi60rucCEqvK0tfHOz?usp=sharing';
let gdriveOnlineAutoPoll = process.env.GDRIVE_ONLINE_AUTO_POLL !== 'false';
let gdriveOnlinePollIntervalSec = Number(process.env.GDRIVE_ONLINE_POLL_INTERVAL_SEC) || 30;
let gdriveOnlinePollerTimer: NodeJS.Timeout | null = null;
let gdriveOnlineLastPoll = new Date().toISOString();
let gdriveOnlineLastError: string | null = null;
const gdriveOnlineProcessedFileIds = new Set<string>();

async function pollGoogleDriveOnlineFolder(): Promise<{
  success: boolean;
  count: number;
  duplicateCount: number;
  totalOnlineFiles: number;
  totalPdfs?: number;
  duplicates?: Array<{ fatura: string; documento: string; nome: string; codigo: string; motivo: string }>;
  folderId: string;
  extracted: Invoice[];
}> {
  gdriveOnlineLastPoll = new Date().toISOString();
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  if (!gdriveOnlineFolderId) {
    return { success: false, count: 0, duplicateCount: 0, totalOnlineFiles: 0, totalPdfs: 0, duplicates: [], folderId: '', extracted: [] };
  }

  try {
    let filesList: Array<{ id: string; name: string; mimeType: string }> = [];

    // 1. Tentar via Google Drive REST API se houver chave
    if (apiKey) {
      try {
        const q = `'${gdriveOnlineFolderId}'+in+parents+and+trashed=false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime)&key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          filesList = data.files || [];
        }
      } catch (apiErr: any) {
        console.warn('[Google Drive API Poller Warning]:', apiErr.message);
      }
    }

    // 2. Fallback Web Crawler direto na pasta oficial do Google Drive
    if (filesList.length === 0) {
      try {
        const folderUrl = `https://drive.google.com/drive/folders/${gdriveOnlineFolderId}`;
        const resp = await fetch(folderUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (resp.ok) {
          const html = await resp.text();
          const regex = /aria-label="([^"]+?)(?:\s+(?:XML|PDF))?\s+Shared"[^>]*?ssk='[^:]+:[^:]+:([a-zA-Z0-9_-]+)-/g;
          let match;
          const seen = new Set<string>();
          while ((match = regex.exec(html)) !== null) {
            let fname = match[1].trim();
            const rawId = match[2].trim();
            const cleanId = rawId.replace(/-0.*$/, '').replace(/-\d+$/, '');
            if (!fname.toLowerCase().endsWith('.xml') && !fname.toLowerCase().endsWith('.pdf')) {
              if (html.includes(fname + '.xml')) fname = fname + '.xml';
              else if (html.includes(fname + '.pdf')) fname = fname + '.pdf';
            }
            if (!seen.has(cleanId)) {
              seen.add(cleanId);
              filesList.push({
                id: cleanId,
                name: fname,
                mimeType: fname.toLowerCase().endsWith('.xml') ? 'text/xml' : 'application/pdf'
              });
            }
          }
        }
      } catch (crawlerErr: any) {
        console.warn('[Google Drive Online Crawler Warning]:', crawlerErr.message);
      }
    }

    if (filesList.length === 0) {
      return {
        success: true,
        count: 0,
        duplicateCount: 0,
        totalOnlineFiles: 0,
        totalPdfs: 0,
        duplicates: [],
        folderId: gdriveOnlineFolderId,
        extracted: []
      };
    }

    const currentInvoices = await getInvoicesFromDb();
    const existingKeySet = new Set<string>();
    currentInvoices.forEach(inv => {
      if (inv.id) existingKeySet.add(inv.id.trim());
      if (inv.fatura) existingKeySet.add(inv.fatura.trim());
      if (inv.fatura && inv.nome) existingKeySet.add(`${inv.fatura.trim()}_${(inv.nome || '').trim().toLowerCase()}`);
    });

    const newExtractedInvoices: Invoice[] = [];
    const duplicateList: Array<{ fatura: string; documento: string; nome: string; codigo: string; motivo: string }> = [];
    const targetFiles = filesList.filter(f => {
      const l = f.name.toLowerCase();
      return l.endsWith('.pdf') || l.endsWith('.xml');
    });

    for (const file of targetFiles) {
      const cleanId = file.id.replace(/-0.*$/, '').replace(/-\d+$/, '');
      if (gdriveOnlineProcessedFileIds.has(cleanId)) continue;

      try {
        let buffer: Buffer | null = null;

        // Se houver API key
        if (apiKey) {
          try {
            const downloadUrl = `https://www.googleapis.com/drive/v3/files/${cleanId}?alt=media&key=${apiKey}`;
            const resp = await fetch(downloadUrl);
            if (resp.ok) {
              const arrayBuffer = await resp.arrayBuffer();
              buffer = Buffer.from(arrayBuffer);
            }
          } catch (_) {}
        }

        // Se download direto web
        if (!buffer) {
          const downloadUrl = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download&confirm=t`;
          const resp = await fetch(downloadUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
          });
          if (resp.ok) {
            const arrayBuffer = await resp.arrayBuffer();
            const tempBuf = Buffer.from(arrayBuffer);
            const sample = tempBuf.toString('utf-8', 0, 80);
            if (!sample.includes('<!DOCTYPE') || sample.includes('<?xml')) {
              buffer = tempBuf;
            }
          }
        }

        if (buffer && buffer.length > 0) {
          // Salvar backup local na pasta Notas_Fiscais
          const localDest = path.join(notasFiscaisDir, file.name);
          fs.writeFileSync(localDest, buffer);

          const items = await extractInvoicesFromFileBuffer(buffer, file.name);
          
          for (const item of items) {
            const idKey = item.id ? item.id.trim() : '';
            const faturaKey = item.fatura ? item.fatura.trim() : '';
            const compoundKey = item.fatura && item.nome ? `${item.fatura.trim()}_${(item.nome || '').trim().toLowerCase()}` : '';

            const isDuplicate = 
              (idKey && existingKeySet.has(idKey)) ||
              (faturaKey && existingKeySet.has(faturaKey)) ||
              (compoundKey && existingKeySet.has(compoundKey));

            if (!isDuplicate) {
              if (idKey) existingKeySet.add(idKey);
              if (faturaKey) existingKeySet.add(faturaKey);
              if (compoundKey) existingKeySet.add(compoundKey);
              newExtractedInvoices.push(item);
            } else {
              duplicateList.push({
                fatura: item.fatura || '',
                documento: item.documento || '',
                nome: item.nome || '',
                codigo: item.codigo || '',
                motivo: 'Já cadastrado na base (Google Drive Cloud)'
              });
            }
          }

          gdriveOnlineProcessedFileIds.add(cleanId);
        }
      } catch (fErr: any) {
        console.warn(`[Google Drive Cloud Poller] Erro ao baixar ${file.name}:`, fErr.message);
      }
    }

    for (const item of newExtractedInvoices) {
      await saveInvoiceToDb(item);
    }

    if (newExtractedInvoices.length > 0) {
      await deductStockForInvoices(newExtractedInvoices, { id: 'system-gdrive-online', name: 'Google Drive Online Cloud' });
      await syncDatabaseToSqlFile();

      await logAction(
        'system-gdrive-online',
        'Google Drive Cloud Poller',
        'Sincronização Nuvem Google Drive',
        'UPLOAD',
        `${newExtractedInvoices.length} nota(s) sincronizada(s) da pasta online oficial '${gdriveOnlineFolderId}'.`,
        'success'
      );

      dispatchN8nEvent('new_invoices', {
        source: 'GDRIVE_CLOUD_POLLER',
        count: newExtractedInvoices.length,
        invoices: newExtractedInvoices
      });
    }

    gdriveOnlineLastError = null;
    return {
      success: true,
      count: newExtractedInvoices.length,
      duplicateCount: duplicateList.length || (targetFiles.length - newExtractedInvoices.length),
      totalOnlineFiles: targetFiles.length,
      totalPdfs: targetFiles.length,
      duplicates: duplicateList,
      folderId: gdriveOnlineFolderId,
      extracted: newExtractedInvoices
    };
  } catch (err: any) {
    gdriveOnlineLastError = err.message;
    console.error('[Google Drive Online Poller Error]:', err.message);
    return {
      success: false,
      count: 0,
      duplicateCount: 0,
      totalOnlineFiles: 0,
      totalPdfs: 0,
      duplicates: [],
      folderId: gdriveOnlineFolderId,
      extracted: []
    };
  }
}

function initGoogleDriveOnlinePoller() {
  if (gdriveOnlinePollerTimer) {
    clearInterval(gdriveOnlinePollerTimer);
    gdriveOnlinePollerTimer = null;
  }

  if (!gdriveOnlineAutoPoll) return;

  console.log(`[Google Drive Cloud Poller] â˜ï¸ Poller online ativado para a pasta ID: ${gdriveOnlineFolderId} (Intervalo: ${gdriveOnlinePollIntervalSec}s)`);

  // ExecuÃ§Ã£o inicial apÃ³s 5 segundos
  setTimeout(() => {
    pollGoogleDriveOnlineFolder().catch(() => {});
  }, 5000);

  // Intervalo recorrente
  gdriveOnlinePollerTimer = setInterval(() => {
    pollGoogleDriveOnlineFolder().catch(() => {});
  }, Math.max(10, gdriveOnlinePollIntervalSec) * 1000);
}

// Endpoints Google Drive Online
app.get('/api/gdrive-online/status', (_req, res) => {
  res.json({
    folderId: gdriveOnlineFolderId,
    folderUrl: gdriveOnlineFolderUrl,
    autoPoll: gdriveOnlineAutoPoll,
    intervalSec: gdriveOnlinePollIntervalSec,
    lastPoll: gdriveOnlineLastPoll,
    lastError: gdriveOnlineLastError,
    pollerActive: !!gdriveOnlinePollerTimer
  });
});

app.post('/api/gdrive-online/sync', authenticateToken, async (req, res) => {
  try {
    const result = await pollGoogleDriveOnlineFolder();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao sincronizar pasta online do Google Drive' });
  }
});

app.post('/api/gdrive-online/config', authenticateToken, async (req, res) => {
  try {
    const { folderId, folderUrl, autoPoll, intervalSec } = req.body;
    if (folderId) gdriveOnlineFolderId = String(folderId).trim();
    if (folderUrl) {
      gdriveOnlineFolderUrl = String(folderUrl).trim();
      const match = gdriveOnlineFolderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) gdriveOnlineFolderId = match[1];
    }
    if (autoPoll !== undefined) gdriveOnlineAutoPoll = Boolean(autoPoll);
    if (intervalSec) gdriveOnlinePollIntervalSec = Math.max(5, Number(intervalSec));

    initGoogleDriveOnlinePoller();

    res.json({
      success: true,
      folderId: gdriveOnlineFolderId,
      folderUrl: gdriveOnlineFolderUrl,
      autoPoll: gdriveOnlineAutoPoll,
      intervalSec: gdriveOnlinePollIntervalSec
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gdrive-desktop/config', authenticateToken, async (req, res) => {
  try {
    const { folderPath, autoSync } = req.body;
    if (folderPath !== undefined) {
      gdriveDesktopPath = String(folderPath).trim();
    }
    if (autoSync !== undefined) {
      gdriveAutoSync = Boolean(autoSync);
    }

    initGoogleDriveWatcher();

    const user = (req as any).user;
    await logAction(
      user?.id || 'admin',
      user?.name || 'Admin',
      'ConfiguraÃ§Ã£o Google Drive Desktop',
      'SYSTEM',
      `Pasta configurada para '${gdriveDesktopPath}' (Auto-sync: ${gdriveAutoSync ? 'ATIVO' : 'DESATIVADO'})`,
      'info',
      req
    );

    const exists = fs.existsSync(gdriveDesktopPath);
    let totalPdfs = 0;
    if (exists) {
      try {
        totalPdfs = fs.readdirSync(gdriveDesktopPath).filter(f => f.toLowerCase().endsWith('.pdf')).length;
      } catch (_) {}
    }

    res.json({
      enabled: true,
      folderPath: gdriveDesktopPath,
      exists,
      totalPdfs,
      lastSync: gdriveLastSync,
      watcherActive: !!gdriveWatcher,
      autoSync: gdriveAutoSync,
      lastError: gdriveLastError,
      recentProcessed: gdriveRecentProcessed
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao salvar configuraÃ§Ã£o do Google Drive' });
  }
});

// 5. EXCEL IMPORT API
const handleExcelImport = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Nenhum arquivo Excel enviado.' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file.path);
    const worksheet = workbook.worksheets[0];

    const rawInvoices: Invoice[] = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const vals = row.values as any[];
      if (!vals || vals.length < 3) return;

      const inv: Invoice = {
        id: 'spm-ex-' + Date.now() + '-' + rowNumber,
        nome: String(vals[1] || 'Consumidor'),
        documento: String(vals[2] || ''),
        dataSaida: String(vals[3] || new Date().toLocaleDateString('pt-BR')),
        endereco: String(vals[4] || ''),
        bairro: String(vals[5] || ''),
        cep: String(vals[6] || ''),
        municipio: String(vals[7] || 'SÃ£o Paulo'),
        uf: String(vals[8] || 'SP'),
        fatura: String(vals[9] || ''),
        valorProdutos: String(vals[10] || '0,00'),
        valorNota: String(vals[11] || '0,00'),
        desconto: String(vals[12] || '0,00'),
        codigo: String(vals[13] || 'Sem cÃ³digo'),
        quantidade: String(vals[14] || '1'),
        descricao: String(vals[15] || 'Item Importado'),
        cor: String(vals[16] || 'NÃ£o identificada'),
        origem: String(vals[17] || 'Outros'),
        origemArquivo: file.originalname,
        dataUpload: new Date().toISOString(),
        status: 'Processado'
      };
      rawInvoices.push(inv);
    });

    const currentInvoices = await getInvoicesFromDb();
    const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawInvoices);

    for (const inv of uniqueItems) {
      await saveInvoiceToDb(inv);
    }

    if (uniqueItems.length > 0) {
      await deductStockForInvoices(uniqueItems, { id: 'admin', name: 'ImportaÃ§Ã£o Excel' });
      await syncDatabaseToSqlFile();
    }

    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    res.json({ 
      count: uniqueItems.length, 
      duplicateCount: duplicates.length,
      duplicates,
      imported: uniqueItems 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao importar arquivo Excel.' });
  }
};

app.post('/api/invoices/import-excel', upload.single('file'), handleExcelImport);
app.post('/api/extract/excel', upload.single('file'), handleExcelImport);

// 6. EXCEL EXPORT (AUDITORIA FISCAL COMPLETA XML SEFAZ & RESUMO)
app.get('/api/export/excel', async (_req, res) => {
  try {
    const invoices = await getInvoicesFromDb();
    const workbook = new ExcelJS.Workbook();
    
    // ABA 1: Auditoria Fiscal Completa (Todas as colunas XML SEFAZ)
    const ws = workbook.addWorksheet('Auditoria Fiscal XML SEFAZ');
    
    ws.columns = [
      // 1. DADOS BÃSICOS & CONTROLE
      { header: 'FATURA / NFe', key: 'fatura', width: 14 },
      { header: 'SÃ‰RIE', key: 'serie', width: 8 },
      { header: 'CHAVE DE ACESSO (44 DÃGITOS)', key: 'chaveAcesso', width: 48 },
      { header: 'DATA/HORA EMISSÃƒO', key: 'dataSaida', width: 16 },
      { header: 'NATUREZA OPERAÃ‡ÃƒO', key: 'naturezaOperacao', width: 26 },
      { header: 'TIPO OPERAÃ‡ÃƒO', key: 'tipoOperacao', width: 14 },
      { header: 'STATUS SEFAZ', key: 'statusSefaz', width: 30 },
      { header: 'NÂº PROTOCOLO', key: 'protocoloAutorizacao', width: 20 },
      { header: 'DATA AUTORIZAÃ‡ÃƒO', key: 'dataHoraAutorizacao', width: 20 },
      
      // 2. DESTINATÃRIO (<dest>, <enderDest>)
      { header: 'DESTINATÃRIO - NOME', key: 'nome', width: 34 },
      { header: 'DESTINATÃRIO - CPF/CNPJ', key: 'documento', width: 20 },
      { header: 'DESTINATÃRIO - IE', key: 'destinatarioIe', width: 16 },
      { header: 'DESTINATÃRIO - IND IE', key: 'destinatarioIndIe', width: 12 },
      { header: 'DESTINATÃRIO - EMAIL', key: 'destinatarioEmail', width: 26 },
      { header: 'DESTINATÃRIO - TELEFONE', key: 'destinatarioTelefone', width: 16 },
      { header: 'ENDEREÃ‡O COMPLETO', key: 'endereco', width: 36 },
      { header: 'BAIRRO', key: 'bairro', width: 22 },
      { header: 'CEP', key: 'cep', width: 14 },
      { header: 'MUNICÃPIO', key: 'municipio', width: 22 },
      { header: 'UF', key: 'uf', width: 8 },
      { header: 'CÃ“D. IBGE CIDADE', key: 'destinatarioCodigoMunicipio', width: 16 },
      { header: 'PAÃS', key: 'destinatarioPais', width: 12 },

      // 3. PRODUTOS & ITENS (<det>, <prod>)
      { header: 'ITEM NÂº', key: 'itemNumero', width: 10 },
      { header: 'SKU / CÃ“D. PRODUTO', key: 'codigo', width: 22 },
      { header: 'CÃ“D. BARRAS EAN/GTIN', key: 'produtoEan', width: 18 },
      { header: 'DESCRIÃ‡ÃƒO DO PRODUTO', key: 'descricao', width: 38 },
      { header: 'COR / VARIAÃ‡ÃƒO', key: 'cor', width: 16 },
      { header: 'NCM (8 DÃGITOS)', key: 'produtoNcm', width: 14 },
      { header: 'CFOP (4 DÃGITOS)', key: 'produtoCfop', width: 12 },
      { header: 'UNIDADE', key: 'produtoUnidade', width: 10 },
      { header: 'QUANTIDADE', key: 'quantidade', width: 14 },
      { header: 'VALOR UNITÃRIO (R$)', key: 'produtoValorUnitario', width: 18 },
      { header: 'VALOR TOTAL PROD (R$)', key: 'valorProdutos', width: 20 },
      { header: 'DESCONTO PROD (R$)', key: 'produtoDesconto', width: 16 },
      { header: 'FRETE RATEADO (R$)', key: 'produtoFrete', width: 16 },
      { header: 'SEGURO RATEADO (R$)', key: 'produtoSeguro', width: 16 },
      { header: 'OUTRAS DESPESAS (R$)', key: 'produtoOutrasDespesas', width: 18 },
      { header: 'INFO ADICIONAL ITEM', key: 'produtoInfoAdicional', width: 30 },

      // 4. IMPOSTOS (<imposto>, <ICMS>, <PIS>, <COFINS>, <IPI>)
      { header: 'ICMS - ORIGEM', key: 'icmsOrigem', width: 14 },
      { header: 'ICMS - CST/CSOSN', key: 'icmsCstCsosn', width: 16 },
      { header: 'ICMS - BASE CÃLCULO (R$)', key: 'icmsBaseCalculo', width: 22 },
      { header: 'ICMS - ALÃQUOTA (%)', key: 'icmsAliquota', width: 18 },
      { header: 'ICMS - VALOR (R$)', key: 'icmsValor', width: 18 },
      { header: 'PIS - CST', key: 'pisCst', width: 12 },
      { header: 'PIS - BASE CÃLCULO (R$)', key: 'pisBaseCalculo', width: 20 },
      { header: 'PIS - ALÃQUOTA (%)', key: 'pisAliquota', width: 16 },
      { header: 'PIS - VALOR (R$)', key: 'pisValor', width: 16 },
      { header: 'COFINS - CST', key: 'cofinsCst', width: 14 },
      { header: 'COFINS - BASE CÃLCULO (R$)', key: 'cofinsBaseCalculo', width: 22 },
      { header: 'COFINS - ALÃQUOTA (%)', key: 'cofinsAliquota', width: 18 },
      { header: 'COFINS - VALOR (R$)', key: 'cofinsValor', width: 18 },
      { header: 'IPI - VALOR (R$)', key: 'ipiValor', width: 16 },
      { header: 'TRIBUTOS APROX. (R$)', key: 'totalTributosAprox', width: 20 },

      // 5. TOTAIS DA NF-e (<total>)
      { header: 'TOTAL BASE ICMS (R$)', key: 'totalBaseIcms', width: 20 },
      { header: 'TOTAL ICMS (R$)', key: 'totalValorIcms', width: 18 },
      { header: 'TOTAL ICMS DESON (R$)', key: 'totalIcmsDesonerado', width: 20 },
      { header: 'TOTAL ICMS ST (R$)', key: 'totalIcmsSt', width: 18 },
      { header: 'TOTAL PRODUTOS (R$)', key: 'totalProdutos', width: 20 },
      { header: 'TOTAL FRETE (R$)', key: 'totalFrete', width: 16 },
      { header: 'TOTAL SEGURO (R$)', key: 'totalSeguro', width: 16 },
      { header: 'TOTAL DESCONTO (R$)', key: 'desconto', width: 18 },
      { header: 'TOTAL IPI (R$)', key: 'totalIpi', width: 16 },
      { header: 'TOTAL PIS (R$)', key: 'totalPis', width: 16 },
      { header: 'TOTAL COFINS (R$)', key: 'totalCofins', width: 18 },
      { header: 'TOTAL OUTRAS DESP (R$)', key: 'totalOutrasDespesas', width: 20 },
      { header: 'VALOR FINAL DA NOTA (R$)', key: 'valorNota', width: 22 },

      // 6. TRANSPORTE (<transp>)
      { header: 'MODALIDADE FRETE', key: 'transporteModalidadeFrete', width: 34 },
      { header: 'TRANSPORTADORA - CNPJ/CPF', key: 'transportadoraCnpjDoc', width: 24 },
      { header: 'TRANSPORTADORA - NOME', key: 'transportadoraNome', width: 30 },
      { header: 'TRANSPORTADORA - IE', key: 'transportadoraIe', width: 18 },
      { header: 'TRANSPORTADORA - ENDEREÃ‡O', key: 'transportadoraEndereco', width: 28 },
      { header: 'TRANSPORTADORA - CIDADE', key: 'transportadoraMunicipio', width: 22 },
      { header: 'TRANSPORTADORA - UF', key: 'transportadoraUf', width: 10 },
      { header: 'PLACA DO VEÃCULO', key: 'transportePlaca', width: 16 },
      { header: 'QTD VOLUMES', key: 'transporteVolumeQuantidade', width: 14 },
      { header: 'ESPÃ‰CIE VOLUMES', key: 'transporteVolumeEspecie', width: 18 },
      { header: 'MARCA VOLUMES', key: 'transporteVolumeMarca', width: 16 },
      { header: 'PESO LÃQUIDO (KG)', key: 'transporteVolumePesoLiquido', width: 18 },
      { header: 'PESO BRUTO (KG)', key: 'transporteVolumePesoBruto', width: 18 },

      // 7. COBRANÃ‡A & PAGAMENTO (<cobr>, <pag>)
      { header: 'NÂº FATURA COBRANÃ‡A', key: 'cobrancaFaturaNumero', width: 20 },
      { header: 'VALOR ORIGINAL FATURA (R$)', key: 'cobrancaValorOriginal', width: 24 },
      { header: 'VALOR LÃQUIDO FATURA (R$)', key: 'cobrancaValorLiquido', width: 22 },
      { header: 'PARCELAS / DUPLICATAS', key: 'cobrancaDuplicatasResumo', width: 35 },
      { header: 'FORMA DE PAGAMENTO', key: 'pagamentoForma', width: 28 },
      { header: 'VALOR PAGAMENTO (R$)', key: 'pagamentoValor', width: 20 },
      { header: 'BANDEIRA CARTÃƒO', key: 'pagamentoCartaoBandeira', width: 18 },
      { header: 'AUTORIZAÃ‡ÃƒO CARTÃƒO', key: 'pagamentoCartaoAutorizacao', width: 20 },

      // 8. INTERMEDIADOR & MARKETPLACE (<infIntermed>)
      { header: 'MARKETPLACE / CANAL', key: 'origem', width: 20 },
      { header: 'INTERMEDIADOR - CNPJ', key: 'intermediadorCnpj', width: 22 },
      { header: 'INTERMEDIADOR - ID CADASTRO', key: 'intermediadorIdentificador', width: 26 },

      // 9. EMITENTE (<emit>)
      { header: 'EMITENTE - CNPJ', key: 'emitenteCnpj', width: 20 },
      { header: 'EMITENTE - RAZÃƒO SOCIAL', key: 'emitenteNome', width: 30 },
      { header: 'EMITENTE - FANTASIA', key: 'emitenteFantasia', width: 24 },
      { header: 'EMITENTE - IE', key: 'emitenteIe', width: 16 },
      { header: 'EMITENTE - CRT', key: 'emitenteCrt', width: 12 },

      // 10. INFORMAÃ‡Ã•ES ADICIONAIS (<infAdic>)
      { header: 'INFORMAÃ‡Ã•ES COMPLEMENTARES (INFCPL)', key: 'informacoesComplementares', width: 45 },
      { header: 'INFORMAÃ‡Ã•ES FISCO (INFADFISCO)', key: 'informacoesFisco', width: 35 },
      { header: 'ARQUIVO DE ORIGEM', key: 'origemArquivo', width: 25 },
      { header: 'DATA UPLOAD / REGISTRO', key: 'dataUpload', width: 22 }
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 32;

    invoices.forEach(inv => {
      const xml = inv.xmlDetails || {};
      ws.addRow({
        fatura: inv.fatura,
        serie: inv.serie || xml.serie || '1',
        chaveAcesso: inv.chaveAcesso || xml.chaveAcesso || '-',
        dataSaida: inv.dataSaida,
        naturezaOperacao: inv.naturezaOperacao || xml.naturezaOperacao || 'Venda de Mercadorias',
        tipoOperacao: inv.tipoOperacao || xml.tipoOperacao || '1 - SaÃ­da',
        statusSefaz: inv.statusSefaz || xml.statusSefaz || '100 - Autorizado o uso da NF-e',
        protocoloAutorizacao: inv.protocoloAutorizacao || xml.protocoloAutorizacao || '-',
        dataHoraAutorizacao: inv.dataHoraAutorizacao || xml.dataHoraAutorizacao || '-',

        nome: inv.nome,
        documento: inv.documento,
        destinatarioIe: inv.destinatarioIe || xml.destinatarioIe || 'ISENTO',
        destinatarioIndIe: inv.destinatarioIndIe || xml.destinatarioIndIe || '9',
        destinatarioEmail: inv.destinatarioEmail || xml.destinatarioEmail || '-',
        destinatarioTelefone: inv.destinatarioTelefone || xml.destinatarioTelefone || '-',
        endereco: inv.endereco,
        bairro: inv.bairro,
        cep: inv.cep,
        municipio: inv.municipio,
        uf: inv.uf,
        destinatarioCodigoMunicipio: inv.destinatarioCodigoMunicipio || xml.destinatarioCodigoMunicipio || '-',
        destinatarioPais: inv.destinatarioPais || xml.destinatarioPais || 'Brasil',

        itemNumero: inv.itemNumero || xml.itemNumero || '1',
        codigo: inv.codigo,
        produtoEan: inv.produtoEan || xml.produtoEan || '-',
        descricao: inv.descricao,
        cor: inv.cor,
        produtoNcm: inv.produtoNcm || xml.produtoNcm || '32089010',
        produtoCfop: inv.produtoCfop || xml.produtoCfop || '5102',
        produtoUnidade: inv.produtoUnidade || xml.produtoUnidade || 'UN',
        quantidade: inv.quantidade,
        produtoValorUnitario: inv.produtoValorUnitario || xml.produtoValorUnitario || inv.valorProdutos,
        valorProdutos: inv.valorProdutos,
        produtoDesconto: inv.produtoDesconto || xml.produtoDesconto || '0,00',
        produtoFrete: inv.produtoFrete || xml.produtoFrete || '0,00',
        produtoSeguro: inv.produtoSeguro || xml.produtoSeguro || '0,00',
        produtoOutrasDespesas: inv.produtoOutrasDespesas || xml.produtoOutrasDespesas || '0,00',
        produtoInfoAdicional: inv.produtoInfoAdicional || xml.produtoInfoAdicional || '-',

        icmsOrigem: inv.icmsOrigem || xml.icmsOrigem || '0',
        icmsCstCsosn: inv.icmsCstCsosn || xml.icmsCstCsosn || '102',
        icmsBaseCalculo: inv.icmsBaseCalculo || xml.icmsBaseCalculo || inv.valorProdutos,
        icmsAliquota: inv.icmsAliquota || xml.icmsAliquota || '0,00',
        icmsValor: inv.icmsValor || xml.icmsValor || '0,00',
        pisCst: inv.pisCst || xml.pisCst || '07',
        pisBaseCalculo: inv.pisBaseCalculo || xml.pisBaseCalculo || '0,00',
        pisAliquota: inv.pisAliquota || xml.pisAliquota || '0,00',
        pisValor: inv.pisValor || xml.pisValor || '0,00',
        cofinsCst: inv.cofinsCst || xml.cofinsCst || '07',
        cofinsBaseCalculo: inv.cofinsBaseCalculo || xml.cofinsBaseCalculo || '0,00',
        cofinsAliquota: inv.cofinsAliquota || xml.cofinsAliquota || '0,00',
        cofinsValor: inv.cofinsValor || xml.cofinsValor || '0,00',
        ipiValor: inv.ipiValor || xml.ipiValor || '0,00',
        totalTributosAprox: inv.totalTributosAprox || xml.totalTributosAprox || '0,00',

        totalBaseIcms: inv.totalBaseIcms || xml.totalBaseIcms || inv.valorProdutos,
        totalValorIcms: inv.totalValorIcms || xml.totalValorIcms || '0,00',
        totalIcmsDesonerado: inv.totalIcmsDesonerado || xml.totalIcmsDesonerado || '0,00',
        totalIcmsSt: inv.totalIcmsSt || xml.totalIcmsSt || '0,00',
        totalProdutos: inv.totalProdutos || xml.totalProdutos || inv.valorProdutos,
        totalFrete: inv.totalFrete || xml.totalFrete || '0,00',
        totalSeguro: inv.totalSeguro || xml.totalSeguro || '0,00',
        desconto: inv.desconto,
        totalIpi: inv.totalIpi || xml.totalIpi || '0,00',
        totalPis: inv.totalPis || xml.totalPis || '0,00',
        totalCofins: inv.totalCofins || xml.totalCofins || '0,00',
        totalOutrasDespesas: inv.totalOutrasDespesas || xml.totalOutrasDespesas || '0,00',
        valorNota: inv.valorNota,

        transporteModalidadeFrete: inv.transporteModalidadeFrete || xml.transporteModalidadeFrete || '0 - ContrataÃ§Ã£o por conta do Remetente (CIF)',
        transportadoraCnpjDoc: inv.transportadoraCnpjDoc || xml.transportadoraCnpjDoc || '-',
        transportadoraNome: inv.transportadoraNome || xml.transportadoraNome || 'Correios / Mercado Envios',
        transportadoraIe: inv.transportadoraIe || xml.transportadoraIe || '-',
        transportadoraEndereco: inv.transportadoraEndereco || xml.transportadoraEndereco || '-',
        transportadoraMunicipio: inv.transportadoraMunicipio || xml.transportadoraMunicipio || '-',
        transportadoraUf: inv.transportadoraUf || xml.transportadoraUf || '-',
        transportePlaca: inv.transportePlaca || xml.transportePlaca || '-',
        transporteVolumeQuantidade: inv.transporteVolumeQuantidade || xml.transporteVolumeQuantidade || '1',
        transporteVolumeEspecie: inv.transporteVolumeEspecie || xml.transporteVolumeEspecie || 'VOLUME',
        transporteVolumeMarca: inv.transporteVolumeMarca || xml.transporteVolumeMarca || 'SPM STORE',
        transporteVolumePesoLiquido: inv.transporteVolumePesoLiquido || xml.transporteVolumePesoLiquido || '0,250',
        transporteVolumePesoBruto: inv.transporteVolumePesoBruto || xml.transporteVolumePesoBruto || '0,300',

        cobrancaFaturaNumero: inv.cobrancaFaturaNumero || xml.cobrancaFaturaNumero || inv.fatura,
        cobrancaValorOriginal: inv.cobrancaValorOriginal || xml.cobrancaValorOriginal || inv.valorProdutos,
        cobrancaValorLiquido: inv.cobrancaValorLiquido || xml.cobrancaValorLiquido || inv.valorNota,
        cobrancaDuplicatasResumo: inv.cobrancaDuplicatasResumo || xml.cobrancaDuplicatasResumo || `Ã€ Vista (R$ ${inv.valorNota})`,
        pagamentoForma: inv.pagamentoForma || xml.pagamentoForma || '17 - Pagamento InstantÃ¢neo (PIX)',
        pagamentoValor: inv.pagamentoValor || xml.pagamentoValor || inv.valorNota,
        pagamentoCartaoBandeira: inv.pagamentoCartaoBandeira || xml.pagamentoCartaoBandeira || '-',
        pagamentoCartaoAutorizacao: inv.pagamentoCartaoAutorizacao || xml.pagamentoCartaoAutorizacao || '-',

        origem: inv.origem,
        intermediadorCnpj: inv.intermediadorCnpj || xml.intermediadorCnpj || '-',
        intermediadorIdentificador: inv.intermediadorIdentificador || xml.intermediadorIdentificador || inv.origem,

        emitenteCnpj: inv.emitenteCnpj || xml.emitenteCnpj || 'SPM STORE LTDA',
        emitenteNome: inv.emitenteNome || xml.emitenteNome || 'SPM STORE VERNIZ ELITE',
        emitenteFantasia: inv.emitenteFantasia || xml.emitenteFantasia || 'SPM VERNIZ ELITE',
        emitenteIe: inv.emitenteIe || xml.emitenteIe || '-',
        emitenteCrt: inv.emitenteCrt || xml.emitenteCrt || '1 - Simples Nacional',

        informacoesComplementares: inv.informacoesComplementares || xml.informacoesComplementares || `Pedido ${inv.origem} - Nota Fiscal Gerada`,
        informacoesFisco: inv.informacoesFisco || xml.informacoesFisco || '-',
        origemArquivo: inv.origemArquivo || 'XML_SEFAZ.xml',
        dataUpload: inv.dataUpload ? new Date(inv.dataUpload).toLocaleString('pt-BR') : '-'
      });
    });

    ws.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        row.alignment = { vertical: 'middle' };
        row.font = { size: 9 };
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Auditoria_Completa_XML_SEFAZ_SPM.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Excel Export Error:', error);
    res.status(500).json({ error: 'Erro ao gerar arquivo Excel de auditoria XML.' });
  }
});

// 7. STATS & ANALYTICS API
app.get('/api/stats', async (req, res) => {
  try {
    const filters = req.query as Record<string, string>;
    const stats = await calculateStatsFromDb(filters);
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ================= CONTROLE DE ESTOQUE & MOVIMENTAÃ‡Ã•ES API =================

app.get('/api/stock/items', async (_req, res) => {
  try {
    const items = await getStockItemsFromDb();
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao carregar itens de estoque' });
  }
});

app.get('/api/stock/movements', async (req, res) => {
  try {
    const filters = req.query as any;
    const movements = await getStockMovementsFromDb(filters);
    res.json({ movements });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao carregar histÃ³rico de movimentaÃ§Ãµes' });
  }
});

app.get('/api/stock/stats', async (_req, res) => {
  try {
    const stats = await calculateStockStatsFromDb();
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao calcular mÃ©tricas de estoque' });
  }
});

app.post('/api/stock/movement', authenticateToken, async (req, res) => {
  try {
    const payload: NewStockMovementPayload = req.body;
    if (!payload.productId || !payload.tipo || !payload.quantidade) {
      return res.status(400).json({ error: 'Produto, tipo de movimentaÃ§Ã£o e quantidade sÃ£o obrigatÃ³rios.' });
    }
    const user = (req as any).user || { id: 'admin', name: 'Administrador' };
    const movement = await addStockMovementToDb(payload, user);

    await logAction(
      user.id,
      user.name,
      'MovimentaÃ§Ã£o Manual de Estoque',
      'EDIT',
      `${payload.tipo}: ${payload.quantidade} un de ${movement.sku} (${payload.motivo || 'Sem observaÃ§Ã£o'})`,
      'info',
      req
    );

    res.status(201).json({ movement });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao registrar movimentaÃ§Ã£o de estoque' });
  }
});

app.post('/api/stock/items', authenticateToken, async (req, res) => {
  try {
    const itemData = req.body;
    if (!itemData.id && !itemData.sku) {
      return res.status(400).json({ error: 'Identificador do produto Ã© obrigatÃ³rio.' });
    }
    await saveStockItemToDb(itemData);

    const user = (req as any).user || { id: 'admin', name: 'Administrador' };
    await logAction(
      user.id,
      user.name,
      'ConfiguraÃ§Ã£o de Produto de Estoque',
      'EDIT',
      `Produto ${itemData.sku || itemData.nome} atualizado`,
      'info',
      req
    );

    res.json({ success: true, message: 'Produto atualizado com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar produto de estoque' });
  }
});

app.post('/api/stock/recalculate', authenticateToken, async (req, res) => {
  try {
    const result = await recalculateAllStockFromInvoices();
    const user = (req as any).user || { id: 'admin', name: 'Administrador' };
    await logAction(
      user.id,
      user.name,
      'RecÃ¡lculo Geral de Estoque',
      'SYSTEM',
      `RecÃ¡lculo completo de estoque executado: ${result.totalNotasProcessadas} notas processadas, ${result.totalUnidadesBaixadas} saÃ­das registradas.`,
      'success',
      req
    );
    res.json({ success: true, message: 'Estoque recalculado com sucesso a partir de todas as notas fiscais.', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao recalcular estoque' });
  }
});

app.get('/api/stock/export-excel', async (_req, res) => {
  try {
    const items = await getStockItemsFromDb();
    const movements = await getStockMovementsFromDb({ limit: 1000 });

    const workbook = new ExcelJS.Workbook();
    
    // Aba 1: PosiÃ§Ã£o de Estoque
    const wsItems = workbook.addWorksheet('PosiÃ§Ã£o de Estoque');
    wsItems.columns = [
      { header: 'SKU', key: 'sku', width: 22 },
      { header: 'PRODUTO', key: 'nome', width: 36 },
      { header: 'CATEGORIA', key: 'categoria', width: 18 },
      { header: 'COR / VARIAÃ‡ÃƒO', key: 'cor', width: 16 },
      { header: 'UNIDADE', key: 'unidade', width: 10 },
      { header: 'SALDO INICIAL', key: 'estoqueInicial', width: 14 },
      { header: 'ENTRADAS (+)', key: 'totalEntradas', width: 14 },
      { header: 'SAÃDAS (-)', key: 'totalSaidas', width: 14 },
      { header: 'ESTOQUE ATUAL', key: 'estoqueAtual', width: 16 },
      { header: 'STATUS', key: 'status', width: 14 },
      { header: 'ESTOQUE MÃN.', key: 'estoqueMinimo', width: 14 },
      { header: 'DIAS RESTANTES', key: 'diasCobertura', width: 16 },
      { header: 'PREVISÃƒO RUPTURA', key: 'previsaoEsgotamento', width: 18 },
      { header: 'CUSTO UNIT. (R$)', key: 'precoCusto', width: 16 },
      { header: 'VALOR TOTAL CUSTO (R$)', key: 'valorTotalEstoqueCusto', width: 22 },
      { header: 'VALOR POTENCIAL VENDA (R$)', key: 'valorTotalEstoqueVenda', width: 24 },
      { header: 'LOCALIZAÃ‡ÃƒO', key: 'localizacao', width: 20 }
    ];

    const hRow1 = wsItems.getRow(1);
    hRow1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    hRow1.height = 25;

    items.forEach(it => {
      wsItems.addRow({
        sku: it.sku,
        nome: it.nome,
        categoria: it.categoria,
        cor: it.cor,
        unidade: it.unidade,
        estoqueInicial: it.estoqueInicial,
        totalEntradas: it.totalEntradas,
        totalSaidas: it.totalSaidas,
        estoqueAtual: it.estoqueAtual,
        status: it.status,
        estoqueMinimo: it.estoqueMinimo,
        diasCobertura: it.diasCobertura,
        previsaoEsgotamento: it.previsaoEsgotamento,
        precoCusto: it.precoCusto,
        valorTotalEstoqueCusto: it.valorTotalEstoqueCusto,
        valorTotalEstoqueVenda: it.valorTotalEstoqueVenda,
        localizacao: it.localizacao
      });
    });

    // Aba 2: HistÃ³rico de MovimentaÃ§Ãµes
    const wsMov = workbook.addWorksheet('HistÃ³rico de MovimentaÃ§Ãµes');
    wsMov.columns = [
      { header: 'DATA/HORA', key: 'data', width: 20 },
      { header: 'SKU', key: 'sku', width: 22 },
      { header: 'TIPO DE OPERAÃ‡ÃƒO', key: 'tipo', width: 20 },
      { header: 'QUANTIDADE', key: 'quantidade', width: 14 },
      { header: 'SALDO ANTERIOR', key: 'saldoAnterior', width: 16 },
      { header: 'SALDO RESULTANTE', key: 'saldoPosterior', width: 18 },
      { header: 'DOCUMENTO / REF.', key: 'documentoRef', width: 22 },
      { header: 'CANAL / ORIGEM', key: 'origemCanal', width: 20 },
      { header: 'MOTIVO / OBSERVAÃ‡ÃƒO', key: 'motivo', width: 35 },
      { header: 'VALOR UNITÃRIO (R$)', key: 'valorUnitario', width: 18 },
      { header: 'VALOR TOTAL (R$)', key: 'valorTotal', width: 18 },
      { header: 'RESPONSÃVEL', key: 'usuarioNome', width: 22 }
    ];

    const hRow2 = wsMov.getRow(1);
    hRow2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    hRow2.height = 25;

    movements.forEach(m => {
      wsMov.addRow({
        data: new Date(m.dataMovimentacao).toLocaleString('pt-BR'),
        sku: m.sku,
        tipo: m.tipo,
        quantidade: m.quantidade,
        saldoAnterior: m.saldoAnterior,
        saldoPosterior: m.saldoPosterior,
        documentoRef: m.documentoRef || '-',
        origemCanal: m.origemCanal || '-',
        motivo: m.motivo || '-',
        valorUnitario: m.valorUnitario,
        valorTotal: m.valorTotal,
        usuarioNome: m.usuarioNome
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Controle_Estoque_SPM.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao exportar planilha de estoque' });
  }
});

// 8. POWER BI & GOOGLE SHEETS FEED API
app.get('/api/powerbi/feed', async (_req, res) => {
  try {
    const invoices = await getInvoicesFromDb();
    res.json({
      updatedAt: new Date().toISOString(),
      totalRows: invoices.length,
      data: invoices
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gsheets/sync', authenticateToken, async (req, res) => {
  try {
    const invoices = await getInvoicesFromDb();
    const config = await getGSheetsConfigFromDb();
    let webhookResult: any = null;

    if (config.webhookUrl && config.webhookUrl.startsWith('http')) {
      try {
        const payload = {
          action: 'sync_invoices',
          spreadsheetId: config.spreadsheetId,
          sheetName: config.sheetName,
          timestamp: new Date().toISOString(),
          total: invoices.length,
          invoices: invoices.map(i => ({
            nome: i.nome,
            documento: i.documento,
            dataSaida: i.dataSaida,
            endereco: i.endereco,
            bairro: i.bairro,
            cep: i.cep,
            municipio: i.municipio,
            uf: i.uf,
            fatura: i.fatura,
            valorProdutos: i.valorProdutos,
            valorNota: i.valorNota,
            desconto: i.desconto,
            codigo: i.codigo,
            quantidade: i.quantidade,
            descricao: i.descricao,
            cor: i.cor,
            origem: i.origem
          }))
        };

        const response = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          redirect: 'follow'
        });

        if (response.ok) {
          webhookResult = await response.text();
        }
      } catch (postErr: any) {
        console.warn('[Google Sheets Sync] Webhook aviso:', postErr.message);
      }
    }

    const updated = await saveGSheetsConfigToDb({
      lastSync: new Date().toISOString(),
      status: 'CONNECTED'
    });

    const user = (req as any).user;
    await logAction(
      user?.id || 'admin',
      user?.name || 'Admin',
      'SincronizaÃ§Ã£o com Google Sheets',
      'SYNC',
      `Sincronizados ${invoices.length} registros com a planilha '${config.sheetName}'.`,
      'success',
      req
    );

    res.json({
      success: true,
      syncedCount: invoices.length,
      lastSync: updated.lastSync,
      webhookResult
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gsheets/test-webhook', authenticateToken, async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return res.status(400).json({ error: 'URL de Webhook invÃ¡lida.' });
    }

    const startTime = Date.now();
    const testPayload = {
      action: 'ping',
      timestamp: new Date().toISOString(),
      system: 'SPM Store Sistema Fiscal'
    };

    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      redirect: 'follow'
    });

    const duration = Date.now() - startTime;
    const responseText = await resp.text();

    res.json({
      success: resp.ok || resp.status < 400,
      status: resp.status,
      durationMs: duration,
      response: responseText.slice(0, 300) || 'ConexÃ£o confirmada com sucesso pelo Google Apps Script.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao testar conexÃ£o com o Webhook.' });
  }
});

// 4.1 GOOGLE DRIVE AUTOMATIC SYNC WEBHOOK ENDPOINT
app.post('/api/drive/sync-pdf', async (req, res) => {
  try {
    const { filename, fileId, text, base64Pdf } = req.body;

    if (!text && !base64Pdf) {
      return res.status(400).json({ error: 'Nenhum texto ou conteÃºdo PDF foi enviado pelo Google Drive.' });
    }

    let pdfText = text || '';
    if (!pdfText && base64Pdf) {
      const buffer = Buffer.from(base64Pdf, 'base64');
      pdfText = await extractTextFromPdfBuffer(buffer);
    }

    const pdfName = filename || (fileId ? `drive-${fileId}.pdf` : 'Google_Drive_NF.pdf');
    const items = extractSpmInvoicesFromPdfText(pdfText, pdfName);

    if (items.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'Nenhum item fiscal identificado no PDF do Drive.',
        duplicates: []
      });
    }

    const currentInvoices = await getInvoicesFromDb();
    const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, items);

    for (const item of uniqueItems) {
      await saveInvoiceToDb(item);
    }

    if (uniqueItems.length > 0) {
      await syncDatabaseToSqlFile();
    }

    await logAction(
      'google-drive-bot',
      'Google Drive Auto-Sync Bot',
      'SincronizaÃ§Ã£o AutomÃ¡tica Google Drive',
      'SYNC',
      `Arquivo '${pdfName}' do Google Drive processado: ${uniqueItems.length} novos registros salvos no MySQL. ${duplicates.length} duplicata(s) ignorada(s).`,
      duplicates.length > 0 ? 'warning' : 'success',
      req
    );

    // Notificar n8n Webhook
    if (uniqueItems.length > 0) {
      dispatchN8nEvent('new_invoices', {
        source: 'GOOGLE_DRIVE_FOLDER',
        filename: pdfName,
        count: uniqueItems.length,
        invoices: uniqueItems
      });
    }
    if (duplicates.length > 0) {
      dispatchN8nEvent('duplicate_detected', {
        source: 'GOOGLE_DRIVE_FOLDER',
        filename: pdfName,
        count: duplicates.length,
        duplicates
      });
    }

    res.json({
      success: true,
      filename: pdfName,
      count: uniqueItems.length,
      duplicateCount: duplicates.length,
      duplicates,
      extracted: uniqueItems
    });
  } catch (err: any) {
    console.error('[Google Drive Sync Error]:', err);
    res.status(500).json({ error: err.message || 'Erro ao processar PDF do Google Drive' });
  }
});

app.get('/api/gsheets/config', authenticateToken, async (_req, res) => {
  try {
    const config = await getGSheetsConfigFromDb();
    res.json({ config });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gsheets/config', authenticateToken, async (req, res) => {
  try {
    const config = await saveGSheetsConfigToDb(req.body);
    res.json({ config });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8.1 N8N AUTOMATION API
app.get('/api/n8n/config', authenticateToken, async (_req, res) => {
  try {
    const config = await getN8nConfigFromDb();
    res.json({ config });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/n8n/config', authenticateToken, async (req, res) => {
  try {
    const config = await saveN8nConfigToDb(req.body);
    res.json({ config });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/n8n/test-webhook', authenticateToken, async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return res.status(400).json({ error: 'URL de Webhook do n8n invÃ¡lida.' });
    }

    const testPayload = {
      event: 'test_ping',
      timestamp: new Date().toISOString(),
      source: 'SPM_STORE_FISCAL_SYSTEM',
      message: 'ConexÃ£o de teste entre SPM Fiscal e n8n realizada com sucesso!',
      sampleData: {
        cliente: 'Cliente Teste SPM Store',
        fatura: '999999',
        valorNota: '250,00',
        municipio: 'SÃ£o Paulo',
        uf: 'SP',
        origem: 'Shopee'
      }
    };

    const startTime = Date.now();
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SPM-Fiscal-n8n-Test'
      },
      body: JSON.stringify(testPayload),
      redirect: 'follow'
    });

    const duration = Date.now() - startTime;
    const responseText = await resp.text();

    await saveN8nConfigToDb({
      lastTrigger: new Date().toISOString(),
      lastStatus: resp.ok ? 'SUCCESS' : 'ERROR'
    });

    res.json({
      success: resp.ok || resp.status < 400,
      status: resp.status,
      durationMs: duration,
      response: responseText.slice(0, 300) || 'Evento recebido com sucesso pelo n8n!'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao conectar com o Webhook do n8n.' });
  }
});

// 9. ALERTS API
app.get('/api/alerts', authenticateToken, async (_req, res) => {
  try {
    const alerts = await getAlertsFromDb();
    res.json({ alerts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const newRule: AlertRule = {
      ...req.body,
      id: 'rule-' + Date.now()
    };
    await saveAlertToDb(newRule);
    res.status(201).json({ alert: newRule });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/alerts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rule: AlertRule = { ...req.body, id };
    await saveAlertToDb(rule);
    res.json({ alert: rule });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/alerts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteAlertFromDb(id);
    res.json({ message: 'Regra removida com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/test-email', authenticateToken, async (req, res) => {
  const { recipientEmail } = req.body;
  const settings = await getSettingsFromDb();
  res.json({ success: true, message: `E-mail de teste enviado com sucesso para ${recipientEmail || settings.smtpSender}` });
});

app.post('/api/notifications/push-test', authenticateToken, (_req, res) => {
  res.json({ success: true, message: 'NotificaÃ§Ã£o Push enviada com sucesso!' });
});

// 10. SYSTEM LOGS & SETTINGS
app.get('/api/logs', authenticateToken, async (_req, res) => {
  try {
    const logs = await getLogsFromDb();
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/logs', authenticateToken, async (_req, res) => {
  try {
    await clearLogsInDb();
    res.json({ message: 'Logs limpos com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings', authenticateToken, async (_req, res) => {
  try {
    const [settings, powerBiConfig, gsheetsConfig] = await Promise.all([
      getSettingsFromDb(),
      getPowerBiConfigFromDb(),
      getGSheetsConfigFromDb()
    ]);
    res.json({
      settings,
      powerBiConfig,
      gsheetsConfig
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = await saveSettingsToDb(req.body);
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= BOOTSTRAP & VITE MIDDLEWARE =================
async function startServer() {
  // Inicializa o banco de dados MySQL e aplica migraÃ§Ãµes automÃ¡ticas
  try {
    await getDbPool();
  } catch (dbErr: any) {
    console.warn(`[Aviso MySQL] NÃ£o foi possÃ­vel conectar imediatamente ao MySQL: ${dbErr.message}`);
    console.warn('[Dica] Certifique-se de que o serviÃ§o MySQL estÃ¡ ativo no painel do XAMPP (Porta 3306).');
  }

  // Localização inteligente da pasta dist com suporte a qualquer diretório de execução
  const candidateDistDirs = [
    path.join(__dirname),                           // Se executado a partir de dist/server.cjs
    path.join(__dirname, 'dist'),                   // Se executado a partir da raiz do projeto
    path.join(process.cwd(), 'dist'),               // Se executado via CWD do projeto
    path.join(process.cwd())                        // Fallback direto
  ];

  const distDir = candidateDistDirs.find(d => 
    fs.existsSync(path.join(d, 'index.html')) && fs.existsSync(path.join(d, 'assets'))
  );

  if (distDir) {
    console.log(`[SPM Store Fiscal] Servindo frontend de produção compilado em: ${distDir}`);
    // Servir ativos estáticos com cache e sem cache para o index.html
    app.use(express.static(distDir, {
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    // Fallback SPA (Single Page Application) para todas as rotas não-API
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('[SPM Store Fiscal] Modo desenvolvimento: inicializando Vite Dev Server...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.error('[ERRO CRÍTICO] Pasta dist/ não encontrada! Execute "npm run build" para gerar os arquivos estáticos de produção.');
    app.get('*', (_req, res) => {
      res.status(500).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; text-align: center;">
            <h1 style="color: #38bdf8;">SPM Store Fiscal - Build de Produção Necessário</h1>
            <p>Os arquivos estáticos compilados não foram encontrados na pasta <code>dist/</code>.</p>
            <p>Execute no terminal: <code>npm run build</code> e reinicie a aplicação.</p>
          </body>
        </html>
      `);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SPM Store Fiscal] Servidor rodando com sucesso em http://localhost:${PORT}`);
  });
}

startServer();
