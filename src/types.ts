export type MarketplaceType = 
  | 'Shopee' 
  | 'Mercado Livre' 
  | 'WhatsApp' 
  | 'TikTok' 
  | 'Outros';

export interface DanfeParsedItem {
  codigo: string;
  descricao: string;
  quantidade: string;
  cor: string;
  origem: string;
}

export interface DanfeParsedData {
  nome: string;
  documento: string;
  dataSaida: string;
  endereco: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  fatura: string;
  valorProdutos: string;
  valorNota: string;
  desconto: string;
  itens: DanfeParsedItem[];
}

export interface Invoice {
  id: string;
  // Campos extraídos estritamente pelo JavaScript do usuário:
  nome: string;             // NOME / Razão Social
  documento: string;        // CPF / CNPJ
  dataSaida: string;        // DATA NF-e
  endereco: string;         // ENDEREÇO
  bairro: string;           // BAIRRO
  cep: string;              // CEP
  municipio: string;        // CIDADE
  uf: string;               // UF
  fatura: string;           // FATURAS
  valorProdutos: string;    // VALOR TOTAL (dos produtos)
  valorNota: string;        // VALOR FINAL (da nota)
  desconto: string;         // DESCONTO
  codigo: string;           // CÓDIGO
  quantidade: string;       // QUANTIDADE
  descricao: string;        // DESCRIÇÃO
  cor: string;              // COR (Preto | Marrom | Incolor | Não identificada)
  origem: string;           // MARKETPLACE (Shopee | Mercado Livre | WhatsApp | TikTok | Outros)

  // Metadados do sistema
  origemArquivo?: string;
  dataUpload?: string;
  status?: 'Processado' | 'Pendente' | 'Erro';
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'AUDITOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  lastLogin?: string;
  createdAt?: string;
  active?: boolean;
}

export type LogCategory = 'UPLOAD' | 'EDIT' | 'DELETE' | 'SYSTEM' | 'EXPORT' | 'SECURITY' | 'AUTH' | 'SYNC';

export interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  category: LogCategory;
  details: string;
  ip: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface AlertRule {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  type: 'DUPLICATE' | 'HIGH_VALUE' | 'MISSING_DATA' | 'TAX_DISCREPANCY' | 'CUSTOM';
  enabled?: boolean;
  active?: boolean;
  threshold?: number;
  condition?: string;
  notifyEmail?: boolean;
  notifyPush?: boolean;
  emailNotify?: boolean;
  pushNotify?: boolean;
  createdAt?: string;
  lastTriggered?: string | null;
}

export interface TVModeConfig {
  enabled: boolean;
  rotateIntervalSeconds: number;
  currentScreen: string;
  screens: string[];
  soundAlerts: boolean;
}

export type DateFilterType = 'today' | '7days' | '30days' | 'this_month' | 'all' | 'hoje' | '7dias' | '30dias' | 'mes' | 'todos';

export interface DashboardFilter {
  dateRange: DateFilterType;
  marketplace?: string;
  origem?: string;
  cor: string;
  uf: string;
  searchTerm: string;
}

export interface DashboardStats {
  totalFaturamento: number;
  totalNotas: number;
  ticketMedio: number;
  totalDescontos: number;
  totalItens: number;
  marketplacesCount: Record<string, number>;
  marketplacesFaturamento: Record<string, number>;
  coresCount: Record<string, number>;
  ufDistribution: Record<string, number>;
  timeline: Array<{ data: string; total: number; count: number }>;
  topClientes: Array<{ nome: string; total: number; count: number; uf: string }>;
}

export interface PowerBiConfig {
  enabled: boolean;
  refreshIntervalMinutes: number;
  lastRefresh: string;
  apiKey: string;
  feedUrl: string;
}

export interface GSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  autoSync: boolean;
  lastSync: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  webhookUrl?: string;
}

export interface GDriveDesktopStatus {
  enabled: boolean;
  folderPath: string;
  exists: boolean;
  totalPdfs: number;
  lastSync: string;
  watcherActive: boolean;
  autoSync: boolean;
  lastError?: string | null;
  recentProcessed?: Array<{
    fatura: string;
    nome: string;
    cor: string;
    valor: string;
    timestamp: string;
    filename: string;
  }>;
}

export interface SystemSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSender: string;
  emailAlertsEnabled: boolean;
  pushAlertsEnabled: boolean;
  autoExportExcel: boolean;
  useGeminiOcrFallback: boolean;
  vpsMode: boolean;
  gdriveDesktopPath?: string;
}

export interface N8nConfig {
  webhookUrl: string;
  active: boolean;
  events: {
    newInvoices: boolean;
    duplicateDetected: boolean;
    mapCitySale: boolean;
    dailySummary: boolean;
  };
  lastTrigger?: string;
  lastStatus?: 'SUCCESS' | 'ERROR' | 'IDLE';
}
