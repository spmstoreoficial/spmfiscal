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
  N8nConfig
} from '../types';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'spm_fiscal';

let pool: mysql.Pool | null = null;
let isConnected = false;

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

export async function getDbPool(): Promise<mysql.Pool> {
  if (pool && isConnected) {
    return pool;
  }

  try {
    // 1. Criar conexão inicial sem especificar o banco de dados para poder criar se não existir
    const initConnection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
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
      keepAliveInitialDelay: 0
    });

    // Testar conexão
    const testConn = await pool.getConnection();
    testConn.release();
    isConnected = true;
    console.log(`[MySQL] Conectado com sucesso ao banco '${DB_NAME}' em ${DB_HOST}:${DB_PORT}`);

    // 3. Garantir a criação das tabelas e migração de dados iniciais
    await initSchemaAndMigrate();

    return pool;
  } catch (error: any) {
    console.error(`[MySQL] Erro ao conectar ao MySQL (${DB_HOST}:${DB_PORT}):`, error.message);
    throw error;
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
      cor VARCHAR(64) NOT NULL DEFAULT 'Não identificada',
      origem VARCHAR(64) NOT NULL DEFAULT 'Outros',
      origem_arquivo VARCHAR(255) NULL,
      data_upload VARCHAR(64) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'Processado',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_documento (documento),
      INDEX idx_origem (origem),
      INDEX idx_cor (cor),
      INDEX idx_uf (uf),
      INDEX idx_municipio (municipio)
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

  // Migração inicial dos arquivos JSON se o banco estiver vazio
  await migrateInitialDataIfEmpty();
}

async function migrateInitialDataIfEmpty() {
  if (!pool) return;
  const dataDir = path.join(process.cwd(), 'data');

  // 1. Migrar Usuários
  const [usersCountRows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
  if (usersCountRows[0].count === 0) {
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

  // 2. Migrar Notas Fiscais
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
              inv.cor || 'Não identificada',
              inv.origem || 'Outros',
              inv.origemArquivo || null,
              inv.dataUpload || null,
              inv.status || 'Processado'
            ]
          );
        }
        console.log(`[MySQL Migration] ${invoices.length} notas fiscais migradas do JSON para o MySQL.`);
      } catch (e) {
        console.error('[MySQL Migration] Erro ao migrar notas fiscais:', e);
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

  // 5. Migrar Configurações Gerais
  const settingsFile = path.join(dataDir, 'settings.json');
  if (fs.existsSync(settingsFile)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      await pool.query(
        'INSERT IGNORE INTO system_settings (id, data_json) VALUES (?, ?)',
        ['main', JSON.stringify(settings)]
      );
    } catch (e) {}
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
    } catch (e) {}
  }

  const gsheetsFile = path.join(dataDir, 'gsheets.json');
  if (fs.existsSync(gsheetsFile)) {
    try {
      const gs = JSON.parse(fs.readFileSync(gsheetsFile, 'utf-8'));
      await pool.query(
        'INSERT IGNORE INTO integrations_config (type, data_json) VALUES (?, ?)',
        ['gsheets', JSON.stringify(gs)]
      );
    } catch (e) {}
  }

  // Sincronizar o arquivo SQL inicial
  await syncDatabaseToSqlFile();
}

// ================= SQL FILE SYNCHRONIZER =================

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  return `'${str}'`;
}

/**
 * Sincroniza o arquivo database_spm_fiscal.sql com o conteúdo atual do banco MySQL
 */
