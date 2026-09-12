import fs from 'fs';
import path from 'path';
import { 
  saveInvoiceToDb, 
  getInvoicesFromDb, 
  checkDuplicateInvoices, 
  deductStockForInvoices, 
  syncDatabaseToSqlFile,
  addLogToDb
} from '../src/lib/db';
import { extractSpmInvoicesFromNfeXml } from '../src/lib/xmlParser';
import { Invoice } from '../src/types';

async function downloadAndProcessDriveXmls() {
  const folderId = '1cqhLdzayHMwzLxdi60rucCEqvK0tfHOz';
  const notasFiscaisDir = path.join(process.cwd(), 'Notas_Fiscais');
  if (!fs.existsSync(notasFiscaisDir)) {
    fs.mkdirSync(notasFiscaisDir, { recursive: true });
  }

  // 1. Load the file list from gdrive_all_files.json or fetch live
  const allFilesJsonPath = path.join(process.cwd(), 'scripts', 'gdrive_all_files.json');
  let fileList: { name: string; id: string }[] = [];
  if (fs.existsSync(allFilesJsonPath)) {
    try {
      fileList = JSON.parse(fs.readFileSync(allFilesJsonPath, 'utf-8'));
    } catch {}
  }

  if (fileList.length === 0) {
    console.log(`Buscando lista de arquivos ao vivo na pasta do Google Drive (${folderId})...`);
    try {
      const folderUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
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
          let name = match[1].trim();
          let rawId = match[2].trim();
          const cleanId = rawId.replace(/-0.*$/, '').replace(/-\d+$/, '');
          if (!name.toLowerCase().endsWith('.xml') && !name.toLowerCase().endsWith('.pdf')) {
            name += '.xml';
          }
          if (!seen.has(cleanId)) {
            seen.add(cleanId);
            fileList.push({ name, id: cleanId });
          }
        }
        if (fileList.length > 0) {
          fs.writeFileSync(allFilesJsonPath, JSON.stringify(fileList, null, 2), 'utf-8');
          console.log(`Encontrados e salvos ${fileList.length} arquivos em scripts/gdrive_all_files.json!`);
        }
      }
    } catch (crawlerErr: any) {
      console.warn('Erro ao buscar lista ao vivo do Google Drive:', crawlerErr.message);
    }
  }

  console.log(`Iniciando download e ingestão de ${fileList.length} arquivos da pasta Google Drive (${folderId})...`);

  let downloadedCount = 0;
  let errorCount = 0;
  const rawItems: Invoice[] = [];

  for (let i = 0; i < fileList.length; i++) {
    const item = fileList[i];
    const cleanId = item.id.replace(/-0.*$/, '').replace(/-\d+$/, '');
    const localFilePath = path.join(notasFiscaisDir, item.name);

    console.log(`[${i + 1}/${fileList.length}] Processing ${item.name} (ID: ${cleanId})...`);

    let xmlContent = '';

    // Check if already downloaded locally or download from Google Drive
    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 100) {
      xmlContent = fs.readFileSync(localFilePath, 'utf-8');
      console.log(`  -> Already exists locally (${xmlContent.length} bytes)`);
    } else {
      try {
        const downloadUrl = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download&confirm=t`;
        const res = await fetch(downloadUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });
        const text = await res.text();

        if (text.startsWith('<?xml') || text.includes('<nfeProc') || text.includes('<NFe')) {
          xmlContent = text;
          fs.writeFileSync(localFilePath, xmlContent, 'utf-8');
          downloadedCount++;
          console.log(`  -> Downloaded successfully (${xmlContent.length} bytes)`);
        } else {
          console.warn(`  -> Non-XML response for ${item.name}: ${text.substring(0, 100)}`);
          errorCount++;
          continue;
        }
      } catch (err: any) {
        console.error(`  -> Download error for ${item.name}:`, err.message);
        errorCount++;
        continue;
      }
    }

    // Extract invoices from XML
    try {
      const extracted = extractSpmInvoicesFromNfeXml(xmlContent, item.name);
      console.log(`  -> Extracted ${extracted.length} invoice records from ${item.name}`);
      rawItems.push(...extracted);
    } catch (err: any) {
      console.error(`  -> Parse error for ${item.name}:`, err.message);
    }

    // Small delay to be polite
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n================ SUMMARY EXTRACTION ================`);
  console.log(`Total files in list: ${fileList.length}`);
  console.log(`Downloaded: ${downloadedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total Extracted Invoice Items: ${rawItems.length}`);

  // Ingest into Database
  const currentInvoices = await getInvoicesFromDb();
  console.log(`Existing DB invoices before import: ${currentInvoices.length}`);

  const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawItems);
  console.log(`Unique items to insert: ${uniqueItems.length}`);
  console.log(`Duplicates ignored: ${duplicates.length}`);

  for (const inv of uniqueItems) {
    await saveInvoiceToDb(inv);
  }

  if (uniqueItems.length > 0) {
    console.log(`Deducting stock for ${uniqueItems.length} items...`);
    await deductStockForInvoices(uniqueItems, { id: 'system-gdrive', name: 'Google Drive Official Sync' });

    console.log(`Syncing database to database_spm_fiscal.sql...`);
    await syncDatabaseToSqlFile();

    await addLogToDb({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: 'system-gdrive',
      userName: 'Google Drive Oficial',
      action: 'Sincronização Google Drive Oficial',
      category: 'UPLOAD',
      details: `Varredura oficial na pasta Google Drive (ID: ${folderId}): ${uniqueItems.length} novas notas fiscais importadas e sincronizadas.`,
      ip: '127.0.0.1',
      severity: 'success'
    });
  }

  const finalInvoices = await getInvoicesFromDb();
  console.log(`\nFinal Invoices in DB: ${finalInvoices.length}`);
  console.log('Done!');
}

downloadAndProcessDriveXmls().catch(console.error);
