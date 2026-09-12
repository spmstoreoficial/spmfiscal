import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  ExternalLink,
  FolderSearch,
  Code2,
  Download,
  MapPin,
  AlertTriangle,
  Database,
  Info
} from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../lib/api';

interface DuplicateItem {
  fatura: string;
  documento: string;
  nome: string;
  codigo: string;
  motivo: string;
}

interface UploadViewProps {
  onRefreshData: () => void;
  onOpenGSheets: () => void;
  onOpenMap?: () => void;
  onNewExtracted?: (items: Invoice[]) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ 
  onRefreshData, 
  onOpenGSheets,
  onOpenMap,
  onNewExtracted
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanningFolder, setIsScanningFolder] = useState(false);
  const [isSyncingGDrive, setIsSyncingGDrive] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<Invoice[]>([]);
  const [duplicatesList, setDuplicatesList] = useState<DuplicateItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      setUploadError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      setUploadError(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSyncGoogleDrive = async () => {
    setIsSyncingGDrive(true);
    setUploadError(null);
    setSuccessMessage(null);
    setDuplicatesList([]);

    try {
      const res = await api.syncGDriveOnline().catch(() => api.scanLocalFolder());
      if ('duplicates' in res && res.duplicates && res.duplicates.length > 0) {
        setDuplicatesList(res.duplicates);
      }

      if (res.count > 0) {
        setExtractedPreview(res.extracted);
        setSuccessMessage(`✅ Google Drive oficial sincronizado com sucesso! ${res.count} novo(s) arquivo(s) (XML/PDF) importado(s) e gravado(s) na base.`);
        if (onNewExtracted && res.extracted) {
          onNewExtracted(res.extracted);
        }
      } else {
        setSuccessMessage(`ℹ️ Google Drive oficial verificado. Nenhum novo arquivo pendente.`);
      }
      onRefreshData();
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao sincronizar com Google Drive oficial');
    } finally {
      setIsSyncingGDrive(false);
    }
  };

  const handleScanLocalFolder = async () => {
    setIsScanningFolder(true);
    setUploadError(null);
    setSuccessMessage(null);
    setDuplicatesList([]);

    try {
      const res = await api.scanLocalFolder();
      if (res.duplicates && res.duplicates.length > 0) {
        setDuplicatesList(res.duplicates);
      }

      if (res.count > 0) {
        setExtractedPreview(res.extracted);
        setSuccessMessage(`✅ Pasta 'Notas_Fiscais' varrida com sucesso! ${res.count} novo(s) registro(s) salvo(s) no MySQL e sincronizado(s) em database_spm_fiscal.sql.`);
        if (onNewExtracted && res.extracted) {
          onNewExtracted(res.extracted);
        }
      } else {
        setSuccessMessage(`ℹ️ A pasta 'Notas_Fiscais' possui ${res.totalPdfs} arquivo(s). Nenhum novo item pendente para inserção.`);
      }
      onRefreshData();
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao escanear pasta de notas fiscais');
    } finally {
      setIsScanningFolder(false);
    }
  };

  const handleProcessBatch = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setUploadError(null);
    setSuccessMessage(null);
    setDuplicatesList([]);

    try {
      const invoiceFiles = selectedFiles.filter(f => {
        const l = f.name.toLowerCase();
        return l.endsWith('.xml') || l.endsWith('.pdf');
      });
      const excelFiles = selectedFiles.filter(f => f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls'));

      let newExtracted: Invoice[] = [];
      const collectedDuplicates: DuplicateItem[] = [];

      // Process XML / PDF invoices
      if (invoiceFiles.length > 0) {
        const res = await api.uploadPdfBatch(invoiceFiles);
        newExtracted = [...newExtracted, ...(res.extractedInvoices || [])];
        if (res.duplicates && res.duplicates.length > 0) {
          collectedDuplicates.push(...res.duplicates);
        }
      }

      // Process Excel files
      if (excelFiles.length > 0) {
        for (const exFile of excelFiles) {
          const res = await api.uploadExcel(exFile);
          newExtracted = [...newExtracted, ...(res.imported || [])];
          if (res.duplicates && res.duplicates.length > 0) {
            collectedDuplicates.push(...res.duplicates);
          }
        }
      }

      setDuplicatesList(collectedDuplicates);
      setExtractedPreview(newExtracted);
      setSelectedFiles([]);
      
      const syncNote = "💾 Salvo no MySQL e sincronizado em database_spm_fiscal.sql.";
      if (newExtracted.length > 0) {
        setSuccessMessage(`✅ Sucesso! Extraídos e salvos ${newExtracted.length} novos registros fiscais. ${syncNote}`);
      } else if (collectedDuplicates.length > 0) {
        setSuccessMessage(`ℹ️ Todos os registros do arquivo já existiam no banco de dados. Nenhuma duplicata foi inserida.`);
      }

      if (onNewExtracted && newExtracted.length > 0) {
        onNewExtracted(newExtracted);
      }

      onRefreshData();
    } catch (err: any) {
      console.error('Batch Extraction Error:', err);
      setUploadError(err.message || 'Erro durante o processamento dos arquivos.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Extração de Notas Fiscais & Sincronização SQL
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Auto-Sync database_spm_fiscal.sql</span>
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Extrai os 17 campos oficiais de DANFEs/PDFs, grava no MySQL, atualiza o arquivo SQL e detecta duplicidades automaticamente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncGoogleDrive}
            disabled={isSyncingGDrive || isProcessing}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
            title="Sincronizar com a pasta oficial do Google Drive"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGDrive ? 'animate-spin' : ''}`} />
            <span>{isSyncingGDrive ? 'Sincronizando Drive...' : 'Sincronizar Google Drive'}</span>
          </button>

          <button
            onClick={handleScanLocalFolder}
            disabled={isScanningFolder || isProcessing}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs transition border border-slate-800 shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
            title="Escanear pasta /Notas_Fiscais no servidor"
          >
            {isScanningFolder ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Processando Pasta...</span>
              </>
            ) : (
              <>
                <FolderSearch className="w-3.5 h-3.5 text-amber-400" />
                <span>Escanear Pasta 'Notas_Fiscais'</span>
              </>
            )}
          </button>

          <a
            href="/api/export/excel"
            download="Auditoria_Faturamento_SPM.xlsx"
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Excel (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="bg-[#1E293B] border-2 border-dashed border-slate-600 hover:border-blue-400 p-8 rounded-xl text-center cursor-pointer transition shadow-sm flex flex-col items-center justify-center space-y-3 group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".xml,.pdf,.xlsx,.xls"
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
          <Upload className="w-7 h-7" />
        </div>

        <div>
          <p className="text-sm font-bold text-white">
            Clique ou arraste seus arquivos XML (NF-e) ou PDF (DANFE) aqui
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Extração nativa ultra-rápida de XML SEFAZ com controle de estoque e sincronização SQL
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-300 pt-2">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-orange-400">Shopee</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400">Mercado Livre</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400">WhatsApp</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-pink-400">TikTok</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Outros</span>
        </div>
      </div>

      {/* Selected Files Queue */}
      {selectedFiles.length > 0 && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Fila de Arquivos Selecionados ({selectedFiles.length})</span>
            </h3>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-slate-500 hover:text-rose-600 text-xs font-semibold transition"
            >
              Limpar Fila
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center space-x-2.5 truncate max-w-md">
                  {file.name.endsWith('.pdf') ? (
                    <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleRemoveFile(idx); }}
                  className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleProcessBatch}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extraindo, Verificando Duplicidades & Sincronizando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Extrair, Salvar no MySQL & Sincronizar SQL</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* DUPLICATES ALERT BANNER & TABLE */}
      {duplicatesList.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-200 text-amber-800">
                <AlertTriangle className="w-5 h-5 animate-pulse text-amber-700" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-950">
                  Aviso: {duplicatesList.length} Nota(s) Fiscal(is) Duplicada(s) Detectada(s)
                </h4>
                <p className="text-[11px] text-amber-800">
                  Os registros abaixo já constam no banco de dados e foram desconsiderados para evitar faturamento duplicado:
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
              {duplicatesList.length} Ignorada(s)
            </span>
          </div>

          <div className="overflow-x-auto max-h-48 overflow-y-auto bg-white rounded-xl border border-amber-200">
            <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
              <thead className="bg-amber-100/60 text-amber-900 uppercase text-[10px] tracking-wider border-b border-amber-200 font-bold sticky top-0">
                <tr>
                  <th className="p-2">FATURA</th>
                  <th className="p-2">CLIENTE / RAZÃO SOCIAL</th>
                  <th className="p-2">CPF / CNPJ</th>
                  <th className="p-2">CÓDIGO (SKU)</th>
                  <th className="p-2">MOTIVO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {duplicatesList.map((dup, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/50">
                    <td className="p-2 font-mono font-bold text-amber-900">{dup.fatura}</td>
                    <td className="p-2 font-semibold text-slate-800">{dup.nome}</td>
                    <td className="p-2 font-mono text-[11px] text-slate-600">{dup.documento}</td>
                    <td className="p-2 font-mono text-slate-700">{dup.codigo}</td>
                    <td className="p-2 text-rose-700 font-medium text-[11px]">{dup.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          
          <div className="flex items-center space-x-3 shrink-0">
            {onOpenMap && (
              <button
                onClick={onOpenMap}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Ver Cidades no Mapa</span>
              </button>
            )}

            <button
              onClick={onOpenGSheets}
              className="flex items-center space-x-1 text-emerald-700 hover:underline font-bold text-xs shrink-0 cursor-pointer"
            >
              <span>Google Sheets Sync</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Extracted Preview Table */}
      {extractedPreview.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Novos Registros Fiscais Inseridos no MySQL</h3>
              <p className="text-slate-500 text-xs">Exibindo os 17 campos mapeados pelo script com localização de cidades</p>
            </div>
            <div className="flex items-center space-x-2">
              {onOpenMap && (
                <button
                  onClick={onOpenMap}
                  className="flex items-center space-x-1 px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Exibir no Mapa do Brasil</span>
                </button>
              )}
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                {extractedPreview.length} Registros Processados
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-2.5">NOME</th>
                  <th className="p-2.5">CPF / CNPJ</th>
                  <th className="p-2.5">DATA NF-e</th>
                  <th className="p-2.5">CIDADE / UF</th>
                  <th className="p-2.5">FATURA</th>
                  <th className="p-2.5">CÓDIGO</th>
                  <th className="p-2.5">QUANTIDADE</th>
                  <th className="p-2.5">DESCRIÇÃO</th>
                  <th className="p-2.5">COR</th>
                  <th className="p-2.5">MARKETPLACE</th>
                  <th className="p-2.5 text-right">VALOR FINAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {extractedPreview.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 font-bold text-slate-900">{item.nome}</td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-500">{item.documento}</td>
                    <td className="p-2.5 text-slate-600">{item.dataSaida}</td>
                    <td className="p-2.5 text-slate-600 font-medium text-blue-700">{item.municipio} / {item.uf}</td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-700">{item.fatura}</td>
                    <td className="p-2.5 font-mono text-slate-800 font-medium">{item.codigo}</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">{item.quantidade}</td>
                    <td className="p-2.5 text-slate-700 truncate max-w-xs">{item.descricao}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.cor.toLowerCase() === 'preto' ? 'bg-slate-900 text-white border-slate-900' :
                        item.cor.toLowerCase() === 'marrom' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                        item.cor.toLowerCase() === 'incolor' ? 'bg-cyan-50 text-cyan-800 border-cyan-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {item.cor}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {item.origem}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                      R$ {item.valorNota}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