export async function syncDatabaseToSqlFile(): Promise<void> {
  try {
    const p = await getDbPool();
    const [users]: any = await p.query('SELECT * FROM users ORDER BY created_at ASC');
    const [passwords]: any = await p.query('SELECT * FROM user_passwords');
    const [invoices]: any = await p.query('SELECT * FROM invoices ORDER BY created_at DESC');
    const [logs]: any = await p.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
    const [alerts]: any = await p.query('SELECT * FROM alert_rules ORDER BY name ASC');
    const [settings]: any = await p.query('SELECT * FROM system_settings');
    const [integrations]: any = await p.query('SELECT * FROM integrations_config');

    let sql = `-- ==========================================================\n`;
    sql += `-- SPM STORE - SISTEMA FISCAL & AUDITORIA DE NOTAS FISCAIS\n`;
    sql += `-- Sincronizado automaticamente em: ${new Date().toLocaleString('pt-BR')}\n`;
    sql += `-- Total de Registros Fiscais: ${invoices.length}\n`;
    sql += `-- ==========================================================\n\n`;
    sql += `CREATE DATABASE IF NOT EXISTS \`spm_fiscal\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sql += `USE \`spm_fiscal\`;\n\n`;

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
    sql += `  \`cor\` VARCHAR(64) NOT NULL DEFAULT 'Não identificada',\n`;
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
      sql += `-- Inserções em users\n`;
      sql += `INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`role\`, \`active\`, \`last_login\`, \`avatar\`, \`department\`) VALUES\n`;
      sql += users.map((u: any) => `(${escapeSql(u.id)}, ${escapeSql(u.name)}, ${escapeSql(u.email)}, ${escapeSql(u.role)}, ${u.active ? 1 : 0}, ${escapeSql(u.last_login)}, ${escapeSql(u.avatar)}, ${escapeSql(u.department)})`).join(',\n') + `;\n\n`;
    }

    if (passwords.length > 0) {
      sql += `-- Inserções em user_passwords\n`;
      sql += `INSERT INTO \`user_passwords\` (\`email\`, \`password_hash\`) VALUES\n`;
      sql += passwords.map((p: any) => `(${escapeSql(p.email)}, ${escapeSql(p.password_hash)})`).join(',\n') + `\nON DUPLICATE KEY UPDATE \`password_hash\` = VALUES(\`password_hash\`);\n\n`;
    }

    if (invoices.length > 0) {
      sql += `-- Inserções em invoices (${invoices.length} notas sincronizadas)\n`;
      sql += `INSERT INTO \`invoices\` (\`id\`, \`nome\`, \`documento\`, \`data_saida\`, \`endereco\`, \`bairro\`, \`cep\`, \`municipio\`, \`uf\`, \`fatura\`, \`valor_produtos\`, \`valor_nota\`, \`desconto\`, \`codigo\`, \`quantidade\`, \`descricao\`, \`cor\`, \`origem\`, \`origem_arquivo\`, \`data_upload\`, \`status\`) VALUES\n`;
      sql += invoices.map((i: any) => `(${escapeSql(i.id)}, ${escapeSql(i.nome)}, ${escapeSql(i.documento)}, ${escapeSql(i.data_saida)}, ${escapeSql(i.endereco)}, ${escapeSql(i.bairro)}, ${escapeSql(i.cep)}, ${escapeSql(i.municipio)}, ${escapeSql(i.uf)}, ${escapeSql(i.fatura)}, ${escapeSql(i.valor_produtos)}, ${escapeSql(i.valor_nota)}, ${escapeSql(i.desconto)}, ${escapeSql(i.codigo)}, ${escapeSql(i.quantidade)}, ${escapeSql(i.descricao)}, ${escapeSql(i.cor)}, ${escapeSql(i.origem)}, ${escapeSql(i.origem_arquivo)}, ${escapeSql(i.data_upload)}, ${escapeSql(i.status)})`).join(',\n') + `;\n\n`;
    }

    if (logs.length > 0) {
      sql += `-- Inserções em audit_logs\n`;
      sql += `INSERT INTO \`audit_logs\` (\`id\`, \`timestamp\`, \`user_id\`, \`user_name\`, \`action\`, \`category\`, \`details\`, \`ip\`, \`severity\`) VALUES\n`;
      sql += logs.map((l: any) => `(${escapeSql(l.id)}, ${escapeSql(l.timestamp)}, ${escapeSql(l.user_id)}, ${escapeSql(l.user_name)}, ${escapeSql(l.action)}, ${escapeSql(l.category)}, ${escapeSql(l.details)}, ${escapeSql(l.ip)}, ${escapeSql(l.severity)})`).join(',\n') + `;\n\n`;
    }

    if (alerts.length > 0) {
      sql += `-- Inserções em alert_rules\n`;
      sql += `INSERT INTO \`alert_rules\` (\`id\`, \`name\`, \`type\`, \`threshold\`, \`email_notify\`, \`push_notify\`, \`active\`, \`last_triggered\`) VALUES\n`;
      sql += alerts.map((a: any) => `(${escapeSql(a.id)}, ${escapeSql(a.name)}, ${escapeSql(a.type)}, ${a.threshold || 'NULL'}, ${a.email_notify ? 1 : 0}, ${a.push_notify ? 1 : 0}, ${a.active ? 1 : 0}, ${escapeSql(a.last_triggered)})`).join(',\n') + `;\n\n`;
    }

    if (settings.length > 0) {
      sql += `INSERT INTO \`system_settings\` (\`id\`, \`data_json\`) VALUES\n`;
      sql += settings.map((s: any) => `(${escapeSql(s.id)}, ${escapeSql(typeof s.data_json === 'string' ? s.data_json : JSON.stringify(s.data_json))})`).join(',\n') + `;\n\n`;
    }

    if (integrations.length > 0) {
      sql += `INSERT INTO \`integrations_config\` (\`type\`, \`data_json\`) VALUES\n`;
      sql += integrations.map((g: any) => `(${escapeSql(g.type)}, ${escapeSql(typeof g.data_json === 'string' ? g.data_json : JSON.stringify(g.data_json))})`).join(',\n') + `;\n\n`;
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
        motivo: `Nota já registrada no banco (Fatura: ${item.fatura}, Doc: ${item.documento}, SKU: ${item.codigo})`
      });
    } else {
      // Verificar também se há duplicação dentro do próprio lote novo
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
          motivo: `Item duplicado dentro do próprio lote (Fatura: ${item.fatura}, SKU: ${item.codigo})`
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

  const [rows]: any = await p.query(query, params);
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

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const p = await getDbPool();
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
    cor: r.cor || 'Não identificada',
    origem: r.origem || 'Outros',
    origemArquivo: r.origem_arquivo || undefined,
    dataUpload: r.data_upload || undefined,
    status: r.status as any
  };
}

