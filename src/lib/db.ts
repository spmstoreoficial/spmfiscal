import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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
  StockMovementType,
  StockStatusLevel,
  NewStockMovementPayload
} from '../types';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'spm_fiscal';

let pool: mysql.Pool | null = null;
let isConnected = false;
let hasLoggedConnectionAttempt = false;

export interface DuplicateInvoiceNotice {
  id: string;
  fatura: string;
  documento: string;
  nome: string;
  codigo: string;
  valorNota: string;
  origem: string;
  motivo: string;
}

// ================= LOCAL JSON STORAGE HELPERS =================

function readJsonFile<T>(filename: string, defaultValue: T): T {
  const filePath = path.join(process.cwd(), 'data', filename);
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  const dirPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const filePath = path.join(dirPath, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getDbPool(): Promise<mysql.Pool | null> {
  if (pool && isConnected) {
    return pool;
  }

  try {
    // 1. Criar conexÃƒÂ£o inicial sem especificar o banco de dados para poder criar se nÃƒÂ£o existir
    const initConnection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      connectTimeout: 2000
    });

    await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await initConnection.end();

    // 2. Criar Pool conectado ao banco de dados do projeto
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 2000,
      multipleStatements: true
    });

    // Testar conexÃƒÂ£o
    const testConn = await pool.getConnection();
    testConn.release();
    isConnected = true;
    console.log(`[MySQL] Conectado com sucesso ao banco '${DB_NAME}' em ${DB_HOST}:${DB_PORT}`);

    // 3. Garantir a criaÃƒÂ§ÃƒÂ£o das tabelas e migraÃƒÂ§ÃƒÂ£o de dados iniciais
    await initSchemaAndMigrate();

    return pool;
  } catch (error: any) {
    isConnected = false;
    pool = null;
    if (!hasLoggedConnectionAttempt) {
      hasLoggedConnectionAttempt = true;
      console.warn(`[MySQL Offline] NÃƒÂ£o foi possÃƒÂ­vel conectar ao MySQL (${DB_HOST}:${DB_PORT}): ${error.message || error}`);
      console.log(`[Modo Local Ativo] Operando com persistÃƒÂªncia JSON local em ./data e sincronizaÃƒÂ§ÃƒÂ£o SQL.`);
      console.log(`[Dica] Para usar MySQL/phpMyAdmin, inicie o MySQL no XAMPP na porta ${DB_PORT}.`);
    }
    return null;
  }
}

