import fs from 'fs';
import path from 'path';
import { extractSpmInvoicesFromNfeXml } from '../src/lib/xmlParser';
import { Invoice } from '../src/types';

async function reprocessAll() {
  const folder = path.join(process.cwd(), 'Notas_Fiscais');
  if (!fs.existsSync(folder)) {
    console.error('Pasta Notas_Fiscais não existe:', folder);
    process.exit(1);
  }

  const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith('.xml'));
  console.log(`[Extrator SPM] Encontrados ${files.length} arquivos XML na pasta Notas_Fiscais...`);

  const startTime = Date.now();
  const allInvoices: Invoice[] = [];
  const seenKeys = new Set<string>();

  const statsByMarketplace: Record<string, number> = {};
  const statsByColor: Record<string, number> = {};
  const statsByUf: Record<string, number> = {};
  let totalRevenue = 0;

  const parseNum = (val: string | number | undefined): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const clean = val.replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  let processedCount = 0;

  for (const file of files) {
    try {
      const filePath = path.join(folder, file);
      const xmlContent = fs.readFileSync(filePath, 'utf-8');
      const items = extractSpmInvoicesFromNfeXml(xmlContent, file);

      for (const item of items) {
        // Unique key: chave de acesso + item number or fatura + codigo
        const uniqueKey = item.chaveAcesso 
          ? `${item.chaveAcesso}-${item.xmlDetails?.itemNumero || item.codigo || '1'}`
          : `${item.fatura}-${item.documento}-${item.codigo}`;

        if (seenKeys.has(uniqueKey)) {
          continue;
        }
        seenKeys.add(uniqueKey);

        allInvoices.push(item);

        // Stats
        const orig = item.origem || 'Outros';
        statsByMarketplace[orig] = (statsByMarketplace[orig] || 0) + 1;

        const cor = item.cor || 'Não identificada';
        statsByColor[cor] = (statsByColor[cor] || 0) + 1;

        const uf = item.uf || 'SP';
        statsByUf[uf] = (statsByUf[uf] || 0) + 1;

        totalRevenue += parseNum(item.valorNota);
      }

      processedCount++;
      if (processedCount % 500 === 0 || processedCount === files.length) {
        console.log(`[Progresso] Processados ${processedCount}/${files.length} XMLs...`);
      }
    } catch (err: any) {
      console.warn(`Erro no arquivo ${file}:`, err.message);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n=============================================================`);
  console.log(`✅ EXTRAÇÃO TOTAL CONCLUÍDA EM ${durationSec}s!`);
  console.log(`📄 Arquivos XML Processados: ${processedCount}`);
  console.log(`📦 Registros de Venda / NFs Extraídos: ${allInvoices.length}`);
  console.log(`💰 Faturamento Total Calculado: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`-------------------------------------------------------------`);
  console.log(`📊 Distribuição por Canal de Venda (Marketplace):`);
  Object.entries(statsByMarketplace)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ch, count]) => {
      console.log(`   - ${ch}: ${count} notas (${((count / allInvoices.length) * 100).toFixed(1)}%)`);
    });
  console.log(`-------------------------------------------------------------`);
  console.log(`🎨 Distribuição por Cor do Produto:`);
  Object.entries(statsByColor)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cor, count]) => {
      console.log(`   - ${cor}: ${count} notas (${((count / allInvoices.length) * 100).toFixed(1)}%)`);
    });
  console.log(`-------------------------------------------------------------`);
  console.log(`🗺️ Top 5 Estados (UFs):`);
  Object.entries(statsByUf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([uf, count]) => {
      console.log(`   - ${uf}: ${count} notas`);
    });
  console.log(`=============================================================\n`);

  // Salvar em data/invoices.json
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const invoicesJsonPath = path.join(dataDir, 'invoices.json');
  fs.writeFileSync(invoicesJsonPath, JSON.stringify(allInvoices, null, 2), 'utf-8');
  console.log(`💾 Salvo com sucesso em: ${invoicesJsonPath}`);

  // Atualizar database_spm_fiscal.sql com todos os registros
  try {
    const sqlPath = path.join(process.cwd(), 'database_spm_fiscal.sql');
    console.log(`🔄 Gerando ${sqlPath} com ${allInvoices.length} notas fiscais...`);

    const escapeSql = (val: any): string => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? '1' : '0';
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
    };

    let sql = `-- ==========================================================\n`;
    sql += `-- SPM STORE - SISTEMA FISCAL & AUDITORIA DE NOTAS FISCAIS\n`;
    sql += `-- Sincronizado automaticamente em: ${new Date().toLocaleString('pt-BR')}\n`;
    sql += `-- Total de Registros Fiscais: ${allInvoices.length}\n`;
    sql += `-- ==========================================================\n\n`;
    sql += `CREATE DATABASE IF NOT EXISTS \`spm_fiscal\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sql += `USE \`spm_fiscal\`;\n\n`;

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
    sql += `  \`cor\` VARCHAR(64) NOT NULL DEFAULT 'Preto',\n`;
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

    // Inserir usuários padrão
    sql += `INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`role\`, \`active\`, \`department\`) VALUES\n`;
    sql += `('usr-1', 'Administrador SPM', 'admin@spm.com.br', 'ADMIN', 1, 'Diretoria'),\n`;
    sql += `('usr-2', 'Auditor Fiscal', 'auditor@spm.com.br', 'AUDITOR', 1, 'Auditoria');\n\n`;

    // Inserir todas as faturas em lotes de 100
    const chunkSize = 100;
    for (let i = 0; i < allInvoices.length; i += chunkSize) {
      const chunk = allInvoices.slice(i, i + chunkSize);
      sql += `INSERT INTO \`invoices\` (\`id\`, \`nome\`, \`documento\`, \`data_saida\`, \`endereco\`, \`bairro\`, \`cep\`, \`municipio\`, \`uf\`, \`fatura\`, \`valor_produtos\`, \`valor_nota\`, \`desconto\`, \`codigo\`, \`quantidade\`, \`descricao\`, \`cor\`, \`origem\`, \`origem_arquivo\`, \`data_upload\`, \`status\`) VALUES\n`;
      const valuesLines = chunk.map(inv => {
        return `(${escapeSql(inv.id)}, ${escapeSql(inv.nome)}, ${escapeSql(inv.documento)}, ${escapeSql(inv.dataSaida)}, ${escapeSql(inv.endereco)}, ${escapeSql(inv.bairro)}, ${escapeSql(inv.cep)}, ${escapeSql(inv.municipio)}, ${escapeSql(inv.uf)}, ${escapeSql(inv.fatura)}, ${escapeSql(inv.valorProdutos)}, ${escapeSql(inv.valorNota)}, ${escapeSql(inv.desconto)}, ${escapeSql(inv.codigo)}, ${escapeSql(inv.quantidade)}, ${escapeSql(inv.descricao)}, ${escapeSql(inv.cor)}, ${escapeSql(inv.origem)}, ${escapeSql(inv.origemArquivo)}, ${escapeSql(inv.dataUpload)}, ${escapeSql(inv.status)})`;
      });
      sql += valuesLines.join(',\n') + ';\n\n';
    }

    fs.writeFileSync(sqlPath, sql, 'utf-8');
    console.log(`✅ ${sqlPath} gerado com sucesso! Tamanho: ${(fs.statSync(sqlPath).size / (1024 * 1024)).toFixed(2)} MB`);
  } catch (err: any) {
    console.warn('Erro ao atualizar SQL:', err.message);
  }
}

reprocessAll();
