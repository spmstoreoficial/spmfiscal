import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Server, 
  Cpu, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Zap, 
  Mail, 
  Sparkles,
  Download,
  Copy,
  Check,
  Terminal,
  FileCode,
  FolderCheck,
  ExternalLink
} from 'lucide-react';
import { SystemSettings } from '../types';
import { api } from '../lib/api';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    smtpHost: 'smtp.empresa.com.br',
    smtpPort: 587,
    smtpUser: 'notificacoes@empresa.com.br',
    smtpSender: 'Sistema Fiscal <notificacoes@empresa.com.br>',
    emailAlertsEnabled: true,
    pushAlertsEnabled: true,
    autoExportExcel: true,
    useGeminiOcrFallback: true,
    vpsMode: true
  });

  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);
  const [copiedVhost, setCopiedVhost] = useState(false);
  const [copiedPm2, setCopiedPm2] = useState(false);

  useEffect(() => {
    api.getSettings().then(res => {
      if (res.settings) setSettings(res.settings);
    }).catch(err => console.error('Error loading settings:', err));
  }, []);

  const handleSaveSettings = async () => {
    await api.updateSettings(settings);
    setSavedMessage('✅ Configurações de sistema atualizadas com sucesso.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const htaccessCode = `# Configuração Apache / XAMPP para SPM Store Sistema Fiscal
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /spm-fiscal/

  # Proxy de Chamadas da API para o Servidor Node.js (Porta 3000)
  RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

  # Roteamento SPA React
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /spm-fiscal/index.html [L]
</IfModule>

# Mod Compressão Gzip para Desempenho
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>`;

  const vhostCode = `# Adicionar em C:\\xampp\\apache\\conf\\extra\\httpd-vhosts.conf
<VirtualHost *:80>
    ServerName spm-fiscal.local
    DocumentRoot "C:/xampp/htdocs/spm-fiscal"

    <Directory "C:/xampp/htdocs/spm-fiscal">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
    </Directory>

    # Ativar módulos no httpd.conf: mod_proxy e mod_proxy_http
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
</VirtualHost>`;

  const pm2Code = `# No terminal dentro de C:\\xampp\\htdocs\\spm-fiscal:
npm install -g pm2
pm2 start server.ts --name "spm-fiscal-api"
pm2 save
pm2-startup install`;

  const handleCopy = (text: string, type: 'htaccess' | 'vhost' | 'pm2') => {
    navigator.clipboard.writeText(text);
    if (type === 'htaccess') {
      setCopiedHtaccess(true);
      setTimeout(() => setCopiedHtaccess(false), 2000);
    } else if (type === 'vhost') {
      setCopiedVhost(true);
      setTimeout(() => setCopiedVhost(false), 2000);
    } else {
      setCopiedPm2(true);
      setTimeout(() => setCopiedPm2(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Settings className="w-5 h-5 text-slate-600" />
              <span>Configurações do Servidor & Instalação XAMPP</span>
            </h2>
            <span className="bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded text-[11px] font-bold">
              Suporte XAMPP / Apache / PM2
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Parâmetros de execução do sistema, suporte a servidores XAMPP/Apache local, inteligência artificial OCR e e-mail SMTP.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{savedMessage}</span>
        </div>
      )}

      {/* XAMPP Deployment Section */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-100 text-orange-700 rounded-lg font-bold">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Instalação e Hospedagem no Servidor XAMPP</h3>
              <p className="text-xs text-slate-500">Guia completo para implantar em <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono font-bold">C:\xampp\htdocs\spm-fiscal</code></p>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold self-start md:self-auto">
            100% Compatível com XAMPP Apache
          </span>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">1</span>
              <span>Copiar para htdocs</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Extraia ou copie a pasta da aplicação para <code className="font-mono font-bold text-slate-800">C:\xampp\htdocs\spm-fiscal</code> no Windows ou <code className="font-mono font-bold text-slate-800">/opt/lampp/htdocs/spm-fiscal</code> no Linux.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
              <span>Ativar Módulos Apache</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              No Painel do XAMPP &gt; Config &gt; <code className="font-mono text-slate-800 font-bold">httpd.conf</code>, descomente as linhas: <code className="font-mono text-blue-700">mod_proxy.so</code> e <code className="font-mono text-blue-700">mod_proxy_http.so</code> e <code className="font-mono text-blue-700">mod_rewrite.so</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
              <span>Iniciar Serviço Node.js</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Abra o terminal na pasta e execute o comando <code className="font-mono text-emerald-700 font-bold">npm start</code> ou use o <code className="font-mono text-slate-800 font-bold">PM2</code> para manter o serviço ativo em segundo plano no Windows/Linux.
            </p>
          </div>
        </div>

        {/* Configurations code snippets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* .htaccess Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                <FileCode className="w-4 h-4 text-orange-600" />
                <span>Arquivo .htaccess (Colocar em C:\xampp\htdocs\spm-fiscal\.htaccess)</span>
              </span>
              <button
                onClick={() => handleCopy(htaccessCode, 'htaccess')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1"
              >
                {copiedHtaccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHtaccess ? 'Copiado!' : 'Copiar .htaccess'}</span>
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-x-auto">
              <pre className="text-[11px] font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                {htaccessCode}
              </pre>
            </div>
          </div>

          {/* VirtualHost / PM2 Box */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span>Configuração Apache VirtualHost (httpd-vhosts.conf)</span>
                </span>
                <button
                  onClick={() => handleCopy(vhostCode, 'vhost')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1"
                >
                  {copiedVhost ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVhost ? 'Copiado!' : 'Copiar VirtualHost'}</span>
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-x-auto">
                <pre className="text-[11px] font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {vhostCode}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  <span>Comandos PM2 (Execução Automática no Windows/XAMPP)</span>
                </span>
                <button
                  onClick={() => handleCopy(pm2Code, 'pm2')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1"
                >
                  {copiedPm2 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPm2 ? 'Copiado!' : 'Copiar PM2'}</span>
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-x-auto">
                <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
                  {pm2Code}
                </pre>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Grid Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* VPS & Performance Optimization */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Otimização para VPS Contabo & Navegadores Leves</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Modo Navegador Leve (VPS Contabo)</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Renderização ultrarrápida com baixo consumo de memória e CPU</p>
              </div>
              <input
                type="checkbox"
                checked={settings.vpsMode}
                onChange={e => setSettings({ ...settings, vpsMode: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Fallback Inteligente Gemini AI OCR</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Usar IA server-side quando o PDF for escaneado ou complexo</p>
              </div>
              <input
                type="checkbox"
                checked={settings.useGeminiOcrFallback}
                onChange={e => setSettings({ ...settings, useGeminiOcrFallback: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Gerar Planilha Excel Automaticamente</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Salvar Auditoria_Faturamento_Completo.xlsx ao processar</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoExportExcel}
                onChange={e => setSettings({ ...settings, autoExportExcel: e.target.checked })}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SMTP Email Settings */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Configurações do Servidor SMTP de E-mail</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Host do Servidor SMTP</label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={e => setSettings({ ...settings, smtpHost: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none font-mono focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Porta SMTP</label>
                <input
                  type="number"
                  value={settings.smtpPort}
                  onChange={e => setSettings({ ...settings, smtpPort: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none font-mono focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Usuário / Remetente</label>
                <input
                  type="text"
                  value={settings.smtpUser}
                  onChange={e => setSettings({ ...settings, smtpUser: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
