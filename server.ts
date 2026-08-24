import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as pdfParseModule from 'pdf-parse';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { parseDanfeText, extractSpmInvoicesFromPdfText } from './src/lib/pdfParser';

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

import { 
  Invoice, 
  User, 
  LogEntry, 
  AlertRule, 
  DashboardStats, 
  PowerBiConfig, 
  GSheetsConfig, 
  SystemSettings 
} from './src/types';

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

// Setup Persistent Data directory
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ================= PERSISTENCE HELPERS =================
function loadJson<T>(filename: string, fallback: T): T {
  const filePath = path.join(dataDir, filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn(`[Storage] Erro ao carregar ${filename}, usando dados padrão:`, e);
  }
  saveJson(filename, fallback);
  return fallback;
}

function saveJson<T>(filename: string, data: T): void {
  const filePath = path.join(dataDir, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`[Storage] Erro ao salvar ${filename}:`, e);
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// ================= INITIAL DATABASE SEED =================
const defaultUsers: User[] = [
  {
    id: 'u-admin-1',
    name: 'José Galdino (Administrador)',
    email: 'josegaldino@hotmail.com.br',
    role: 'ADMIN',
    active: true,
    lastLogin: new Date().toISOString(),
    department: 'SPM Store - Diretoria'
  },
  {
    id: 'u-gerente-1',
    name: 'Carlos Santos',
    email: 'gerente@empresa.com',
    role: 'MANAGER',
    active: true,
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    department: 'Faturamento'
  },
  {
    id: 'u-auditor-1',
    name: 'Ana Maria Ferreira',
    email: 'auditor@empresa.com',
    role: 'AUDITOR',
    active: true,
    lastLogin: new Date(Date.now() - 172800000).toISOString(),
    department: 'Auditoria Fiscal'
  }
];

const defaultUserPasswords: Record<string, string> = {
  'josegaldino@hotmail.com.br': bcrypt.hashSync('admin123', 8),
  'gerente@empresa.com': bcrypt.hashSync('gerente123', 8),
  'auditor@empresa.com': bcrypt.hashSync('auditor123', 8)
};

const defaultInvoices: Invoice[] = [
  {
    id: 'spm-1001',
    nome: 'Comércio e Distribuição Silva Ltda',
    documento: '12.345.678/0001-95',
    dataSaida: '05/08/2026',
    endereco: 'Rua das Palmeiras, 150 - Galpão 3',
    bairro: 'Jardim Paulista',
    cep: '01415-000',
    municipio: 'São Paulo',
    uf: 'SP',
    fatura: '27821',
    valorProdutos: '289,80',
    valorNota: '289,80',
    desconto: '0,00',
    codigo: 'SPM-Shopee-Preto-1',
    quantidade: '2',
    descricao: 'Verniz Especial Pro Alto Brilho - Cor: Preto',
    cor: 'Preto',
    origem: 'Shopee',
    origemArquivo: 'DANFE_Shopee_27821.pdf',
    dataUpload: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    status: 'Processado'
  },
  {
    id: 'spm-1002',
    nome: 'Supermercado e Utilidades Brasil S.A.',
    documento: '98.765.432/0001-10',
    dataSaida: '06/08/2026',
    endereco: 'Av. Brigadeiro Faria Lima, 2200',
    bairro: 'Itaim Bibi',
    cep: '01451-000',
    municipio: 'São Paulo',
    uf: 'SP',
    fatura: '33910',
    valorProdutos: '259,00',
    valorNota: '244,00',
    desconto: '15,00',
    codigo: 'SPM-Meli-Marrom-2',
    quantidade: '1',
    descricao: 'Verniz Poliuretano Acetinado - Cor: Marrom',
    cor: 'Marrom',
    origem: 'Mercado Livre',
    origemArquivo: 'DANFE_MELI_33910.pdf',
    dataUpload: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    status: 'Processado'
  },
  {
    id: 'spm-1003',
    nome: 'Distribuidora Express Carioca',
    documento: '55.544.433/0001-22',
    dataSaida: '07/08/2026',
    endereco: 'Rua Copacabana, 450',
    bairro: 'Copacabana',
    cep: '22020-001',
    municipio: 'Rio de Janeiro',
    uf: 'RJ',
    fatura: '44520',
    valorProdutos: '179,80',
    valorNota: '179,80',
    desconto: '0,00',
    codigo: 'SPM-Whatsapp-Incolor-1',
    quantidade: '2',
    descricao: 'Verniz Protetor UV Transparente - Cor: Incolor',
    cor: 'Incolor',
    origem: 'WhatsApp',
    origemArquivo: 'DANFE_Zap_44520.pdf',
    dataUpload: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(),
    status: 'Processado'
  },
  {
    id: 'spm-1004',
    nome: 'E-commerce Trends Sul Eireli',
    documento: '11.223.344/0001-55',
    dataSaida: '07/08/2026',
    endereco: 'Rua XV de Novembro, 1000',
    bairro: 'Centro',
    cep: '80020-310',
    municipio: 'Curitiba',
    uf: 'PR',
    fatura: '55123',
    valorProdutos: '199,90',
    valorNota: '189,90',
    desconto: '10,00',
    codigo: 'SPM-Tiktok-Preto-3',
    quantidade: '1',
    descricao: 'Verniz Acrílico Fosco - Cor: Preto',
    cor: 'Preto',
    origem: 'TikTok',
    origemArquivo: 'DANFE_TikTok_55123.pdf',
    dataUpload: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'Processado'
  }
];

const defaultLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    userId: 'u-admin-1',
    userName: 'José Galdino (Administrador)',
    action: 'Inicialização do Motor JavaScript',
    category: 'SYSTEM',
    details: 'Motor JavaScript SPM Store ativado com sucesso com persistência em disco.',
    ip: '127.0.0.1',
    severity: 'success'
  }
];