export async function saveInvoiceToDb(inv: Invoice): Promise<void> {
  const p = await getDbPool();
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
      inv.cor || 'Não identificada',
      inv.origem || 'Outros',
      inv.origemArquivo || null,
      inv.dataUpload || null,
      inv.status || 'Processado'
    ]
  );
}

export async function deleteInvoiceFromDb(id: string): Promise<boolean> {
  const p = await getDbPool();
  const [result]: any = await p.query('DELETE FROM invoices WHERE id = ?', [id]);
  await syncDatabaseToSqlFile();
  return result.affectedRows > 0;
}

export async function bulkDeleteInvoicesFromDb(ids: string[]): Promise<number> {
  if (!ids || ids.length === 0) return 0;
  const p = await getDbPool();
  const [result]: any = await p.query('DELETE FROM invoices WHERE id IN (?)', [ids]);
  await syncDatabaseToSqlFile();
  return result.affectedRows;
}

export async function resetInvoicesInDb(): Promise<void> {
  const p = await getDbPool();
  await p.query('TRUNCATE TABLE invoices');
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
    const cor = inv.cor || 'Não identificada';
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
    const clienteNome = inv.nome || 'Consumidor Não Identificado';
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
  const [rows]: any = await p.query('SELECT * FROM users ORDER BY created_at ASC');
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

export async function getUserByIdFromDb(id: string): Promise<User | null> {
  const p = await getDbPool();
  const [rows]: any = await p.query('SELECT * FROM users WHERE id = ?', [id]);
  if (!rows || rows.length === 0) return null;
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

export async function getUserByEmailFromDb(email: string): Promise<User | null> {
  const p = await getDbPool();
  const [rows]: any = await p.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  if (!rows || rows.length === 0) return null;
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

export async function getUserPasswordHash(email: string): Promise<string | null> {
  const p = await getDbPool();
  const [rows]: any = await p.query('SELECT password_hash FROM user_passwords WHERE LOWER(email) = LOWER(?)', [email]);
  if (!rows || rows.length === 0) return null;
  return rows[0].password_hash;
}

export async function saveUserToDb(user: User, passwordHash?: string): Promise<void> {
  const p = await getDbPool();
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

  await syncDatabaseToSqlFile();
}

export async function deleteUserFromDb(id: string): Promise<boolean> {
  const user = await getUserByIdFromDb(id);
  if (!user) return false;
  const p = await getDbPool();
  await p.query('DELETE FROM user_passwords WHERE LOWER(email) = LOWER(?)', [user.email]);
  const [result]: any = await p.query('DELETE FROM users WHERE id = ?', [id]);
  await syncDatabaseToSqlFile();
  return result.affectedRows > 0;
}

export async function updateLastLoginInDb(userId: string): Promise<void> {
  const p = await getDbPool();
  await p.query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
}

// --- Audit Logs ---
export async function getLogsFromDb(): Promise<LogEntry[]> {
  const p = await getDbPool();
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

export async function addLogToDb(log: LogEntry): Promise<void> {
  const p = await getDbPool();
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

export async function clearLogsInDb(): Promise<void> {
  const p = await getDbPool();
  await p.query('TRUNCATE TABLE audit_logs');
  await syncDatabaseToSqlFile();
}

// --- Alerts ---
export async function getAlertsFromDb(): Promise<AlertRule[]> {
  const p = await getDbPool();
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

export async function saveAlertToDb(rule: AlertRule): Promise<void> {
  const p = await getDbPool();
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
  await syncDatabaseToSqlFile();
}

export async function deleteAlertFromDb(id: string): Promise<boolean> {
  const p = await getDbPool();
  const [res]: any = await p.query('DELETE FROM alert_rules WHERE id = ?', [id]);
  await syncDatabaseToSqlFile();
  return res.affectedRows > 0;
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
  const [rows]: any = await p.query('SELECT data_json FROM system_settings WHERE id = ?', ['main']);
  if (!rows || rows.length === 0) {
    await saveSettingsToDb(defaultSettings);
    return defaultSettings;
  }
  const val = typeof rows[0].data_json === 'string' ? JSON.parse(rows[0].data_json) : rows[0].data_json;
  return { ...defaultSettings, ...val };
}

export async function saveSettingsToDb(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await getSettingsFromDb();
  const updated = { ...current, ...settings };
  const p = await getDbPool();
  await p.query(
    'INSERT INTO system_settings (id, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)',
    ['main', JSON.stringify(updated)]
  );
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
  const [rows]: any = await p.query('SELECT data_json FROM integrations_config WHERE type = ?', ['powerbi']);
  if (!rows || rows.length === 0) {
    await savePowerBiConfigToDb(defaultPbi);
    return defaultPbi;
  }
  const val = typeof rows[0].data_json === 'string' ? JSON.parse(rows[0].data_json) : rows[0].data_json;
  return { ...defaultPbi, ...val };
}

export async function savePowerBiConfigToDb(cfg: Partial<PowerBiConfig>): Promise<PowerBiConfig> {
  const current = await getPowerBiConfigFromDb();
  const updated = { ...current, ...cfg };
  const p = await getDbPool();
  await p.query(
    'INSERT INTO integrations_config (type, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)',
    ['powerbi', JSON.stringify(updated)]
  );
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
  const [rows]: any = await p.query('SELECT data_json FROM integrations_config WHERE type = ?', ['gsheets']);
  if (!rows || rows.length === 0) {
    await saveGSheetsConfigToDb(defaultGs);
    return defaultGs;
  }
  const val = typeof rows[0].data_json === 'string' ? JSON.parse(rows[0].data_json) : rows[0].data_json;
  return { ...defaultGs, ...val };
}

export async function saveGSheetsConfigToDb(cfg: Partial<GSheetsConfig>): Promise<GSheetsConfig> {
  const current = await getGSheetsConfigFromDb();
  const updated = { ...current, ...cfg };
  const p = await getDbPool();
  await p.query(
    'INSERT INTO integrations_config (type, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)',
    ['gsheets', JSON.stringify(updated)]
  );
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
  const [rows]: any = await p.query('SELECT data_json FROM integrations_config WHERE type = ?', ['n8n']);
  if (!rows || rows.length === 0) {
    await saveN8nConfigToDb(defaultN8n);
    return defaultN8n;
  }
  const val = typeof rows[0].data_json === 'string' ? JSON.parse(rows[0].data_json) : rows[0].data_json;
  return { ...defaultN8n, ...val };
}

export async function saveN8nConfigToDb(cfg: Partial<N8nConfig>): Promise<N8nConfig> {
  const current = await getN8nConfigFromDb();
  const updated = { ...current, ...cfg };
  const p = await getDbPool();
  await p.query(
    'INSERT INTO integrations_config (type, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)',
    ['n8n', JSON.stringify(updated)]
  );
  await syncDatabaseToSqlFile();
  return updated;
}
