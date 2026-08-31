import { 
  Invoice, 
  User, 
  LogEntry, 
  AlertRule, 
  DashboardStats, 
  GSheetsConfig, 
  SystemSettings,
  N8nConfig
} from '../types';

const TOKEN_KEY = 'fiscal_app_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao realizar login');
    }
    const data = await res.json();
    setStoredToken(data.token);
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch('/api/auth/me', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Sessão expirada');
    const data = await res.json();
    return data.user;
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/users', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.users;
  },

  async createUser(userData: any): Promise<User> {
    const res = await fetch('/api/auth/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar usuário');
    }
    const data = await res.json();
    return data.user;
  },

  async updateUser(id: string, userData: any): Promise<User> {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    return data.user;
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao excluir usuário');
    }
  },

  // Invoices (SPM Store 17 campos)
  async getInvoices(filters?: Record<string, string>): Promise<{ invoices: Invoice[]; totalCount: number }> {
    const query = new URLSearchParams(filters || {}).toString();
    const res = await fetch(`/api/invoices?${query}`, { headers: getAuthHeaders() });
    return await res.json();
  },

  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(invoice)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar nota fiscal');
    }
    const data = await res.json();
    return data.invoice;
  },

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(invoice)
    });
    const data = await res.json();
    return data.invoice;
  },

  async deleteInvoice(id: string): Promise<void> {
    await fetch(`/api/invoices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async bulkDeleteInvoices(ids: string[]): Promise<void> {
    await fetch('/api/invoices/bulk-delete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids })
    });
  },

  async bulkUpdateInvoices(ids: string[], updates: Partial<Invoice>): Promise<{ success: boolean; updatedCount: number; message: string }> {
    const res = await fetch('/api/invoices/bulk-update', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids, updates })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao atualizar notas em lote');
    }
    return await res.json();
  },

  async resetDatabase(): Promise<{ message: string; count: number; removedCount: number }> {
    const res = await fetch('/api/invoices/reset', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao zerar banco de dados');
    }
    return await res.json();
  },

  // PDF Extraction (SPM JavaScript Engine)
  async uploadPdfBatch(files: File[]): Promise<{ 
    extractedCount: number; 
    newInsertedCount?: number;
    duplicateCount?: number;
    duplicates?: Array<{ fatura: string; documento: string; nome: string; codigo: string; motivo: string }>;
    extractedInvoices: Invoice[]; 
    errors: any[] 
  }> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    const token = getStoredToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/extract/pdf', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao processar lote de PDFs');
    }

    return await res.json();
  },

  async scanLocalFolder(): Promise<{ 
    success: boolean; 
    count: number; 
    duplicateCount?: number;
    duplicates?: Array<{ fatura: string; documento: string; nome: string; codigo: string; motivo: string }>;
    totalPdfs: number; 
    extracted: Invoice[] 
  }> {
    const res = await fetch('/api/scan-local-folder', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao escanear pasta local de notas');
    }
    return await res.json();
  },

  async uploadExcel(file: File): Promise<{ 
    success: boolean;
    totalRows: number;
    updatedCount: number;
    insertedCount: number;
    message: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getStoredToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/invoices/import-excel', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao importar arquivo Excel');
    }

    return await res.json();
  },

  async importExcelInvoices(file: File): Promise<{
    success: boolean;
    totalRows: number;
    updatedCount: number;
    insertedCount: number;
    message: string;
  }> {
    return this.uploadExcel(file);
  },

  // Stats
  async getStats(filters?: Record<string, string>): Promise<DashboardStats> {
    const query = new URLSearchParams(filters || {}).toString();
    const res = await fetch(`/api/stats?${query}`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.stats;
  },

  // Google Sheets
  async syncGSheets(): Promise<{ syncedCount: number; lastSync: string }> {
    const res = await fetch('/api/gsheets/sync', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getGSheetsConfig(): Promise<GSheetsConfig> {
    const res = await fetch('/api/gsheets/config', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.config;
  },

  async updateGSheetsConfig(config: Partial<GSheetsConfig>): Promise<GSheetsConfig> {
    const res = await fetch('/api/gsheets/config', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });
    const data = await res.json();
    return data.config;
  },

  async testGSheetsWebhook(webhookUrl: string): Promise<{ success: boolean; status: number; durationMs: number; response: string }> {
    const res = await fetch('/api/gsheets/test-webhook', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ webhookUrl })
    });
    
    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { error: text || 'Resposta vazia do servidor' };
    }

    if (!res.ok) {
      throw new Error(data.error || 'Falha no teste de conexão com o Webhook.');
    }
    return data;
  },

  // Alerts
  async getAlerts(): Promise<AlertRule[]> {
    const res = await fetch('/api/alerts', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.alerts;
  },

  async createAlert(alertData: Partial<AlertRule>): Promise<AlertRule> {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(alertData)
    });
    const data = await res.json();
    return data.alert;
  },

  async updateAlert(id: string, alertData: Partial<AlertRule>): Promise<AlertRule> {
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(alertData)
    });
    const data = await res.json();
    return data.alert;
  },

  async deleteAlert(id: string): Promise<void> {
    await fetch(`/api/alerts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async sendTestEmail(recipientEmail: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/notifications/test-email', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recipientEmail })
    });
    return await res.json();
  },

  async sendTestPush(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/notifications/push-test', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Logs
  async getLogs(): Promise<LogEntry[]> {
    const res = await fetch('/api/logs', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.logs;
  },

  async clearLogs(): Promise<void> {
    await fetch('/api/logs', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // System Settings
  async getSettings(): Promise<{ settings: SystemSettings; powerBiConfig: any; gsheetsConfig: any }> {
    const res = await fetch('/api/settings', { headers: getAuthHeaders() });
    return await res.json();
  },

  async updateSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newSettings)
    });
    const data = await res.json();
    return data.settings;
  },

  // n8n Integration
  async getN8nConfig(): Promise<N8nConfig> {
    const res = await fetch('/api/n8n/config', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.config;
  },

  async updateN8nConfig(config: Partial<N8nConfig>): Promise<N8nConfig> {
    const res = await fetch('/api/n8n/config', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });
    const data = await res.json();
    return data.config;
  },

  async testN8nWebhook(webhookUrl: string): Promise<{ success: boolean; status: number; durationMs: number; response: string }> {
    const res = await fetch('/api/n8n/test-webhook', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ webhookUrl })
    });
    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { error: text || 'Erro de resposta do n8n' };
    }
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao testar conexão com o n8n');
    }
    return data;
  },

  // Google Drive para Desktop (100% Offline / Monitoramento em Tempo Real)
  async getGDriveDesktopStatus(): Promise<import('../types').GDriveDesktopStatus> {
    const res = await fetch('/api/gdrive-desktop/status', { headers: getAuthHeaders() });
    return await res.json();
  },

  async scanGDriveDesktop(): Promise<{
    success: boolean;
    count: number;
    duplicateCount: number;
    duplicates: Array<{ fatura: string; documento: string; nome: string; codigo: string; motivo: string }>;
    totalPdfs: number;
    extracted: Invoice[];
    folderPath: string;
  }> {
    const res = await fetch('/api/gdrive-desktop/scan', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao escanear pasta do Google Drive');
    }
    return await res.json();
  },

  async updateGDriveDesktopConfig(config: { folderPath?: string; autoSync?: boolean }): Promise<import('../types').GDriveDesktopStatus> {
    const res = await fetch('/api/gdrive-desktop/config', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });
    return await res.json();
  }
};

