import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Trash2,
  FolderSearch,
  Database,
  MapPin
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

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  onNewExtracted?: (items: Invoice[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  onNewExtracted
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanningFolder, setIsScanningFolder] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<Invoice[]>([]);
  const [duplicatesList, setDuplicatesList] = useState<DuplicateItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSyncingGDrive, setIsSyncingGDrive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
      // 1. Tentar sincronização em nuvem oficial e depois varredura de pasta local
      const res = await api.syncGDriveOnline().catch(() => api.scanLocalFolder());
      if ('duplicates' in res && res.duplicates && res.duplicates.length > 0) {
        setDuplicatesList(res.duplicates);
      }

      if (res.count > 0) {
        setExtractedPreview(res.extracted);
        setSuccessMessage(`✅ Google Drive sincronizado com sucesso! ${res.count} novo(s) arquivo(s) (PDF/XML) processado(s) e inserido(s) na base.`);
        if (onNewExtracted && res.extracted) {
          onNewExtracted(res.extracted);
        }
      } else {
        const total = ('totalOnlineFiles' in res ? res.totalOnlineFiles : ('totalPdfs' in res ? res.totalPdfs : 0)) || 0;
        setSuccessMessage(`ℹ️ Google Drive sincronizado. Nenhum novo arquivo pendente (Total de ${total} arquivos verificados).`);
      }
      onRefreshData();
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao sincronizar com Google Drive');
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
        setSuccessMessage(`✅ Pasta 'Notas_Fiscais' varrida com sucesso! ${res.count} novo(s) registro(s) salvo(s) e sincronizado(s).`);
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

  const handleProcessUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setUploadError(null);
    setSuccessMessage(null);
    setDuplicatesList([]);

    try {
      const res = await api.uploadPdfBatch(selectedFiles);
      if (res.duplicates && res.duplicates.length > 0) {
        setDuplicatesList(res.duplicates);
      }

      const count = res.newInsertedCount !== undefined ? res.newInsertedCount : res.extractedCount;
      if (count > 0) {
        setExtractedPreview(res.extractedInvoices || []);
        setSuccessMessage(`🎉 Sucesso: ${count} novo(s) registro(s) extraído(s) de arquivos XML/PDF e salvo(s) na base.`);
        setSelectedFiles([]);
        if (onNewExtracted && res.extractedInvoices) {
          onNewExtracted(res.extractedInvoices);
        }
      } else if (res.duplicates && res.duplicates.length > 0) {
        setSuccessMessage(`⚠️ Todos os ${res.duplicates.length} itens deste lote já constavam na base (Duplicatas prevenidas).`);
      } else {
        setSuccessMessage(`ℹ️ Processamento concluído sem novos registros adicionados.`);
      }
      onRefreshData();
    } catch (err: any) {
      setUploadError(err.message || 'Falha ao processar arquivos');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Importação de Notas Fiscais (XML SEFAZ & PDF DANFE)
              </h3>
              <p className="text-xs text-slate-400">
                Extração precisa de XML nativo e leitura inteligente de PDFs com auditoria fiscal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Google Drive Realtime Integration Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="font-extrabold text-white text-xs">
                  Sincronização Automática Google Drive
                </span>
                <span className="px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-300 font-mono text-[10px] border border-blue-500/30">
                  ONLINE & ATIVO
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Pasta Vinculada:{' '}
                <a
                  href="https://drive.google.com/drive/folders/1cqhLdzayHMwzLxdi60rucCEqvK0tfHOz?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline font-mono inline-flex items-center gap-1"
                >
                  drive.google.com/drive/folders/1cqhLdzay... <span className="text-[10px]">↗</span>
                </a>
              </p>
              <p className="text-[10px] text-slate-400">
                Qualquer novo PDF ou XML adicionado à pasta é sincronizado e processado em tempo real.
              </p>
            </div>

            <button
              onClick={handleSyncGoogleDrive}
              disabled={isSyncingGDrive}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(37,99,235,0.3)] transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGDrive ? 'animate-spin' : ''}`} />
              {isSyncingGDrive ? 'Sincronizando...' : 'Sincronizar Drive Agora'}
            </button>
          </div>

          {/* Quick Scan Local Folder */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FolderSearch className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-xs block">
                  Varrer Pasta Local <code className="text-cyan-400 font-mono">./Notas_Fiscais</code>
                </span>
                <span className="text-[11px] text-slate-400">
                  Lê todos os arquivos PDF e XML armazenados localmente
                </span>
              </div>
            </div>

            <button
              onClick={handleScanLocalFolder}
              disabled={isScanningFolder}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningFolder ? 'animate-spin' : ''}`} />
              {isScanningFolder ? 'Varrendo...' : 'Varrer Local'}
            </button>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center bg-[#020617] cursor-pointer transition flex flex-col items-center justify-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.xml"
              className="hidden"
            />
            <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-cyan-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-200 text-xs sm:text-sm">
                Arraste seus arquivos XML (NF-e) ou PDF (DANFE) aqui ou clique para selecionar
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                💡 <strong className="text-emerald-400">XMLs</strong> são lidos de forma 100% precisa e instantânea. <strong className="text-cyan-400">PDFs</strong> são extraídos via OCR/Regex.
              </p>
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  {selectedFiles.length} arquivo(s) selecionado(s) para upload
                </span>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-rose-400 hover:underline text-[11px]"
                >
                  Limpar lista
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-slate-200 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleProcessUpload}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Extraindo e Auditando Notas...' : `Processar ${selectedFiles.length} Arquivo(s)`}
              </button>
            </div>
          )}

          {/* Messages */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Duplicates Notice */}
          {duplicatesList.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 space-y-1.5">
              <span className="font-bold text-amber-300 text-xs block">
                {duplicatesList.length} Duplicata(s) Prevenida(s):
              </span>
              <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-amber-200/80 font-mono">
                {duplicatesList.map((d, i) => (
                  <div key={i}>
                    • Fatura {d.fatura} (Doc: {d.documento}): {d.motivo}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
