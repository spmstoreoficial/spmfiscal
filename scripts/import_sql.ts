import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'spm_fiscal';

async function importSql() {
  console.log(`[phpMyAdmin / MySQL] Conectando a ${DB_HOST}:${DB_PORT} com usuário '${DB_USER}'...`);
  
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true
    });

    const sqlPath = path.join(process.cwd(), 'database_spm_fiscal.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Arquivo SQL não encontrado em: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    console.log('[phpMyAdmin / MySQL] Executando script database_spm_fiscal.sql...');
    
    await connection.query(sqlContent);
    await connection.end();

    console.log(`\n=============================================================`);
    console.log(`✅ SUCESSO: Banco '${DB_NAME}' criado e populado no MySQL!`);
    console.log(`👉 Você pode conferir agora no phpMyAdmin: http://localhost/phpmyadmin`);
    console.log(`=============================================================\n`);
  } catch (err: any) {
    console.error(`\n❌ [Erro de Conexão MySQL]: ${err.message}`);
    console.log(`💡 Dica: Certifique-se de que o módulo 'MySQL' está ativo (Start) no XAMPP Control Panel.\n`);
  }
}

importSql();