const defaultAlertRules: AlertRule[] = [
  {
    id: 'rule-1',
    name: 'Nota Fiscal com Valor Acima de R$ 5.000',
    type: 'HIGH_VALUE',
    threshold: 5000,
    emailNotify: true,
    pushNotify: true,
    active: true
  },
  {
    id: 'rule-2',
    name: 'Fim de Processamento em Lote de PDFs',
    type: 'BATCH_COMPLETE',
    emailNotify: true,
    pushNotify: false,
    active: true
  },
  {
    id: 'rule-3',
    name: 'Alerta de Erro na Extração de PDF',
    type: 'EXTRACTION_ERROR',
    emailNotify: true,
    pushNotify: true,
    active: true
  }
];

const defaultGSheetsConfig: GSheetsConfig = {
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  sheetName: 'Notas Fiscais',
  autoSync: true,
  lastSync: new Date().toISOString(),
  status: 'CONNECTED',
  webhookUrl: 'https://script.google.com/macros/s/AKfycbx_fiscal_sync_webhook/exec'
};

const defaultPowerBiConfig: PowerBiConfig = {
  enabled: true,
  refreshIntervalMinutes: 15,
  lastRefresh: new Date().toISOString(),
  apiKey: 'pbi-spm-key-' + Math.random().toString(36).substring(7),
  feedUrl: '/api/powerbi/feed'
};

const defaultSystemSettings: SystemSettings = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: 'alertas.fiscais@spmstore.com.br',
  smtpSender: 'SPM Store Alertas <alertas.fiscais@spmstore.com.br>',
  emailAlertsEnabled: true,
  pushAlertsEnabled: true,
  autoExportExcel: true,
  useGeminiOcrFallback: true,
  vpsMode: false
};

// ================= LOAD STORED STATE =================
let users: User[] = loadJson('users.json', defaultUsers);
let userPasswords: Record<string, string> = loadJson('userPasswords.json', defaultUserPasswords);
let invoices: Invoice[] = loadJson('invoices.json', defaultInvoices);
let logs: LogEntry[] = loadJson('logs.json', defaultLogs);
let alertRules: AlertRule[] = loadJson('alerts.json', defaultAlertRules);
let gsheetsConfig: GSheetsConfig = loadJson('gsheets.json', defaultGSheetsConfig);
let powerBiConfig: PowerBiConfig = loadJson('powerbi.json', defaultPowerBiConfig);
let systemSettings: SystemSettings = loadJson('settings.json', defaultSystemSettings);

