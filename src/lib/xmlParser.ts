import { XMLParser } from 'fast-xml-parser';
import { Invoice, InvoiceXmlDetails } from '../types';

function formatCpfCnpj(doc: string | number | undefined): string {
  if (!doc) return '';
  const clean = String(doc).replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return clean;
}

function formatCep(cep: string | number | undefined): string {
  if (!cep) return '';
  const clean = String(cep).replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return clean;
}

function formatCurrencyBr(val: number | string | undefined): string {
  if (val === undefined || val === null || val === '') return '0,00';
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(n)) return '0,00';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateBr(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toLocaleDateString('pt-BR');
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (_) {}

  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
}

function detectColor(text: string): string {
  const upper = (text || '').toUpperCase();
  // 1. Cores explícitas
  if (upper.includes('COR:MARROM') || upper.includes(' MARROM') || upper.includes('-MARROM') || upper.includes('MARROM30') || upper.includes('MARROM40') || upper.includes('BROWN') || upper.includes('CAFE') || upper.includes('CAFÉ')) {
    return 'Marrom';
  }
  if (upper.includes('COR:INCOLOR') || upper.includes(' INCOLOR') || upper.includes('-INCOLOR') || upper.includes('TRANSPARENTE') || upper.includes('NATURAL') || upper.includes('LIMPADOR')) {
    return 'Incolor';
  }
  if (upper.includes('COR:PRETO') || upper.includes(' PRETO') || upper.includes('-PRETO') || upper.includes('PRETO30') || upper.includes('PRETO40') || upper.includes('BLACK')) {
    return 'Preto';
  }
  if (upper.includes('KIT 2') || upper.includes('2 UNIDADES') || upper.includes('KIT2')) {
    return 'Kit 2';
  }
  if (upper.includes('KIT 1') || upper.includes('KIT1') || upper.includes('KIT DE LIMPEZA') || upper.includes('COMBO') || (upper.includes('ESPONJA') && upper.includes('FLANELA'))) {
    return 'Kit 1';
  }
  if (upper.includes('ESPONJA')) return 'Esponja';
  if (upper.includes('FLANELA')) return 'Flanela';

  // 2. Linha padrão SPM Store (Verniz Graxa Elite SPM militar para coturnos e botas é Preto por definição)
  if (upper.includes('COTURNO') || upper.includes('GRAXA') || upper.includes('VERNIZ ELITE SPM') || upper.includes('HEROIS') || upper.includes('MILITAR') || upper.includes('SAPATO SOCIAL') || upper.includes('SPMVERNIZ') || upper.includes('SPM-01')) {
    return 'Preto';
  }

  return 'Preto';
}

function mapMarketplaceFromCnpjOrText(cnpj?: string, text?: string, code?: string, extra?: string): string {
  const cleanCnpj = (cnpj || '').replace(/\D/g, '');
  if (cleanCnpj === '03007331000141' || cleanCnpj === '16524211000198') return 'Mercado Livre';
  if (cleanCnpj === '35635824000112' || cleanCnpj === '35635824000200') return 'Shopee';
  if (cleanCnpj === '27415911000136' || cleanCnpj === '50074558000118') return 'TikTok';
  if (cleanCnpj === '15436940000103' || cleanCnpj === '03499243000104') return 'Amazon';
  if (cleanCnpj === '47960950000121') return 'Magalu';
  if (cleanCnpj === '40154884000153') return 'Shein';

  const upper = `${text || ''} ${code || ''} ${extra || ''}`.toUpperCase();
  if (upper.includes('MERCADO LIVRE') || upper.includes('MERCADOLIVRE') || upper.includes('MELI') || upper.startsWith('MLB') || upper.includes('MLB')) {
    return 'Mercado Livre';
  }
  if (upper.includes('TIKTOK') || upper.includes('TIK TOK') || upper.startsWith('TOK') || upper.includes('TOKSPM')) {
    return 'TikTok';
  }
  if (upper.includes('WHATSAPP') || upper.includes('WPP') || upper.includes('ZAP')) {
    return 'WhatsApp';
  }
  if (upper.includes('SHOPEE') || upper.includes('SHP') || upper.startsWith('SPM') || upper.includes('SPMVERNIZ') || upper.startsWith('spm')) {
    return 'Shopee';
  }
  if (upper.includes('AMAZON') || upper.includes('AMZN')) return 'Amazon';
  if (upper.includes('MAGALU') || upper.includes('MAGAZINE LUIZA')) return 'Magalu';
  if (upper.includes('SHEIN')) return 'Shein';
  if (upper.includes('BLING')) return 'Bling';
  if (upper.includes('TINY')) return 'Tiny';
  if (upper.includes('SITE') || upper.includes('LOJA VIRTUAL') || upper.includes('ECOMMERCE')) return 'Site Próprio';
  return 'Outros';
}

