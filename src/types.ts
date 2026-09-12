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

export interface InvoiceXmlDetails {
  // 1. Identificação & Protocolo (<ide>, <infProt>)
  chaveAcesso?: string;              // chNFe (44 dígitos da NF-e)
  protocoloAutorizacao?: string;     // nProt
  dataHoraAutorizacao?: string;      // dhRecbto
  statusSefaz?: string;              // cStat - xMotivo
  serie?: string;                    // serie
  naturezaOperacao?: string;         // natOp
  tipoOperacao?: string;             // tpNF (0-Entrada, 1-Saída)
  tipoEmissao?: string;              // tpEmis (1-Normal, etc)
  finalidadeEmissao?: string;        // finNFe (1-Normal, 2-Complementar, 4-Devolução)
  ambiente?: string;                 // tpAmb (1-Produção, 2-Homologação)

  // 2. Emitente (<emit>, <enderEmit>)
  emitenteCnpj?: string;             // CNPJ do emitente
  emitenteNome?: string;             // Razão social emitente
  emitenteFantasia?: string;         // Nome fantasia emitente
  emitenteIe?: string;               // Inscrição Estadual
  emitenteCrt?: string;              // CRT (1-Simples, 3-Regime Normal)
  emitenteLogradouro?: string;
  emitenteNumero?: string;
  emitenteBairro?: string;
  emitenteMunicipio?: string;
  emitenteUf?: string;
  emitenteCep?: string;

  // 3. Destinatário & Endereço Completo (<dest>, <enderDest>)
  destinatarioNome?: string;         // xNome
  destinatarioDoc?: string;          // CPF ou CNPJ
  destinatarioIe?: string;           // IE
  destinatarioIndIe?: string;        // indIEDest (1-Contribuinte, 2-Isento, 9-Não Contribuinte)
  destinatarioEmail?: string;        // email
  destinatarioTelefone?: string;     // fone
  destinatarioLogradouro?: string;   // xLgr
  destinatarioNumero?: string;       // nro
  destinatarioComplemento?: string;  // xCpl
  destinatarioBairro?: string;       // xBairro
  destinatarioCodigoMunicipio?: string; // cMun (Código IBGE)
  destinatarioMunicipio?: string;    // xMun
  destinatarioUf?: string;           // UF
  destinatarioCep?: string;          // CEP
  destinatarioPais?: string;         // xPais

  // 4. Detalhe do Item / Produto (<det>, <prod>)
  itemNumero?: string;               // nItem
  produtoCodigo?: string;            // cProd
  produtoEan?: string;               // cEAN (GTIN)
  produtoDescricao?: string;         // xProd
  produtoNcm?: string;               // NCM (8 dígitos)
  produtoCfop?: string;              // CFOP (4 dígitos)
  produtoUnidade?: string;           // uCom (UN, CX, KG, etc)
  produtoQuantidade?: string;        // qCom
  produtoValorUnitario?: string;     // vUnCom
  produtoValorTotal?: string;        // vProd
  produtoDesconto?: string;          // vDesc
  produtoFrete?: string;             // vFrete
  produtoSeguro?: string;            // vSeg
  produtoOutrasDespesas?: string;    // vOutro
  produtoInfoAdicional?: string;     // infAdProd

  // 5. Impostos do Item (<imposto>, <ICMS>, <PIS>, <COFINS>, <IPI>)
  icmsOrigem?: string;               // orig (0-Nacional, etc)
  icmsCstCsosn?: string;             // CST ou CSOSN
  icmsBaseCalculo?: string;          // vBC
  icmsAliquota?: string;             // pICMS
  icmsValor?: string;                // vICMS
  pisCst?: string;                   // CST PIS
  pisBaseCalculo?: string;           // vBC PIS
  pisAliquota?: string;              // pPIS
  pisValor?: string;                 // vPIS
  cofinsCst?: string;                // CST COFINS
  cofinsBaseCalculo?: string;        // vBC COFINS
  cofinsAliquota?: string;           // pCOFINS
  cofinsValor?: string;              // vCOFINS
  ipiValor?: string;                 // vIPI
  totalTributosAprox?: string;       // vTotTrib

  // 6. Totais da NF-e (<total>, <ICMSTot>)
  totalBaseIcms?: string;            // vBC
  totalValorIcms?: string;           // vICMS
  totalIcmsDesonerado?: string;      // vICMSDeson
  totalIcmsSt?: string;              // vST
  totalProdutos?: string;            // vProd
  totalFrete?: string;               // vFrete
  totalSeguro?: string;              // vSeg
  totalDesconto?: string;            // vDesc
  totalIpi?: string;                 // vIPI
  totalPis?: string;                 // vPIS
  totalCofins?: string;              // vCOFINS
  totalOutrasDespesas?: string;      // vOutro
  totalNotaFiscal?: string;          // vNF