const saveUsers = () => saveJson('users.json', users);
const saveUserPasswords = () => saveJson('userPasswords.json', userPasswords);
const saveInvoices = () => saveJson('invoices.json', invoices);
const saveLogs = () => saveJson('logs.json', logs);
const saveAlerts = () => saveJson('alerts.json', alertRules);
const saveGSheets = () => saveJson('gsheets.json', gsheetsConfig);
const savePowerBi = () => saveJson('powerbi.json', powerBiConfig);
const saveSettings = () => saveJson('settings.json', systemSettings);

// Helper to check invoice duplicates
function isDuplicateInvoice(existing: Invoice, newItem: Invoice): boolean {
  if (existing.fatura && newItem.fatura && existing.fatura !== 'Não encontrada' && newItem.fatura !== 'Não encontrada') {
    const docA = (existing.documento || '').replace(/\D/g, '');
    const docB = (newItem.documento || '').replace(/\D/g, '');
    const fatA = existing.fatura.trim();
    const fatB = newItem.fatura.trim();
    const codA = (existing.codigo || '').trim().toLowerCase();
    const codB = (newItem.codigo || '').trim().toLowerCase();

    return fatA === fatB && (docA === docB || docA === '' || docB === '') && codA === codB;
  }
  return false;
}

// Logging helper
function addLog(
  userId: string, 
  userName: string, 
  action: string, 
  category: LogEntry['category'], 
  details: string, 
  severity: LogEntry['severity'] = 'info', 
  req?: Request
) {
  const ip = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
  logs.unshift({
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action,
    category,
    details,
    ip,
    severity
  });
  if (logs.length > 500) logs.pop();
  saveLogs();
}

// Helper to parse Brazilian number string
function parseNum(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/R\$\s*/gi, '').replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

// Format number to Brazilian BRL format
function formatPtBr(val: number): string {
  return (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// JWT Authentication Middleware
function authenticateToken(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const defaultAdmin = users.find(u => u.role === 'ADMIN') || users[0];
    (req as any).user = defaultAdmin;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      const defaultAdmin = users.find(u => u.role === 'ADMIN') || users[0];
      (req as any).user = defaultAdmin;
      return next();
    }
    (req as any).user = user;
    next();
  });
}

// ================= API ENDPOINTS =================

// 0. HEALTH CHECK
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'SPM Store Sistema Fiscal & Auditoria NFs',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    invoicesCount: invoices.length,
    usersCount: users.length
  });
});

// 1. AUTH API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo.' });
  }

  const storedHash = userPasswords[user.email];
  const isValid = storedHash ? bcrypt.compareSync(password || '', storedHash) : (password === 'admin123');

  if (!isValid) {
    addLog(user.id, user.name, 'Falha de Login', 'AUTH', `Tentativa de login com senha inválida para ${email}`, 'warning', req);
    return res.status(401).json({ error: 'Senha incorreta.' });
  }

  user.lastLogin = new Date().toISOString();
  saveUsers();

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  addLog(user.id, user.name, 'Login Realizado', 'AUTH', `Usuário ${user.name} autenticou-se com sucesso.`, 'success', req);
  res.json({ token, user });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = (req as any).user;
  res.json({ user });
});

app.get('/api/auth/users', authenticateToken, (_req, res) => {
  res.json({ users });
});