function mapModalidadeFrete(mod: string | number | undefined): string {
  const m = String(mod || '').trim();
  switch (m) {
    case '0': return '0 - Contratação por conta do Remetente (CIF)';
    case '1': return '1 - Contratação por conta do Destinatário (FOB)';
    case '2': return '2 - Contratação por conta de Terceiros';
    case '3': return '3 - Transporte Próprio por conta do Remetente';
    case '4': return '4 - Transporte Próprio por conta do Destinatário';
    case '9': return '9 - Sem Ocorrência de Transporte';
    default: return m ? `${m} - Outro` : '9 - Sem Frete';
  }
}

function mapFormaPagamento(tPag: string | number | undefined): string {
  const t = String(tPag || '').trim();
  switch (t) {
    case '01': return '01 - Dinheiro';
    case '02': return '02 - Cheque';
    case '03': return '03 - Cartão de Crédito';
    case '04': return '04 - Cartão de Débito';
    case '05': return '05 - Crédito Loja';
    case '10': return '10 - Vale Alimentação';
    case '11': return '11 - Vale Refeição';
    case '12': return '12 - Vale Presente';
    case '13': return '13 - Vale Combustível';
    case '14': return '14 - Duplicata Mercantil';
    case '15': return '15 - Boleto Bancário';
    case '16': return '16 - Depósito Bancário';
    case '17': return '17 - Pagamento Instantâneo (PIX)';
    case '18': return '18 - Transferência bancária, Carteira Digital';
    case '19': return '19 - Programa de fidelidade, Cashback';
    case '90': return '90 - Sem pagamento';
    case '99': return '99 - Outros';
    default: return t ? `${t} - Outros` : '99 - Outros';
  }
}

function mapBandeiraCartao(tBand: string | number | undefined): string {
  const b = String(tBand || '').trim();
  switch (b) {
    case '01': return 'Visa';
    case '02': return 'Mastercard';
    case '03': return 'American Express';
    case '04': return 'Sorocred';
    case '05': return 'Diners Club';
    case '06': return 'Elo';
    case '07': return 'Hipercard';
    case '08': return 'Aura';
    case '09': return 'Cabal';
    case '99': return 'Outros';
    default: return b || '';
  }
}

function findNFeNodes(obj: any): any[] {
  if (!obj || typeof obj !== 'object') return [];
  const results: any[] = [];

  if (obj.infNFe || (obj.ide && obj.dest)) {
    results.push(obj);
    return results;
  }

  if (obj.NFe) {
    const list = Array.isArray(obj.NFe) ? obj.NFe : [obj.NFe];
    list.forEach(item => results.push(...findNFeNodes(item)));
    return results;
  }

  if (obj.nfeProc) {
    const list = Array.isArray(obj.nfeProc) ? obj.nfeProc : [obj.nfeProc];
    list.forEach(item => results.push(...findNFeNodes(item)));
    return results;
  }

  if (obj.enviNFe) {
    const list = Array.isArray(obj.enviNFe) ? obj.enviNFe : [obj.enviNFe];
    list.forEach(item => results.push(...findNFeNodes(item)));
    return results;
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const sub = findNFeNodes(obj[key]);
      if (sub.length > 0) results.push(...sub);
    }
  }

  return results;
}