  // 7. Transporte & Volumes (<transp>)
  transporteModalidadeFrete?: string;// modFrete (0-CIF, 1-FOB, 9-Sem Frete)
  transportadoraCnpjDoc?: string;    // CNPJ / CPF Transportadora
  transportadoraNome?: string;       // xNome
  transportadoraIe?: string;         // IE
  transportadoraEndereco?: string;   // xEnder
  transportadoraMunicipio?: string;  // xMun
  transportadoraUf?: string;         // UF
  transportePlaca?: string;          // placa
  transporteVolumeQuantidade?: string; // qVol
  transporteVolumeEspecie?: string;  // esp
  transporteVolumeMarca?: string;    // marca
  transporteVolumePesoLiquido?: string; // pesoL
  transporteVolumePesoBruto?: string;   // pesoB

  // 8. Cobrança e Duplicatas (<cobr>)
  cobrancaFaturaNumero?: string;     // nFat
  cobrancaValorOriginal?: string;    // vOrig
  cobrancaValorDesconto?: string;    // vDesc
  cobrancaValorLiquido?: string;     // vLiq
  cobrancaDuplicatasResumo?: string; // Duplicatas/Parcelas

  // 9. Pagamento (<pag>, <detPag>)
  pagamentoForma?: string;           // tPag (01-Dinheiro, 03-Cartão Crédito, 15-Boleto, 17-PIX, 99-Outros)
  pagamentoValor?: string;           // vPag
  pagamentoCartaoBandeira?: string;  // tBand
  pagamentoCartaoAutorizacao?: string; // cAut

  // 10. Intermediador da Transação (<infIntermed>)
  intermediadorCnpj?: string;        // CNPJ da Plataforma/Marketplace
  intermediadorIdentificador?: string;// idCadIntTran
  intermediadorNome?: string;        // Nome amigável do Marketplace

  // 11. Informações Adicionais (<infAdic>)
  informacoesComplementares?: string;// infCpl
  informacoesFisco?: string;         // infAdFisco
}

export interface Invoice extends Partial<InvoiceXmlDetails> {
  id: string;
  // Campos principais de compatibilidade e exibição:
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
  xmlDetails?: InvoiceXmlDetails;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'AUDITOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLogin: string;
  avatar?: string;
  department?: string;
}

export type LogCategory = 'UPLOAD' | 'EDIT' | 'DELETE' | 'SYNC' | 'AUTH' | 'EXPORT' | 'ALERT' | 'SYSTEM' | 'SECURITY';
export type LogSeverity = 'info' | 'warning' | 'error' | 'success';

export interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  category: LogCategory;
  details: string;
  ip: string;
  severity: LogSeverity;
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'HIGH_VALUE' | 'HIGH_TAX' | 'BATCH_COMPLETE' | 'EXTRACTION_ERROR' | 'UNUSUAL_UF';
  threshold?: number;
  emailNotify: boolean;
  pushNotify: boolean;
  active: boolean;
  lastTriggered?: string;
}

export interface DashboardFilter {
  startDate?: string;
  endDate?: string;
  origem?: string;
  cor?: string;
  uf?: string;
  search?: string;
  status?: string;
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
}

export interface MunicipioSP {
  nome: string;
  codigoIbge: string;
  lat: number;
  lng: number;
  regiao: string;
  populacao?: number;
  uf?: string;
}