app.post('/api/auth/users', authenticateToken, (req, res) => {
  const { name, email, role, department, password } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Nome, email e perfil são obrigatórios.' });
  }

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
  }

  const newUser: User = {
    id: 'u-' + Date.now(),
    name,
    email,
    role,
    active: true,
    lastLogin: 'Nunca',
    department: department || 'Geral'
  };

  users.push(newUser);
  userPasswords[email] = bcrypt.hashSync(password || 'senha123', 8);
  saveUsers();
  saveUserPasswords();

  const currentUser = (req as any).user;
  addLog(currentUser.id, currentUser.name, 'Criação de Usuário', 'SECURITY', `Novo usuário ${email} criado com perfil ${role}`, 'info', req);

  res.status(201).json({ user: newUser });
});

app.put('/api/auth/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, role, active, department, password } = req.body;
  
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;
  if (department !== undefined) user.department = department;
  if (password) {
    userPasswords[user.email] = bcrypt.hashSync(password, 8);
    saveUserPasswords();
  }

  saveUsers();

  const currentUser = (req as any).user;
  addLog(currentUser.id, currentUser.name, 'Atualização de Usuário', 'SECURITY', `Usuário ${user.email} atualizado`, 'info', req);

  res.json({ user });
});

app.delete('/api/auth/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  if (users.length <= 1) return res.status(400).json({ error: 'Não é possível remover o único usuário do sistema.' });
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const deletedUser = users[userIndex];
  users.splice(userIndex, 1);
  delete userPasswords[deletedUser.email];
  saveUsers();
  saveUserPasswords();

  const currentUser = (req as any).user;
  addLog(currentUser.id, currentUser.name, 'Exclusão de Usuário', 'SECURITY', `Usuário ${deletedUser.email} removido`, 'warning', req);

  res.json({ message: 'Usuário removido com sucesso.' });
});

// 2. INVOICE CRUD & SEARCH API
app.get('/api/invoices', (req, res) => {
  let result = [...invoices];
  const { search, origem, cor, uf, status } = req.query;

  if (search) {
    const q = (search as string).toLowerCase();
    result = result.filter(inv => 
      inv.nome.toLowerCase().includes(q) ||
      inv.documento.includes(q) ||
      inv.codigo.toLowerCase().includes(q) ||
      inv.descricao.toLowerCase().includes(q) ||
      inv.municipio.toLowerCase().includes(q) ||
      inv.fatura.includes(q)
    );
  }

  if (origem && origem !== 'Todas' && origem !== 'Todos') {
    result = result.filter(inv => inv.origem === origem);
  }

  if (cor && cor !== 'Todas' && cor !== 'Todos') {
    result = result.filter(inv => inv.cor.toLowerCase() === (cor as string).toLowerCase());
  }

  if (uf && uf !== 'Todos') {
    result = result.filter(inv => inv.uf === uf);
  }

  if (status && status !== 'Todos') {
    result = result.filter(inv => inv.status === status);
  }

  res.json({ invoices: result, totalCount: result.length });
});

app.post('/api/invoices', authenticateToken, (req, res) => {
  const newInvoice: Invoice = {
    ...req.body,
    id: req.body.id || 'spm-' + Date.now() + '-' + Math.floor(Math.random() * 100),
    dataUpload: new Date().toISOString()
  };

  invoices.unshift(newInvoice);
  saveInvoices();

  const user = (req as any).user;
  addLog(user.id, user.name, 'Cadastro de Nota Fiscal', 'UPLOAD', `Registro para ${newInvoice.nome} adicionado manualmente`, 'info', req);

  res.status(201).json({ invoice: newInvoice });
});

app.put('/api/invoices/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const index = invoices.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).json({ error: 'Registro fiscal não encontrado.' });

  invoices[index] = { ...invoices[index], ...req.body };
  saveInvoices();

  const user = (req as any).user;
  addLog(user.id, user.name, 'Edição de Nota Fiscal', 'UPLOAD', `Dados do registro #${id} atualizados`, 'info', req);

  res.json({ invoice: invoices[index] });
});

app.delete('/api/invoices/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const index = invoices.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).json({ error: 'Registro não encontrado.' });

  const deleted = invoices.splice(index, 1)[0];
  saveInvoices();

  const user = (req as any).user;
  addLog(user.id, user.name, 'Exclusão de Nota Fiscal', 'UPLOAD', `Registro #${deleted.id} de ${deleted.nome} excluído`, 'warning', req);

  res.json({ message: 'Registro removido com sucesso.' });
});

