import React, { useState, useEffect, useRef } from 'react';
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
  Info,
  Radio,
  ShoppingBag,
  Tag,
  DollarSign,
  FolderSync,
  HardDrive,
  Check,
  Copy,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Invoice, GDriveDesktopStatus } from '../types';
import { api } from '../lib/api';
import { playAttendanceChime, playUrgentAlert } from '../utils/audioAlert';

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
  const [isScanningGDrive, setIsScanningGDrive] = useState(false);
  const [gdriveStatus, setGdriveStatus] = useState<GDriveDesktopStatus | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<Invoice[]>([]);
  const [duplicatesList, setDuplicatesList] = useState<DuplicateItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGDriveStatus = async () => {
    try {
      const status = await api.getGDriveDesktopStatus();
      setGdriveStatus(status);
    } catch (e) {
      console.warn('Erro ao obter status do Google Drive Desktop:', e);
    }
  };

  useEffect(() => {
    loadGDriveStatus();
    const interval = setInterval(loadGDriveStatus, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const handleCopyGDrivePath = () => {
    const path = gdriveStatus?.folderPath || 'I:\\Meu Drive\\SPM Store\\SPM Verniz Elite\\SPM Verniz\\Verniz Elite SPM Pedidos\\Notas_Fiscais';
    navigator.clipboard.writeText(path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  // Sincronização e Varredura da Pasta do Google Drive para Desktop (I:\...)
  const handleScanGDriveDesktop = async () => {
    setIsScanningGDrive(true);
    setUploadError(null);
    setSuccessMessage(null);
    setDuplicatesList([]);

    try {
      const res = await api.scanGDriveDesktop();
      if (res.duplicates && res.duplicates.length > 0) {
        setDuplicatesList(res.duplicates);
        playUrgentAlert();
      }

      if (res.count > 0) {
        setExtractedPreview(res.extracted);
        setSuccessMessage(`✅ Google Drive Desktop (I:\\) sincronizado! ${res.count} novo(s) registro(s) salvo(s) no MySQL e atualizado(s) em database_spm_fiscal.sql.`);
        playAttendanceChime();
        if (onNewExtracted && res.extracted) {
          onNewExtracted(res.extracted);
        }
      } else {
        setSuccessMessage(`ℹ️ A pasta do Google Drive Desktop possui ${res.totalPdfs} PDF(s). Todos já estão 100% sincronizados no MySQL.`);
      }
      await loadGDriveStatus();
      onRefreshData();
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao escanear pasta do Google Drive para Desktop');
      playUrgentAlert();
    } finally {
      setIsScanningGDrive(false);
    }
  };

  // Motor de Extração Automática da Pasta Local 'Notas_Fiscais' (XAMPP / Local)
  const handleScanLocalFolder = async () => {
    setIsScanningFolder(true);
    setUploadError(null);
    setSuccessMessage(null);
    setDuplicatesList([]);

    try {
      const res = await api.scanLocalFolder();
      if (res.duplicates && res.duplicates.length > 0) {
        setDuplicatesList(res.duplicates);
        playUrgentAlert();
      }

      if (res.count > 0) {
        setExtractedPreview(res.extracted);
        setSuccessMessage(`✅ Pasta 'Notas_Fiscais' varrida com sucesso! ${res.count} novo(s) registro(s) salvo(s) no MySQL e sincronizado(s) em database_spm_fiscal.sql.`);
        playAttendanceChime();
        if (onNewExtracted && res.extracted) {
          onNewExtracted(res.extracted);
        }
      } else {
        setSuccessMessage(`ℹ️ A pasta 'Notas_Fiscais' possui ${res.totalPdfs} arquivo(s). Nenhum novo item pendente para inserção.`);
      }
      onRefreshData();
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao escanear pasta de notas fiscais');
      playUrgentAlert();
    } finally {
      setIsScanningFolder(false);
    }
  };

  // Motor de Upload e Extração dos Arquivos Selecionados
  const handleProcessFiles = async () => {
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

      if (res.extractedInvoices && res.extractedInvoices.length > 0) {
        setExtractedPreview(res.extractedInvoices);
        setSuccessMessage(`✅ Sucesso! ${res.extractedCount} registro(s) fiscal(is) extraído(s) rigorosamente com JavaScript e salvo(s) no MySQL.`);
        playAttendanceChime();
        setSelectedFiles([]);
        if (onNewExtracted && res.extractedInvoices) {
          onNewExtracted(res.extractedInvoices);
        }
      } else if (res.duplicates && res.duplicates.length > 0) {
        setSuccessMessage(`ℹ️ Todas as notas enviadas já haviam sido processadas anteriormente.`);
      }
      onRefreshData();
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao processar arquivos');
      playUrgentAlert();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Google Drive para Desktop (100% Offline) - Real-time Watcher Banner */}
      <div className="bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#020617] p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <HardDrive className="w-3.5 h-3.5" /> Monitoramento Automático Ativo (100% Offline)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
                {gdriveStatus?.totalPdfs || 0} PDF(s) Detectados na Pasta
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Google Drive para Desktop</span>
              <span className="text-emerald-400 font-mono">I:\</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              O sistema monitora constantemente a pasta local do Google Drive no Windows. 
              <strong> Ao colocar ou salvar qualquer PDF DANFE nesta pasta, a extração dos 17 campos e a inserção no MySQL acontecem automaticamente em tempo real!</strong>
            </p>

            {/* Path Box with 1-Click Copy */}
            <div className="flex items-center gap-2 bg-[#020617] border border-slate-800 rounded-xl p-2.5 max-w-3xl">
              <span className="text-slate-500 text-xs font-mono shrink-0">Pasta:</span>
              <code className="text-xs sm:text-sm font-mono text-cyan-400 font-bold truncate flex-1 select-all">
                {gdriveStatus?.folderPath || 'I:\\Meu Drive\\SPM Store\\SPM Verniz Elite\\SPM Verniz\\Verniz Elite SPM Pedidos\\Notas_Fiscais'}
              </code>
              <button
                onClick={handleCopyGDrivePath}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 shrink-0 border border-slate-700"
                title="Copiar caminho da pasta"
              >
                {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPath ? 'Copiado!' : 'Copiar Caminho'}</span>
              </button>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={handleScanGDriveDesktop}
              disabled={isScanningGDrive || isProcessing}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 border border-emerald-400/50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanningGDrive ? 'animate-spin text-white' : 'text-emerald-200'}`} />
              <span>{isScanningGDrive ? 'Sincronizando Drive I:\\...' : 'Sincronizar Google Drive Agora'}</span>
            </button>

            <button
              onClick={handleScanLocalFolder}
              disabled={isScanningFolder || isProcessing}
              className="px-4 py-2.5 rounded-xl bg-[#020617] hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-800"
            >
              <FolderSearch className="w-3.5 h-3.5 text-cyan-400" />
              <span>Escanear Notas_Fiscais Local</span>
            </button>
          </div>
        </div>

        {/* Live Status indicator bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Status Watcher: <strong>{gdriveStatus?.watcherActive ? 'ONLINE (ESCUTA ATIVA)' : 'INICIALIZANDO'}</strong></span>
          </div>
          <div>
            <span>Última Sincronização: <strong>{gdriveStatus?.lastSync ? new Date(gdriveStatus.lastSync).toLocaleTimeString('pt-BR') : 'Em tempo real'}</strong></span>
          </div>
        </div>
      </div>

      {/* Messages Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Processamento Concluído:</span> {successMessage}
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Erro no Processamento:</span> {uploadError}
          </div>
        </div>
      )}

      {/* Duplicate Notices */}
      {duplicatesList.length > 0 && (
        <div className="bg-amber-950/50 border border-amber-500/40 p-4 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Aviso de Duplicidades Detectadas ({duplicatesList.length})</span>
            </div>
            <span className="text-[11px] text-amber-400 font-mono">Itens já existentes foram preservados</span>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {duplicatesList.map((dup, idx) => (
              <div key={idx} className="bg-[#020617]/80 p-2.5 rounded-xl border border-amber-500/20 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-300">
                <span className="font-mono font-bold text-cyan-400">NF #{dup.fatura || 'N/A'}</span>
                <span className="font-medium text-white">{dup.nome}</span>
                <span className="text-slate-400 font-mono text-[11px]">{dup.codigo}</span>
                <span className="text-amber-400 text-[11px] font-semibold">{dup.motivo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div 
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className="bg-[#0f172a]/95 backdrop-blur-md border-2 border-dashed border-slate-700 hover:border-cyan-500/80 p-8 rounded-2xl text-center space-y-4 transition-all duration-300 shadow-xl group cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept=".pdf,.xml,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden" 
        />

        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-lg group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Arraste seus arquivos PDF ou XML aqui</h3>
          <p className="text-xs text-slate-400 mt-1">Ou clique para selecionar manualmente notas fiscais do computador</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="px-2.5 py-1 rounded-lg bg-[#020617] border border-slate-800 font-mono text-cyan-400">
            ✓ DANFE em PDF
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#020617] border border-slate-800 font-mono text-emerald-400">
            ✓ XML NF-e Oficial
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#020617] border border-slate-800 font-mono text-amber-400">
            ✓ Extração 17 Campos
          </span>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Arquivos Selecionados ({selectedFiles.length})</span>
            </h4>
            
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Lista</span>
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#020617] border border-slate-800 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-mono text-slate-200 truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(idx);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleProcessFiles}
              disabled={isProcessing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Extraindo Dados Rigorosos...' : `Processar ${selectedFiles.length} Arquivo(s)`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Extracted Preview Table */}
      {extractedPreview.length > 0 && (
        <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Últimas Notas Extraídas & Salvas no MySQL ({extractedPreview.length})</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Todos os 17 campos oficiais mapeados com sucesso</p>
            </div>
            
            {onOpenMap && (
              <button
                onClick={onOpenMap}
                className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold transition border border-cyan-500/40 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Ver no Mapa do Brasil</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#020617] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-2.5">NF / Fatura</th>
                  <th className="p-2.5">Comprador</th>
                  <th className="p-2.5">CPF / CNPJ</th>
                  <th className="p-2.5">Município / UF</th>
                  <th className="p-2.5">SKU / Verniz</th>
                  <th className="p-2.5">Cor</th>
                  <th className="p-2.5">Canal</th>
                  <th className="p-2.5 text-right">Valor Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#0f172a]/60 text-slate-200">
                {extractedPreview.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-2.5 font-bold text-cyan-400">#{item.fatura || 'N/A'}</td>
                    <td className="p-2.5 font-sans font-medium text-white max-w-[180px] truncate">{item.nome}</td>
                    <td className="p-2.5 text-slate-400">{item.documento}</td>
                    <td className="p-2.5">{item.municipio} - {item.uf}</td>
                    <td className="p-2.5 text-slate-300 max-w-[160px] truncate">{item.codigo}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.cor.toLowerCase() === 'preto' ? 'bg-slate-950 text-white border border-slate-700' :
                        item.cor.toLowerCase() === 'marrom' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                        item.cor.toLowerCase() === 'incolor' ? 'bg-sky-950 text-sky-200 border border-sky-700' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {item.cor}
                      </span>
                    </td>
                    <td className="p-2.5 uppercase font-bold text-[10px] text-slate-300">{item.origem}</td>
                    <td className="p-2.5 font-bold text-emerald-400 text-right">R$ {item.valorNota}</td>
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