export interface MunicipioInfoAvancada {
  cidade: string;
  grandeComando?: string;
  adesao?: string;
  temGcm?: boolean | string;
  card?: string;
  situacaoGeral?: string;
  acao?: string;
  observacao?: string;
  empresaMonitoramento?: string;
  totalAtendimentos?: number;
  camerasTotal?: number;
  camerasFacial?: number;
  camerasLpr?: number;
  camerasRtsp?: number;
  facial?: number;
  lpr?: number;
  rtspStream?: number;
  temCameras?: boolean | string;
  dataAtualizacao?: string;
  populacao?: number;
  populacaoFormatada?: string;
  codigoIbge?: string;
  lat?: number;
  lng?: number;
  regiao?: string;
  [key: string]: any;
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

export type TipoAtendimento =
  | 'municipio'
  | 'orgao_publico'
  | 'pmesp'
  | 'policia_civil'
  | 'empresa'
  | 'pessoa_fisica'
  | 'evento'
  | 'demanda'
  | 'publico_interno'
  | 'outros';

export type StatusIntegracao =
  | 'integrado'
  | 'em_integracao'
  | 'sem_cameras'
  | 'agendado'
  | 'outros';

export type PrioridadeAtendimento = 'baixa' | 'media' | 'alta' | 'critica';

export interface Atendimento {
  id: string;
  data: string;
  hora: string;
  municipio: string;
  uf: string;
  codigoIbge?: string;
  lat?: number;
  lng?: number;
  tipo: TipoAtendimento | string;
  status: StatusIntegracao | string;
  prioridade?: PrioridadeAtendimento;
  nomeEntidade?: string;
  responsavel: string;
  descricao: string;
  camerasQtd: number;
  facialQtd?: number;
  lprQtd?: number;
  rtspQtd?: number;
  grandeComando?: string;
  temGcm?: boolean | string;
  adesao?: string;
  card?: string;
  situacaoGeral?: string;
  acao?: string;
  observacao?: string;
  empresaMonitoramento?: string;
  protocolo?: string;
  timestamp: number;
  sheetRowIndex?: number;
  sourceSheet?: string;
}

export interface UnifiedSheetResult {
  muralha: Atendimento[];
  consolidado: Atendimento[];
  combined: Atendimento[];
  produtividade?: Atendimento[];
  municipiosInfo: Record<string, MunicipioInfoAvancada>;
  totalCount: number;
  totalMunicipios?: number;
  columnsDetected?: string[];
  lastSyncTime: string;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  errors: string[];
  [key: string]: any;
}

export interface CitySummary {
  cidade: string;
  uf: string;
  lat: number;
  lng: number;
  totalAtendimentos: number;
  integrados: number;
  emIntegracao: number;
  semCameras: number;
  agendados: number;
  camerasTotal: number;
  camerasFacial: number;
  camerasLpr: number;
  camerasRtsp: number;
  temGcm: boolean;
  adesao: boolean;
  grandeComando?: string;
  populacao?: number;
  codigoIbge?: string;
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
  gdriveDesktopPath?: string;
}

// ================= ESTOQUE & PRODUTOS =================
export type StockMovementType = 
  | 'SAIDA_VENDA' 
  | 'ENTRADA_COMPRA' 
  | 'ENTRADA_PRODUCAO' 
  | 'AJUSTE_POSITIVO' 
  | 'AJUSTE_NEGATIVO' 
  | 'PERDA_AVARIA' 
  | 'ESTORNO';

export type StockStatusLevel = 'NORMAL' | 'BAIXO' | 'CRITICO' | 'ZERADO';

export interface StockItem {
  id: string;
  sku: string;
  nome: string;
  categoria: string;
  cor: string;
  unidade: string;
  estoqueInicial: number;
  totalEntradas: number;
  totalSaidas: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueSeguranca: number;
  precoCusto: number;
  precoVenda: number;
  localizacao: string;
  ativo: boolean;
  // Métricas calculadas
  status: StockStatusLevel;
  consumoMedioDiario: number;
  diasCobertura: number;
  previsaoEsgotamento: string;
  valorTotalEstoqueCusto: number;
  valorTotalEstoqueVenda: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  sku: string;
  tipo: StockMovementType;
  quantidade: number;
  saldoAnterior: number;
  saldoPosterior: number;
  documentoRef?: string;
  origemCanal?: string;
  motivo?: string;
  valorUnitario: number;
  valorTotal: number;
  usuarioId: string;
  usuarioNome: string;
  dataMovimentacao: string;
}

export interface StockStats {
  totalItensCadastrados: number;
  totalUnidadesEstoque: number;
  valorPatrimonialCusto: number;
  valorPotencialVenda: number;
  margemLucroBrutaEstimada: number;
  totalSaidas30Dias: number;
  totalEntradas30Dias: number;
  giroDiarioMedio: number;
  diasCoberturaGeral: number;
  itensStatus: {
    normal: number;
    baixo: number;
    critico: number;
    zerado: number;
  };
  topVendidos: Array<{
    sku: string;
    nome: string;
    cor: string;
    totalVendido: number;
    faturamento: number;
    participacaoPercent: number;
  }>;
  distribuicaoCores: Record<string, number>;
  movimentacoesRecentes: StockMovement[];
  consumoPorCanal: Record<string, number>;
  evolucaoSaidas: Array<{ data: string; quantidade: number; valor: number }>;
}

export interface NewStockMovementPayload {
  productId: string;
  tipo: StockMovementType;
  quantidade: number;
  documentoRef?: string;
  origemCanal?: string;
  motivo?: string;
  valorUnitario?: number;
}

export interface GDriveOnlineStatus {
  folderId: string;
  folderUrl: string;
  autoPoll: boolean;
  intervalSec: number;
  lastPoll: string;
  lastError: string | null;
  pollerActive: boolean;
}