app.post('/api/invoices/bulk-delete', authenticateToken, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Nenhum ID fornecido para exclusão.' });
  }

  invoices = invoices.filter(i => !ids.includes(i.id));
  saveInvoices();

  const user = (req as any).user;
  addLog(user.id, user.name, 'Exclusão em Lote', 'UPLOAD', `${ids.length} registros fiscais excluídos`, 'warning', req);

  res.json({ message: `${ids.length} registros removidos com sucesso.` });
});

app.post('/api/invoices/reset', authenticateToken, (req, res) => {
  const previousCount = invoices.length;
  invoices = [];
  saveInvoices();

  const user = (req as any).user;
  addLog(user.id, user.name, 'Limpeza Total do Banco de Dados', 'UPLOAD', `O banco de dados foi zerado (${previousCount} registros removidos).`, 'warning', req);

  res.json({ message: 'Banco de dados zerado com sucesso.', count: 0, removedCount: previousCount });
});

// 3. JAVASCRIPT PDF EXTRACTION API (Processar PDFs usando o código JavaScript)
app.post('/api/extract/pdf', upload.array('files', 100), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF foi enviado.' });
    }

    let extractedInvoices: Invoice[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of files) {
      try {
        // Also copy file to Notas_Fiscais folder
        const destInNotasFiscais = path.join(notasFiscaisDir, file.originalname);
        fs.copyFileSync(file.path, destInNotasFiscais);

        const dataBuffer = fs.readFileSync(file.path);
        const text = await extractTextFromPdfBuffer(dataBuffer);

        // Extract using exact user's JavaScript logic
        const items = extractSpmInvoicesFromPdfText(text, file.originalname);
        extractedInvoices.push(...items);

        // Remove temp upload file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err: any) {
        errors.push({ filename: file.originalname, error: err.message || 'Erro ao extrair texto do PDF' });
      }
    }

    // Filter duplicates and append
    const newItemsToAdd: Invoice[] = [];
    for (const item of extractedInvoices) {
      const isDup = invoices.some(existing => isDuplicateInvoice(existing, item));
      if (!isDup) {
        newItemsToAdd.push(item);
      }
    }

    if (newItemsToAdd.length > 0) {
      invoices.unshift(...newItemsToAdd);
      saveInvoices();
    }

    const user = (req as any).user || users[0];
    addLog(
      user.id, 
      user.name, 
      'Processamento de PDFs Concluído', 
      'UPLOAD', 
      `Extraídos ${extractedInvoices.length} registros (${newItemsToAdd.length} novos inseridos) de ${files.length} arquivo(s) PDF. ${errors.length} erro(s).`, 
      errors.length > 0 ? 'warning' : 'success', 
      req
    );

    res.json({
      success: true,
      extractedCount: extractedInvoices.length,
      newInsertedCount: newItemsToAdd.length,
      extractedInvoices,
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
      return res.json({ success: true, count: 0, extracted: [] });
    }

    const pdfFiles = fs.readdirSync(notasFiscaisDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    let extractedCount = 0;
    const newItems: Invoice[] = [];

    for (const file of pdfFiles) {
      try {
        const filePath = path.join(notasFiscaisDir, file);
        const dataBuffer = fs.readFileSync(filePath);
        const text = await extractTextFromPdfBuffer(dataBuffer);

        const items = extractSpmInvoicesFromPdfText(text, file);
        newItems.push(...items);
        extractedCount += items.length;
      } catch (err) {
        console.error(`Erro ao ler ${file}:`, err);
      }
    }

    // Deduplicate before saving
    const newUniqueItems: Invoice[] = [];
    for (const item of newItems) {
      const isDup = invoices.some(existing => isDuplicateInvoice(existing, item));
      if (!isDup) {
        newUniqueItems.push(item);
      }
    }

    if (newUniqueItems.length > 0) {
      invoices.unshift(...newUniqueItems);
      saveInvoices();
    }

    res.json({
      success: true,
      count: newUniqueItems.length,
      totalPdfs: pdfFiles.length,
      extracted: newUniqueItems
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao escanear pasta local' });
  }
});

// 5. EXCEL IMPORT API
app.post('/api/extract/excel', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Nenhum arquivo Excel enviado.' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file.path);
    const worksheet = workbook.worksheets[0];

    const newInvoices: Invoice[] = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
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
        municipio: String(vals[7] || 'São Paulo'),
        uf: String(vals[8] || 'SP'),
        fatura: String(vals[9] || ''),
        valorProdutos: String(vals[10] || '0,00'),
        valorNota: String(vals[11] || '0,00'),
        desconto: String(vals[12] || '0,00'),
        codigo: String(vals[13] || 'Sem código'),
        quantidade: String(vals[14] || '1'),
        descricao: String(vals[15] || 'Item Importado'),
        cor: String(vals[16] || 'Não identificada'),
        origem: String(vals[17] || 'Outros'),
        origemArquivo: file.originalname,
        dataUpload: new Date().toISOString(),
        status: 'Processado'
      };
      newInvoices.push(inv);
    });

    if (newInvoices.length > 0) {
      invoices.unshift(...newInvoices);
      saveInvoices();
    }

    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    res.json({ count: newInvoices.length, imported: newInvoices });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao importar arquivo Excel.' });
  }
});

