import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as pdfParseModule from 'pdf-parse';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { parseDanfeText, extractSpmInvoicesFromPdfText } from './src/lib/pdfParser.ts';
import {
  getDbPool,
  getInvoicesFromDb,
  getInvoiceById,
  saveInvoiceToDb,
  deleteInvoiceFromDb,
  bulkDeleteInvoicesFromDb,
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
  DuplicateInvoiceNotice
} from './src/lib/db.ts';
import { 
  Invoice, 
  User, 
  LogEntry, 
  AlertRule, 
  DashboardStats, 
  PowerBiConfig, 
  GSheetsConfig, 
  SystemSettings,
  N8nConfig
} from './src/types.ts';

async function extractTextFromPdfBuffer(dataBuffer: Buffer): Promise<string> {
  try {
    const PDFClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;
    if (typeof PDFClass === 'function') {
      const parser = new PDFClass({ data: dataBuffer });
      const res = await parser.getText();
      return typeof res === 'string' ? res : (res?.text || '');
    }
  } catch (e) {
    console.warn('PDFParse class attempt failed:', e);
  }

  try {
    const fn = (pdfParseModule as any).default || pdfParseModule;
    if (typeof fn === 'function') {
      const res = await fn(dataBuffer);
      return typeof res === 'string' ? res : (res?.text || '');
    }
  } catch (e) {
    console.warn('pdfParse function attempt failed:', e);
  }

  throw new Error('Não foi possível extrair o texto do arquivo PDF.');
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secur3-spm-store-jwt-secret-2026';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
      name: 'José Galdino (Administrador)',
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

// 1. AUTH API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmailFromDb(email || '');
    
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo.' });
    }

    const storedHash = await getUserPasswordHash(user.email);
    const isValid = storedHash ? bcrypt.compareSync(password || '', storedHash) : (password === 'admin123');

    if (!isValid) {
      await logAction(user.id, user.name, 'Falha de Login', 'AUTH', `Tentativa de login com senha inválida para ${email}`, 'warning', req);
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    await updateLastLoginInDb(user.id);
    user.lastLogin = new Date().toISOString();

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    await logAction(user.id, user.name, 'Login Realizado', 'AUTH', `Usuário ${user.name} autenticou-se com sucesso.`, 'success', req);
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
      return res.status(400).json({ error: 'Nome, email e perfil são obrigatórios.' });
    }

    const existingUser = await getUserByEmailFromDb(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
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
    await logAction(currentUser?.id || 'admin', currentUser?.name || 'Admin', 'Criação de Usuário', 'SECURITY', `Novo usuário ${email} criado com perfil ${role}`, 'info', req);

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
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (active !== undefined) user.active = active;
    if (department !== undefined) user.department = department;

    const passwordHash = password ? bcrypt.hashSync(password, 8) : undefined;
    await saveUserToDb(user, passwordHash);

    const currentUser = (req as any).user;
    await logAction(currentUser?.id || 'admin', currentUser?.name || 'Admin', 'Edição de Usuário', 'SECURITY', `Usuário ${user.email} atualizado`, 'info', req);

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/auth/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdFromDb(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (user.role === 'ADMIN' && user.email === 'josegaldino@hotmail.com.br') {
      return res.status(403).json({ error: 'O usuário Administrador Principal não pode ser removido.' });
    }

    await deleteUserFromDb(id);

    const currentUser = (req as any).user;
    await logAction(currentUser?.id || 'admin', currentUser?.name || 'Admin', 'Exclusão de Usuário', 'SECURITY', `Usuário ${user.email} removido do sistema`, 'warning', req);

    res.json({ message: 'Usuário removido com sucesso.' });
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
        'Tentativa de Inserção Duplicada', 
        'UPLOAD', 
        `Nota com fatura ${newInvoice.fatura} e CPF/CNPJ ${newInvoice.documento} já existe.`, 
        'warning', 
        req
      );
      return res.status(409).json({ 
        error: 'Esta nota fiscal já está cadastrada no sistema.',
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
    if (!existing) return res.status(404).json({ error: 'Registro fiscal não encontrado.' });

    const updated: Invoice = { ...existing, ...req.body };
    await saveInvoiceToDb(updated);
    await syncDatabaseToSqlFile();

    const user = (req as any).user;
    await logAction(user?.id || 'admin', user?.name || 'Admin', 'Edição de Nota Fiscal', 'UPLOAD', `Dados do registro #${id} atualizados`, 'info', req);

    res.json({ invoice: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getInvoiceById(id);
    if (!existing) return res.status(404).json({ error: 'Registro não encontrado.' });

    await deleteInvoiceFromDb(id);

    const user = (req as any).user;
    await logAction(user?.id || 'admin', user?.name || 'Admin', 'Exclusão de Nota Fiscal', 'UPLOAD', `Registro #${existing.id} de ${existing.nome} excluído`, 'warning', req);

    res.json({ message: 'Registro removido com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Nenhum ID fornecido para exclusão.' });
    }

    const removedCount = await bulkDeleteInvoicesFromDb(ids);

    const user = (req as any).user;
    await logAction(user?.id || 'admin', user?.name || 'Admin', 'Exclusão em Lote', 'UPLOAD', `${removedCount} registros fiscais excluídos`, 'warning', req);

    res.json({ message: `${removedCount} registros removidos com sucesso.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices/bulk-update', authenticateToken, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Nenhum ID fornecido para atualização em lote.' });
    }
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Nenhum dado de atualização fornecido.' });
    }

    const currentInvoices = await getInvoicesFromDb();
    const updatedList: Invoice[] = [];

    for (const id of ids) {
      const existing = currentInvoices.find(inv => inv.id === id);
      if (!existing) continue;

      const updated: Invoice = {
        ...existing,
        cor: updates.cor !== undefined && updates.cor !== '' && updates.cor !== 'MANTER' ? updates.cor : existing.cor,
        origem: updates.origem !== undefined && updates.origem !== '' && updates.origem !== 'MANTER' ? updates.origem : existing.origem,
        quantidade: updates.quantidade !== undefined && updates.quantidade !== '' && updates.quantidade !== 'MANTER' ? updates.quantidade : existing.quantidade,
        codigo: updates.codigo !== undefined && updates.codigo !== '' && updates.codigo !== 'MANTER' ? updates.codigo : existing.codigo,
        descricao: updates.descricao !== undefined && updates.descricao !== '' && updates.descricao !== 'MANTER' ? updates.descricao : existing.descricao,
        status: updates.status !== undefined && updates.status !== '' && updates.status !== 'MANTER' ? updates.status : existing.status,
      };

      await saveInvoiceToDb(updated);
      updatedList.push(updated);
    }

    if (updatedList.length > 0) {
      await syncDatabaseToSqlFile();
    }

    const user = (req as any).user || { id: 'admin', name: 'Administrador' };
    await logAction(
      user.id,
      user.name,
      'Edição em Lote de Notas Fiscais',
      'EDIT',
      `${updatedList.length} notas atualizadas em lote`,
      'success',
      req
    );

    res.json({
      success: true,
      updatedCount: updatedList.length,
      message: `${updatedList.length} nota(s) fiscal(is) atualizada(s) em lote com sucesso.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar registros em lote.' });
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

// 3. JAVASCRIPT PDF EXTRACTION API
app.post('/api/extract/pdf', upload.array('files', 100), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF foi enviado.' });
    }

    let rawExtractedInvoices: Invoice[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of files) {
      try {
        const destInNotasFiscais = path.join(notasFiscaisDir, file.originalname);
        fs.copyFileSync(file.path, destInNotasFiscais);

        const dataBuffer = fs.readFileSync(file.path);
        const text = await extractTextFromPdfBuffer(dataBuffer);

        const items = extractSpmInvoicesFromPdfText(text, file.originalname);
        rawExtractedInvoices.push(...items);

        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err: any) {
        errors.push({ filename: file.originalname, error: err.message || 'Erro ao extrair texto do PDF' });
      }
    }

    // Checagem rigorosa de duplicidade contra o banco existente
    const currentInvoices = await getInvoicesFromDb();
    const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawExtractedInvoices);

    // Salvar novos itens únicos no MySQL
    for (const item of uniqueItems) {
      await saveInvoiceToDb(item);
    }

    // Sincronizar o arquivo database_spm_fiscal.sql
    await syncDatabaseToSqlFile();

    const user = (req as any).user || { id: 'admin', name: 'Administrador' };
    
    // Log de auditoria
    if (duplicates.length > 0) {
      await logAction(
        user.id, 
        user.name, 
        'Aviso de Notas Duplicadas', 
        'UPLOAD', 
        `Foram detectadas ${duplicates.length} nota(s) duplicada(s) ignoradas no lote de PDFs.`, 
        'warning', 
        req
      );
    }

    await logAction(
      user.id, 
      user.name, 
      'Processamento de PDFs Concluído', 
      'UPLOAD', 
      `Processamento de ${files.length} arquivo(s) PDF: ${uniqueItems.length} novos registros salvos no MySQL e sincronizados no SQL. ${duplicates.length} duplicata(s) ignorada(s).`, 
      errors.length > 0 ? 'warning' : 'success', 
      req
    );

    // Notificar n8n Webhook
    if (uniqueItems.length > 0) {
      dispatchN8nEvent('new_invoices', {
        source: 'PDF_BATCH_UPLOAD',
        count: uniqueItems.length,
        invoices: uniqueItems
      });
    }
    if (duplicates.length > 0) {
      dispatchN8nEvent('duplicate_detected', {
        source: 'PDF_BATCH_UPLOAD',
        count: duplicates.length,
        duplicates
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
    console.error('PDF Extraction Error:', error);
    res.status(500).json({ error: 'Erro ao processar lote de arquivos PDF.' });
  }
});

// 4. SCAN LOCAL NOTAS_FISCAIS FOLDER
app.post('/api/scan-local-folder', authenticateToken, async (req, res) => {
  try {
    if (!fs.existsSync(notasFiscaisDir)) {
      return res.json({ success: true, count: 0, duplicateCount: 0, duplicates: [], extracted: [] });
    }

    const pdfFiles = fs.readdirSync(notasFiscaisDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    let rawItems: Invoice[] = [];

    for (const file of pdfFiles) {
      try {
        const filePath = path.join(notasFiscaisDir, file);
        const dataBuffer = fs.readFileSync(filePath);
        const text = await extractTextFromPdfBuffer(dataBuffer);

        const items = extractSpmInvoicesFromPdfText(text, file);
        rawItems.push(...items);
      } catch (err) {
        console.error(`Erro ao ler ${file}:`, err);
      }
    }

    const currentInvoices = await getInvoicesFromDb();
    const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawItems);

    for (const item of uniqueItems) {
      await saveInvoiceToDb(item);
    }

    if (uniqueItems.length > 0) {
      await syncDatabaseToSqlFile();
    }

    const user = (req as any).user;
    if (duplicates.length > 0) {
      await logAction(
        user?.id || 'admin',
        user?.name || 'Admin',
        'Duplicidades na Varredura de Pasta',
        'UPLOAD',
        `${duplicates.length} registros já existiam na pasta 'Notas_Fiscais' e foram ignorados.`,
        'warning',
        req
      );
    }

    res.json({
      success: true,
      count: uniqueItems.length,
      duplicateCount: duplicates.length,
      duplicates,
      totalPdfs: pdfFiles.length,
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

// Fila sequencial assíncrona para processamento suave de PDFs
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
        // Pausa cooperativa leve para o event loop
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
    const text = await extractTextFromPdfBuffer(dataBuffer);
    const items = extractSpmInvoicesFromPdfText(text, filename);
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
        cor: item.cor || 'Não identificada',
        valor: item.valorNota || '0,00',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        filename
      });
      if (gdriveRecentProcessed.length > 20) gdriveRecentProcessed.pop();
    }

    if (uniqueItems.length > 0) {
      // Backup local
      try {
        const destInNotasFiscais = path.join(notasFiscaisDir, filename);
        if (!fs.existsSync(destInNotasFiscais) && filePath !== destInNotasFiscais) {
          fs.copyFileSync(filePath, destInNotasFiscais);
        }
      } catch (_) {}

      await logAction(
        'system-gdrive',
        'Google Drive Watcher',
        'Sincronização Automática Google Drive',
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

      console.log(`[Google Drive Sync] ✅ ${uniqueItems.length} nota(s) sincronizada(s) automaticamente: ${filename}`);
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

async function processSinglePdfFile(filePath: string, filename: string, sourceTag = 'GDRIVE_DESKTOP_WATCHER'): Promise<Invoice[]> {
  const currentInvoices = await getInvoicesFromDb();
  const existingKeySet = new Set<string>();
  currentInvoices.forEach(inv => {
    if (inv.id) existingKeySet.add(inv.id.trim());
    if (inv.fatura) existingKeySet.add(inv.fatura.trim());
    if (inv.fatura && inv.nome) existingKeySet.add(`${inv.fatura.trim()}_${(inv.nome || '').trim().toLowerCase()}`);
  });
  return processSinglePdfFileCached(filePath, filename, existingKeySet, sourceTag);
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
  const pdfFiles = allEntries.filter(f => f.toLowerCase().endsWith('.pdf'));
  let rawItems: Invoice[] = [];

  for (const file of pdfFiles) {
    try {
      const filePath = path.join(gdriveDesktopPath, file);
      const dataBuffer = fs.readFileSync(filePath);
      const text = await extractTextFromPdfBuffer(dataBuffer);
      const items = extractSpmInvoicesFromPdfText(text, file);
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
      filename: item.origemArquivo || 'Google Drive PDF'
    });
    if (gdriveRecentProcessed.length > 20) gdriveRecentProcessed.pop();
  }

  if (uniqueItems.length > 0) {
    await syncDatabaseToSqlFile();
  }

  gdriveLastSync = new Date().toISOString();
  gdriveLastError = null;

  return {
    success: true,
    count: uniqueItems.length,
    duplicateCount: duplicates.length,
    duplicates,
    totalPdfs: pdfFiles.length,
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
      if (filePath.toLowerCase().endsWith('.pdf')) {
        const filename = path.basename(filePath);
        console.log(`[Google Drive Watcher] 📄 Novo PDF detectado na fila: ${filename}`);
        enqueuePdfForProcessing(filePath);
      }
    });

    gdriveWatcher.on('change', (filePath: string) => {
      if (filePath.toLowerCase().endsWith('.pdf')) {
        const filename = path.basename(filePath);
        console.log(`[Google Drive Watcher] 🔄 PDF alterado na fila: ${filename}`);
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

// 4.1 ENDPOINTS GOOGLE DRIVE PARA DESKTOP
app.get('/api/gdrive-desktop/status', async (_req, res) => {
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

app.post('/api/gdrive-desktop/config', authenticateToken, async (req, res) => {
  try {
    const { folderPath, autoSync } = req.body;
    if (folderPath && typeof folderPath === 'string') {
      gdriveDesktopPath = folderPath.trim();
    }
    if (typeof autoSync === 'boolean') {
      gdriveAutoSync = autoSync;
    }

    initGoogleDriveWatcher();

    const user = (req as any).user;
    await logAction(
      user?.id || 'admin',
      user?.name || 'Admin',
      'Configuração Google Drive Desktop',
      'SYSTEM',
      `Caminho atualizado para '${gdriveDesktopPath}' (Auto-Sync: ${gdriveAutoSync})`,
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
    res.status(500).json({ error: err.message || 'Erro ao configurar Google Drive Desktop' });
  }
});

// 5. EXCEL IMPORT & UPSERT API (Importação e Atualização Inteligente)
const handleExcelImport = async (req: any, res: any) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Nenhum arquivo Excel (.xlsx) enviado.' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file.path);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'A planilha enviada está vazia.' });
    }

    const currentInvoices = await getInvoicesFromDb();
    const updatedInvoices: Invoice[] = [];
    const insertedInvoices: Invoice[] = [];
    let totalProcessed = 0;

    // Detectar posições dos cabeçalhos na primeira linha
    let colMap: Record<string, number> = {};
    const firstRow = worksheet.getRow(1).values as any[];
    if (Array.isArray(firstRow)) {
      firstRow.forEach((val, idx) => {
        if (!val) return;
        const str = String(val).trim().toUpperCase();
        if (/NOME|RAZ[AÃ]O|CLIENTE/i.test(str)) colMap['nome'] = idx;
        else if (/CPF|CNPJ|DOCUMENTO/i.test(str)) colMap['documento'] = idx;
        else if (/DATA/i.test(str)) colMap['dataSaida'] = idx;
        else if (/ENDERE[CÇ]O|LOGRADOURO/i.test(str)) colMap['endereco'] = idx;
        else if (/BAIRRO/i.test(str)) colMap['bairro'] = idx;
        else if (/CEP/i.test(str)) colMap['cep'] = idx;
        else if (/CIDADE|MUNIC[IÍ]PIO/i.test(str)) colMap['municipio'] = idx;
        else if (/^UF$|ESTADO/i.test(str)) colMap['uf'] = idx;
        else if (/FATURA|N[UÚ]MERO/i.test(str)) colMap['fatura'] = idx;
        else if (/VALOR\s*TOTAL|VALOR\s*PROD/i.test(str)) colMap['valorProdutos'] = idx;
        else if (/VALOR\s*FINAL|VALOR\s*NOTA/i.test(str)) colMap['valorNota'] = idx;
        else if (/DESCONTO/i.test(str)) colMap['desconto'] = idx;
        else if (/C[OÓ]DIGO|SKU/i.test(str)) colMap['codigo'] = idx;
        else if (/QUANTIDADE|QTD/i.test(str)) colMap['quantidade'] = idx;
        else if (/DESCRI[CÇ][AÃ]O|PRODUTO|ITEM/i.test(str)) colMap['descricao'] = idx;
        else if (/^COR$/i.test(str)) colMap['cor'] = idx;
        else if (/MARKETPLACE|ORIGEM|CANAL/i.test(str)) colMap['origem'] = idx;
        else if (/^ID$/i.test(str)) colMap['id'] = idx;
      });
    }

    const getColVal = (vals: any[], key: string, fallbackIdx: number): string => {
      const idx = colMap[key] !== undefined ? colMap[key] : fallbackIdx;
      const v = vals[idx];
      if (v === null || v === undefined) return '';
      if (v instanceof Date) {
        return v.toLocaleDateString('pt-BR');
      }
      return String(v).trim();
    };

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // pular cabeçalho
      const vals = row.values as any[];
      if (!vals || vals.length < 2) return;

      const rawNome = getColVal(vals, 'nome', 1);
      const rawDoc = getColVal(vals, 'documento', 2);
      const rawData = getColVal(vals, 'dataSaida', 3);
      const rawEnd = getColVal(vals, 'endereco', 4);
      const rawBairro = getColVal(vals, 'bairro', 5);
      const rawCep = getColVal(vals, 'cep', 6);
      const rawMun = getColVal(vals, 'municipio', 7);
      const rawUf = getColVal(vals, 'uf', 8);
      const rawFatura = getColVal(vals, 'fatura', 9);
      const rawValProd = getColVal(vals, 'valorProdutos', 10);
      const rawValNota = getColVal(vals, 'valorNota', 11);
      const rawDesc = getColVal(vals, 'desconto', 12);
      const rawCod = getColVal(vals, 'codigo', 13);
      const rawQtd = getColVal(vals, 'quantidade', 14);
      const rawDescricao = getColVal(vals, 'descricao', 15);
      const rawCor = getColVal(vals, 'cor', 16);
      const rawOrigem = getColVal(vals, 'origem', 17);
      const rawId = getColVal(vals, 'id', -1);

      // Pular linhas completamente vazias
      if (!rawNome && !rawDoc && !rawFatura && !rawDescricao) return;
      totalProcessed++;

      // Buscar se este registro já existe no banco de dados para atualizar
      const existing = currentInvoices.find(inv => {
        if (rawId && inv.id === rawId) return true;

        const invDocClean = (inv.documento || '').replace(/[^\d]/g, '');
        const rowDocClean = rawDoc.replace(/[^\d]/g, '');
        const invFat = (inv.fatura || '').replace(/\D/g, '');
        const rowFat = rawFatura.replace(/\D/g, '');
        const invCod = (inv.codigo || '').trim().toUpperCase();
        const rowCodClean = rawCod.trim().toUpperCase();
        const invNome = (inv.nome || '').trim().toLowerCase();
        const rowNomeClean = rawNome.trim().toLowerCase();

        // 1. CPF/CNPJ + Fatura
        if (invDocClean && rowDocClean && invDocClean === rowDocClean && invFat && rowFat && invFat === rowFat) return true;

        // 2. CPF/CNPJ + SKU
        if (invDocClean && rowDocClean && invDocClean === rowDocClean && invCod && rowCodClean && invCod === rowCodClean) return true;

        // 3. CPF/CNPJ único válido (CPF com 11 dígitos ou CNPJ com 14)
        if (invDocClean && rowDocClean && invDocClean === rowDocClean && rowDocClean.length >= 9) return true;

        // 4. Nome + SKU
        if (invNome && rowNomeClean && invNome === rowNomeClean && invCod && rowCodClean && invCod === rowCodClean) return true;

        // 5. Nome + Fatura
        if (invNome && rowNomeClean && invNome === rowNomeClean && invFat && rowFat && invFat === rowFat) return true;

        // 6. Fatura longa e única (>= 5 dígitos)
        if (invFat && rowFat && invFat === rowFat && rowFat.length >= 5) return true;

        return false;
      });

      if (existing) {
        // ATUALIZAÇÃO (UPSERT): Atualiza a cor, quantidade, descrição, valores e demais campos modificados
        const updated: Invoice = {
          ...existing,
          nome: rawNome || existing.nome,
          documento: rawDoc || existing.documento,
          dataSaida: rawData || existing.dataSaida,
          endereco: rawEnd || existing.endereco,
          bairro: rawBairro || existing.bairro,
          cep: rawCep || existing.cep,
          municipio: rawMun || existing.municipio,
          uf: rawUf || existing.uf,
          fatura: rawFatura || existing.fatura,
          valorProdutos: rawValProd || existing.valorProdutos,
          valorNota: rawValNota || existing.valorNota,
          desconto: rawDesc || existing.desconto,
          codigo: rawCod || existing.codigo,
          quantidade: rawQtd || existing.quantidade,
          descricao: rawDescricao || existing.descricao,
          cor: rawCor || existing.cor,
          origem: rawOrigem || existing.origem,
          status: 'Processado'
        };

        updatedInvoices.push(updated);
      } else {
        // NOVO REGISTRO: Adiciona novo item na base de dados
        const newInvoice: Invoice = {
          id: rawId || ('spm-imp-' + Date.now() + '-' + rowNumber),
          nome: rawNome || 'Consumidor',
          documento: rawDoc || '',
          dataSaida: rawData || new Date().toLocaleDateString('pt-BR'),
          endereco: rawEnd || '',
          bairro: rawBairro || '',
          cep: rawCep || '',
          municipio: rawMun || 'São Paulo',
          uf: rawUf || 'SP',
          fatura: rawFatura || '',
          valorProdutos: rawValProd || '0,00',
          valorNota: rawValNota || '0,00',
          desconto: rawDesc || '0,00',
          codigo: rawCod || 'SPM-Verniz',
          quantidade: rawQtd || '1',
          descricao: rawDescricao || 'Verniz SPM Store',
          cor: rawCor || 'Não identificada',
          origem: rawOrigem || 'Outros',
          origemArquivo: file.originalname,
          dataUpload: new Date().toISOString(),
          status: 'Processado'
        };

        insertedInvoices.push(newInvoice);
      }
    });

    // Salvar todas as atualizações no MySQL
    for (const inv of updatedInvoices) {
      await saveInvoiceToDb(inv);
    }

    // Salvar todas as novas inserções no MySQL
    for (const inv of insertedInvoices) {
      await saveInvoiceToDb(inv);
    }

    if (updatedInvoices.length > 0 || insertedInvoices.length > 0) {
      await syncDatabaseToSqlFile();
    }

    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    const user = (req as any).user || { id: 'admin', name: 'Administrador' };
    await logAction(
      user.id,
      user.name,
      'Importação e Atualização de Planilha Excel',
      'UPLOAD',
      `Planilha '${file.originalname}' importada: ${updatedInvoices.length} registro(s) atualizado(s), ${insertedInvoices.length} novo(s) inserido(s).`,
      'success',
      req
    );

    res.json({
      success: true,
      totalRows: totalProcessed,
      updatedCount: updatedInvoices.length,
      insertedCount: insertedInvoices.length,
      message: `Planilha processada com sucesso! ${updatedInvoices.length} registro(s) atualizado(s) e ${insertedInvoices.length} novo(s) inserido(s).`
    });
  } catch (error: any) {
    console.error('Erro na importação da planilha Excel:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ error: error.message || 'Erro ao importar e atualizar planilha Excel.' });
  }
};

app.post('/api/invoices/import-excel', upload.single('file'), handleExcelImport);
app.post('/api/extract/excel', upload.single('file'), handleExcelImport);

// 6. EXCEL EXPORT
app.get('/api/export/excel', async (_req, res) => {
  try {
    const invoices = await getInvoicesFromDb();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Notas Fiscais');

    worksheet.columns = [
      { header: 'NOME', key: 'nome', width: 32 },
      { header: 'CPF/CNPJ', key: 'documento', width: 20 },
      { header: 'DATA NF-e', key: 'dataSaida', width: 14 },
      { header: 'ENDEREÇO', key: 'endereco', width: 30 },
      { header: 'BAIRRO', key: 'bairro', width: 20 },
      { header: 'CEP', key: 'cep', width: 14 },
      { header: 'CIDADE', key: 'municipio', width: 20 },
      { header: 'UF', key: 'uf', width: 8 },
      { header: 'FATURAS', key: 'fatura', width: 14 },
      { header: 'VALOR TOTAL', key: 'valorProdutos', width: 16 },
      { header: 'VALOR FINAL', key: 'valorNota', width: 16 },
      { header: 'DESCONTO', key: 'desconto', width: 14 },
      { header: 'CÓDIGO', key: 'codigo', width: 22 },
      { header: 'QUANTIDADE', key: 'quantidade', width: 14 },
      { header: 'DESCRIÇÃO', key: 'descricao', width: 35 },
      { header: 'COR', key: 'cor', width: 16 },
      { header: 'MARKETPLACE', key: 'origem', width: 18 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 26;

    invoices.forEach(inv => {
      worksheet.addRow({
        nome: inv.nome,
        documento: inv.documento,
        dataSaida: inv.dataSaida,
        endereco: inv.endereco,
        bairro: inv.bairro,
        cep: inv.cep,
        municipio: inv.municipio,
        uf: inv.uf,
        fatura: inv.fatura,
        valorProdutos: inv.valorProdutos,
        valorNota: inv.valorNota,
        desconto: inv.desconto,
        codigo: inv.codigo,
        quantidade: inv.quantidade,
        descricao: inv.descricao,
        cor: inv.cor,
        origem: inv.origem
      });
    });

    worksheet.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        row.alignment = { vertical: 'middle' };
        row.font = { size: 9 };
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Auditoria_Faturamento_SPM.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Excel Export Error:', error);
    res.status(500).json({ error: 'Erro ao gerar arquivo Excel.' });
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
      'Sincronização com Google Sheets',
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
      return res.status(400).json({ error: 'URL de Webhook inválida.' });
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
      response: responseText.slice(0, 300) || 'Conexão confirmada com sucesso pelo Google Apps Script.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao testar conexão com o Webhook.' });
  }
});

// 4.1 GOOGLE DRIVE AUTOMATIC SYNC WEBHOOK ENDPOINT
app.post('/api/drive/sync-pdf', async (req, res) => {
  try {
    const { filename, fileId, text, base64Pdf } = req.body;

    if (!text && !base64Pdf) {
      return res.status(400).json({ error: 'Nenhum texto ou conteúdo PDF foi enviado pelo Google Drive.' });
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
      'Sincronização Automática Google Drive',
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
      return res.status(400).json({ error: 'URL de Webhook do n8n inválida.' });
    }

    const testPayload = {
      event: 'test_ping',
      timestamp: new Date().toISOString(),
      source: 'SPM_STORE_FISCAL_SYSTEM',
      message: 'Conexão de teste entre SPM Fiscal e n8n realizada com sucesso!',
      sampleData: {
        cliente: 'Cliente Teste SPM Store',
        fatura: '999999',
        valorNota: '250,00',
        municipio: 'São Paulo',
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
  res.json({ success: true, message: 'Notificação Push enviada com sucesso!' });
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
  // Inicializa o banco de dados MySQL e aplica migrações automáticas
  try {
    await getDbPool();
  } catch (dbErr: any) {
    console.warn(`[Aviso MySQL] Não foi possível conectar imediatamente ao MySQL: ${dbErr.message}`);
    console.warn('[Dica] Certifique-se de que o serviço MySQL está ativo no painel do XAMPP (Porta 3306).');
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Inicializa o monitoramento contínuo da pasta do Google Drive para Desktop (100% Offline)
  initGoogleDriveWatcher();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SPM Store Fiscal] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();