function extractProtMap(obj: any): Record<string, any> {
  const protMap: Record<string, any> = {};
  if (!obj || typeof obj !== 'object') return protMap;

  function walk(curr: any) {
    if (!curr || typeof curr !== 'object') return;
    if (curr.protNFe?.infProt) {
      const p = curr.protNFe.infProt;
      if (p.chNFe) protMap[p.chNFe] = p;
    }
    if (curr.infProt && curr.infProt.chNFe) {
      protMap[curr.infProt.chNFe] = curr.infProt;
    }
    for (const k of Object.keys(curr)) {
      if (typeof curr[k] === 'object' && curr[k] !== null) {
        walk(curr[k]);
      }
    }
  }

  walk(obj);
  return protMap;
}

/**
 * Extrai notas fiscais estruturadas a partir do XML da NF-e (SEFAZ padrão nacional 4.00)
 * com todas as tags de <dest>, <enderDest>, <det/prod>, <imposto>, <total>, <transp>, <cobr>, <pag>, <infIntermed>, <infProt>
 */
export function extractSpmInvoicesFromNfeXml(xmlContent: string, originalFilename = 'nfe.xml'): Invoice[] {
  if (!xmlContent || typeof xmlContent !== 'string') return [];

  // Remover eventuais caracteres BOM ou espaços antes da tag inicial
  const cleanXml = xmlContent.replace(/^\uFEFF/, '').trim();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    trimValues: true,
    parseTagValue: false,
    removeNSPrefix: true
  });

  let parsedObj: any;
  try {
    parsedObj = parser.parse(cleanXml);
  } catch (err: any) {
    console.error(`[XML Parser] Erro ao fazer parse de ${originalFilename}:`, err.message);
    return [];
  }

  if (!parsedObj) return [];

  const protNFeMap = extractProtMap(parsedObj);
  const nfeNodes = findNFeNodes(parsedObj);

  if (nfeNodes.length === 0) {
    console.warn(`[XML Parser] Nenhuma tag <NFe> ou <infNFe> encontrada no arquivo: ${originalFilename}`);
    return [];
  }

  const invoices: Invoice[] = [];

  for (const nfe of nfeNodes) {
    try {
      const infNFe = nfe.infNFe || nfe;
      if (!infNFe) continue;

      const rawIdAttr = infNFe['@_Id'] || nfe['@_Id'] || '';
      const chaveAcessoRaw = String(rawIdAttr).replace(/^NFe/, '').trim();

      const ide = infNFe.ide || {};
      const emit = infNFe.emit || {};
      const dest = infNFe.dest || {};
      const total = infNFe.total?.ICMSTot || infNFe.total || {};
      const transp = infNFe.transp || {};
      const cobr = infNFe.cobr || {};
      const pag = infNFe.pag || {};
      const infIntermed = infNFe.infIntermed || {};
      const infAdic = infNFe.infAdic || {};
      
      const infProt = nfe.protNFe?.infProt || protNFeMap[chaveAcessoRaw] || {};
      const chaveAcesso = infProt.chNFe || chaveAcessoRaw || '';

      // 1. Identificação (<ide>, <infProt>)
      const faturaNumero = String(ide.nNF || '').padStart(6, '0');
      const serieNfe = String(ide.serie || '1');
      const natOp = String(ide.natOp || 'Venda de Mercadorias');
      const tipoOperacao = String(ide.tpNF || '1') === '0' ? '0 - Entrada' : '1 - Saída';
      const tipoEmissao = String(ide.tpEmis || '1');
      const finNFe = String(ide.finNFe || '1');
      const ambiente = String(ide.tpAmb || '1') === '1' ? '1 - Produção' : '2 - Homologação';
      const nProt = String(infProt.nProt || '');
      const dhRecbto = String(infProt.dhRecbto || '');
      const cStat = String(infProt.cStat || '100');
      const xMotivo = String(infProt.xMotivo || 'Autorizado o uso da NF-e');
      const statusSefaz = `${cStat} - ${xMotivo}`;

      const dataEmissaoRaw = ide.dhSaiEnt || ide.dhEmi || ide.dSaiEnt || ide.dEmi || '';
      const dataSaidaFormatted = formatDateBr(dataEmissaoRaw);

      // 2. Emitente (<emit>)
      const emitCnpj = formatCpfCnpj(emit.CNPJ || '');
      const emitNome = String(emit.xNome || 'SPM STORE');
      const emitFant = String(emit.xFant || emitNome);
      const emitIe = String(emit.IE || '');
      const emitCrt = String(emit.CRT || '1');
      const enderEmit = emit.enderEmit || {};

      // 3. Destinatário (<dest>, <enderDest>)
      const nomeCliente = String(dest.xNome || 'Consumidor Final');
      const docCliente = formatCpfCnpj(dest.CPF || dest.CNPJ || '');
      const destIe = String(dest.IE || '');
      const destIndIe = String(dest.indIEDest || '9');
      const destEmail = String(dest.email || '');
      const destFone = String(dest.enderDest?.fone || dest.fone || '');

      const ender = dest.enderDest || {};
      const logradouro = String(ender.xLgr || '');
      const numero = String(ender.nro || '');
      const complemento = ender.xCpl ? ` - ${ender.xCpl}` : '';
      const enderecoCompleto = logradouro ? `${logradouro}, ${numero}${complemento}`.trim() : '';
      const bairro = String(ender.xBairro || '');
      const codigoMunicipio = String(ender.cMun || '');
      const municipio = String(ender.xMun || 'São Paulo');
      const uf = String(ender.UF || 'SP').toUpperCase();
      const cep = formatCep(ender.CEP || '');
      const pais = String(ender.xPais || 'Brasil');

      // 4. Totais da NF-e (<total>)
      const totalBaseIcms = formatCurrencyBr(total.vBC);
      const totalValorIcms = formatCurrencyBr(total.vICMS);
      const totalIcmsDeson = formatCurrencyBr(total.vICMSDeson);
      const totalIcmsSt = formatCurrencyBr(total.vST);
      const totalProdutos = formatCurrencyBr(total.vProd);
      const totalFrete = formatCurrencyBr(total.vFrete);
      const totalSeguro = formatCurrencyBr(total.vSeg);
      const totalDesconto = formatCurrencyBr(total.vDesc || 0);
      const totalIpi = formatCurrencyBr(total.vIPI);
      const totalPis = formatCurrencyBr(total.vPIS);
      const totalCofins = formatCurrencyBr(total.vCOFINS);
      const totalOutro = formatCurrencyBr(total.vOutro);
      const totalNota = formatCurrencyBr(total.vNF || total.vProd);
      const totalTribAprox = formatCurrencyBr(total.vTotTrib);

      // 5. Transporte (<transp>)
      const modalidadeFrete = mapModalidadeFrete(transp.modFrete);
      const transporta = transp.transporta || {};
      const transportadoraDoc = formatCpfCnpj(transporta.CNPJ || transporta.CPF || '');
      const transportadoraNome = String(transporta.xNome || '');
      const transportadoraIe = String(transporta.IE || '');
      const transportadoraEnder = String(transporta.xEnder || '');
      const transportadoraMun = String(transporta.xMun || '');
      const transportadoraUf = String(transporta.UF || '');
      const veicTransp = transp.veicTransp || {};
      const transpPlaca = String(veicTransp.placa || '');

      let volObj = transp.vol;
      if (Array.isArray(volObj)) volObj = volObj[0] || {};
      volObj = volObj || {};
      const volQtd = String(volObj.qVol || '1');
      const volEsp = String(volObj.esp || 'VOLUME');
      const volMarca = String(volObj.marca || '');
      const volPesoL = formatCurrencyBr(volObj.pesoL);
      const volPesoB = formatCurrencyBr(volObj.pesoB);

      // 6. Cobrança e Duplicatas (<cobr>)
      const cobrFat = cobr.fat || {};
      const nFat = String(cobrFat.nFat || faturaNumero);
      const vOrig = formatCurrencyBr(cobrFat.vOrig || total.vProd);
      const vDescFat = formatCurrencyBr(cobrFat.vDesc || total.vDesc);
      const vLiqFat = formatCurrencyBr(cobrFat.vLiq || total.vNF || total.vProd);

      let dupList: any[] = [];
      if (cobr.dup) {
        dupList = Array.isArray(cobr.dup) ? cobr.dup : [cobr.dup];
      }
      const duplicatasResumo = dupList.length > 0 
        ? dupList.map(d => `Nº ${d.nDup || 1}: Venc ${formatDateBr(d.dVenc)} - R$ ${formatCurrencyBr(d.vDup)}`).join(' | ')
        : `À Vista (R$ ${totalNota})`;

      // 7. Pagamento (<pag>)
      let detPagList: any[] = [];
      if (pag.detPag) {
        detPagList = Array.isArray(pag.detPag) ? pag.detPag : [pag.detPag];
      }
      const primaryPag = detPagList[0] || {};
      const formaPagto = mapFormaPagamento(primaryPag.tPag);
      const valorPagto = formatCurrencyBr(primaryPag.vPag || total.vNF || total.vProd);
      const cardObj = primaryPag.card || {};
      const bandeiraCartao = mapBandeiraCartao(cardObj.tBand);
      const autCartao = String(cardObj.cAut || '');

      // 8. Intermediador da Transação (<infIntermed>)
      const intermedCnpj = formatCpfCnpj(infIntermed.CNPJ || '');
      const intermedId = String(infIntermed.idCadIntTran || '');

      // 9. Informações Complementares & Marketplace
      const infCpl = String(infAdic.infCpl || '');
      const infAdFisco = String(infAdic.infAdFisco || '');
      const combinedText = `${infCpl} ${infAdFisco} ${emitFant} ${intermedId}`;
      const marketplaceOrigem = mapMarketplaceFromCnpjOrText(infIntermed.CNPJ, combinedText);

      // 10. Detalhes dos Itens (<det>)
      let detList: any[] = [];
      if (infNFe.det) {
        detList = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
      }

      if (detList.length === 0) {
        const invId = `spm-xml-${faturaNumero || Date.now()}-1`;
        const corItem = detectColor(combinedText);

        const xmlDetails: InvoiceXmlDetails = {
          chaveAcesso,
          protocoloAutorizacao: nProt,
          dataHoraAutorizacao: dhRecbto,
          statusSefaz,
          serie: serieNfe,
          naturezaOperacao: natOp,
          tipoOperacao,
          tipoEmissao,
          finalidadeEmissao: finNFe,
          ambiente,

          emitenteCnpj: emitCnpj,
          emitenteNome: emitNome,
          emitenteFantasia: emitFant,
          emitenteIe: emitIe,
          emitenteCrt: emitCrt,
          emitenteLogradouro: enderEmit.xLgr,
          emitenteNumero: enderEmit.nro,
          emitenteBairro: enderEmit.xBairro,
          emitenteMunicipio: enderEmit.xMun,
          emitenteUf: enderEmit.UF,
          emitenteCep: formatCep(enderEmit.CEP),

          destinatarioNome: nomeCliente,
          destinatarioDoc: docCliente,
          destinatarioIe: destIe,
          destinatarioIndIe: destIndIe,
          destinatarioEmail: destEmail,
          destinatarioTelefone: destFone,
          destinatarioLogradouro: logradouro,
          destinatarioNumero: numero,
          destinatarioComplemento: complemento,
          destinatarioBairro: bairro,
          destinatarioCodigoMunicipio: codigoMunicipio,
          destinatarioMunicipio: municipio,
          destinatarioUf: uf,
          destinatarioCep: cep,
          destinatarioPais: pais,

          itemNumero: '1',
          produtoCodigo: 'SPM-GERAL',
          produtoEan: '',
          produtoDescricao: 'Produtos SPM',
          produtoNcm: '',
          produtoCfop: '5102',
          produtoUnidade: 'UN',
          produtoQuantidade: '1',
          produtoValorUnitario: totalProdutos,
          produtoValorTotal: totalProdutos,
          produtoDesconto: totalDesconto,
          produtoFrete: totalFrete,
          produtoSeguro: totalSeguro,
          produtoOutrasDespesas: totalOutro,
          produtoInfoAdicional: '',

          icmsOrigem: '0',
          icmsCstCsosn: '102',
          icmsBaseCalculo: totalBaseIcms,
          icmsAliquota: '0,00',
          icmsValor: totalValorIcms,
          pisCst: '07',
          pisBaseCalculo: '0,00',
          pisAliquota: '0,00',
          pisValor: totalPis,
          cofinsCst: '07',
          cofinsBaseCalculo: '0,00',
          cofinsAliquota: '0,00',
          cofinsValor: totalCofins,
          ipiValor: totalIpi,
          totalTributosAprox: totalTribAprox,

          totalBaseIcms,
          totalValorIcms,
          totalIcmsDesonerado: totalIcmsDeson,
          totalIcmsSt,
          totalProdutos,
          totalFrete,
          totalSeguro,
          totalDesconto,
          totalIpi,
          totalPis,
          totalCofins,
          totalOutrasDespesas: totalOutro,
          totalNotaFiscal: totalNota,

          transporteModalidadeFrete: modalidadeFrete,
          transportadoraCnpjDoc: transportadoraDoc,
          transportadoraNome: transportadoraNome,
          transportadoraIe: transportadoraIe,
          transportadoraEndereco: transportadoraEnder,
          transportadoraMunicipio: transportadoraMun,
          transportadoraUf: transportadoraUf,
          transportePlaca: transpPlaca,
          transporteVolumeQuantidade: volQtd,
          transporteVolumeEspecie: volEsp,
          transporteVolumeMarca: volMarca,
          transporteVolumePesoLiquido: volPesoL,
          transporteVolumePesoBruto: volPesoB,

          cobrancaFaturaNumero: nFat,
          cobrancaValorOriginal: vOrig,
          cobrancaValorDesconto: vDescFat,
          cobrancaValorLiquido: vLiqFat,
          cobrancaDuplicatasResumo: duplicatasResumo,

          pagamentoForma: formaPagto,
          pagamentoValor: valorPagto,
          pagamentoCartaoBandeira: bandeiraCartao,
          pagamentoCartaoAutorizacao: autCartao,

          intermediadorCnpj: intermedCnpj,
          intermediadorIdentificador: intermedId,
          intermediadorNome: marketplaceOrigem,

          informacoesComplementares: infCpl,
          informacoesFisco: infAdFisco
        };

        invoices.push({
          id: invId,
          nome: nomeCliente,
          documento: docCliente,
          dataSaida: dataSaidaFormatted,
          endereco: enderecoCompleto,
          bairro,
          cep,
          municipio,
          uf,
          fatura: faturaNumero,
          valorProdutos: totalProdutos,
          valorNota: totalNota,
          desconto: totalDesconto,
          codigo: 'SPM-GERAL',
          quantidade: '1',
          descricao: 'Produtos SPM',
          cor: corItem,
          origem: marketplaceOrigem,
          origemArquivo: originalFilename,
          dataUpload: new Date().toISOString(),
          status: 'Processado',
          xmlDetails,
          ...xmlDetails
        });
      } else {
        detList.forEach((detItem, idx) => {
          const prod = detItem.prod || {};
          const imp = detItem.imposto || {};
          
          const itemNum = String(detItem['@_nItem'] || idx + 1);
          const itemCodigo = String(prod.cProd || `PROD-${itemNum}`);
          const itemEan = String(prod.cEAN || '');
          const itemDescricao = String(prod.xProd || 'Produto SPM');
          const itemNcm = String(prod.NCM || '');
          const itemCfop = String(prod.CFOP || '5102');
          const itemUnidade = String(prod.uCom || 'UN');
          const itemQtd = String(Math.round(parseFloat(prod.qCom || 1)) || 1);
          const itemVUnCom = formatCurrencyBr(prod.vUnCom);
          const itemVProd = formatCurrencyBr(prod.vProd || total.vProd);
          const itemVDesc = formatCurrencyBr(prod.vDesc || 0);
          const itemVFrete = formatCurrencyBr(prod.vFrete || 0);
          const itemVSeg = formatCurrencyBr(prod.vSeg || 0);
          const itemVOutro = formatCurrencyBr(prod.vOutro || 0);
          const itemInfAdProd = String(detItem.infAdProd || '');
          const itemCor = detectColor(`${itemDescricao} ${itemCodigo} ${itemInfAdProd}`);
          const itemMarketplace = mapMarketplaceFromCnpjOrText(
            infIntermed.CNPJ,
            combinedText,
            itemCodigo,
            `${itemDescricao} ${detItem.prod?.xPed || ''}`
          );

          // Impostos do Item
          const icmsObj = imp.ICMS ? Object.values(imp.ICMS)[0] as any : {};
          const icmsOrig = String(icmsObj?.orig || '0');
          const icmsCstCsosn = String(icmsObj?.CST || icmsObj?.CSOSN || '102');
          const icmsVBC = formatCurrencyBr(icmsObj?.vBC);
          const icmsPICMS = formatCurrencyBr(icmsObj?.pICMS);
          const icmsVICMS = formatCurrencyBr(icmsObj?.vICMS);

          const pisObj = imp.PIS ? Object.values(imp.PIS)[0] as any : {};
          const pisCST = String(pisObj?.CST || '07');
          const pisVBC = formatCurrencyBr(pisObj?.vBC);
          const pisPPIS = formatCurrencyBr(pisObj?.pPIS);
          const pisVPIS = formatCurrencyBr(pisObj?.vPIS);

          const cofinsObj = imp.COFINS ? Object.values(imp.COFINS)[0] as any : {};
          const cofinsCST = String(cofinsObj?.CST || '07');
          const cofinsVBC = formatCurrencyBr(cofinsObj?.vBC);
          const cofinsPCOFINS = formatCurrencyBr(cofinsObj?.pCOFINS);
          const cofinsVCOFINS = formatCurrencyBr(cofinsObj?.vCOFINS);

          const ipiObj = imp.IPI?.IPITrib || imp.IPI || {};
          const ipiVIPI = formatCurrencyBr(ipiObj?.vIPI || 0);
          const itemTotTrib = formatCurrencyBr(imp.vTotTrib || totalTribAprox);

          const invId = `spm-xml-${faturaNumero || Date.now()}-${itemNum}`;
          const itemValorFinalNota = detList.length === 1 ? totalNota : itemVProd;

          const xmlDetails: InvoiceXmlDetails = {
            chaveAcesso,
            protocoloAutorizacao: nProt,
            dataHoraAutorizacao: dhRecbto,
            statusSefaz,
            serie: serieNfe,
            naturezaOperacao: natOp,
            tipoOperacao,
            tipoEmissao,
            finalidadeEmissao: finNFe,
            ambiente,

            emitenteCnpj: emitCnpj,
            emitenteNome: emitNome,
            emitenteFantasia: emitFant,
            emitenteIe: emitIe,
            emitenteCrt: emitCrt,
            emitenteLogradouro: enderEmit.xLgr,
            emitenteNumero: enderEmit.nro,
            emitenteBairro: enderEmit.xBairro,
            emitenteMunicipio: enderEmit.xMun,
            emitenteUf: enderEmit.UF,
            emitenteCep: formatCep(enderEmit.CEP),

            destinatarioNome: nomeCliente,
            destinatarioDoc: docCliente,
            destinatarioIe: destIe,
            destinatarioIndIe: destIndIe,
            destinatarioEmail: destEmail,
            destinatarioTelefone: destFone,
            destinatarioLogradouro: logradouro,
            destinatarioNumero: numero,
            destinatarioComplemento: complemento,
            destinatarioBairro: bairro,
            destinatarioCodigoMunicipio: codigoMunicipio,
            destinatarioMunicipio: municipio,
            destinatarioUf: uf,
            destinatarioCep: cep,
            destinatarioPais: pais,

            itemNumero: itemNum,
            produtoCodigo: itemCodigo,
            produtoEan: itemEan,
            produtoDescricao: itemDescricao,
            produtoNcm: itemNcm,
            produtoCfop: itemCfop,
            produtoUnidade: itemUnidade,
            produtoQuantidade: itemQtd,
            produtoValorUnitario: itemVUnCom,
            produtoValorTotal: itemVProd,
            produtoDesconto: itemVDesc,
            produtoFrete: itemVFrete,
            produtoSeguro: itemVSeg,
            produtoOutrasDespesas: itemVOutro,
            produtoInfoAdicional: itemInfAdProd,

            icmsOrigem: icmsOrig,
            icmsCstCsosn: icmsCstCsosn,
            icmsBaseCalculo: icmsVBC,
            icmsAliquota: icmsPICMS,
            icmsValor: icmsVICMS,
            pisCst: pisCST,
            pisBaseCalculo: pisVBC,
            pisAliquota: pisPPIS,
            pisValor: pisVPIS,
            cofinsCst: cofinsCST,
            cofinsBaseCalculo: cofinsVBC,
            cofinsAliquota: cofinsPCOFINS,
            cofinsValor: cofinsVCOFINS,
            ipiValor: ipiVIPI,
            totalTributosAprox: itemTotTrib,

            totalBaseIcms,
            totalValorIcms,
            totalIcmsDesonerado: totalIcmsDeson,
            totalIcmsSt,
            totalProdutos,
            totalFrete,
            totalSeguro,
            totalDesconto,
            totalIpi,
            totalPis,
            totalCofins,
            totalOutrasDespesas: totalOutro,
            totalNotaFiscal: totalNota,

            transporteModalidadeFrete: modalidadeFrete,
            transportadoraCnpjDoc: transportadoraDoc,
            transportadoraNome: transportadoraNome,
            transportadoraIe: transportadoraIe,
            transportadoraEndereco: transportadoraEnder,
            transportadoraMunicipio: transportadoraMun,
            transportadoraUf: transportadoraUf,
            transportePlaca: transpPlaca,
            transporteVolumeQuantidade: volQtd,
            transporteVolumeEspecie: volEsp,
            transporteVolumeMarca: volMarca,
            transporteVolumePesoLiquido: volPesoL,
            transporteVolumePesoBruto: volPesoB,

            cobrancaFaturaNumero: nFat,
            cobrancaValorOriginal: vOrig,
            cobrancaValorDesconto: vDescFat,
            cobrancaValorLiquido: vLiqFat,
            cobrancaDuplicatasResumo: duplicatasResumo,

            pagamentoForma: formaPagto,
            pagamentoValor: valorPagto,
            pagamentoCartaoBandeira: bandeiraCartao,
            pagamentoCartaoAutorizacao: autCartao,

            intermediadorCnpj: intermedCnpj,
            intermediadorIdentificador: intermedId,
            intermediadorNome: itemMarketplace,

            informacoesComplementares: infCpl,
            informacoesFisco: infAdFisco
          };

          invoices.push({
            id: invId,
            nome: nomeCliente,
            documento: docCliente,
            dataSaida: dataSaidaFormatted,
            endereco: enderecoCompleto,
            bairro,
            cep,
            municipio,
            uf,
            fatura: faturaNumero,
            valorProdutos: itemVProd,
            valorNota: itemValorFinalNota,
            desconto: itemVDesc,
            codigo: itemCodigo,
            quantidade: itemQtd,
            descricao: itemDescricao,
            cor: itemCor,
            origem: itemMarketplace,
            origemArquivo: originalFilename,
            dataUpload: new Date().toISOString(),
            status: 'Processado',
            xmlDetails,
            ...xmlDetails
          });
        });
      }
    } catch (nfeErr: any) {
      console.warn(`[XML Parser] Erro ao extrair dados de NF no arquivo ${originalFilename}:`, nfeErr.message);
    }
  }

  return invoices;
}