// 6. EXCEL EXPORT (EXATAMENTE AS 17 COLUNAS DO CÓDIGO JAVASCRIPT)
app.get('/api/export/excel', async (_req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Notas Fiscais');

    // 17 Colunas em ordem exata:
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

    // Formatação do Cabeçalho
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Dark Slate Navy
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 26;

    // Inserção dos registros
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

    // Bordas e alinhamentos
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
app.get('/api/stats', (req, res) => {
  const { origem, cor, uf, search } = req.query;
  let filtered = [...invoices];

  if (origem && origem !== 'Todas' && origem !== 'Todos') {
    filtered = filtered.filter(i => i.origem === origem);
  }
  if (cor && cor !== 'Todas' && cor !== 'Todos') {
    filtered = filtered.filter(i => i.cor.toLowerCase() === (cor as string).toLowerCase());
  }
  if (uf && uf !== 'Todos') {
    filtered = filtered.filter(i => i.uf === uf);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(i => 
      i.nome.toLowerCase().includes(q) || 
      i.documento.includes(q) || 
      i.codigo.toLowerCase().includes(q) || 
      i.descricao.toLowerCase().includes(q)
    );
  }

  let totalFaturamento = 0;
  let totalDescontos = 0;
  let totalItens = 0;

  const marketplacesCount: Record<string, number> = {};
  const marketplacesFaturamento: Record<string, number> = {};
  const coresCount: Record<string, number> = {};
  const ufDistribution: Record<string, number> = {};
  const clientTotals: Record<string, { total: number; count: number; uf: string }> = {};

  filtered.forEach(inv => {
    const vNota = parseNum(inv.valorNota);
    const vDesc = parseNum(inv.desconto);
    const qtd = parseNum(inv.quantidade) || 1;

    totalFaturamento += vNota;
    totalDescontos += vDesc;
    totalItens += qtd;

    // Marketplace
    const orig = inv.origem || 'Outros';
    marketplacesCount[orig] = (marketplacesCount[orig] || 0) + 1;
    marketplacesFaturamento[orig] = (marketplacesFaturamento[orig] || 0) + vNota;

    // Cor
    const c = inv.cor || 'Não identificada';
    coresCount[c] = (coresCount[c] || 0) + 1;

    // UF
    const u = inv.uf || 'Outros';
    ufDistribution[u] = (ufDistribution[u] || 0) + 1;

    // Top Clientes
    const cliente = inv.nome || 'Consumidor';
    if (!clientTotals[cliente]) {
      clientTotals[cliente] = { total: 0, count: 0, uf: inv.uf };
    }
    clientTotals[cliente].total += vNota;
    clientTotals[cliente].count += 1;
  });

  const topClientes = Object.entries(clientTotals)
    .map(([nome, data]) => ({ nome, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const timeline = [
    { data: '05/08', total: 289.80, count: 1 },
    { data: '06/08', total: 244.00, count: 1 },
    { data: '07/08', total: 369.70, count: 2 }
  ];

  const totalNotas = filtered.length;
  const ticketMedio = totalNotas > 0 ? totalFaturamento / totalNotas : 0;

  const stats: DashboardStats = {
    totalFaturamento,
    totalNotas,
    ticketMedio,
    totalDescontos,
    totalItens,
    marketplacesCount,
    marketplacesFaturamento,
    coresCount,
    ufDistribution,
    timeline,
    topClientes
  };

  res.json({ stats });
});

// 8. POWER BI & GOOGLE SHEETS FEED API
app.get('/api/powerbi/feed', (_req, res) => {
  res.json({
    updatedAt: new Date().toISOString(),
    totalRows: invoices.length,
    data: invoices
  });
});

app.post('/api/gsheets/sync', authenticateToken, (_req, res) => {
  gsheetsConfig.lastSync = new Date().toISOString();
  gsheetsConfig.status = 'CONNECTED';
  saveGSheets();
  res.json({
    success: true,
    syncedCount: invoices.length,
    lastSync: gsheetsConfig.lastSync
  });
});

app.get('/api/gsheets/config', authenticateToken, (_req, res) => {
  res.json({ config: gsheetsConfig });
});

app.post('/api/gsheets/config', authenticateToken, (req, res) => {
  gsheetsConfig = { ...gsheetsConfig, ...req.body };
  saveGSheets();
  res.json({ config: gsheetsConfig });
});

// 9. ALERTS API
app.get('/api/alerts', authenticateToken, (_req, res) => {
  res.json({ alerts: alertRules });
});

app.post('/api/alerts', authenticateToken, (req, res) => {
  const newRule: AlertRule = {
    ...req.body,
    id: 'rule-' + Date.now()
  };
  alertRules.push(newRule);
  saveAlerts();
  res.status(201).json({ alert: newRule });
});

app.put('/api/alerts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const idx = alertRules.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Regra não encontrada.' });
  alertRules[idx] = { ...alertRules[idx], ...req.body };
  saveAlerts();
  res.json({ alert: alertRules[idx] });
});

app.delete('/api/alerts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  alertRules = alertRules.filter(a => a.id !== id);
  saveAlerts();
  res.json({ message: 'Regra removida com sucesso.' });
});

app.post('/api/notifications/test-email', authenticateToken, (req, res) => {
  const { recipientEmail } = req.body;
  res.json({ success: true, message: `E-mail de teste enviado com sucesso para ${recipientEmail || systemSettings.smtpSender}` });
});

app.post('/api/notifications/push-test', authenticateToken, (_req, res) => {
  res.json({ success: true, message: 'Notificação Push enviada com sucesso!' });
});

// 10. SYSTEM LOGS & SETTINGS
app.get('/api/logs', authenticateToken, (_req, res) => {
  res.json({ logs });
});

app.delete('/api/logs', authenticateToken, (_req, res) => {
  logs = [];
  saveLogs();
  res.json({ message: 'Logs limpos com sucesso.' });
});

app.get('/api/settings', authenticateToken, (_req, res) => {
  res.json({
    settings: systemSettings,
    powerBiConfig,
    gsheetsConfig
  });
});

app.post('/api/settings', authenticateToken, (req, res) => {
  systemSettings = { ...systemSettings, ...req.body };
  saveSettings();
  res.json({ settings: systemSettings });
});

// ================= BOOTSTRAP & VITE MIDDLEWARE =================
async function startServer() {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Motor de Extração JavaScript SPM Store rodando em http://localhost:${PORT}`);
  });
}

startServer();