async function initSchemaAndMigrate() {
  if (!pool) return;

  // Schema DDL
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'AUDITOR',
      active TINYINT(1) NOT NULL DEFAULT 1,
      last_login DATETIME NULL,
      avatar TEXT NULL,
      department VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_passwords (
      email VARCHAR(255) PRIMARY KEY,
      password_hash VARCHAR(255) NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(64) PRIMARY KEY,
      nome VARCHAR(255) NOT NULL DEFAULT '',
      documento VARCHAR(64) NOT NULL DEFAULT '',
      data_saida VARCHAR(64) NOT NULL DEFAULT '',
      endereco TEXT NULL,
      bairro VARCHAR(255) NOT NULL DEFAULT '',
      cep VARCHAR(32) NOT NULL DEFAULT '',
      municipio VARCHAR(255) NOT NULL DEFAULT '',
      uf VARCHAR(10) NOT NULL DEFAULT '',
      fatura VARCHAR(64) NOT NULL DEFAULT '',
      valor_produtos VARCHAR(64) NOT NULL DEFAULT '0,00',
      valor_nota VARCHAR(64) NOT NULL DEFAULT '0,00',
      desconto VARCHAR(64) NOT NULL DEFAULT '0,00',
      codigo VARCHAR(128) NOT NULL DEFAULT '',
      quantidade VARCHAR(64) NOT NULL DEFAULT '1',
      descricao TEXT NULL,
      cor VARCHAR(64) NOT NULL DEFAULT 'NÃƒÂ£o identificada',
      origem VARCHAR(64) NOT NULL DEFAULT 'Outros',
      origem_arquivo VARCHAR(255) NULL,
      data_upload VARCHAR(64) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'Processado',
      xml_data JSON NULL,
      chave_acesso VARCHAR(64) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_documento (documento),
      INDEX idx_origem (origem),
      INDEX idx_cor (cor),
      INDEX idx_uf (uf),
      INDEX idx_municipio (municipio),
      INDEX idx_chave (chave_acesso)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      user_id VARCHAR(64) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      action VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL,
      details TEXT NOT NULL,
      ip VARCHAR(64) NOT NULL DEFAULT '127.0.0.1',
      severity VARCHAR(32) NOT NULL DEFAULT 'info'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS alert_rules (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(64) NOT NULL,
      threshold DECIMAL(12,2) NULL,
      email_notify TINYINT(1) NOT NULL DEFAULT 1,
      push_notify TINYINT(1) NOT NULL DEFAULT 1,
      active TINYINT(1) NOT NULL DEFAULT 1,
      last_triggered DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id VARCHAR(32) PRIMARY KEY,
      data_json JSON NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS integrations_config (
      type VARCHAR(32) PRIMARY KEY,
      data_json JSON NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_items (
      id VARCHAR(64) PRIMARY KEY,
      sku VARCHAR(64) UNIQUE NOT NULL,
      nome VARCHAR(255) NOT NULL,
      categoria VARCHAR(64) NOT NULL DEFAULT 'Verniz',
      cor VARCHAR(64) NOT NULL DEFAULT 'Preto',
      unidade VARCHAR(16) NOT NULL DEFAULT 'UN',
      estoque_inicial INT NOT NULL DEFAULT 0,
      total_entradas INT NOT NULL DEFAULT 0,
      total_saidas INT NOT NULL DEFAULT 0,
      estoque_atual INT NOT NULL DEFAULT 0,
      estoque_minimo INT NOT NULL DEFAULT 50,
      estoque_seguranca INT NOT NULL DEFAULT 20,
      preco_custo DECIMAL(10,2) NOT NULL DEFAULT 12.50,
      preco_venda DECIMAL(10,2) NOT NULL DEFAULT 29.99,
      localizacao VARCHAR(128) NOT NULL DEFAULT 'Prateleira A-01',
      ativo TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_stock_sku (sku),
      INDEX idx_stock_cor (cor)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      sku VARCHAR(64) NOT NULL,
      tipo VARCHAR(32) NOT NULL,
      quantidade INT NOT NULL,
      saldo_anterior INT NOT NULL DEFAULT 0,
      saldo_posterior INT NOT NULL DEFAULT 0,
      documento_ref VARCHAR(128) NULL,
      origem_canal VARCHAR(64) NULL,
      motivo TEXT NULL,
      valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      usuario_id VARCHAR(64) NOT NULL DEFAULT 'sistema',
      usuario_nome VARCHAR(255) NOT NULL DEFAULT 'Sistema AutomÃƒÂ¡tico',
      data_movimentacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_mov_product (product_id),
      INDEX idx_mov_sku (sku),
      INDEX idx_mov_tipo (tipo),
      INDEX idx_mov_data (data_movimentacao),
      INDEX idx_mov_doc (documento_ref)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

    try {
    const [cols]: any = await pool.query("SHOW COLUMNS FROM invoices LIKE 'xml_data'");
    if (!cols || cols.length === 0) {
      await pool.query("ALTER TABLE invoices ADD COLUMN xml_data JSON NULL");
    }
    const [colsChave]: any = await pool.query("SHOW COLUMNS FROM invoices LIKE 'chave_acesso'");
    if (!colsChave || colsChave.length === 0) {
      await pool.query("ALTER TABLE invoices ADD COLUMN chave_acesso VARCHAR(64) NULL, ADD INDEX idx_chave (chave_acesso)");
    }
  } catch (e: any) {
    console.warn('[DB Migration Warning]:', e.message);
  }

  await initDefaultStockItemsIfEmpty();

  // MigraÃƒÂ§ÃƒÂ£o inicial dos arquivos JSON se o banco estiver vazio
  await migrateInitialDataIfEmpty();
}

async function migrateInitialDataIfEmpty() {
  if (!pool) return;
  const dataDir = path.join(process.cwd(), 'data');

  // Verificar se o banco de dados já possui dados
  let usersCount = 0;
  let invoicesCount = 0;
  try {
    const [usersCountRows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
    const [invoicesCountRows]: any = await pool.query('SELECT COUNT(*) as count FROM invoices');
    usersCount = Number(usersCountRows?.[0]?.count || 0);
    invoicesCount = Number(invoicesCountRows?.[0]?.count || 0);
  } catch (err: any) {
    console.warn('[MySQL Check Error]:', err.message);
  }

  // 0. Auto-Seed Automático Completo via database_spm_fiscal.sql (Se banco estiver zerado)
  if (invoicesCount === 0 || usersCount === 0) {
    const candidateSqlFiles = [
      path.join(process.cwd(), 'database_spm_fiscal.sql'),
      path.join(__dirname, 'database_spm_fiscal.sql'),
      path.join(__dirname, '..', 'database_spm_fiscal.sql'),
      path.join(__dirname, '..', '..', 'database_spm_fiscal.sql')
    ];
    const sqlFile = candidateSqlFiles.find(f => fs.existsSync(f));
    if (sqlFile) {
      try {
        console.log(`[MySQL Auto-Seed] 🚀 Inicializando banco de dados completo via ${sqlFile}...`);
        const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
        await pool.query(sqlContent);
        console.log(`[MySQL Auto-Seed] ✅ Base de dados populada com sucesso! Todos os registros fiscais e usuários estão operacionais.`);
        return;
      } catch (sqlErr: any) {
        console.warn(`[MySQL Auto-Seed Warning] Falha na execução direta do SQL dump: ${sqlErr.message}. Continuando para restauração individual...`);
      }
    }
  }

  // 1. Migrar Usuários via JSON se users estiver vazio
  if (usersCount === 0) {
    const usersFile = path.join(dataDir, 'users.json');
    const passwordsFile = path.join(dataDir, 'userPasswords.json');
    if (fs.existsSync(usersFile)) {
      try {
        const users: User[] = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
        const passwords: Record<string, string> = fs.existsSync(passwordsFile) 
          ? JSON.parse(fs.readFileSync(passwordsFile, 'utf-8'))
          : {};

        for (const u of users) {
          await pool.query(
            'INSERT IGNORE INTO users (id, name, email, role, active, last_login, avatar, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [u.id, u.name, u.email, u.role, u.active ? 1 : 0, u.lastLogin ? new Date(u.lastLogin) : null, u.avatar || null, u.department || null]
          );
          if (passwords[u.email]) {
            await pool.query(
              'INSERT INTO user_passwords (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
              [u.email, passwords[u.email]]
            );
          }
        }
        console.log(`[MySQL Migration] ${users.length} usuários migrados do JSON para o MySQL.`);
      } catch (e) {
        console.error('[MySQL Migration] Erro ao migrar usuários:', e);
      }
    }
  }

  // Garantia absoluta de usuários padrão do sistema (Administrador, Gerente, Auditor)
  try {
    const [checkUsers]: any = await pool.query('SELECT COUNT(*) as count FROM users');
    if (Number(checkUsers?.[0]?.count || 0) === 0) {
      console.log('[MySQL] Inserindo contas essenciais de acesso administrativo...');
      await pool.query(`
        INSERT IGNORE INTO users (id, name, email, role, active, department) VALUES
        ('u-admin-1', 'José Galdino (Administrador)', 'josegaldino@hotmail.com.br', 'ADMIN', 1, 'SPM Store - Diretoria'),
        ('u-gerente-1', 'Carlos Santos (Gerente)', 'gerente@empresa.com', 'MANAGER', 1, 'Faturamento & Gestão'),
        ('u-auditor-1', 'Ana Maria Ferreira (Auditor)', 'auditor@empresa.com', 'AUDITOR', 1, 'Auditoria Fiscal');
      `);
      await pool.query(`
        INSERT INTO user_passwords (email, password_hash) VALUES
        ('josegaldino@hotmail.com.br', '$2b$08$l.pMRvk9WSkZ8BuG5n0OduB78DfKBlUkeaUEc.wkyBaotzsuD1VBe'),
        ('gerente@empresa.com', '$2b$08$SBcQF1FIuVKuBhT/U0WRTudP9UdYr.hGJNp9BOKr5X0u8fKsTSTfm'),
        ('auditor@empresa.com', '$2b$08$YC0ePodzrQtMw9S233gAbeGVMp9QVNT.3noknIic7farYRYObOn3q')
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);
      `);
      console.log('[MySQL] ✅ Contas essenciais criadas com sucesso (josegaldino@hotmail.com.br / admin123).');
    }
  } catch (userErr: any) {
    console.warn('[MySQL User Guarantee Error]:', userErr.message);
  }

  // 2. Migrar Notas Fiscais via JSON
  const [invoicesCountRows]: any = await pool.query('SELECT COUNT(*) as count FROM invoices');
  if (invoicesCountRows[0].count === 0) {
    const invoicesFile = path.join(dataDir, 'invoices.json');
    if (fs.existsSync(invoicesFile)) {
      try {
        const invoices: Invoice[] = JSON.parse(fs.readFileSync(invoicesFile, 'utf-8'));
        for (const inv of invoices) {
          await pool.query(
            `INSERT IGNORE INTO invoices 
            (id, nome, documento, data_saida, endereco, bairro, cep, municipio, uf, fatura, valor_produtos, valor_nota, desconto, codigo, quantidade, descricao, cor, origem, origem_arquivo, data_upload, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              inv.id,
              inv.nome || '',
              inv.documento || '',
              inv.dataSaida || '',
              inv.endereco || '',
              inv.bairro || '',
              inv.cep || '',
              inv.municipio || '',
              inv.uf || '',
              inv.fatura || '',
              inv.valorProdutos || '0,00',
              inv.valorNota || '0,00',
              inv.desconto || '0,00',
              inv.codigo || '',
              inv.quantidade || '1',
              inv.descricao || '',
              inv.cor || 'NÃƒÂ£o identificada',
              inv.origem || 'Outros',
              inv.origemArquivo || null,
              inv.dataUpload || null,
              inv.status || 'Processado'
            ]
          );
        }
        console.log(`[MySQL Migration] ${invoices.length} notas fiscais migradas do JSON para o MySQL.`);
      } catch (e) {
        console.error('[MySQL Migration] Erro ao migrar notas:', e);
      }
    }
  }

  // 3. Migrar Logs
  const [logsCountRows]: any = await pool.query('SELECT COUNT(*) as count FROM audit_logs');
  if (logsCountRows[0].count === 0) {
    const logsFile = path.join(dataDir, 'logs.json');
    if (fs.existsSync(logsFile)) {
      try {
        const logs: LogEntry[] = JSON.parse(fs.readFileSync(logsFile, 'utf-8'));
        for (const l of logs) {
          await pool.query(
            'INSERT IGNORE INTO audit_logs (id, timestamp, user_id, user_name, action, category, details, ip, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [l.id, l.timestamp ? new Date(l.timestamp) : new Date(), l.userId, l.userName, l.action, l.category, l.details, l.ip, l.severity]
          );
        }
      } catch (e) {
        console.error('[MySQL Migration] Erro ao migrar logs:', e);
      }
    }
  }

  // 4. Migrar Alertas
  const [alertsCountRows]: any = await pool.query('SELECT COUNT(*) as count FROM alert_rules');
  if (alertsCountRows[0].count === 0) {
    const alertsFile = path.join(dataDir, 'alerts.json');
    if (fs.existsSync(alertsFile)) {
      try {
        const alerts: AlertRule[] = JSON.parse(fs.readFileSync(alertsFile, 'utf-8'));
        for (const a of alerts) {
          await pool.query(
            'INSERT IGNORE INTO alert_rules (id, name, type, threshold, email_notify, push_notify, active, last_triggered) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [a.id, a.name, a.type, a.threshold || null, a.emailNotify ? 1 : 0, a.pushNotify ? 1 : 0, a.active ? 1 : 0, a.lastTriggered ? new Date(a.lastTriggered) : null]
          );
        }
      } catch (e) {
        console.error('[MySQL Migration] Erro ao migrar alertas:', e);
      }
    }
  }

  // 5. Migrar ConfiguraÃƒÂ§ÃƒÂµes Gerais
  const settingsFile = path.join(dataDir, 'settings.json');
  if (fs.existsSync(settingsFile)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      await pool.query(
        'INSERT IGNORE INTO system_settings (id, data_json) VALUES (?, ?)',
        ['main', JSON.stringify(settings)]
      );
    } catch {}
  }

  // 6. Migrar PowerBI e GSheets
  const powerBiFile = path.join(dataDir, 'powerbi.json');
  if (fs.existsSync(powerBiFile)) {
    try {
      const pbi = JSON.parse(fs.readFileSync(powerBiFile, 'utf-8'));
      await pool.query(
        'INSERT IGNORE INTO integrations_config (type, data_json) VALUES (?, ?)',
        ['powerbi', JSON.stringify(pbi)]
      );
    } catch {}
  }

  const gsheetsFile = path.join(dataDir, 'gsheets.json');
  if (fs.existsSync(gsheetsFile)) {
    try {
      const gs = JSON.parse(fs.readFileSync(gsheetsFile, 'utf-8'));
      await pool.query(
        'INSERT IGNORE INTO integrations_config (type, data_json) VALUES (?, ?)',
        ['gsheets', JSON.stringify(gs)]
      );
    } catch {}
  }

  // Sincronizar o arquivo SQL inicial
  await syncDatabaseToSqlFile();
}

async function initDefaultStockItemsIfEmpty() {
  if (!pool) return;
  try {
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM stock_items');
    if (rows[0].count === 0) {
      const defaultItems = [
        {
          id: 'sku-spm-preto',
          sku: 'SPM-PRETO-100ML',
          nome: 'Verniz Elite SPM 100ml - Cor Preto',
          categoria: 'Verniz 100ml',
          cor: 'Preto',
          unidade: 'UN',
          estoque_inicial: 3000,
          estoque_minimo: 120,
          estoque_seguranca: 40,
          preco_custo: 12.50,
          preco_venda: 29.99,
          localizacao: 'Setor A - P01'
        },
        {
          id: 'sku-spm-marrom',
          sku: 'SPM-MARROM-100ML',
          nome: 'Verniz Elite SPM 100ml - Cor Marrom',
          categoria: 'Verniz 100ml',
          cor: 'Marrom',
          unidade: 'UN',
          estoque_inicial: 1500,
          estoque_minimo: 60,
          estoque_seguranca: 20,
          preco_custo: 12.50,
          preco_venda: 29.99,
          localizacao: 'Setor A - P02'
        },
        {
          id: 'sku-spm-incolor',
          sku: 'SPM-INCOLOR-100ML',
          nome: 'Verniz Elite SPM 100ml - Cor Incolor',
          categoria: 'Verniz 100ml',
          cor: 'Incolor',
          unidade: 'UN',
          estoque_inicial: 1200,
          estoque_minimo: 50,
          estoque_seguranca: 20,
          preco_custo: 12.50,
          preco_venda: 29.99,
          localizacao: 'Setor A - P03'
        },
        {
          id: 'sku-spm-kit1',
          sku: 'SPM-KIT1-COMPLETO',
          nome: 'Kit 1 Verniz Elite SPM 100ml + Esponja + Flanela',
          categoria: 'Kits Promocionais',
          cor: 'Kit Completo',
          unidade: 'KIT',
          estoque_inicial: 2000,
          estoque_minimo: 80,
          estoque_seguranca: 30,
          preco_custo: 18.00,
          preco_venda: 57.99,
          localizacao: 'Setor B - Kits'
        },
        {
          id: 'sku-spm-esponja',
          sku: 'SPM-ESPONJA',
          nome: 'Esponja Aplicadora AnatÃ´mica SPM',
          categoria: 'AcessÃ³rios',
          cor: 'Amarela/Preta',
          unidade: 'UN',
          estoque_inicial: 3500,
          estoque_minimo: 150,
          estoque_seguranca: 50,
          preco_custo: 2.50,
          preco_venda: 8.90,
          localizacao: 'Setor C - AcessÃ³rios'
        },
        {
          id: 'sku-spm-flanela',
          sku: 'SPM-FLANELA',
          nome: 'Flanela de Microfibra Especial SPM',
          categoria: 'AcessÃ³rios',
          cor: 'Laranja/Azul',
          unidade: 'UN',
          estoque_inicial: 3500,
          estoque_minimo: 150,
          estoque_seguranca: 50,
          preco_custo: 3.00,
          preco_venda: 9.90,
          localizacao: 'Setor C - AcessÃ³rios'
        },
        {
          id: 'sku-spm-outros',
          sku: 'SPM-OUTROS',
          nome: 'Outros Produtos & VariaÃ§Ãµes SPM',
          categoria: 'Geral',
          cor: 'Variada',
          unidade: 'UN',
          estoque_inicial: 1000,
          estoque_minimo: 40,
          estoque_seguranca: 15,
          preco_custo: 15.00,
          preco_venda: 35.00,
          localizacao: 'Setor D - Geral'
        }
      ];

      for (const item of defaultItems) {
        await pool.query(
          `INSERT IGNORE INTO stock_items 
          (id, sku, nome, categoria, cor, unidade, estoque_inicial, total_entradas, total_saidas, estoque_atual, estoque_minimo, estoque_seguranca, preco_custo, preco_venda, localizacao, ativo) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.sku,
            item.nome,
            item.categoria,
            item.cor,
            item.unidade,
            item.estoque_inicial,
            item.estoque_inicial,
            0,
            item.estoque_inicial,
            item.estoque_minimo,
            item.estoque_seguranca,
            item.preco_custo,
            item.preco_venda,
            item.localizacao,
            1
          ]
        );
      }
      console.log(`[MySQL Stock] ${defaultItems.length} produtos de estoque cadastrados inicialmente.`);
      
      // Sincronizar saÃ­das automaticamente com o histÃ³rico de notas fiscais
      await recalculateAllStockFromInvoices();
    }
  } catch (err: any) {
    console.error('[MySQL Stock Init Error]:', err.message);
  }
}

// ================= SQL FILE SYNCHRONIZER =================

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  const str = String(val).replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case '\0': return '\\0';
      case '\x08': return '\\b';
      case '\x09': return '\\t';
      case '\x1a': return '\\z';
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '"':
      case "'":
      case '\\':
      case '%': return '\\' + char;
      default: return char;
    }
  });
  return `'${str}'`;
}

export async function syncDatabaseToSqlFile(): Promise<void> {
  try {
    let users: any[] = [];
    let passwords: any[] = [];
    let invoices: any[] = [];
    let logs: any[] = [];
    let alerts: any[] = [];
    let settings: any[] = [];
    let integrations: any[] = [];

    const p = await getDbPool();
    if (p) {
      const [u]: any = await p.query('SELECT * FROM users ORDER BY created_at ASC');
      users = u;
      const [pw]: any = await p.query('SELECT * FROM user_passwords');
      passwords = pw;
      const [inv]: any = await p.query('SELECT * FROM invoices ORDER BY created_at DESC');
      invoices = inv;
      const [lg]: any = await p.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
      logs = lg;
      const [al]: any = await p.query('SELECT * FROM alert_rules ORDER BY name ASC');
      alerts = al;
      const [st]: any = await p.query('SELECT * FROM system_settings');
      settings = st;
      const [ig]: any = await p.query('SELECT * FROM integrations_config');
      integrations = ig;
    } else {
      // Fallback: carregar dos arquivos JSON
      users = readJsonFile<User[]>('users.json', []);
      const pwMap = readJsonFile<Record<string, string>>('userPasswords.json', {});
      passwords = Object.entries(pwMap).map(([email, password_hash]) => ({ email, password_hash }));
      invoices = readJsonFile<Invoice[]>('invoices.json', []);
      logs = readJsonFile<LogEntry[]>('logs.json', []);
      alerts = readJsonFile<AlertRule[]>('alerts.json', []);
      const mainSettings = readJsonFile<SystemSettings>('settings.json', defaultSettings);
      settings = [{ id: 'main', data_json: mainSettings }];
      const pbi = readJsonFile<PowerBiConfig>('powerbi.json', { enabled: true } as any);
      const gs = readJsonFile<GSheetsConfig>('gsheets.json', { autoSync: true } as any);
      integrations = [
        { type: 'powerbi', data_json: pbi },
        { type: 'gsheets', data_json: gs }
      ];
    }

    let sql = `-- ==========================================================\n`;
    sql += `-- SPM STORE - SISTEMA FISCAL & AUDITORIA DE NOTAS FISCAIS\n`;
    sql += `-- Sincronizado automaticamente em: ${new Date().toLocaleString('pt-BR')}\n`;
    sql += `-- Total de Registros Fiscais: ${invoices.length}\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sql += `USE \`${DB_NAME}\`;\n\n`;

    // 1. Users
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- 1. Tabela users\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`user_passwords\`;\n`;
    sql += `DROP TABLE IF EXISTS \`users\`;\n`;
    sql += `CREATE TABLE \`users\` (\n`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`name\` VARCHAR(255) NOT NULL,\n`;
    sql += `  \`email\` VARCHAR(255) NOT NULL,\n`;
    sql += `  \`role\` ENUM('ADMIN', 'MANAGER', 'AUDITOR') NOT NULL DEFAULT 'AUDITOR',\n`;
    sql += `  \`active\` TINYINT(1) NOT NULL DEFAULT 1,\n`;
    sql += `  \`last_login\` DATETIME NULL,\n`;
    sql += `  \`avatar\` TEXT NULL,\n`;
    sql += `  \`department\` VARCHAR(255) NULL,\n`;
    sql += `  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  PRIMARY KEY (\`id\`),\n`;
    sql += `  UNIQUE KEY \`idx_users_email\` (\`email\`)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    // 2. Passwords
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- 2. Tabela user_passwords\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `CREATE TABLE \`user_passwords\` (\n`;
    sql += `  \`email\` VARCHAR(255) NOT NULL,\n`;
    sql += `  \`password_hash\` VARCHAR(255) NOT NULL,\n`;
    sql += `  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
    sql += `  PRIMARY KEY (\`email\`),\n`;
    sql += `  CONSTRAINT \`fk_user_passwords_email\` FOREIGN KEY (\`email\`) REFERENCES \`users\` (\`email\`) ON DELETE CASCADE ON UPDATE CASCADE\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    // 3. Invoices
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- 3. Tabela invoices\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`invoices\`;\n`;
    sql += `CREATE TABLE \`invoices\` (\n`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`nome\` VARCHAR(255) NOT NULL DEFAULT '',\n`;
    sql += `  \`documento\` VARCHAR(64) NOT NULL DEFAULT '',\n`;
    sql += `  \`data_saida\` VARCHAR(64) NOT NULL DEFAULT '',\n`;
    sql += `  \`endereco\` TEXT NULL,\n`;
    sql += `  \`bairro\` VARCHAR(255) NOT NULL DEFAULT '',\n`;
    sql += `  \`cep\` VARCHAR(32) NOT NULL DEFAULT '',\n`;
    sql += `  \`municipio\` VARCHAR(255) NOT NULL DEFAULT '',\n`;
    sql += `  \`uf\` VARCHAR(10) NOT NULL DEFAULT '',\n`;
    sql += `  \`fatura\` VARCHAR(64) NOT NULL DEFAULT '',\n`;
    sql += `  \`valor_produtos\` VARCHAR(64) NOT NULL DEFAULT '0,00',\n`;
    sql += `  \`valor_nota\` VARCHAR(64) NOT NULL DEFAULT '0,00',\n`;
    sql += `  \`desconto\` VARCHAR(64) NOT NULL DEFAULT '0,00',\n`;
    sql += `  \`codigo\` VARCHAR(128) NOT NULL DEFAULT '',\n`;
    sql += `  \`quantidade\` VARCHAR(64) NOT NULL DEFAULT '1',\n`;
    sql += `  \`descricao\` TEXT NULL,\n`;
    sql += `  \`cor\` VARCHAR(64) NOT NULL DEFAULT 'NÃƒÂ£o identificada',\n`;
    sql += `  \`origem\` VARCHAR(64) NOT NULL DEFAULT 'Outros',\n`;
    sql += `  \`origem_arquivo\` VARCHAR(255) NULL,\n`;
    sql += `  \`data_upload\` VARCHAR(64) NULL,\n`;
    sql += `  \`status\` VARCHAR(32) NOT NULL DEFAULT 'Processado',\n`;
    sql += `  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  PRIMARY KEY (\`id\`),\n`;
    sql += `  INDEX \`idx_invoices_documento\` (\`documento\`),\n`;
    sql += `  INDEX \`idx_invoices_origem\` (\`origem\`),\n`;
    sql += `  INDEX \`idx_invoices_cor\` (\`cor\`),\n`;
    sql += `  INDEX \`idx_invoices_uf\` (\`uf\`),\n`;
    sql += `  INDEX \`idx_invoices_municipio\` (\`municipio\`)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    // 4. Logs
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- 4. Tabela audit_logs\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`audit_logs\`;\n`;
    sql += `CREATE TABLE \`audit_logs\` (\n`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`timestamp\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  \`user_id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`user_name\` VARCHAR(255) NOT NULL,\n`;
    sql += `  \`action\` VARCHAR(255) NOT NULL,\n`;
    sql += `  \`category\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`details\` TEXT NOT NULL,\n`;
    sql += `  \`ip\` VARCHAR(64) NOT NULL DEFAULT '127.0.0.1',\n`;
    sql += `  \`severity\` ENUM('info', 'warning', 'error', 'success') NOT NULL DEFAULT 'info',\n`;
    sql += `  PRIMARY KEY (\`id\`),\n`;
    sql += `  INDEX \`idx_audit_logs_timestamp\` (\`timestamp\`),\n`;
    sql += `  INDEX \`idx_audit_logs_category\` (\`category\`)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    // 5. Alerts
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- 5. Tabela alert_rules\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`alert_rules\`;\n`;
    sql += `CREATE TABLE \`alert_rules\` (\n`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`name\` VARCHAR(255) NOT NULL,\n`;
    sql += `  \`type\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`threshold\` DECIMAL(12,2) NULL,\n`;
    sql += `  \`email_notify\` TINYINT(1) NOT NULL DEFAULT 1,\n`;
    sql += `  \`push_notify\` TINYINT(1) NOT NULL DEFAULT 1,\n`;
    sql += `  \`active\` TINYINT(1) NOT NULL DEFAULT 1,\n`;
    sql += `  \`last_triggered\` DATETIME NULL,\n`;
    sql += `  PRIMARY KEY (\`id\`)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    // 6. Settings & Integrations
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- 6. Tabelas system_settings & integrations_config\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`system_settings\`;\n`;
    sql += `CREATE TABLE \`system_settings\` (\n`;
    sql += `  \`id\` VARCHAR(32) NOT NULL,\n`;
    sql += `  \`data_json\` JSON NOT NULL,\n`;
    sql += `  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
    sql += `  PRIMARY KEY (\`id\`)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    sql += `DROP TABLE IF EXISTS \`integrations_config\`;\n`;
    sql += `CREATE TABLE \`integrations_config\` (\n`;
    sql += `  \`type\` VARCHAR(32) NOT NULL,\n`;
    sql += `  \`data_json\` JSON NOT NULL,\n`;
    sql += `  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
    sql += `  PRIMARY KEY (\`type\`)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    // Inserts
    if (users.length > 0) {
      sql += `INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`role\`, \`active\`, \`last_login\`, \`avatar\`, \`department\`) VALUES\n`;
      sql += users.map((u: any) => `(${escapeSql(u.id)}, ${escapeSql(u.name)}, ${escapeSql(u.email)}, ${escapeSql(u.role)}, ${escapeSql(u.active ? 1 : 0)}, ${escapeSql(u.last_login || u.lastLogin || null)}, ${escapeSql(u.avatar || null)}, ${escapeSql(u.department || null)})`).join(',\n') + `;\n\n`;
    }

    if (passwords.length > 0) {
      sql += `INSERT INTO \`user_passwords\` (\`email\`, \`password_hash\`) VALUES\n`;
      sql += passwords.map((pw: any) => `(${escapeSql(pw.email)}, ${escapeSql(pw.password_hash || pw.passwordHash)})`).join(',\n') + `;\n\n`;
    }

    if (invoices.length > 0) {
      sql += `INSERT INTO \`invoices\` (\`id\`, \`nome\`, \`documento\`, \`data_saida\`, \`endereco\`, \`bairro\`, \`cep\`, \`municipio\`, \`uf\`, \`fatura\`, \`valor_produtos\`, \`valor_nota\`, \`desconto\`, \`codigo\`, \`quantidade\`, \`descricao\`, \`cor\`, \`origem\`, \`origem_arquivo\`, \`data_upload\`, \`status\`) VALUES\n`;
      sql += invoices.map((inv: any) => `(${escapeSql(inv.id)}, ${escapeSql(inv.nome || '')}, ${escapeSql(inv.documento || '')}, ${escapeSql(inv.data_saida || inv.dataSaida || '')}, ${escapeSql(inv.endereco || '')}, ${escapeSql(inv.bairro || '')}, ${escapeSql(inv.cep || '')}, ${escapeSql(inv.municipio || '')}, ${escapeSql(inv.uf || '')}, ${escapeSql(inv.fatura || '')}, ${escapeSql(inv.valor_produtos || inv.valorProdutos || '0,00')}, ${escapeSql(inv.valor_nota || inv.valorNota || '0,00')}, ${escapeSql(inv.desconto || '0,00')}, ${escapeSql(inv.codigo || '')}, ${escapeSql(inv.quantidade || '1')}, ${escapeSql(inv.descricao || '')}, ${escapeSql(inv.cor || 'NÃƒÂ£o identificada')}, ${escapeSql(inv.origem || 'Outros')}, ${escapeSql(inv.origem_arquivo || inv.origemArquivo || null)}, ${escapeSql(inv.data_upload || inv.dataUpload || null)}, ${escapeSql(inv.status || 'Processado')})`).join(',\n') + `;\n\n`;
    }

    if (logs.length > 0) {
      sql += `INSERT INTO \`audit_logs\` (\`id\`, \`timestamp\`, \`user_id\`, \`user_name\`, \`action\`, \`category\`, \`details\`, \`ip\`, \`severity\`) VALUES\n`;
      sql += logs.map((l: any) => `(${escapeSql(l.id)}, ${escapeSql(l.timestamp ? new Date(l.timestamp) : new Date())}, ${escapeSql(l.user_id || l.userId)}, ${escapeSql(l.user_name || l.userName)}, ${escapeSql(l.action)}, ${escapeSql(l.category)}, ${escapeSql(l.details)}, ${escapeSql(l.ip || '127.0.0.1')}, ${escapeSql(l.severity || 'info')})`).join(',\n') + `;\n\n`;
    }

    if (alerts.length > 0) {
      sql += `INSERT INTO \`alert_rules\` (\`id\`, \`name\`, \`type\`, \`threshold\`, \`email_notify\`, \`push_notify\`, \`active\`, \`last_triggered\`) VALUES\n`;
      sql += alerts.map((a: any) => `(${escapeSql(a.id)}, ${escapeSql(a.name)}, ${escapeSql(a.type)}, ${escapeSql(a.threshold || null)}, ${escapeSql(a.email_notify !== undefined ? (a.email_notify ? 1 : 0) : (a.emailNotify ? 1 : 0))}, ${escapeSql(a.push_notify !== undefined ? (a.push_notify ? 1 : 0) : (a.pushNotify ? 1 : 0))}, ${escapeSql(a.active !== undefined ? (a.active ? 1 : 0) : 1)}, ${escapeSql(a.last_triggered || a.lastTriggered || null)})`).join(',\n') + `;\n\n`;
    }

    if (settings.length > 0) {
      sql += `INSERT INTO \`system_settings\` (\`id\`, \`data_json\`) VALUES\n`;
      sql += settings.map((s: any) => `(${escapeSql(s.id)}, ${escapeSql(typeof s.data_json === 'string' ? s.data_json : JSON.stringify(s.data_json))})`).join(',\n') + `;\n\n`;
    }

    if (integrations.length > 0) {
      sql += `INSERT INTO \`integrations_config\` (\`type\`, \`data_json\`) VALUES\n`;
      sql += integrations.map((g: any) => `(${escapeSql(g.type)}, ${escapeSql(typeof g.data_json === 'string' ? g.data_json : JSON.stringify(g.data_json))})`).join(',\n') + `;\n\n`;
    }

    // 7. Tabelas de Controle de Estoque
    let stockItems: any[] = [];
    let stockMovements: any[] = [];
    if (p) {
      const [si]: any = await p.query('SELECT * FROM stock_items ORDER BY nome ASC');
      stockItems = si;
      const [sm]: any = await p.query('SELECT * FROM stock_movements ORDER BY data_movimentacao DESC LIMIT 500');
      stockMovements = sm;
    }

    sql += `-- --------------------------------------------------------\n`;
    sql += `-- 7. Tabelas de Controle de Estoque (stock_items & stock_movements)\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`stock_movements\`;\n`;
    sql += `DROP TABLE IF EXISTS \`stock_items\`;\n`;
    sql += `CREATE TABLE \`stock_items\` (\n`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`sku\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`nome\` VARCHAR(255) NOT NULL,\n`;
    sql += `  \`categoria\` VARCHAR(64) NOT NULL DEFAULT 'Verniz',\n`;
    sql += `  \`cor\` VARCHAR(64) NOT NULL DEFAULT 'Preto',\n`;
    sql += `  \`unidade\` VARCHAR(16) NOT NULL DEFAULT 'UN',\n`;
    sql += `  \`estoque_inicial\` INT NOT NULL DEFAULT 0,\n`;
    sql += `  \`total_entradas\` INT NOT NULL DEFAULT 0,\n`;
    sql += `  \`total_saidas\` INT NOT NULL DEFAULT 0,\n`;
    sql += `  \`estoque_atual\` INT NOT NULL DEFAULT 0,\n`;
    sql += `  \`estoque_minimo\` INT NOT NULL DEFAULT 50,\n`;
    sql += `  \`estoque_seguranca\` INT NOT NULL DEFAULT 20,\n`;
    sql += `  \`preco_custo\` DECIMAL(10,2) NOT NULL DEFAULT 12.50,\n`;
    sql += `  \`preco_venda\` DECIMAL(10,2) NOT NULL DEFAULT 29.99,\n`;
    sql += `  \`localizacao\` VARCHAR(128) NOT NULL DEFAULT 'Prateleira A-01',\n`;
    sql += `  \`ativo\` TINYINT(1) NOT NULL DEFAULT 1,\n`;
    sql += `  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
    sql += `  PRIMARY KEY (\`id\`),\n`;
    sql += `  UNIQUE KEY \`idx_stock_sku\` (\`sku\`),\n`;
    sql += `  INDEX \`idx_stock_cor\` (\`cor\`)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    sql += `CREATE TABLE \`stock_movements\` (\n`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`product_id\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`sku\` VARCHAR(64) NOT NULL,\n`;
    sql += `  \`tipo\` VARCHAR(32) NOT NULL,\n`;
    sql += `  \`quantidade\` INT NOT NULL,\n`;
    sql += `  \`saldo_anterior\` INT NOT NULL DEFAULT 0,\n`;
    sql += `  \`saldo_posterior\` INT NOT NULL DEFAULT 0,\n`;
    sql += `  \`documento_ref\` VARCHAR(128) NULL,\n`;
    sql += `  \`origem_canal\` VARCHAR(64) NULL,\n`;
    sql += `  \`motivo\` TEXT NULL,\n`;
    sql += `  \`valor_unitario\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,\n`;
    sql += `  \`valor_total\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,\n`;
    sql += `  \`usuario_id\` VARCHAR(64) NOT NULL DEFAULT 'sistema',\n`;
    sql += `  \`usuario_nome\` VARCHAR(255) NOT NULL DEFAULT 'Sistema AutomÃƒÂ¡tico',\n`;
    sql += `  \`data_movimentacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  PRIMARY KEY (\`id\`),\n`;
    sql += `  INDEX \`idx_mov_product\` (\`product_id\`),\n`;
    sql += `  INDEX \`idx_mov_sku\` (\`sku\`),\n`;
    sql += `  INDEX \`idx_mov_tipo\` (\`tipo\`),\n`;
    sql += `  INDEX \`idx_mov_data\` (\`data_movimentacao\`)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    if (stockItems.length > 0) {
      sql += `-- InserÃƒÂ§ÃƒÂµes em stock_items (${stockItems.length} produtos cadastrados)\n`;
      sql += `INSERT INTO \`stock_items\` (\`id\`, \`sku\`, \`nome\`, \`categoria\`, \`cor\`, \`unidade\`, \`estoque_inicial\`, \`total_entradas\`, \`total_saidas\`, \`estoque_atual\`, \`estoque_minimo\`, \`estoque_seguranca\`, \`preco_custo\`, \`preco_venda\`, \`localizacao\`, \`ativo\`) VALUES\n`;
      sql += stockItems.map((s: any) => `(${escapeSql(s.id)}, ${escapeSql(s.sku)}, ${escapeSql(s.nome)}, ${escapeSql(s.categoria)}, ${escapeSql(s.cor)}, ${escapeSql(s.unidade)}, ${escapeSql(s.estoque_inicial || s.estoqueInicial || 0)}, ${escapeSql(s.total_entradas || s.totalEntradas || 0)}, ${escapeSql(s.total_saidas || s.totalSaidas || 0)}, ${escapeSql(s.estoque_atual || s.estoqueAtual || 0)}, ${escapeSql(s.estoque_minimo || s.estoqueMinimo || 50)}, ${escapeSql(s.estoque_seguranca || s.estoqueSeguranca || 20)}, ${escapeSql(s.preco_custo || s.precoCusto || 12.50)}, ${escapeSql(s.preco_venda || s.precoVenda || 29.99)}, ${escapeSql(s.localizacao || 'Prateleira A-01')}, ${escapeSql(s.ativo ? 1 : 0)})`).join(',\n') + `;\n\n`;
    }

    if (stockMovements.length > 0) {
      sql += `-- InserÃƒÂ§ÃƒÂµes em stock_movements (ÃƒÅ¡ltimas ${stockMovements.length} movimentaÃƒÂ§ÃƒÂµes)\n`;
      sql += `INSERT INTO \`stock_movements\` (\`id\`, \`product_id\`, \`sku\`, \`tipo\`, \`quantidade\`, \`saldo_anterior\`, \`saldo_posterior\`, \`documento_ref\`, \`origem_canal\`, \`motivo\`, \`valor_unitario\`, \`valor_total\`, \`usuario_id\`, \`usuario_nome\`, \`data_movimentacao\`) VALUES\n`;
      sql += stockMovements.map((m: any) => `(${escapeSql(m.id)}, ${escapeSql(m.product_id || m.productId)}, ${escapeSql(m.sku)}, ${escapeSql(m.tipo)}, ${escapeSql(m.quantidade || 0)}, ${escapeSql(m.saldo_anterior || m.saldoAnterior || 0)}, ${escapeSql(m.saldo_posterior || m.saldoPosterior || 0)}, ${escapeSql(m.documento_ref || m.documentoRef || null)}, ${escapeSql(m.origem_canal || m.origemCanal || null)}, ${escapeSql(m.motivo || null)}, ${escapeSql(m.valor_unitario || m.valorUnitario || 0)}, ${escapeSql(m.valor_total || m.valorTotal || 0)}, ${escapeSql(m.usuario_id || m.usuarioId || 'sistema')}, ${escapeSql(m.usuario_nome || m.usuarioNome || 'Sistema')}, ${escapeSql(m.data_movimentacao ? new Date(m.data_movimentacao) : new Date())})`).join(',\n') + `;\n\n`;
    }

    const sqlFilePath = path.join(process.cwd(), 'database_spm_fiscal.sql');
    fs.writeFileSync(sqlFilePath, sql, 'utf-8');
    console.log(`[SQL Sync] Arquivo database_spm_fiscal.sql sincronizado com sucesso (${invoices.length} notas).`);
  } catch (err: any) {
    console.error('[SQL Sync] Erro ao sincronizar database_spm_fiscal.sql:', err.message);
  }
}

// ================= DUPLICATE CHECK HELPER =================

export function checkDuplicateInvoices(
  existingList: Invoice[], 
  incomingList: Invoice[]
): { uniqueItems: Invoice[]; duplicates: DuplicateInvoiceNotice[] } {
  const uniqueItems: Invoice[] = [];
  const duplicates: DuplicateInvoiceNotice[] = [];

  for (const item of incomingList) {
    const existingMatch = existingList.find(existing => {
      if (existing.id && item.id && existing.id === item.id) return true;
      if (
        existing.documento &&
        item.documento &&
        existing.documento === item.documento &&
        existing.fatura &&
        item.fatura &&
        existing.fatura === item.fatura &&
        existing.codigo === item.codigo
      ) {
        return true;
      }
      return false;
    });

    if (existingMatch) {
      duplicates.push({
        id: item.id || existingMatch.id,
        fatura: item.fatura || 'N/A',
        documento: item.documento || 'N/A',
        nome: item.nome || existingMatch.nome,
        codigo: item.codigo || 'N/A',
        valorNota: item.valorNota || '0,00',
        origem: item.origem || 'Outros',
        motivo: `Nota jÃƒÂ¡ registrada no banco (Fatura: ${item.fatura}, Doc: ${item.documento}, SKU: ${item.codigo})`
      });
    } else {
      // Verificar tambÃƒÂ©m se hÃƒÂ¡ duplicaÃƒÂ§ÃƒÂ£o dentro do prÃƒÂ³prio lote novo
      const batchMatch = uniqueItems.find(u => 
        u.documento === item.documento && u.fatura === item.fatura && u.codigo === item.codigo
      );
      if (batchMatch) {
        duplicates.push({
          id: item.id,
          fatura: item.fatura || 'N/A',
          documento: item.documento || 'N/A',
          nome: item.nome,
          codigo: item.codigo || 'N/A',
          valorNota: item.valorNota || '0,00',
          origem: item.origem || 'Outros',
          motivo: `Item duplicado dentro do prÃƒÂ³prio lote (Fatura: ${item.fatura}, SKU: ${item.codigo})`
        });
      } else {
        uniqueItems.push(item);
      }
    }
  }

  return { uniqueItems, duplicates };
}

// ================= REPOSITORY METHODS =================

function parseNumber(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const clean = val.replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

// --- Invoices ---
export async function getInvoicesFromDb(filters?: Record<string, string>): Promise<Invoice[]> {
  const p = await getDbPool();
  if (p) {
    let query = 'SELECT * FROM invoices WHERE 1=1';
    const params: any[] = [];

    if (filters?.origem && filters.origem !== 'Todas' && filters.origem !== 'Todos') {
      query += ' AND origem = ?';
      params.push(filters.origem);
    }
    if (filters?.cor && filters.cor !== 'Todas' && filters.cor !== 'Todos') {
      query += ' AND cor = ?';
      params.push(filters.cor);
    }
    if (filters?.uf && filters.uf !== 'Todos') {
      query += ' AND uf = ?';
      params.push(filters.uf);
    }
    if (filters?.status && filters.status !== 'Todos') {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.search) {
      query += ' AND (nome LIKE ? OR documento LIKE ? OR descricao LIKE ? OR fatura LIKE ? OR codigo LIKE ? OR municipio LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC';

    let [rows]: any = await p.query(query, params);

    // Se o MySQL retornou 0 notas, verificar se a base está zerada e rodar auto-seed
    if ((!rows || rows.length === 0) && (!filters?.search && !filters?.origem && !filters?.cor && !filters?.uf && !filters?.status)) {
      try {
        console.warn('[MySQL Invoices Vazio] Nenhuma nota encontrada no MySQL. Executando auto-seed de recuperação...');
        await migrateInitialDataIfEmpty();
        const [recheckRows]: any = await p.query(query, params);
        if (recheckRows && recheckRows.length > 0) {
          rows = recheckRows;
        }
      } catch (seedErr: any) {
        console.warn('[MySQL Invoices Seed Error]:', seedErr.message);
      }
    }

    if (rows && rows.length > 0) {
      return rows.map((r: any): Invoice => ({
        id: r.id,
        nome: r.nome,
        documento: r.documento,
        dataSaida: r.data_saida,
        endereco: r.endereco || '',
        bairro: r.bairro || '',
        cep: r.cep || '',
        municipio: r.municipio || '',
        uf: r.uf || '',
        fatura: r.fatura || '',
        valorProdutos: r.valor_produtos || '0,00',
        valorNota: r.valor_nota || '0,00',
        desconto: r.desconto || '0,00',
        codigo: r.codigo || '',
        quantidade: r.quantidade || '1',
        descricao: r.descricao || '',
        cor: r.cor || 'Não identificada',
        origem: r.origem || 'Outros',
        origemArquivo: r.origem_arquivo || undefined,
        dataUpload: r.data_upload || undefined,
        status: r.status as any
      }));
    }
  }

  // Fallback Local JSON
  let list = readJsonFile<Invoice[]>('invoices.json', []);
  if (filters?.origem && filters.origem !== 'Todas' && filters.origem !== 'Todos') {
    list = list.filter(i => (i.origem || 'Outros') === filters.origem);
  }
  if (filters?.cor && filters.cor !== 'Todas' && filters.cor !== 'Todos') {
    list = list.filter(i => (i.cor || 'NÃƒÂ£o identificada') === filters.cor);
  }
  if (filters?.uf && filters.uf !== 'Todos') {
    list = list.filter(i => (i.uf || '').toUpperCase() === filters.uf.toUpperCase());
  }
  if (filters?.status && filters.status !== 'Todos') {
    list = list.filter(i => i.status === filters.status);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(i => 
      (i.nome || '').toLowerCase().includes(s) ||
      (i.documento || '').toLowerCase().includes(s) ||
      (i.descricao || '').toLowerCase().includes(s) ||
      (i.fatura || '').toLowerCase().includes(s) ||
      (i.codigo || '').toLowerCase().includes(s) ||
      (i.municipio || '').toLowerCase().includes(s)
    );
  }
  return list;
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const p = await getDbPool();
  if (p) {
    const [rows]: any = await p.query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      nome: r.nome,
      documento: r.documento,
      dataSaida: r.data_saida,
      endereco: r.endereco || '',
      bairro: r.bairro || '',
      cep: r.cep || '',
      municipio: r.municipio || '',
      uf: r.uf || '',
      fatura: r.fatura || '',
      valorProdutos: r.valor_produtos || '0,00',
      valorNota: r.valor_nota || '0,00',
      desconto: r.desconto || '0,00',
      codigo: r.codigo || '',
      quantidade: r.quantidade || '1',
      descricao: r.descricao || '',
      cor: r.cor || 'NÃƒÂ£o identificada',
      origem: r.origem || 'Outros',
      origemArquivo: r.origem_arquivo || undefined,
      dataUpload: r.data_upload || undefined,
      status: r.status as any
    };
  }

  const list = readJsonFile<Invoice[]>('invoices.json', []);
  return list.find(i => i.id === id) || null;
}

export async function saveInvoiceToDb(inv: Invoice): Promise<void> {
  // Always update JSON for local consistency
  const list = readJsonFile<Invoice[]>('invoices.json', []);
  const idx = list.findIndex(i => i.id === inv.id);
  if (idx >= 0) {
    list[idx] = inv;
  } else {
    list.unshift(inv);
  }
  writeJsonFile('invoices.json', list);

  const p = await getDbPool();
  if (p) {
    await p.query(
      `INSERT INTO invoices 
      (id, nome, documento, data_saida, endereco, bairro, cep, municipio, uf, fatura, valor_produtos, valor_nota, desconto, codigo, quantidade, descricao, cor, origem, origem_arquivo, data_upload, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      nome = VALUES(nome), documento = VALUES(documento), data_saida = VALUES(data_saida), endereco = VALUES(endereco),
      bairro = VALUES(bairro), cep = VALUES(cep), municipio = VALUES(municipio), uf = VALUES(uf), fatura = VALUES(fatura),
      valor_produtos = VALUES(valor_produtos), valor_nota = VALUES(valor_nota), desconto = VALUES(desconto),
      codigo = VALUES(codigo), quantidade = VALUES(quantidade), descricao = VALUES(descricao), cor = VALUES(cor),
      origem = VALUES(origem), origem_arquivo = VALUES(origem_arquivo), data_upload = VALUES(data_upload), status = VALUES(status)`,
      [
        inv.id,
        inv.nome || '',
        inv.documento || '',
        inv.dataSaida || '',
        inv.endereco || '',
        inv.bairro || '',
        inv.cep || '',
        inv.municipio || '',
        inv.uf || '',
        inv.fatura || '',
        inv.valorProdutos || '0,00',
        inv.valorNota || '0,00',
        inv.desconto || '0,00',
        inv.codigo || '',
        inv.quantidade || '1',
        inv.descricao || '',
        inv.cor || 'NÃƒÂ£o identificada',
        inv.origem || 'Outros',
        inv.origemArquivo || null,
        inv.dataUpload || null,
        inv.status || 'Processado'
      ]
    );
  }

  await syncDatabaseToSqlFile();
}

export async function deleteInvoiceFromDb(id: string): Promise<boolean> {
  const list = readJsonFile<Invoice[]>('invoices.json', []);
  const nextList = list.filter(i => i.id !== id);
  const deleted = nextList.length !== list.length;
  writeJsonFile('invoices.json', nextList);

  const p = await getDbPool();
  if (p) {
    const [result]: any = await p.query('DELETE FROM invoices WHERE id = ?', [id]);
    await syncDatabaseToSqlFile();
    return result.affectedRows > 0;
  }

  await syncDatabaseToSqlFile();
  return deleted;
}

export async function bulkDeleteInvoicesFromDb(ids: string[]): Promise<number> {
  if (!ids || ids.length === 0) return 0;
  const list = readJsonFile<Invoice[]>('invoices.json', []);
  const idsSet = new Set(ids);
  const nextList = list.filter(i => !idsSet.has(i.id));
  const count = list.length - nextList.length;
  writeJsonFile('invoices.json', nextList);

  const p = await getDbPool();
  if (p) {
    const [result]: any = await p.query('DELETE FROM invoices WHERE id IN (?)', [ids]);
    await syncDatabaseToSqlFile();
    return result.affectedRows;
  }

  await syncDatabaseToSqlFile();
  return count;
}

export async function bulkUpdateInvoicesInDb(ids: string[], updates: Partial<Invoice>): Promise<number> {
  if (!ids || ids.length === 0) return 0;
  const list = readJsonFile<Invoice[]>('invoices.json', []);
  const idsSet = new Set(ids);
  let updatedCount = 0;
  for (let i = 0; i < list.length; i++) {
    if (idsSet.has(list[i].id)) {
      list[i] = { ...list[i], ...updates };
      updatedCount++;
    }
  }
  writeJsonFile('invoices.json', list);

  const p = await getDbPool();
  if (p) {
    const setClauses: string[] = [];
    const values: any[] = [];
    if (updates.origem !== undefined) { setClauses.push('origem = ?'); values.push(updates.origem); }
    if (updates.cor !== undefined) { setClauses.push('cor = ?'); values.push(updates.cor); }
    if (updates.status !== undefined) { setClauses.push('status = ?'); values.push(updates.status); }
    if (updates.municipio !== undefined) { setClauses.push('municipio = ?'); values.push(updates.municipio); }
    if (updates.uf !== undefined) { setClauses.push('uf = ?'); values.push(updates.uf); }
    
    if (setClauses.length > 0) {
      values.push(ids);
      const [result]: any = await p.query(
        `UPDATE invoices SET ${setClauses.join(', ')} WHERE id IN (?)`,
        values
      );
      await syncDatabaseToSqlFile();
      return result.affectedRows || updatedCount;
    }
  }

  await syncDatabaseToSqlFile();
  return updatedCount;
}

export async function resetInvoicesInDb(): Promise<void> {
  writeJsonFile('invoices.json', []);
  const p = await getDbPool();
  if (p) {
    await p.query('TRUNCATE TABLE invoices');
  }
  await syncDatabaseToSqlFile();
}

// --- Dashboard Stats ---
export async function calculateStatsFromDb(filters?: Record<string, string>): Promise<DashboardStats> {
  const list = await getInvoicesFromDb(filters);

  let totalFaturamento = 0;
  let totalDescontos = 0;
  let totalItens = 0;
  const marketplacesCount: Record<string, number> = {};
  const marketplacesFaturamento: Record<string, number> = {};
  const coresCount: Record<string, number> = {};
  const ufDistribution: Record<string, number> = {};
  const timelineMap: Record<string, { total: number; count: number }> = {};
  const clientesMap: Record<string, { total: number; count: number; uf: string }> = {};

  list.forEach(inv => {
    const valNota = parseNumber(inv.valorNota);
    const valDesc = parseNumber(inv.desconto);
    const qtd = parseNumber(inv.quantidade) || 1;

    totalFaturamento += valNota;
    totalDescontos += valDesc;
    totalItens += qtd;

    // Marketplace
    const orig = inv.origem || 'Outros';
    marketplacesCount[orig] = (marketplacesCount[orig] || 0) + 1;
    marketplacesFaturamento[orig] = (marketplacesFaturamento[orig] || 0) + valNota;

    // Cor
    const cor = inv.cor || 'NÃƒÂ£o identificada';
    coresCount[cor] = (coresCount[cor] || 0) + 1;

    // UF
    const uf = inv.uf ? inv.uf.toUpperCase().trim() : 'OUTROS';
    if (uf.length === 2) {
      ufDistribution[uf] = (ufDistribution[uf] || 0) + 1;
    }

    // Timeline por dataSaida
    const data = inv.dataSaida || 'Sem Data';
    if (!timelineMap[data]) {
      timelineMap[data] = { total: 0, count: 0 };
    }
    timelineMap[data].total += valNota;
    timelineMap[data].count += 1;

    // Top Clientes
    const clienteNome = inv.nome || 'Consumidor NÃƒÂ£o Identificado';
    if (!clientesMap[clienteNome]) {
      clientesMap[clienteNome] = { total: 0, count: 0, uf: inv.uf || 'SP' };
    }
    clientesMap[clienteNome].total += valNota;
    clientesMap[clienteNome].count += 1;
  });

  const timeline = Object.keys(timelineMap).map(d => ({
    data: d,
    total: timelineMap[d].total,
    count: timelineMap[d].count
  })).slice(-15);

  const topClientes = Object.keys(clientesMap).map(c => ({
    nome: c,
    total: clientesMap[c].total,
    count: clientesMap[c].count,
    uf: clientesMap[c].uf
  })).sort((a, b) => b.total - a.total).slice(0, 10);

  const ticketMedio = list.length > 0 ? totalFaturamento / list.length : 0;

  return {
    totalFaturamento,
    totalNotas: list.length,
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
}

// --- Users & Auth ---
export async function getUsersFromDb(): Promise<User[]> {
  const p = await getDbPool();
  if (p) {
    try {
      const [rows]: any = await p.query('SELECT * FROM users ORDER BY created_at ASC');
      if (rows && rows.length > 0) {
        return rows.map((r: any): User => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          active: Boolean(r.active),
          lastLogin: r.last_login ? new Date(r.last_login).toISOString() : '',
          avatar: r.avatar || undefined,
          department: r.department || undefined
        }));
      }
    } catch (e: any) {
      console.warn('[MySQL getUsers Error]:', e.message);
    }
  }

  const jsonUsers = readJsonFile<User[]>('users.json', []);
  if (jsonUsers && jsonUsers.length > 0) return jsonUsers;

  return [
    {
      id: 'u-admin-1',
      name: 'José Galdino (Administrador)',
      email: 'josegaldino@hotmail.com.br',
      role: 'ADMIN',
      active: true,
      department: 'SPM Store - Diretoria'
    },
    {
      id: 'u-gerente-1',
      name: 'Carlos Santos (Gerente)',
      email: 'gerente@empresa.com',
      role: 'MANAGER',
      active: true,
      department: 'Faturamento & Gestão'
    },
    {
      id: 'u-auditor-1',
      name: 'Ana Maria Ferreira (Auditor)',
      email: 'auditor@empresa.com',
      role: 'AUDITOR',
      active: true,
      department: 'Auditoria Fiscal'
    }
  ];
}

export async function getUserByIdFromDb(id: string): Promise<User | null> {
  const p = await getDbPool();
  if (p) {
    try {
      const [rows]: any = await p.query('SELECT * FROM users WHERE id = ?', [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          active: Boolean(r.active),
          lastLogin: r.last_login ? new Date(r.last_login).toISOString() : '',
          avatar: r.avatar || undefined,
          department: r.department || undefined
        };
      }
    } catch (_) {}
  }

  const list = await getUsersFromDb();
  return list.find(u => u.id === id) || null;
}

export async function getUserByEmailFromDb(email: string): Promise<User | null> {
  const p = await getDbPool();
  if (p) {
    try {
      const [rows]: any = await p.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          active: Boolean(r.active),
          lastLogin: r.last_login ? new Date(r.last_login).toISOString() : '',
          avatar: r.avatar || undefined,
          department: r.department || undefined
        };
      }
    } catch (_) {}
  }

  const list = await getUsersFromDb();
  return list.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getUserPasswordHash(email: string): Promise<string | null> {
  const p = await getDbPool();
  if (p) {
    try {
      const [rows]: any = await p.query('SELECT password_hash FROM user_passwords WHERE LOWER(email) = LOWER(?)', [email]);
      if (rows && rows.length > 0) {
        return rows[0].password_hash;
      }
    } catch (_) {}
  }

  const pwMap = readJsonFile<Record<string, string>>('userPasswords.json', {});
  const directHash = pwMap[email.toLowerCase()] || pwMap[email];
  if (directHash) return directHash;

  // Hashes padrão de segurança para as contas pré-configuradas
  const defaultHashes: Record<string, string> = {
    'josegaldino@hotmail.com.br': '$2b$08$l.pMRvk9WSkZ8BuG5n0OduB78DfKBlUkeaUEc.wkyBaotzsuD1VBe', // admin123
    'gerente@empresa.com': '$2b$08$SBcQF1FIuVKuBhT/U0WRTudP9UdYr.hGJNp9BOKr5X0u8fKsTSTfm', // gerente123
    'auditor@empresa.com': '$2b$08$YC0ePodzrQtMw9S233gAbeGVMp9QVNT.3noknIic7farYRYObOn3q' // auditor123
  };

  return defaultHashes[email.toLowerCase()] || null;
}

export async function saveUserToDb(user: User, passwordHash?: string): Promise<void> {
  // Update local JSON
  const users = readJsonFile<User[]>('users.json', []);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  writeJsonFile('users.json', users);

  if (passwordHash) {
    const pwMap = readJsonFile<Record<string, string>>('userPasswords.json', {});
    pwMap[user.email.toLowerCase()] = passwordHash;
    writeJsonFile('userPasswords.json', pwMap);
  }

  const p = await getDbPool();
  if (p) {
    await p.query(
      `INSERT INTO users (id, name, email, role, active, last_login, avatar, department)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       name = VALUES(name), email = VALUES(email), role = VALUES(role), 
       active = VALUES(active), last_login = VALUES(last_login), avatar = VALUES(avatar), department = VALUES(department)`,
      [
        user.id,
        user.name,
        user.email,
        user.role,
        user.active ? 1 : 0,
        user.lastLogin ? new Date(user.lastLogin) : null,
        user.avatar || null,
        user.department || null
      ]
    );

    if (passwordHash) {
      await p.query(
        `INSERT INTO user_passwords (email, password_hash) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [user.email, passwordHash]
      );
    }
  }

  await syncDatabaseToSqlFile();
}

export async function deleteUserFromDb(id: string): Promise<boolean> {
  const user = await getUserByIdFromDb(id);
  if (!user) return false;

  const users = readJsonFile<User[]>('users.json', []);
  const nextUsers = users.filter(u => u.id !== id);
  writeJsonFile('users.json', nextUsers);

  const pwMap = readJsonFile<Record<string, string>>('userPasswords.json', {});
  delete pwMap[user.email.toLowerCase()];
  delete pwMap[user.email];
  writeJsonFile('userPasswords.json', pwMap);

  const p = await getDbPool();
  if (p) {
    await p.query('DELETE FROM user_passwords WHERE LOWER(email) = LOWER(?)', [user.email]);
    const [result]: any = await p.query('DELETE FROM users WHERE id = ?', [id]);
    await syncDatabaseToSqlFile();
    return result.affectedRows > 0;
  }

  await syncDatabaseToSqlFile();
  return true;
}

export async function updateLastLoginInDb(userId: string): Promise<void> {
  const users = readJsonFile<User[]>('users.json', []);
  const u = users.find(x => x.id === userId);
  if (u) {
    u.lastLogin = new Date().toISOString();
    writeJsonFile('users.json', users);
  }

  const p = await getDbPool();
  if (p) {
    await p.query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
  }
}

// --- Audit Logs ---
export async function getLogsFromDb(): Promise<LogEntry[]> {
  const p = await getDbPool();
  if (p) {
    const [rows]: any = await p.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
    return rows.map((r: any): LogEntry => ({
      id: r.id,
      timestamp: new Date(r.timestamp).toISOString(),
      userId: r.user_id,
      userName: r.user_name,
      action: r.action,
      category: r.category,
      details: r.details,
      ip: r.ip,
      severity: r.severity
    }));
  }

  return readJsonFile<LogEntry[]>('logs.json', []);
}

export async function addLogToDb(log: LogEntry): Promise<void> {
  const logs = readJsonFile<LogEntry[]>('logs.json', []);
  logs.unshift(log);
  if (logs.length > 500) logs.pop();
  writeJsonFile('logs.json', logs);

  const p = await getDbPool();
  if (p) {
    await p.query(
      'INSERT INTO audit_logs (id, timestamp, user_id, user_name, action, category, details, ip, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        log.id,
        log.timestamp ? new Date(log.timestamp) : new Date(),
        log.userId,
        log.userName,
        log.action,
        log.category,
        log.details,
        log.ip,
        log.severity
      ]
    );
  }
}

export async function clearLogsInDb(): Promise<void> {
  writeJsonFile('logs.json', []);
  const p = await getDbPool();
  if (p) {
    await p.query('TRUNCATE TABLE audit_logs');
  }
  await syncDatabaseToSqlFile();
}

// --- Alerts ---
export async function getAlertsFromDb(): Promise<AlertRule[]> {
  const p = await getDbPool();
  if (p) {
    const [rows]: any = await p.query('SELECT * FROM alert_rules ORDER BY name ASC');
    return rows.map((r: any): AlertRule => ({
      id: r.id,
      name: r.name,
      type: r.type,
      threshold: r.threshold ? parseFloat(r.threshold) : undefined,
      emailNotify: Boolean(r.email_notify),
      pushNotify: Boolean(r.push_notify),
      active: Boolean(r.active),
      lastTriggered: r.last_triggered ? new Date(r.last_triggered).toISOString() : undefined
    }));
  }

  return readJsonFile<AlertRule[]>('alerts.json', []);
}

export async function saveAlertToDb(rule: AlertRule): Promise<void> {
  const alerts = readJsonFile<AlertRule[]>('alerts.json', []);
  const idx = alerts.findIndex(a => a.id === rule.id);
  if (idx >= 0) {
    alerts[idx] = rule;
  } else {
    alerts.push(rule);
  }
  writeJsonFile('alerts.json', alerts);

  const p = await getDbPool();
  if (p) {
    await p.query(
      `INSERT INTO alert_rules (id, name, type, threshold, email_notify, push_notify, active, last_triggered)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       name = VALUES(name), type = VALUES(type), threshold = VALUES(threshold),
       email_notify = VALUES(email_notify), push_notify = VALUES(push_notify),
       active = VALUES(active), last_triggered = VALUES(last_triggered)`,
      [
        rule.id,
        rule.name,
        rule.type,
        rule.threshold || null,
        rule.emailNotify ? 1 : 0,
        rule.pushNotify ? 1 : 0,
        rule.active ? 1 : 0,
        rule.lastTriggered ? new Date(rule.lastTriggered) : null
      ]
    );
  }
  await syncDatabaseToSqlFile();
}

export async function deleteAlertFromDb(id: string): Promise<boolean> {
  const alerts = readJsonFile<AlertRule[]>('alerts.json', []);
  const nextAlerts = alerts.filter(a => a.id !== id);
  const deleted = nextAlerts.length !== alerts.length;
  writeJsonFile('alerts.json', nextAlerts);

  const p = await getDbPool();
  if (p) {
    const [res]: any = await p.query('DELETE FROM alert_rules WHERE id = ?', [id]);
    await syncDatabaseToSqlFile();
    return res.affectedRows > 0;
  }

  await syncDatabaseToSqlFile();
  return deleted;
}

// --- Settings & Integrations ---
const defaultSettings: SystemSettings = {
  smtpHost: 'smtp.empresa.com.br',
  smtpPort: 587,
  smtpUser: 'auditoria@empresa.com.br',
  smtpSender: 'SPM Store Auditoria Fiscal <auditoria@empresa.com.br>',
  emailAlertsEnabled: true,
  pushAlertsEnabled: true,
  autoExportExcel: true,
  useGeminiOcrFallback: true,
  vpsMode: true
};

export async function getSettingsFromDb(): Promise<SystemSettings> {
  const p = await getDbPool();
  if (p) {
    const [rows]: any = await p.query('SELECT data_json FROM system_settings WHERE id = ?', ['main']);
    if (rows && rows.length > 0) {
      const val = typeof rows[0].data_json === 'string' ? JSON.parse(rows[0].data_json) : rows[0].data_json;
      return { ...defaultSettings, ...val };
    }
  }

  const s = readJsonFile<SystemSettings>('settings.json', defaultSettings);
  return { ...defaultSettings, ...s };
}

export async function saveSettingsToDb(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await getSettingsFromDb();
  const updated = { ...current, ...settings };
  writeJsonFile('settings.json', updated);

  const p = await getDbPool();
  if (p) {
    await p.query(
      'INSERT INTO system_settings (id, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)',
      ['main', JSON.stringify(updated)]
    );
  }
  await syncDatabaseToSqlFile();
  return updated;
}

export async function getPowerBiConfigFromDb(): Promise<PowerBiConfig> {
  const defaultPbi: PowerBiConfig = {
    enabled: true,
    refreshIntervalMinutes: 15,
    lastRefresh: new Date().toISOString(),
    apiKey: 'pbi-spm-secret-key-998822',
    feedUrl: `http://localhost:${process.env.PORT || 3000}/api/powerbi/feed`
  };
  const p = await getDbPool();
  if (p) {
    const [rows]: any = await p.query('SELECT data_json FROM integrations_config WHERE type = ?', ['powerbi']);
    if (rows && rows.length > 0) {
      const val = typeof rows[0].data_json === 'string' ? JSON.parse(rows[0].data_json) : rows[0].data_json;
      return { ...defaultPbi, ...val };
    }
  }

  const pbi = readJsonFile<PowerBiConfig>('powerbi.json', defaultPbi);
  return { ...defaultPbi, ...pbi };
}

export async function savePowerBiConfigToDb(cfg: Partial<PowerBiConfig>): Promise<PowerBiConfig> {
  const current = await getPowerBiConfigFromDb();
  const updated = { ...current, ...cfg };
  writeJsonFile('powerbi.json', updated);

  const p = await getDbPool();
  if (p) {
    await p.query(
      'INSERT INTO integrations_config (type, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)',
      ['powerbi', JSON.stringify(updated)]
    );
  }
  await syncDatabaseToSqlFile();
  return updated;
}

export async function getGSheetsConfigFromDb(): Promise<GSheetsConfig> {
  const defaultGs: GSheetsConfig = {
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    sheetName: 'Notas_Fiscais_SPM',
    autoSync: true,
    lastSync: new Date().toISOString(),
    status: 'CONNECTED',
    webhookUrl: 'https://script.google.com/macros/s/AKfycbw-spm-fiscal-sync/exec'
  };
  const p = await getDbPool();
  if (p) {
    const [rows]: any = await p.query('SELECT data_json FROM integrations_config WHERE type = ?', ['gsheets']);
    if (rows && rows.length > 0) {
      const val = typeof rows[0].data_json === 'string' ? JSON.parse(rows[0].data_json) : rows[0].data_json;
      return { ...defaultGs, ...val };
    }
  }

  const gs = readJsonFile<GSheetsConfig>('gsheets.json', defaultGs);
  return { ...defaultGs, ...gs };
}

export async function saveGSheetsConfigToDb(cfg: Partial<GSheetsConfig>): Promise<GSheetsConfig> {
  const current = await getGSheetsConfigFromDb();
  const updated = { ...current, ...cfg };
  writeJsonFile('gsheets.json', updated);

  const p = await getDbPool();
  if (p) {
    await p.query(
      'INSERT INTO integrations_config (type, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)',
      ['gsheets', JSON.stringify(updated)]
    );
  }
  await syncDatabaseToSqlFile();
  return updated;
}

export async function getN8nConfigFromDb(): Promise<N8nConfig> {
  const defaultN8n: N8nConfig = {
    webhookUrl: '',
    active: true,
    events: {
      newInvoices: true,
      duplicateDetected: true,
      mapCitySale: true,
      dailySummary: false
    },
    lastStatus: 'IDLE'
  };
  const p = await getDbPool();
  if (p) {
    const [rows]: any = await p.query('SELECT data_json FROM integrations_config WHERE type = ?', ['n8n']);
    if (rows && rows.length > 0) {
      const val = typeof rows[0].data_json === 'string' ? JSON.parse(rows[0].data_json) : rows[0].data_json;
      return { ...defaultN8n, ...val };
    }
  }

  return defaultN8n;
}

export async function saveN8nConfigToDb(cfg: Partial<N8nConfig>): Promise<N8nConfig> {
  const current = await getN8nConfigFromDb();
  const updated = { ...current, ...cfg };

  const p = await getDbPool();
  if (p) {
    await p.query(
      'INSERT INTO integrations_config (type, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)',
      ['n8n', JSON.stringify(updated)]
    );
  }
  await syncDatabaseToSqlFile();
  return updated;
}

// ================= CONTROLE DE ESTOQUE & MOVIMENTAÃƒâ€¡Ãƒâ€¢ES =================

export function resolveSkuFromInvoice(inv: Partial<Invoice>): { sku: string; productId: string; nome: string } {
  const cor = (inv.cor || '').toLowerCase().trim();
  const desc = (inv.descricao || '').toLowerCase().trim();
  const cod = (inv.codigo || '').toLowerCase().trim();

  if (cod.includes('kit') || desc.includes('kit') || desc.includes('esponja + flanela')) {
    return { sku: 'SPM-KIT1-COMPLETO', productId: 'sku-spm-kit1', nome: 'Kit 1 Verniz Elite SPM 100ml + Esponja + Flanela' };
  }
  if (cor.includes('marrom') || desc.includes('marrom') || cod.includes('marrom')) {
    return { sku: 'SPM-MARROM-100ML', productId: 'sku-spm-marrom', nome: 'Verniz Elite SPM 100ml - Cor Marrom' };
  }
  if (cor.includes('incolor') || desc.includes('incolor') || cod.includes('incolor')) {
    return { sku: 'SPM-INCOLOR-100ML', productId: 'sku-spm-incolor', nome: 'Verniz Elite SPM 100ml - Cor Incolor' };
  }
  if (
    cor.includes('preto') || 
    desc.includes('preto') || 
    cod.includes('preto') || 
    desc.includes('verniz') || 
    desc.includes('graxa') ||
    cod.includes('spm-01') ||
    cod.includes('spm-02') ||
    cod.includes('spm-1') ||
    cod.includes('spm-2') ||
    desc.includes('elite spm')
  ) {
    return { sku: 'SPM-PRETO-100ML', productId: 'sku-spm-preto', nome: 'Verniz Elite SPM 100ml - Cor Preto' };
  }
  if (desc.includes('esponja')) {
    return { sku: 'SPM-ESPONJA', productId: 'sku-spm-esponja', nome: 'Esponja Aplicadora AnatÃƒÂ´mica SPM' };
  }
  if (desc.includes('flanela')) {
    return { sku: 'SPM-FLANELA', productId: 'sku-spm-flanela', nome: 'Flanela de Microfibra Especial SPM' };
  }
  return { sku: 'SPM-OUTROS', productId: 'sku-spm-outros', nome: 'Outros Produtos & VariaÃƒÂ§ÃƒÂµes SPM' };
}

const FALLBACK_DEFAULT_STOCK: StockItem[] = [
  {
    id: 'spm-stock-01',
    sku: 'SPM-PRETO-100ML',
    nome: 'Verniz Elite SPM 100ml - Preto',
    categoria: 'Verniz / Graxa',
    cor: 'Preto',
    unidade: 'un',
    estoqueInicial: 1000,
    totalEntradas: 1000,
    totalSaidas: 0,
    estoqueAtual: 1000,
    estoqueMinimo: 100,
    estoqueSeguranca: 30,
    precoCusto: 12.50,
    precoVenda: 39.99,
    localizacao: 'Prateleira A-01',
    ativo: true,
    status: 'NORMAL',
    consumoMedioDiario: 10,
    diasCobertura: 100,
    previsaoEsgotamento: '+ 1 ano de estoque',
    valorTotalEstoqueCusto: 12500,
    valorTotalEstoqueVenda: 39990
  },
  {
    id: 'spm-stock-02',
    sku: 'SPM-MARROM-100ML',
    nome: 'Verniz Elite SPM 100ml - Marrom',
    categoria: 'Verniz / Graxa',
    cor: 'Marrom',
    unidade: 'un',
    estoqueInicial: 800,
    totalEntradas: 800,
    totalSaidas: 0,
    estoqueAtual: 800,
    estoqueMinimo: 80,
    estoqueSeguranca: 25,
    precoCusto: 12.50,
    precoVenda: 39.99,
    localizacao: 'Prateleira A-02',
    ativo: true,
    status: 'NORMAL',
    consumoMedioDiario: 8,
    diasCobertura: 100,
    previsaoEsgotamento: '+ 1 ano de estoque',
    valorTotalEstoqueCusto: 10000,
    valorTotalEstoqueVenda: 31992
  },
  {
    id: 'spm-stock-03',
    sku: 'SPM-INCOLOR-100ML',
    nome: 'Verniz Elite SPM 100ml - Incolor',
    categoria: 'Verniz / Graxa',
    cor: 'Incolor',
    unidade: 'un',
    estoqueInicial: 600,
    totalEntradas: 600,
    totalSaidas: 0,
    estoqueAtual: 600,
    estoqueMinimo: 60,
    estoqueSeguranca: 20,
    precoCusto: 12.50,
    precoVenda: 39.99,
    localizacao: 'Prateleira A-03',
    ativo: true,
    status: 'NORMAL',
    consumoMedioDiario: 6,
    diasCobertura: 100,
    previsaoEsgotamento: '+ 1 ano de estoque',
    valorTotalEstoqueCusto: 7500,
    valorTotalEstoqueVenda: 23994
  },
  {
    id: 'spm-stock-04',
    sku: 'SPM-KIT1-COMPLETO',
    nome: 'Kit 1 Verniz Elite SPM 100ml + Esponja + Flanela',
    categoria: 'Kits Promocionais',
    cor: 'Kit Completo',
    unidade: 'kit',
    estoqueInicial: 500,
    totalEntradas: 500,
    totalSaidas: 0,
    estoqueAtual: 500,
    estoqueMinimo: 50,
    estoqueSeguranca: 15,
    precoCusto: 18.00,
    precoVenda: 69.99,
    localizacao: 'Prateleira B-01',
    ativo: true,
    status: 'NORMAL',
    consumoMedioDiario: 5,
    diasCobertura: 100,
    previsaoEsgotamento: '+ 1 ano de estoque',
    valorTotalEstoqueCusto: 9000,
    valorTotalEstoqueVenda: 34995
  },
  {
    id: 'spm-stock-05',
    sku: 'SPM-ESPONJA',
    nome: 'Esponja Aplicadora AnatÃƒÂ´mica SPM',
    categoria: 'AcessÃƒÂ³rios',
    cor: 'Amarela/Preta',
    unidade: 'un',
    estoqueInicial: 1500,
    totalEntradas: 1500,
    totalSaidas: 0,
    estoqueAtual: 1500,
    estoqueMinimo: 150,
    estoqueSeguranca: 50,
    precoCusto: 1.80,
    precoVenda: 9.90,
    localizacao: 'Gaveteiro C-01',
    ativo: true,
    status: 'NORMAL',
    consumoMedioDiario: 15,
    diasCobertura: 100,
    previsaoEsgotamento: '+ 1 ano de estoque',
    valorTotalEstoqueCusto: 2700,
    valorTotalEstoqueVenda: 14850
  },
  {
    id: 'spm-stock-06',
    sku: 'SPM-FLANELA',
    nome: 'Flanela de Microfibra Especial SPM',
    categoria: 'AcessÃƒÂ³rios',
    cor: 'Laranja/Azul',
    unidade: 'un',
    estoqueInicial: 1500,
    totalEntradas: 1500,
    totalSaidas: 0,
    estoqueAtual: 1500,
    estoqueMinimo: 150,
    estoqueSeguranca: 50,
    precoCusto: 2.20,
    precoVenda: 12.90,
    localizacao: 'Gaveteiro C-02',
    ativo: true,
    status: 'NORMAL',
    consumoMedioDiario: 15,
    diasCobertura: 100,
    previsaoEsgotamento: '+ 1 ano de estoque',
    valorTotalEstoqueCusto: 3300,
    valorTotalEstoqueVenda: 19350
  },
  {
    id: 'spm-stock-07',
    sku: 'SPM-OUTROS',
    nome: 'Produtos e VariaÃƒÂ§ÃƒÂµes Gerais SPM',
    categoria: 'Geral',
    cor: 'Variada',
    unidade: 'un',
    estoqueInicial: 300,
    totalEntradas: 300,
    totalSaidas: 0,
    estoqueAtual: 300,
    estoqueMinimo: 30,
    estoqueSeguranca: 10,
    precoCusto: 10.00,
    precoVenda: 39.99,
    localizacao: 'Prateleira D-01',
    ativo: true,
    status: 'NORMAL',
    consumoMedioDiario: 3,
    diasCobertura: 100,
    previsaoEsgotamento: '+ 1 ano de estoque',
    valorTotalEstoqueCusto: 3000,
    valorTotalEstoqueVenda: 11997
  }
];

export async function getStockItemsFromDb(): Promise<StockItem[]> {
  try {
    const p = await getDbPool();
    const [rows]: any = await p.query('SELECT * FROM stock_items WHERE ativo = 1 ORDER BY nome ASC');
    if (!rows || rows.length === 0) {
      await initDefaultStockItemsIfEmpty();
      return FALLBACK_DEFAULT_STOCK;
    }
    
    // Calcular consumo dos ÃƒÂºltimos 30 dias para projeÃƒÂ§ÃƒÂµes precisas de esgotamento
    const [recentSales]: any = await p.query(`
      SELECT sku, SUM(quantidade) as total_vendido 
      FROM stock_movements 
      WHERE tipo = 'SAIDA_VENDA' AND data_movimentacao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY sku
    `);

    const salesMap: Record<string, number> = {};
    recentSales.forEach((r: any) => {
      salesMap[r.sku] = Number(r.total_vendido) || 0;
    });

    return rows.map((r: any): StockItem => {
      const estoqueInicial = Number(r.estoque_inicial) || 0;
      const totalEntradas = Number(r.total_entradas) || 0;
      const totalSaidas = Number(r.total_saidas) || 0;
      const estoqueMinimo = Number(r.estoque_minimo) || 50;
      const estoqueSeguranca = Number(r.estoque_seguranca) || 20;
      const precoCusto = Number(r.preco_custo) || 0;
      const precoVenda = Number(r.preco_venda) || 0;

      // Saldo real = total entradas - total saÃƒÂ­das
      const estoqueAtual = Math.max(0, totalEntradas - totalSaidas);

      // NÃƒÂ­vel de status do produto
      let status: StockStatusLevel = 'NORMAL';
      if (estoqueAtual <= 0) {
        status = 'ZERADO';
      } else if (estoqueAtual <= estoqueSeguranca) {
        status = 'CRITICO';
      } else if (estoqueAtual <= estoqueMinimo) {
        status = 'BAIXO';
      }

      const vendas30Dias = salesMap[r.sku] || Math.max(1, Math.round(totalSaidas / 30));
      const consumoMedioDiario = Math.max(0.1, Number((vendas30Dias / 30).toFixed(1)));
      const diasCobertura = consumoMedioDiario > 0 ? Math.round(estoqueAtual / consumoMedioDiario) : 999;

      const dataEsgotamento = new Date();
      dataEsgotamento.setDate(dataEsgotamento.getDate() + diasCobertura);
      const previsaoEsgotamento = diasCobertura > 365 
        ? '+ 1 ano de estoque' 
        : dataEsgotamento.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      return {
        id: r.id,
        sku: r.sku,
        nome: r.nome,
        categoria: r.categoria,
        cor: r.cor,
        unidade: r.unidade,
        estoqueInicial,
        totalEntradas,
        totalSaidas,
        estoqueAtual,
        estoqueMinimo,
        estoqueSeguranca,
        precoCusto,
        precoVenda,
        localizacao: r.localizacao,
        ativo: Boolean(r.ativo),
        status,
        consumoMedioDiario,
        diasCobertura,
        previsaoEsgotamento,
        valorTotalEstoqueCusto: Number((estoqueAtual * precoCusto).toFixed(2)),
        valorTotalEstoqueVenda: Number((estoqueAtual * precoVenda).toFixed(2)),
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
      };
    });
  } catch (_) {
    return FALLBACK_DEFAULT_STOCK;
  }
}

export async function getStockMovementsFromDb(filters?: {
  sku?: string;
  tipo?: string;
  canal?: string;
  search?: string;
  limit?: number;
}): Promise<StockMovement[]> {
  try {
    const p = await getDbPool();
    let query = 'SELECT * FROM stock_movements WHERE 1=1';
    const params: any[] = [];

    if (filters?.sku && filters.sku !== 'TODOS') {
      query += ' AND sku = ?';
      params.push(filters.sku);
    }
    if (filters?.tipo && filters.tipo !== 'TODOS') {
      query += ' AND tipo = ?';
      params.push(filters.tipo);
    }
    if (filters?.canal && filters.canal !== 'TODOS') {
      query += ' AND origem_canal = ?';
      params.push(filters.canal);
    }
    if (filters?.search) {
      query += ' AND (sku LIKE ? OR documento_ref LIKE ? OR motivo LIKE ? OR usuario_nome LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY data_movimentacao DESC, id DESC';
    query += ` LIMIT ${Number(filters?.limit) || 150}`;

    const [rows]: any = await p.query(query, params);
    return rows.map((r: any): StockMovement => ({
      id: r.id,
      productId: r.product_id,
      sku: r.sku,
      tipo: r.tipo as StockMovementType,
      quantidade: Number(r.quantidade) || 0,
      saldoAnterior: Number(r.saldo_anterior) || 0,
      saldoPosterior: Number(r.saldo_posterior) || 0,
      documentoRef: r.documento_ref || undefined,
      origemCanal: r.origem_canal || undefined,
      motivo: r.motivo || undefined,
      valorUnitario: Number(r.valor_unitario) || 0,
      valorTotal: Number(r.valor_total) || 0,
      usuarioId: r.usuario_id || 'sistema',
      usuarioNome: r.usuario_nome || 'Sistema',
      dataMovimentacao: new Date(r.data_movimentacao).toISOString()
    }));
  } catch (_) {
    return [];
  }
}

export async function addStockMovementToDb(
  payload: NewStockMovementPayload,
  user?: { id: string; name: string }
): Promise<StockMovement> {
  const p = await getDbPool();
  const [prodRows]: any = await p.query('SELECT * FROM stock_items WHERE id = ? OR sku = ?', [payload.productId, payload.productId]);
  if (!prodRows || prodRows.length === 0) {
    throw new Error('Produto de estoque nÃƒÂ£o encontrado.');
  }

  const prod = prodRows[0];
  const qtd = Math.abs(Number(payload.quantidade) || 1);
  const saldoAnterior = Math.max(0, Number(prod.total_entradas) - Number(prod.total_saidas));
  
  const isAddition = 
    payload.tipo === 'ENTRADA_COMPRA' || 
    payload.tipo === 'ENTRADA_PRODUCAO' || 
    payload.tipo === 'AJUSTE_POSITIVO';

  const saldoPosterior = isAddition 
    ? saldoAnterior + qtd 
    : Math.max(0, saldoAnterior - qtd);

  const valorUnitario = payload.valorUnitario !== undefined ? Number(payload.valorUnitario) : Number(prod.preco_custo);
  const valorTotal = valorUnitario * qtd;

  const movementId = 'mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const now = new Date();

  await p.query(
    `INSERT INTO stock_movements 
    (id, product_id, sku, tipo, quantidade, saldo_anterior, saldo_posterior, documento_ref, origem_canal, motivo, valor_unitario, valor_total, usuario_id, usuario_nome, data_movimentacao) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movementId,
      prod.id,
      prod.sku,
      payload.tipo,
      qtd,
      saldoAnterior,
      saldoPosterior,
      payload.documentoRef || 'Ajuste Manual',
      payload.origemCanal || 'Interno / ArmazÃƒÂ©m SPM',
      payload.motivo || 'MovimentaÃƒÂ§ÃƒÂ£o manual de estoque',
      valorUnitario,
      valorTotal,
      user?.id || 'admin',
      user?.name || 'Administrador',
      now
    ]
  );

  // Atualizar saldo no item
  if (isAddition) {
    await p.query(
      'UPDATE stock_items SET total_entradas = total_entradas + ?, estoque_atual = total_entradas - total_saidas WHERE id = ?',
      [qtd, prod.id]
    );
  } else {
    await p.query(
      'UPDATE stock_items SET total_saidas = total_saidas + ?, estoque_atual = GREATEST(0, total_entradas - total_saidas) WHERE id = ?',
      [qtd, prod.id]
    );
  }

  await syncDatabaseToSqlFile();

  return {
    id: movementId,
    productId: prod.id,
    sku: prod.sku,
    tipo: payload.tipo,
    quantidade: qtd,
    saldoAnterior,
    saldoPosterior,
    documentoRef: payload.documentoRef,
    origemCanal: payload.origemCanal,
    motivo: payload.motivo,
    valorUnitario,
    valorTotal,
    usuarioId: user?.id || 'admin',
    usuarioNome: user?.name || 'Administrador',
    dataMovimentacao: now.toISOString()
  };
}

export async function saveStockItemToDb(item: Partial<StockItem>): Promise<void> {
  const p = await getDbPool();
  await p.query(
    `UPDATE stock_items SET 
      nome = COALESCE(?, nome),
      categoria = COALESCE(?, categoria),
      cor = COALESCE(?, cor),
      unidade = COALESCE(?, unidade),
      estoque_minimo = COALESCE(?, estoque_minimo),
      estoque_seguranca = COALESCE(?, estoque_seguranca),
      preco_custo = COALESCE(?, preco_custo),
      preco_venda = COALESCE(?, preco_venda),
      localizacao = COALESCE(?, localizacao),
      ativo = COALESCE(?, ativo)
    WHERE id = ? OR sku = ?`,
    [
      item.nome,
      item.categoria,
      item.cor,
      item.unidade,
      item.estoqueMinimo,
      item.estoqueSeguranca,
      item.precoCusto,
      item.precoVenda,
      item.localizacao,
      item.ativo !== undefined ? (item.ativo ? 1 : 0) : undefined,
      item.id,
      item.sku
    ]
  );
  await syncDatabaseToSqlFile();
}

/**
 * Realiza a baixa de estoque em lote para novas notas fiscais inseridas
 */


/**
 * Retorna estatÃƒÂ­sticas consolidadas e inteligÃƒÂªncia de estoque
 */

/**
 * Realiza a baixa de estoque em lote para novas notas fiscais inseridas
 */
export async function deductStockForInvoices(
  invoices: Invoice[],
  user?: { id: string; name: string }
): Promise<number> {
  if (!invoices || invoices.length === 0) return 0;
  let deductedCount = 0;

  try {
    const p = await getDbPool();
    if (p) {
      for (const inv of invoices) {
        try {
          const resolved = resolveSkuFromInvoice(inv);
          const qtd = Math.max(1, Math.round(parseNumber(inv.quantidade) || 1));
          const valNota = parseNumber(inv.valorNota);
          const valUnitario = valNota > 0 ? Number((valNota / qtd).toFixed(2)) : 29.99;

          // Buscar produto
          const [prodRows]: any = await p.query('SELECT * FROM stock_items WHERE id = ?', [resolved.productId]);
          if (!prodRows || prodRows.length === 0) continue;

          const prod = prodRows[0];
          const saldoAnterior = Math.max(0, Number(prod.total_entradas) - Number(prod.total_saidas));
          const saldoPosterior = Math.max(0, saldoAnterior - qtd);

          const movId = 'mov-venda-' + (inv.id || Date.now() + '-' + Math.floor(Math.random() * 1000));
          
          // Inserir movimentação se não existir
          await p.query(
            `INSERT IGNORE INTO stock_movements 
            (id, product_id, sku, tipo, quantidade, saldo_anterior, saldo_posterior, documento_ref, origem_canal, motivo, valor_unitario, valor_total, usuario_id, usuario_nome, data_movimentacao) 
            VALUES (?, ?, ?, 'SAIDA_VENDA', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              movId,
              prod.id,
              prod.sku,
              qtd,
              saldoAnterior,
              saldoPosterior,
              inv.fatura ? `NF ${inv.fatura}` : `Pedido #${inv.id}`,
              inv.origem || 'Outros',
              `Venda NF ${inv.fatura || ''} para ${inv.nome || 'Consumidor'} (${inv.municipio || ''}/${inv.uf || ''})`,
              valUnitario,
              valNota,
              user?.id || 'sistema',
              user?.name || 'Emissão Automática DANFE',
              inv.dataSaida ? parseDateSafely(inv.dataSaida) : new Date()
            ]
          );

          // Atualizar total de saídas no produto
          await p.query(
            'UPDATE stock_items SET total_saidas = total_saidas + ?, estoque_atual = GREATEST(0, total_entradas - total_saidas) WHERE id = ?',
            [qtd, prod.id]
          );

          deductedCount += qtd;
        } catch (e) {
          console.warn('[Stock Deduction Warning]:', (e as any).message);
        }
      }
      return deductedCount;
    }
  } catch (_) {}

  // Fallback JSON local
  try {
    const stockItems = readJsonFile<StockItem[]>('stock_items.json', FALLBACK_DEFAULT_STOCK);
    const stockMovements = readJsonFile<StockMovement[]>('stock_movements.json', []);

    for (const inv of invoices) {
      const resolved = resolveSkuFromInvoice(inv);
      const qtd = Math.max(1, Math.round(parseNumber(inv.quantidade) || 1));
      const valNota = parseNumber(inv.valorNota);
      const valUnitario = valNota > 0 ? Number((valNota / qtd).toFixed(2)) : 29.99;

      const prod = stockItems.find(i => i.id === resolved.productId || i.sku === resolved.sku);
      if (prod) {
        const saldoAnterior = prod.estoqueAtual;
        prod.totalSaidas += qtd;
        prod.estoqueAtual = Math.max(0, prod.totalEntradas - prod.totalSaidas);
        const saldoPosterior = prod.estoqueAtual;

        const movId = 'mov-venda-' + (inv.id || Date.now() + '-' + Math.floor(Math.random() * 1000));
        if (!stockMovements.some(m => m.id === movId)) {
          stockMovements.unshift({
            id: movId,
            productId: prod.id,
            sku: prod.sku,
            tipo: 'SAIDA_VENDA',
            quantidade: qtd,
            saldoAnterior,
            saldoPosterior,
            documentoRef: inv.fatura ? `NF ${inv.fatura}` : `Pedido #${inv.id}`,
            origemCanal: inv.origem || 'Outros',
            motivo: `Venda NF ${inv.fatura || ''} para ${inv.nome || 'Consumidor'} (${inv.municipio || ''}/${inv.uf || ''})`,
            valorUnitario: valUnitario,
            valorTotal: valNota,
            usuarioId: user?.id || 'sistema',
            usuarioNome: user?.name || 'Emissão Automática DANFE',
            dataMovimentacao: new Date().toISOString()
          });
        }
        deductedCount += qtd;
      }
    }

    writeJsonFile('stock_items.json', stockItems);
    writeJsonFile('stock_movements.json', stockMovements.slice(0, 500));
  } catch (err: any) {
    console.warn('[Stock Local Deduction Warning]:', err.message);
  }

  return deductedCount;
}

/**
 * Restaura o estoque em caso de exclusão de notas fiscais (Estorno)
 */
export async function restoreStockForDeletedInvoices(
  invoices: Invoice[],
  user?: { id: string; name: string }
): Promise<void> {
  if (!invoices || invoices.length === 0) return;
  try {
    const p = await getDbPool();
    if (p) {
      for (const inv of invoices) {
        try {
          const resolved = resolveSkuFromInvoice(inv);
          const qtd = Math.max(1, Math.round(parseNumber(inv.quantidade) || 1));
          const movId = 'mov-venda-' + inv.id;
          await p.query('DELETE FROM stock_movements WHERE id = ?', [movId]);
          await p.query(
            'UPDATE stock_items SET total_saidas = GREATEST(0, total_saidas - ?), estoque_atual = total_entradas - total_saidas WHERE id = ?',
            [qtd, resolved.productId]
          );
        } catch (e) {}
      }
      return;
    }
  } catch (_) {}

  // Fallback JSON local
  try {
    const stockItems = readJsonFile<StockItem[]>('stock_items.json', FALLBACK_DEFAULT_STOCK);
    let stockMovements = readJsonFile<StockMovement[]>('stock_movements.json', []);

    for (const inv of invoices) {
      const resolved = resolveSkuFromInvoice(inv);
      const qtd = Math.max(1, Math.round(parseNumber(inv.quantidade) || 1));
      const movId = 'mov-venda-' + inv.id;

      stockMovements = stockMovements.filter(m => m.id !== movId);
      const prod = stockItems.find(i => i.id === resolved.productId || i.sku === resolved.sku);
      if (prod) {
        prod.totalSaidas = Math.max(0, prod.totalSaidas - qtd);
        prod.estoqueAtual = Math.max(0, prod.totalEntradas - prod.totalSaidas);
      }
    }

    writeJsonFile('stock_items.json', stockItems);
    writeJsonFile('stock_movements.json', stockMovements);
  } catch (_) {}
}

/**
 * Recalcula todo o estoque histórico a partir de todas as notas fiscais
 */
export async function recalculateAllStockFromInvoices(): Promise<{
  totalNotasProcessadas: number;
  totalUnidadesBaixadas: number;
  porSku: Record<string, number>;
}> {
  try {
    const p = await getDbPool();
    if (p) {
      await p.query("DELETE FROM stock_movements WHERE tipo = 'SAIDA_VENDA'");
      await p.query('UPDATE stock_items SET total_saidas = 0, estoque_atual = total_entradas');
      const [invoices]: any = await p.query('SELECT * FROM invoices ORDER BY created_at ASC');
      
      const porSku: Record<string, number> = {};
      let totalUnidadesBaixadas = 0;

      for (const r of invoices) {
        const inv: Invoice = {
          id: r.id,
          nome: r.nome,
          documento: r.documento,
          dataSaida: r.data_saida,
          endereco: r.endereco,
          bairro: r.bairro,
          cep: r.cep,
          municipio: r.municipio,
          uf: r.uf,
          fatura: r.fatura,
          valorProdutos: r.valor_produtos,
          valorNota: r.valor_nota,
          desconto: r.desconto,
          codigo: r.codigo,
          quantidade: r.quantidade,
          descricao: r.descricao,
          cor: r.cor,
          origem: r.origem
        };

        const resolved = resolveSkuFromInvoice(inv);
        const qtd = Math.max(1, Math.round(parseNumber(inv.quantidade) || 1));
        const valNota = parseNumber(inv.valorNota);
        const valUnitario = valNota > 0 ? Number((valNota / qtd).toFixed(2)) : 29.99;

        porSku[resolved.sku] = (porSku[resolved.sku] || 0) + qtd;
        totalUnidadesBaixadas += qtd;

        const movId = 'mov-venda-' + (inv.id || Math.random().toString());
        await p.query(
          `INSERT IGNORE INTO stock_movements 
          (id, product_id, sku, tipo, quantidade, saldo_anterior, saldo_posterior, documento_ref, origem_canal, motivo, valor_unitario, valor_total, usuario_id, usuario_nome, data_movimentacao) 
          VALUES (?, ?, ?, 'SAIDA_VENDA', ?, 0, 0, ?, ?, ?, ?, ?, 'sistema', 'Auditoria Histórica SPM', ?)`,
          [
            movId,
            resolved.productId,
            resolved.sku,
            qtd,
            inv.fatura ? `NF ${inv.fatura}` : `Doc #${inv.id}`,
            inv.origem || 'Outros',
            `Venda NF ${inv.fatura || ''} (${inv.nome || 'Consumidor'})`,
            valUnitario,
            valNota,
            inv.dataSaida ? parseDateSafely(inv.dataSaida) : new Date()
          ]
        );

        await p.query(
          'UPDATE stock_items SET total_saidas = total_saidas + ?, estoque_atual = GREATEST(0, total_entradas - total_saidas) WHERE id = ?',
          [qtd, resolved.productId]
        );
      }

      await syncDatabaseToSqlFile();

      return {
        totalNotasProcessadas: invoices.length,
        totalUnidadesBaixadas,
        porSku
      };
    }
  } catch (_) {}

  // Fallback JSON local
  const stockItems = readJsonFile<StockItem[]>('stock_items.json', FALLBACK_DEFAULT_STOCK);
  stockItems.forEach(i => {
    i.totalSaidas = 0;
    i.estoqueAtual = i.totalEntradas;
  });

  const invoices = readJsonFile<Invoice[]>('invoices.json', []);
  const porSku: Record<string, number> = {};
  let totalUnidadesBaixadas = 0;
  const newMovements: StockMovement[] = [];

  for (const inv of invoices) {
    const resolved = resolveSkuFromInvoice(inv);
    const qtd = Math.max(1, Math.round(parseNumber(inv.quantidade) || 1));
    const valNota = parseNumber(inv.valorNota);
    const valUnitario = valNota > 0 ? Number((valNota / qtd).toFixed(2)) : 29.99;

    porSku[resolved.sku] = (porSku[resolved.sku] || 0) + qtd;
    totalUnidadesBaixadas += qtd;

    const prod = stockItems.find(i => i.id === resolved.productId || i.sku === resolved.sku);
    if (prod) {
      const saldoAnterior = prod.estoqueAtual;
      prod.totalSaidas += qtd;
      prod.estoqueAtual = Math.max(0, prod.totalEntradas - prod.totalSaidas);
      const saldoPosterior = prod.estoqueAtual;

      const movId = 'mov-venda-' + (inv.id || Math.random().toString());
      newMovements.push({
        id: movId,
        productId: prod.id,
        sku: prod.sku,
        tipo: 'SAIDA_VENDA',
        quantidade: qtd,
        saldoAnterior,
        saldoPosterior,
        documentoRef: inv.fatura ? `NF ${inv.fatura}` : `Doc #${inv.id}`,
        origemCanal: inv.origem || 'Outros',
        motivo: `Venda NF ${inv.fatura || ''} (${inv.nome || 'Consumidor'})`,
        valorUnitario: valUnitario,
        valorTotal: valNota,
        usuarioId: 'sistema',
        usuarioNome: 'Auditoria Histórica SPM',
        dataMovimentacao: new Date().toISOString()
      });
    }
  }

  writeJsonFile('stock_items.json', stockItems);
  writeJsonFile('stock_movements.json', newMovements.slice(0, 500));
  await syncDatabaseToSqlFile();

  return {
    totalNotasProcessadas: invoices.length,
    totalUnidadesBaixadas,
    porSku
  };
}

export async function calculateStockStatsFromDb(): Promise<StockStats> {
  const items = await getStockItemsFromDb();
  const movements = await getStockMovementsFromDb({ limit: 50 });

  let totalUnidadesEstoque = 0;
  let valorPatrimonialCusto = 0;
  let valorPotencialVenda = 0;
  const statusCount = { normal: 0, baixo: 0, critico: 0, zerado: 0 };
  const distribuicaoCores: Record<string, number> = {};

  items.forEach(it => {
    totalUnidadesEstoque += it.estoqueAtual;
    valorPatrimonialCusto += it.valorTotalEstoqueCusto;
    valorPotencialVenda += it.valorTotalEstoqueVenda;

    if (it.status === 'NORMAL') statusCount.normal++;
    else if (it.status === 'BAIXO') statusCount.baixo++;
    else if (it.status === 'CRITICO') statusCount.critico++;
    else if (it.status === 'ZERADO') statusCount.zerado++;

    distribuicaoCores[it.cor] = (distribuicaoCores[it.cor] || 0) + it.estoqueAtual;
  });

  const margemLucroBrutaEstimada = valorPotencialVenda > 0
    ? Number((((valorPotencialVenda - valorPatrimonialCusto) / valorPotencialVenda) * 100).toFixed(1))
    : 0;

  // MovimentaÃƒÂ§ÃƒÂµes nos ÃƒÂºltimos 30 dias
  const p = await getDbPool();
  const [recentMovements]: any = await p.query(`
    SELECT tipo, SUM(quantidade) as total_qtd, SUM(valor_total) as total_val 
    FROM stock_movements 
    WHERE data_movimentacao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY tipo
  `);

  let totalSaidas30Dias = 0;
  let totalEntradas30Dias = 0;
  recentMovements.forEach((r: any) => {
    if (r.tipo === 'SAIDA_VENDA' || r.tipo === 'AJUSTE_NEGATIVO' || r.tipo === 'PERDA_AVARIA') {
      totalSaidas30Dias += Number(r.total_qtd) || 0;
    } else {
      totalEntradas30Dias += Number(r.total_qtd) || 0;
    }
  });

  const giroDiarioMedio = Number((totalSaidas30Dias / 30).toFixed(1));
  const diasCoberturaGeral = giroDiarioMedio > 0 ? Math.round(totalUnidadesEstoque / giroDiarioMedio) : 999;

  // Consumo por canal
  const [canalRows]: any = await p.query(`
    SELECT COALESCE(origem_canal, 'Outros') as canal, SUM(quantidade) as qtd 
    FROM stock_movements 
    WHERE tipo = 'SAIDA_VENDA'
    GROUP BY canal
  `);
  const consumoPorCanal: Record<string, number> = {};
  canalRows.forEach((c: any) => {
    consumoPorCanal[c.canal] = Number(c.qtd) || 0;
  });

  // EvoluÃƒÂ§ÃƒÂ£o de saÃƒÂ­das por dia (ÃƒÂºltimos 15 registros de saÃƒÂ­da)
  const [timelineRows]: any = await p.query(`
    SELECT DATE_FORMAT(data_movimentacao, '%d/%m') as dia, SUM(quantidade) as qtd, SUM(valor_total) as val 
    FROM stock_movements 
    WHERE tipo = 'SAIDA_VENDA'
    GROUP BY dia 
    ORDER BY MIN(data_movimentacao) DESC 
    LIMIT 15
  `);
  const evolucaoSaidas = (timelineRows || []).reverse().map((t: any) => ({
    data: t.dia,
    quantidade: Number(t.qtd) || 0,
    valor: Number(t.val) || 0
  }));

  // Top Vendidos
  const topVendidos = items.map(it => {
    const participacao = totalSaidas30Dias > 0 
      ? Number(((it.totalSaidas / Math.max(1, totalSaidas30Dias)) * 100).toFixed(1))
      : 0;
    return {
      sku: it.sku,
      nome: it.nome,
      cor: it.cor,
      totalVendido: it.totalSaidas,
      faturamento: Number((it.totalSaidas * it.precoVenda).toFixed(2)),
      participacaoPercent: Math.min(100, participacao)
    };
  }).sort((a, b) => b.totalVendido - a.totalVendido);

  return {
    totalItensCadastrados: items.length,
    totalUnidadesEstoque,
    valorPatrimonialCusto,
    valorPotencialVenda,
    margemLucroBrutaEstimada,
    totalSaidas30Dias,
    totalEntradas30Dias,
    giroDiarioMedio,
    diasCoberturaGeral,
    itensStatus: statusCount,
    topVendidos,
    distribuicaoCores,
    movimentacoesRecentes: movements,
    consumoPorCanal,
    evolucaoSaidas
  };
}

function parseDateSafely(val: string): Date {
  if (!val) return new Date();
  // Formato dd/mm/yyyy
  if (val.includes('/')) {
    const parts = val.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const res = new Date(y, m, d);
      if (!isNaN(res.getTime())) return res;
    }
  }
  const direct = new Date(val);
  return isNaN(direct.getTime()) ? new Date() : direct;
}
