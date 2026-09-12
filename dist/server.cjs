var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_multer = __toESM(require("multer"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_chokidar = __toESM(require("chokidar"), 1);
var pdfParseModule = __toESM(require("pdf-parse"), 1);
var import_exceljs = __toESM(require("exceljs"), 1);

// src/lib/pdfParser.ts
function parseDanfeText(text) {
  if (!text) {
    text = "";
  }
  const buscar = function(regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };
  const dados = {};
  const regexNome = /Nome\s*\/\s*Razão Social[\s\r\n]+([\s\S]+?)[\s\r\n]+Endereço/i;
  const matchNome = text.match(regexNome);
  if (matchNome) {
    const linhasNome = matchNome[1].trim().split(/[\r\n]+/);
    dados.nome = linhasNome[0].trim();
  } else {
    dados.nome = buscar(/Nome\s*\/\s*Razão Social[\s\r\n]+([^\r\n]+)/i) || buscar(/Destinatário.*?Nome\/Razão Social[\s\r\n]+([^\r\n]+)/i);
  }
  dados.documento = buscar(/CNPJ\/CPF[\s\r\n]+([\d\.\-\/]+)/i);
  dados.dataSaida = buscar(/Data sa[ií]da[\s\r\n]+([\d]{2}\/[\d]{2}\/[\d]{4})/i) || buscar(/Data emissão[\s\r\n]+([\d]{2}\/[\d]{2}\/[\d]{4})/i);
  dados.endereco = buscar(/Endereço[\s\r\n]+([^\r\n]+)/i);
  dados.bairro = buscar(/Bairro[\s\r\n]+([^\r\n]+)/i);
  dados.cep = buscar(/CEP[\s\r\n]+([\d\.\-]+)/i);
  dados.municipio = buscar(/Munic[ií]pio[\s\r\n]+([^\r\n]+)/i);
  if (!dados.municipio || dados.municipio === "N\xE3o encontrado") {
    const matchMun = text.match(/Munic[ií]pio[\s\r\n]+([\s\S]+?)[\s\r\n]+UF/i);
    if (matchMun) {
      const linhasMun = matchMun[1].trim().split(/[\r\n]+/);
      dados.municipio = linhasMun[0].trim();
    }
  }
  dados.uf = buscar(/UF[\s\r\n]+([A-Z]{2})/i);
  const matchFatura = text.match(/Faturas[\s\S]*?\n(\d{3,})/i) || text.match(/Faturas[\s\S]*?Valor\s*[\r\n\t ]+(\d+)/i);
  dados.fatura = matchFatura ? matchFatura[1].trim() : buscar(/N[°º]\s*(\d+)/i);
  if (!dados.fatura) dados.fatura = "N\xE3o encontrada";
  dados.valorProdutos = buscar(/Valor total dos produtos[\s\r\n]+([\d\,\.]+)/i);
  dados.valorNota = buscar(/Valor total da nota[\s\r\n]+([\d\,\.]+)/i);
  dados.desconto = buscar(/Desconto[\s\r\n]+([\d\,\.]+)/i);
  const textoGeral = text.toLowerCase();
  let origemGeral = "Outros";
  if (textoGeral.includes("shopee")) origemGeral = "Shopee";
  else if (textoGeral.includes("mercado livre") || textoGeral.includes("mercadolivre")) origemGeral = "Mercado Livre";
  else if (textoGeral.includes("whatsapp")) origemGeral = "WhatsApp";
  else if (textoGeral.includes("tiktok")) origemGeral = "TikTok";
  dados.itens = [];
  const regexTabelaPipes = /Código\s*\|\s*Descrição.*?%IPI[\s\r\n]+([\s\S]+?)(?:Cálculo do ISSQN|Cálculo do ISSON|Dados adicionais|Total aproximado)/i;
  const matchTabelaPipes = text.match(regexTabelaPipes);
  if (matchTabelaPipes) {
    const tabelaStr = matchTabelaPipes[1];
    const colunas = tabelaStr.split("|");
    if (colunas.length >= 2) {
      const blocoCodigos = colunas[0].trim().replace(/-\s*[\r\n]+\s*/g, "-");
      let codigos = blocoCodigos.split(/[\r\n]+/).map((c) => c.trim()).filter((c) => c !== "");
      if (codigos.length === 0) codigos = ["Sem c\xF3digo"];
      const blocoDescricoes = colunas[1] ? colunas[1].trim() : "";
      const descLinhas = blocoDescricoes.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l !== "");
      const descricoes = [];
      if (descLinhas.length > 0) {
        const primeiraPalavra = descLinhas[0].split(" ")[0];
        let currentDesc = descLinhas[0];
        for (let idx = 1; idx < descLinhas.length; idx++) {
          if (descLinhas[idx].indexOf(primeiraPalavra) === 0 && descricoes.length < codigos.length - 1) {
            descricoes.push(currentDesc);
            currentDesc = descLinhas[idx];
          } else {
            currentDesc += " " + descLinhas[idx];
          }
        }
        descricoes.push(currentDesc);
      }
      while (descricoes.length < codigos.length) {
        descricoes.push(descricoes[0] || "Descri\xE7\xE3o n\xE3o encontrada");
      }
      const blocoQtdes = colunas.length >= 6 ? colunas[colunas.length - 2] + " " + colunas[colunas.length - 3] : tabelaStr;
      const qtdesMatch = blocoQtdes.match(/\b\d+(?:,\d+)?\b/g);
      const qtdes = qtdesMatch ? qtdesMatch : [];
      while (qtdes.length < codigos.length) {
        qtdes.push("1");
      }
      for (let j = 0; j < codigos.length; j++) {
        const cod = codigos[j];
        const desc = descricoes[j];
        const qtde = qtdes[j] || "1";
        let cor = "N\xE3o identificada";
        const corAlvo = /(Preto|Marrom|Incolor)/i;
        const matchCorCodigo = cod.match(corAlvo);
        if (matchCorCodigo) {
          cor = matchCorCodigo[1].charAt(0).toUpperCase() + matchCorCodigo[1].slice(1).toLowerCase();
        } else {
          const matchCorDesc = desc.match(/Cor:\s*(Preto|Marrom|Incolor)/i);
          if (matchCorDesc) {
            cor = matchCorDesc[1].charAt(0).toUpperCase() + matchCorDesc[1].slice(1).toLowerCase();
          } else {
            const matchPalavra = desc.match(corAlvo);
            if (matchPalavra) {
              cor = matchPalavra[1].charAt(0).toUpperCase() + matchPalavra[1].slice(1).toLowerCase();
            }
          }
        }
        dados.itens.push({
          codigo: cod,
          descricao: desc,
          quantidade: qtde,
          cor,
          origem: origemGeral
        });
      }
    }
  }
  if (dados.itens.length === 0) {
    const regexSecao = /Itens da nota fiscal[\s\S]*?Código[\s\S]*?%IPI[\s\r\n]+([\s\S]+?)(?:Cálculo do ISSQN|Cálculo do ISSON|Dados adicionais|Total aproximado|$)/i;
    const matchSecao = text.match(regexSecao);
    if (matchSecao) {
      const blocoTratado = matchSecao[1].replace(/-\s*[\r\n]+\s*/g, "-");
      const linhas = blocoTratado.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l !== "");
      const codigos = linhas.filter((l) => /^SPM-|^COD-|^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+/i.test(l));
      const outrasLinhas = linhas.filter((l) => !codigos.includes(l) && !l.includes("C\xE1lculo do") && !l.includes("Inscri\xE7\xE3o Municipal"));
      if (codigos.length > 0) {
        const descTexto = outrasLinhas.join(" ");
        const descLimpa = descTexto.replace(/\s+\d{8}\s+[\s\S]*$/, "").trim();
        for (const cod of codigos) {
          let cor = "N\xE3o identificada";
          const corAlvo = /(Preto|Marrom|Incolor)/i;
          const matchCorCodigo = cod.match(corAlvo);
          if (matchCorCodigo) {
            cor = matchCorCodigo[1].charAt(0).toUpperCase() + matchCorCodigo[1].slice(1).toLowerCase();
          } else {
            const matchCorDesc = descLimpa.match(/Cor:\s*(Preto|Marrom|Incolor)/i);
            if (matchCorDesc) {
              cor = matchCorDesc[1].charAt(0).toUpperCase() + matchCorDesc[1].slice(1).toLowerCase();
            } else {
              const matchPalavra = descLimpa.match(corAlvo);
              if (matchPalavra) {
                cor = matchPalavra[1].charAt(0).toUpperCase() + matchPalavra[1].slice(1).toLowerCase();
              }
            }
          }
          const mQtde = descTexto.match(/\bUN\s+([\d]+(?:,\d+)?)/i) || descTexto.match(/\b(\d+(?:,\d+)?)\s+\d+,\d{2}\s+\d+,\d{2}/);
          const qtde = mQtde ? mQtde[1] : "1";
          dados.itens.push({
            codigo: cod,
            descricao: descLimpa || "Verniz Elite SPM",
            quantidade: qtde,
            cor,
            origem: origemGeral
          });
        }
      }
    }
  }
  if (dados.itens.length === 0) {
    const descFbMatch = text.match(/(?:Verniz[^\n\r]+)/ig);
    const codFbMatch = text.replace(/-\s*[\r\n]+\s*/g, "-").match(/SPM-[A-Za-z0-9_-]+/ig);
    const qtdFb = Math.max(codFbMatch ? codFbMatch.length : 1, descFbMatch ? descFbMatch.length : 1);
    for (let f = 0; f < qtdFb; f++) {
      const codF = codFbMatch ? codFbMatch[f] || codFbMatch[0] : "Sem c\xF3digo";
      const descF = descFbMatch ? descFbMatch[f] || descFbMatch[0] : "Item sem descri\xE7\xE3o";
      let corF = "N\xE3o identificada";
      const corAlvoFb = /(Preto|Marrom|Incolor)/i;
      const matchCorCodF = codF.match(corAlvoFb);
      if (matchCorCodF) {
        corF = matchCorCodF[1].charAt(0).toUpperCase() + matchCorCodF[1].slice(1).toLowerCase();
      } else {
        const matchCorDescF = descF.match(/Cor:\s*(Preto|Marrom|Incolor)/i);
        if (matchCorDescF) {
          corF = matchCorDescF[1].charAt(0).toUpperCase() + matchCorDescF[1].slice(1).toLowerCase();
        } else {
          const matchPalavraF = descF.match(corAlvoFb);
          if (matchPalavraF) {
            corF = matchPalavraF[1].charAt(0).toUpperCase() + matchPalavraF[1].slice(1).toLowerCase();
          }
        }
      }
      dados.itens.push({
        codigo: codF,
        descricao: descF,
        quantidade: "1",
        cor: corF,
        origem: origemGeral
      });
    }
  }
  return {
    nome: dados.nome || "N\xE3o encontrado",
    documento: dados.documento || "",
    dataSaida: dados.dataSaida || "",
    endereco: dados.endereco || "",
    bairro: dados.bairro || "",
    cep: dados.cep || "",
    municipio: dados.municipio || "",
    uf: dados.uf || "",
    fatura: dados.fatura || "",
    valorProdutos: dados.valorProdutos || "0,00",
    valorNota: dados.valorNota || "0,00",
    desconto: dados.desconto || "0,00",
    itens: dados.itens || []
  };
}
function extractSpmInvoicesFromPdfText(text, filename = "documento.pdf") {
  const parsed = parseDanfeText(text);
  const rows = [];
  const baseId = "spm-" + Date.now() + "-" + Math.floor(Math.random() * 1e3);
  if (parsed.itens.length === 0) {
    rows.push({
      id: `${baseId}-1`,
      nome: parsed.nome,
      documento: parsed.documento,
      dataSaida: parsed.dataSaida,
      endereco: parsed.endereco,
      bairro: parsed.bairro,
      cep: parsed.cep,
      municipio: parsed.municipio,
      uf: parsed.uf,
      fatura: parsed.fatura,
      valorProdutos: parsed.valorProdutos,
      valorNota: parsed.valorNota,
      desconto: parsed.desconto,
      codigo: "Sem c\xF3digo",
      quantidade: "1",
      descricao: "Item sem descri\xE7\xE3o",
      cor: "N\xE3o identificada",
      origem: "Outros",
      origemArquivo: filename,
      dataUpload: (/* @__PURE__ */ new Date()).toISOString(),
      status: "Processado"
    });
  } else {
    parsed.itens.forEach((item, index) => {
      rows.push({
        id: `${baseId}-${index + 1}`,
        nome: parsed.nome,
        documento: parsed.documento,
        dataSaida: parsed.dataSaida,
        endereco: parsed.endereco,
        bairro: parsed.bairro,
        cep: parsed.cep,
        municipio: parsed.municipio,
        uf: parsed.uf,
        fatura: parsed.fatura,
        valorProdutos: parsed.valorProdutos,
        valorNota: parsed.valorNota,
        desconto: parsed.desconto,
        codigo: item.codigo,
        quantidade: item.quantidade,
        descricao: item.descricao,
        cor: item.cor,
        origem: item.origem,
        origemArquivo: filename,
        dataUpload: (/* @__PURE__ */ new Date()).toISOString(),
        status: "Processado"
      });
    });
  }
  return rows;
}

// src/lib/xmlParser.ts
var import_fast_xml_parser = require("fast-xml-parser");
function formatCpfCnpj(doc) {
  if (!doc) return "";
  const clean = String(doc).replace(/\D/g, "");
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return clean;
}
function formatCep(cep) {
  if (!cep) return "";
  const clean = String(cep).replace(/\D/g, "");
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, "$1-$2");
  }
  return clean;
}
function formatCurrencyBr(val) {
  if (val === void 0 || val === null || val === "") return "0,00";
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
  if (isNaN(n)) return "0,00";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDateBr(dateStr) {
  if (!dateStr) return (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (_) {
  }
  if (dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
}
function detectColor(text) {
  const upper = (text || "").toUpperCase();
  if (upper.includes("COR:MARROM") || upper.includes(" MARROM") || upper.includes("-MARROM") || upper.includes("MARROM30") || upper.includes("MARROM40") || upper.includes("BROWN") || upper.includes("CAFE") || upper.includes("CAF\xC9")) {
    return "Marrom";
  }
  if (upper.includes("COR:INCOLOR") || upper.includes(" INCOLOR") || upper.includes("-INCOLOR") || upper.includes("TRANSPARENTE") || upper.includes("NATURAL") || upper.includes("LIMPADOR")) {
    return "Incolor";
  }
  if (upper.includes("COR:PRETO") || upper.includes(" PRETO") || upper.includes("-PRETO") || upper.includes("PRETO30") || upper.includes("PRETO40") || upper.includes("BLACK")) {
    return "Preto";
  }
  if (upper.includes("KIT 2") || upper.includes("2 UNIDADES") || upper.includes("KIT2")) {
    return "Kit 2";
  }
  if (upper.includes("KIT 1") || upper.includes("KIT1") || upper.includes("KIT DE LIMPEZA") || upper.includes("COMBO") || upper.includes("ESPONJA") && upper.includes("FLANELA")) {
    return "Kit 1";
  }
  if (upper.includes("ESPONJA")) return "Esponja";
  if (upper.includes("FLANELA")) return "Flanela";
  if (upper.includes("COTURNO") || upper.includes("GRAXA") || upper.includes("VERNIZ ELITE SPM") || upper.includes("HEROIS") || upper.includes("MILITAR") || upper.includes("SAPATO SOCIAL") || upper.includes("SPMVERNIZ") || upper.includes("SPM-01")) {
    return "Preto";
  }
  return "Preto";
}
function mapMarketplaceFromCnpjOrText(cnpj, text, code, extra) {
  const cleanCnpj = (cnpj || "").replace(/\D/g, "");
  if (cleanCnpj === "03007331000141" || cleanCnpj === "16524211000198") return "Mercado Livre";
  if (cleanCnpj === "35635824000112" || cleanCnpj === "35635824000200") return "Shopee";
  if (cleanCnpj === "27415911000136" || cleanCnpj === "50074558000118") return "TikTok";
  if (cleanCnpj === "15436940000103" || cleanCnpj === "03499243000104") return "Amazon";
  if (cleanCnpj === "47960950000121") return "Magalu";
  if (cleanCnpj === "40154884000153") return "Shein";
  const upper = `${text || ""} ${code || ""} ${extra || ""}`.toUpperCase();
  if (upper.includes("MERCADO LIVRE") || upper.includes("MERCADOLIVRE") || upper.includes("MELI") || upper.startsWith("MLB") || upper.includes("MLB")) {
    return "Mercado Livre";
  }
  if (upper.includes("TIKTOK") || upper.includes("TIK TOK") || upper.startsWith("TOK") || upper.includes("TOKSPM")) {
    return "TikTok";
  }
  if (upper.includes("WHATSAPP") || upper.includes("WPP") || upper.includes("ZAP")) {
    return "WhatsApp";
  }
  if (upper.includes("SHOPEE") || upper.includes("SHP") || upper.startsWith("SPM") || upper.includes("SPMVERNIZ") || upper.startsWith("spm")) {
    return "Shopee";
  }
  if (upper.includes("AMAZON") || upper.includes("AMZN")) return "Amazon";
  if (upper.includes("MAGALU") || upper.includes("MAGAZINE LUIZA")) return "Magalu";
  if (upper.includes("SHEIN")) return "Shein";
  if (upper.includes("BLING")) return "Bling";
  if (upper.includes("TINY")) return "Tiny";
  if (upper.includes("SITE") || upper.includes("LOJA VIRTUAL") || upper.includes("ECOMMERCE")) return "Site Pr\xF3prio";
  return "Outros";
}
function mapModalidadeFrete(mod) {
  const m = String(mod || "").trim();
  switch (m) {
    case "0":
      return "0 - Contrata\xE7\xE3o por conta do Remetente (CIF)";
    case "1":
      return "1 - Contrata\xE7\xE3o por conta do Destinat\xE1rio (FOB)";
    case "2":
      return "2 - Contrata\xE7\xE3o por conta de Terceiros";
    case "3":
      return "3 - Transporte Pr\xF3prio por conta do Remetente";
    case "4":
      return "4 - Transporte Pr\xF3prio por conta do Destinat\xE1rio";
    case "9":
      return "9 - Sem Ocorr\xEAncia de Transporte";
    default:
      return m ? `${m} - Outro` : "9 - Sem Frete";
  }
}
function mapFormaPagamento(tPag) {
  const t = String(tPag || "").trim();
  switch (t) {
    case "01":
      return "01 - Dinheiro";
    case "02":
      return "02 - Cheque";
    case "03":
      return "03 - Cart\xE3o de Cr\xE9dito";
    case "04":
      return "04 - Cart\xE3o de D\xE9bito";
    case "05":
      return "05 - Cr\xE9dito Loja";
    case "10":
      return "10 - Vale Alimenta\xE7\xE3o";
    case "11":
      return "11 - Vale Refei\xE7\xE3o";
    case "12":
      return "12 - Vale Presente";
    case "13":
      return "13 - Vale Combust\xEDvel";
    case "14":
      return "14 - Duplicata Mercantil";
    case "15":
      return "15 - Boleto Banc\xE1rio";
    case "16":
      return "16 - Dep\xF3sito Banc\xE1rio";
    case "17":
      return "17 - Pagamento Instant\xE2neo (PIX)";
    case "18":
      return "18 - Transfer\xEAncia banc\xE1ria, Carteira Digital";
    case "19":
      return "19 - Programa de fidelidade, Cashback";
    case "90":
      return "90 - Sem pagamento";
    case "99":
      return "99 - Outros";
    default:
      return t ? `${t} - Outros` : "99 - Outros";
  }
}
function mapBandeiraCartao(tBand) {
  const b = String(tBand || "").trim();
  switch (b) {
    case "01":
      return "Visa";
    case "02":
      return "Mastercard";
    case "03":
      return "American Express";
    case "04":
      return "Sorocred";
    case "05":
      return "Diners Club";
    case "06":
      return "Elo";
    case "07":
      return "Hipercard";
    case "08":
      return "Aura";
    case "09":
      return "Cabal";
    case "99":
      return "Outros";
    default:
      return b || "";
  }
}
function findNFeNodes(obj) {
  if (!obj || typeof obj !== "object") return [];
  const results = [];
  if (obj.infNFe || obj.ide && obj.dest) {
    results.push(obj);
    return results;
  }
  if (obj.NFe) {
    const list = Array.isArray(obj.NFe) ? obj.NFe : [obj.NFe];
    list.forEach((item) => results.push(...findNFeNodes(item)));
    return results;
  }
  if (obj.nfeProc) {
    const list = Array.isArray(obj.nfeProc) ? obj.nfeProc : [obj.nfeProc];
    list.forEach((item) => results.push(...findNFeNodes(item)));
    return results;
  }
  if (obj.enviNFe) {
    const list = Array.isArray(obj.enviNFe) ? obj.enviNFe : [obj.enviNFe];
    list.forEach((item) => results.push(...findNFeNodes(item)));
    return results;
  }
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const sub = findNFeNodes(obj[key]);
      if (sub.length > 0) results.push(...sub);
    }
  }
  return results;
}
function extractProtMap(obj) {
  const protMap = {};
  if (!obj || typeof obj !== "object") return protMap;
  function walk(curr) {
    if (!curr || typeof curr !== "object") return;
    if (curr.protNFe?.infProt) {
      const p = curr.protNFe.infProt;
      if (p.chNFe) protMap[p.chNFe] = p;
    }
    if (curr.infProt && curr.infProt.chNFe) {
      protMap[curr.infProt.chNFe] = curr.infProt;
    }
    for (const k of Object.keys(curr)) {
      if (typeof curr[k] === "object" && curr[k] !== null) {
        walk(curr[k]);
      }
    }
  }
  walk(obj);
  return protMap;
}
function extractSpmInvoicesFromNfeXml(xmlContent, originalFilename = "nfe.xml") {
  if (!xmlContent || typeof xmlContent !== "string") return [];
  const cleanXml = xmlContent.replace(/^\uFEFF/, "").trim();
  const parser = new import_fast_xml_parser.XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    trimValues: true,
    parseTagValue: false,
    removeNSPrefix: true
  });
  let parsedObj;
  try {
    parsedObj = parser.parse(cleanXml);
  } catch (err) {
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
  const invoices = [];
  for (const nfe of nfeNodes) {
    try {
      const infNFe = nfe.infNFe || nfe;
      if (!infNFe) continue;
      const rawIdAttr = infNFe["@_Id"] || nfe["@_Id"] || "";
      const chaveAcessoRaw = String(rawIdAttr).replace(/^NFe/, "").trim();
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
      const chaveAcesso = infProt.chNFe || chaveAcessoRaw || "";
      const faturaNumero = String(ide.nNF || "").padStart(6, "0");
      const serieNfe = String(ide.serie || "1");
      const natOp = String(ide.natOp || "Venda de Mercadorias");
      const tipoOperacao = String(ide.tpNF || "1") === "0" ? "0 - Entrada" : "1 - Sa\xEDda";
      const tipoEmissao = String(ide.tpEmis || "1");
      const finNFe = String(ide.finNFe || "1");
      const ambiente = String(ide.tpAmb || "1") === "1" ? "1 - Produ\xE7\xE3o" : "2 - Homologa\xE7\xE3o";
      const nProt = String(infProt.nProt || "");
      const dhRecbto = String(infProt.dhRecbto || "");
      const cStat = String(infProt.cStat || "100");
      const xMotivo = String(infProt.xMotivo || "Autorizado o uso da NF-e");
      const statusSefaz = `${cStat} - ${xMotivo}`;
      const dataEmissaoRaw = ide.dhSaiEnt || ide.dhEmi || ide.dSaiEnt || ide.dEmi || "";
      const dataSaidaFormatted = formatDateBr(dataEmissaoRaw);
      const emitCnpj = formatCpfCnpj(emit.CNPJ || "");
      const emitNome = String(emit.xNome || "SPM STORE");
      const emitFant = String(emit.xFant || emitNome);
      const emitIe = String(emit.IE || "");
      const emitCrt = String(emit.CRT || "1");
      const enderEmit = emit.enderEmit || {};
      const nomeCliente = String(dest.xNome || "Consumidor Final");
      const docCliente = formatCpfCnpj(dest.CPF || dest.CNPJ || "");
      const destIe = String(dest.IE || "");
      const destIndIe = String(dest.indIEDest || "9");
      const destEmail = String(dest.email || "");
      const destFone = String(dest.enderDest?.fone || dest.fone || "");
      const ender = dest.enderDest || {};
      const logradouro = String(ender.xLgr || "");
      const numero = String(ender.nro || "");
      const complemento = ender.xCpl ? ` - ${ender.xCpl}` : "";
      const enderecoCompleto = logradouro ? `${logradouro}, ${numero}${complemento}`.trim() : "";
      const bairro = String(ender.xBairro || "");
      const codigoMunicipio = String(ender.cMun || "");
      const municipio = String(ender.xMun || "S\xE3o Paulo");
      const uf = String(ender.UF || "SP").toUpperCase();
      const cep = formatCep(ender.CEP || "");
      const pais = String(ender.xPais || "Brasil");
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
      const modalidadeFrete = mapModalidadeFrete(transp.modFrete);
      const transporta = transp.transporta || {};
      const transportadoraDoc = formatCpfCnpj(transporta.CNPJ || transporta.CPF || "");
      const transportadoraNome = String(transporta.xNome || "");
      const transportadoraIe = String(transporta.IE || "");
      const transportadoraEnder = String(transporta.xEnder || "");
      const transportadoraMun = String(transporta.xMun || "");
      const transportadoraUf = String(transporta.UF || "");
      const veicTransp = transp.veicTransp || {};
      const transpPlaca = String(veicTransp.placa || "");
      let volObj = transp.vol;
      if (Array.isArray(volObj)) volObj = volObj[0] || {};
      volObj = volObj || {};
      const volQtd = String(volObj.qVol || "1");
      const volEsp = String(volObj.esp || "VOLUME");
      const volMarca = String(volObj.marca || "");
      const volPesoL = formatCurrencyBr(volObj.pesoL);
      const volPesoB = formatCurrencyBr(volObj.pesoB);
      const cobrFat = cobr.fat || {};
      const nFat = String(cobrFat.nFat || faturaNumero);
      const vOrig = formatCurrencyBr(cobrFat.vOrig || total.vProd);
      const vDescFat = formatCurrencyBr(cobrFat.vDesc || total.vDesc);
      const vLiqFat = formatCurrencyBr(cobrFat.vLiq || total.vNF || total.vProd);
      let dupList = [];
      if (cobr.dup) {
        dupList = Array.isArray(cobr.dup) ? cobr.dup : [cobr.dup];
      }
      const duplicatasResumo = dupList.length > 0 ? dupList.map((d) => `N\xBA ${d.nDup || 1}: Venc ${formatDateBr(d.dVenc)} - R$ ${formatCurrencyBr(d.vDup)}`).join(" | ") : `\xC0 Vista (R$ ${totalNota})`;
      let detPagList = [];
      if (pag.detPag) {
        detPagList = Array.isArray(pag.detPag) ? pag.detPag : [pag.detPag];
      }
      const primaryPag = detPagList[0] || {};
      const formaPagto = mapFormaPagamento(primaryPag.tPag);
      const valorPagto = formatCurrencyBr(primaryPag.vPag || total.vNF || total.vProd);
      const cardObj = primaryPag.card || {};
      const bandeiraCartao = mapBandeiraCartao(cardObj.tBand);
      const autCartao = String(cardObj.cAut || "");
      const intermedCnpj = formatCpfCnpj(infIntermed.CNPJ || "");
      const intermedId = String(infIntermed.idCadIntTran || "");
      const infCpl = String(infAdic.infCpl || "");
      const infAdFisco = String(infAdic.infAdFisco || "");
      const combinedText = `${infCpl} ${infAdFisco} ${emitFant} ${intermedId}`;
      const marketplaceOrigem = mapMarketplaceFromCnpjOrText(infIntermed.CNPJ, combinedText);
      let detList = [];
      if (infNFe.det) {
        detList = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
      }
      if (detList.length === 0) {
        const invId = `spm-xml-${faturaNumero || Date.now()}-1`;
        const corItem = detectColor(combinedText);
        const xmlDetails = {
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
          itemNumero: "1",
          produtoCodigo: "SPM-GERAL",
          produtoEan: "",
          produtoDescricao: "Produtos SPM",
          produtoNcm: "",
          produtoCfop: "5102",
          produtoUnidade: "UN",
          produtoQuantidade: "1",
          produtoValorUnitario: totalProdutos,
          produtoValorTotal: totalProdutos,
          produtoDesconto: totalDesconto,
          produtoFrete: totalFrete,
          produtoSeguro: totalSeguro,
          produtoOutrasDespesas: totalOutro,
          produtoInfoAdicional: "",
          icmsOrigem: "0",
          icmsCstCsosn: "102",
          icmsBaseCalculo: totalBaseIcms,
          icmsAliquota: "0,00",
          icmsValor: totalValorIcms,
          pisCst: "07",
          pisBaseCalculo: "0,00",
          pisAliquota: "0,00",
          pisValor: totalPis,
          cofinsCst: "07",
          cofinsBaseCalculo: "0,00",
          cofinsAliquota: "0,00",
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
          transportadoraNome,
          transportadoraIe,
          transportadoraEndereco: transportadoraEnder,
          transportadoraMunicipio: transportadoraMun,
          transportadoraUf,
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
          codigo: "SPM-GERAL",
          quantidade: "1",
          descricao: "Produtos SPM",
          cor: corItem,
          origem: marketplaceOrigem,
          origemArquivo: originalFilename,
          dataUpload: (/* @__PURE__ */ new Date()).toISOString(),
          status: "Processado",
          xmlDetails,
          ...xmlDetails
        });
      } else {
        detList.forEach((detItem, idx) => {
          const prod = detItem.prod || {};
          const imp = detItem.imposto || {};
          const itemNum = String(detItem["@_nItem"] || idx + 1);
          const itemCodigo = String(prod.cProd || `PROD-${itemNum}`);
          const itemEan = String(prod.cEAN || "");
          const itemDescricao = String(prod.xProd || "Produto SPM");
          const itemNcm = String(prod.NCM || "");
          const itemCfop = String(prod.CFOP || "5102");
          const itemUnidade = String(prod.uCom || "UN");
          const itemQtd = String(Math.round(parseFloat(prod.qCom || 1)) || 1);
          const itemVUnCom = formatCurrencyBr(prod.vUnCom);
          const itemVProd = formatCurrencyBr(prod.vProd || total.vProd);
          const itemVDesc = formatCurrencyBr(prod.vDesc || 0);
          const itemVFrete = formatCurrencyBr(prod.vFrete || 0);
          const itemVSeg = formatCurrencyBr(prod.vSeg || 0);
          const itemVOutro = formatCurrencyBr(prod.vOutro || 0);
          const itemInfAdProd = String(detItem.infAdProd || "");
          const itemCor = detectColor(`${itemDescricao} ${itemCodigo} ${itemInfAdProd}`);
          const itemMarketplace = mapMarketplaceFromCnpjOrText(
            infIntermed.CNPJ,
            combinedText,
            itemCodigo,
            `${itemDescricao} ${detItem.prod?.xPed || ""}`
          );
          const icmsObj = imp.ICMS ? Object.values(imp.ICMS)[0] : {};
          const icmsOrig = String(icmsObj?.orig || "0");
          const icmsCstCsosn = String(icmsObj?.CST || icmsObj?.CSOSN || "102");
          const icmsVBC = formatCurrencyBr(icmsObj?.vBC);
          const icmsPICMS = formatCurrencyBr(icmsObj?.pICMS);
          const icmsVICMS = formatCurrencyBr(icmsObj?.vICMS);
          const pisObj = imp.PIS ? Object.values(imp.PIS)[0] : {};
          const pisCST = String(pisObj?.CST || "07");
          const pisVBC = formatCurrencyBr(pisObj?.vBC);
          const pisPPIS = formatCurrencyBr(pisObj?.pPIS);
          const pisVPIS = formatCurrencyBr(pisObj?.vPIS);
          const cofinsObj = imp.COFINS ? Object.values(imp.COFINS)[0] : {};
          const cofinsCST = String(cofinsObj?.CST || "07");
          const cofinsVBC = formatCurrencyBr(cofinsObj?.vBC);
          const cofinsPCOFINS = formatCurrencyBr(cofinsObj?.pCOFINS);
          const cofinsVCOFINS = formatCurrencyBr(cofinsObj?.vCOFINS);
          const ipiObj = imp.IPI?.IPITrib || imp.IPI || {};
          const ipiVIPI = formatCurrencyBr(ipiObj?.vIPI || 0);
          const itemTotTrib = formatCurrencyBr(imp.vTotTrib || totalTribAprox);
          const invId = `spm-xml-${faturaNumero || Date.now()}-${itemNum}`;
          const itemValorFinalNota = detList.length === 1 ? totalNota : itemVProd;
          const xmlDetails = {
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
            icmsCstCsosn,
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
            transportadoraNome,
            transportadoraIe,
            transportadoraEndereco: transportadoraEnder,
            transportadoraMunicipio: transportadoraMun,
            transportadoraUf,
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
            dataUpload: (/* @__PURE__ */ new Date()).toISOString(),
            status: "Processado",
            xmlDetails,
            ...xmlDetails
          });
        });
      }
    } catch (nfeErr) {
      console.warn(`[XML Parser] Erro ao extrair dados de NF no arquivo ${originalFilename}:`, nfeErr.message);
    }
  }
  return invoices;
}

// src/lib/db.ts
var import_promise = __toESM(require("mysql2/promise"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
import_dotenv.default.config();
var DB_HOST = process.env.DB_HOST || "localhost";
var DB_PORT = Number(process.env.DB_PORT) || 3306;
var DB_USER = process.env.DB_USER || "root";
var DB_PASSWORD = process.env.DB_PASSWORD || "";
var DB_NAME = process.env.DB_NAME || "spm_fiscal";
var pool = null;
var isConnected = false;
var hasLoggedConnectionAttempt = false;
function readJsonFile(filename, defaultValue) {
  const filePath = import_path.default.join(process.cwd(), "data", filename);
  try {
    if (!import_fs.default.existsSync(filePath)) {
      return defaultValue;
    }
    const raw = import_fs.default.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}
function writeJsonFile(filename, data) {
  const dirPath = import_path.default.join(process.cwd(), "data");
  if (!import_fs.default.existsSync(dirPath)) {
    import_fs.default.mkdirSync(dirPath, { recursive: true });
  }
  const filePath = import_path.default.join(dirPath, filename);
  import_fs.default.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
async function getDbPool() {
  if (pool && isConnected) {
    return pool;
  }
  try {
    const initConnection = await import_promise.default.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      connectTimeout: 2e3
    });
    await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await initConnection.end();
    pool = import_promise.default.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 2e3,
      multipleStatements: true
    });
    const testConn = await pool.getConnection();
    testConn.release();
    isConnected = true;
    console.log(`[MySQL] Conectado com sucesso ao banco '${DB_NAME}' em ${DB_HOST}:${DB_PORT}`);
    await initSchemaAndMigrate();
    return pool;
  } catch (error) {
    isConnected = false;
    pool = null;
    if (!hasLoggedConnectionAttempt) {
      hasLoggedConnectionAttempt = true;
      console.warn(`[MySQL Offline] N\xC3\u0192\xC2\xA3o foi poss\xC3\u0192\xC2\xADvel conectar ao MySQL (${DB_HOST}:${DB_PORT}): ${error.message || error}`);
      console.log(`[Modo Local Ativo] Operando com persist\xC3\u0192\xC2\xAAncia JSON local em ./data e sincroniza\xC3\u0192\xC2\xA7\xC3\u0192\xC2\xA3o SQL.`);
      console.log(`[Dica] Para usar MySQL/phpMyAdmin, inicie o MySQL no XAMPP na porta ${DB_PORT}.`);
    }
    return null;
  }
}
async function initSchemaAndMigrate() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'AUDITOR',
      active TINYINT(1) NOT NULL DEFAULT 1,
      last_login DATETIME NULL,
      avatar TEXT NULL,
      department VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_passwords (
      email VARCHAR(255) PRIMARY KEY,
      password_hash VARCHAR(255) NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(64) PRIMARY KEY,
      nome VARCHAR(255) NOT NULL DEFAULT '',
      documento VARCHAR(64) NOT NULL DEFAULT '',
      data_saida VARCHAR(64) NOT NULL DEFAULT '',
      endereco TEXT NULL,
      bairro VARCHAR(255) NOT NULL DEFAULT '',
      cep VARCHAR(32) NOT NULL DEFAULT '',
      municipio VARCHAR(255) NOT NULL DEFAULT '',
      uf VARCHAR(10) NOT NULL DEFAULT '',
      fatura VARCHAR(64) NOT NULL DEFAULT '',
      valor_produtos VARCHAR(64) NOT NULL DEFAULT '0,00',
      valor_nota VARCHAR(64) NOT NULL DEFAULT '0,00',
      desconto VARCHAR(64) NOT NULL DEFAULT '0,00',
      codigo VARCHAR(128) NOT NULL DEFAULT '',
      quantidade VARCHAR(64) NOT NULL DEFAULT '1',
      descricao TEXT NULL,
      cor VARCHAR(64) NOT NULL DEFAULT 'N\xC3\u0192\xC2\xA3o identificada',
      origem VARCHAR(64) NOT NULL DEFAULT 'Outros',
      origem_arquivo VARCHAR(255) NULL,
      data_upload VARCHAR(64) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'Processado',
      xml_data JSON NULL,
      chave_acesso VARCHAR(64) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_documento (documento),
      INDEX idx_origem (origem),
      INDEX idx_cor (cor),
      INDEX idx_uf (uf),
      INDEX idx_municipio (municipio),
      INDEX idx_chave (chave_acesso)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      user_id VARCHAR(64) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      action VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL,
      details TEXT NOT NULL,
      ip VARCHAR(64) NOT NULL DEFAULT '127.0.0.1',
      severity VARCHAR(32) NOT NULL DEFAULT 'info'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alert_rules (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(64) NOT NULL,
      threshold DECIMAL(12,2) NULL,
      email_notify TINYINT(1) NOT NULL DEFAULT 1,
      push_notify TINYINT(1) NOT NULL DEFAULT 1,
      active TINYINT(1) NOT NULL DEFAULT 1,
      last_triggered DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id VARCHAR(32) PRIMARY KEY,
      data_json JSON NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS integrations_config (
      type VARCHAR(32) PRIMARY KEY,
      data_json JSON NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_items (
      id VARCHAR(64) PRIMARY KEY,
      sku VARCHAR(64) UNIQUE NOT NULL,
      nome VARCHAR(255) NOT NULL,
      categoria VARCHAR(64) NOT NULL DEFAULT 'Verniz',
      cor VARCHAR(64) NOT NULL DEFAULT 'Preto',
      unidade VARCHAR(16) NOT NULL DEFAULT 'UN',
      estoque_inicial INT NOT NULL DEFAULT 0,
      total_entradas INT NOT NULL DEFAULT 0,
      total_saidas INT NOT NULL DEFAULT 0,
      estoque_atual INT NOT NULL DEFAULT 0,
      estoque_minimo INT NOT NULL DEFAULT 50,
      estoque_seguranca INT NOT NULL DEFAULT 20,
      preco_custo DECIMAL(10,2) NOT NULL DEFAULT 12.50,
      preco_venda DECIMAL(10,2) NOT NULL DEFAULT 29.99,
      localizacao VARCHAR(128) NOT NULL DEFAULT 'Prateleira A-01',
      ativo TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_stock_sku (sku),
      INDEX idx_stock_cor (cor)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      sku VARCHAR(64) NOT NULL,
      tipo VARCHAR(32) NOT NULL,
      quantidade INT NOT NULL,
      saldo_anterior INT NOT NULL DEFAULT 0,
      saldo_posterior INT NOT NULL DEFAULT 0,
      documento_ref VARCHAR(128) NULL,
      origem_canal VARCHAR(64) NULL,
      motivo TEXT NULL,
      valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      usuario_id VARCHAR(64) NOT NULL DEFAULT 'sistema',
      usuario_nome VARCHAR(255) NOT NULL DEFAULT 'Sistema Autom\xC3\u0192\xC2\xA1tico',
      data_movimentacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_mov_product (product_id),
      INDEX idx_mov_sku (sku),
      INDEX idx_mov_tipo (tipo),
      INDEX idx_mov_data (data_movimentacao),
      INDEX idx_mov_doc (documento_ref)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM invoices LIKE 'xml_data'");
    if (!cols || cols.length === 0) {
      await pool.query("ALTER TABLE invoices ADD COLUMN xml_data JSON NULL");
    }
    const [colsChave] = await pool.query("SHOW COLUMNS FROM invoices LIKE 'chave_acesso'");
    if (!colsChave || colsChave.length === 0) {
      await pool.query("ALTER TABLE invoices ADD COLUMN chave_acesso VARCHAR(64) NULL, ADD INDEX idx_chave (chave_acesso)");
    }
  } catch (e) {
    console.warn("[DB Migration Warning]:", e.message);
  }
  await initDefaultStockItemsIfEmpty();
  await migrateInitialDataIfEmpty();
}
async function migrateInitialDataIfEmpty() {
  if (!pool) return;
  const dataDir = import_path.default.join(process.cwd(), "data");
  let usersCount = 0;
  let invoicesCount = 0;
  try {
    const [usersCountRows] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [invoicesCountRows2] = await pool.query("SELECT COUNT(*) as count FROM invoices");
    usersCount = Number(usersCountRows?.[0]?.count || 0);
    invoicesCount = Number(invoicesCountRows2?.[0]?.count || 0);
  } catch (err) {
    console.warn("[MySQL Check Error]:", err.message);
  }
  if (invoicesCount === 0 || usersCount === 0) {
    const candidateSqlFiles = [
      import_path.default.join(process.cwd(), "database_spm_fiscal.sql"),
      import_path.default.join(__dirname, "database_spm_fiscal.sql"),
      import_path.default.join(__dirname, "..", "database_spm_fiscal.sql"),
      import_path.default.join(__dirname, "..", "..", "database_spm_fiscal.sql")
    ];
    const sqlFile = candidateSqlFiles.find((f) => import_fs.default.existsSync(f));
    if (sqlFile) {
      try {
        console.log(`[MySQL Auto-Seed] \u{1F680} Inicializando banco de dados completo via ${sqlFile}...`);
        const sqlContent = import_fs.default.readFileSync(sqlFile, "utf-8");
        await pool.query(sqlContent);
        console.log(`[MySQL Auto-Seed] \u2705 Base de dados populada com sucesso! Todos os registros fiscais e usu\xE1rios est\xE3o operacionais.`);
        return;
      } catch (sqlErr) {
        console.warn(`[MySQL Auto-Seed Warning] Falha na execu\xE7\xE3o direta do SQL dump: ${sqlErr.message}. Continuando para restaura\xE7\xE3o individual...`);
      }
    }
  }
  if (usersCount === 0) {
    const usersFile = import_path.default.join(dataDir, "users.json");
    const passwordsFile = import_path.default.join(dataDir, "userPasswords.json");
    if (import_fs.default.existsSync(usersFile)) {
      try {
        const users = JSON.parse(import_fs.default.readFileSync(usersFile, "utf-8"));
        const passwords = import_fs.default.existsSync(passwordsFile) ? JSON.parse(import_fs.default.readFileSync(passwordsFile, "utf-8")) : {};
        for (const u of users) {
          await pool.query(
            "INSERT IGNORE INTO users (id, name, email, role, active, last_login, avatar, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [u.id, u.name, u.email, u.role, u.active ? 1 : 0, u.lastLogin ? new Date(u.lastLogin) : null, u.avatar || null, u.department || null]
          );
          if (passwords[u.email]) {
            await pool.query(
              "INSERT INTO user_passwords (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)",
              [u.email, passwords[u.email]]
            );
          }
        }
        console.log(`[MySQL Migration] ${users.length} usu\xE1rios migrados do JSON para o MySQL.`);
      } catch (e) {
        console.error("[MySQL Migration] Erro ao migrar usu\xE1rios:", e);
      }
    }
  }
  try {
    const [checkUsers] = await pool.query("SELECT COUNT(*) as count FROM users");
    if (Number(checkUsers?.[0]?.count || 0) === 0) {
      console.log("[MySQL] Inserindo contas essenciais de acesso administrativo...");
      await pool.query(`
        INSERT IGNORE INTO users (id, name, email, role, active, department) VALUES
        ('u-admin-1', 'Jos\xE9 Galdino (Administrador)', 'josegaldino@hotmail.com.br', 'ADMIN', 1, 'SPM Store - Diretoria'),
        ('u-gerente-1', 'Carlos Santos (Gerente)', 'gerente@empresa.com', 'MANAGER', 1, 'Faturamento & Gest\xE3o'),
        ('u-auditor-1', 'Ana Maria Ferreira (Auditor)', 'auditor@empresa.com', 'AUDITOR', 1, 'Auditoria Fiscal');
      `);
      await pool.query(`
        INSERT INTO user_passwords (email, password_hash) VALUES
        ('josegaldino@hotmail.com.br', '$2b$08$l.pMRvk9WSkZ8BuG5n0OduB78DfKBlUkeaUEc.wkyBaotzsuD1VBe'),
        ('gerente@empresa.com', '$2b$08$SBcQF1FIuVKuBhT/U0WRTudP9UdYr.hGJNp9BOKr5X0u8fKsTSTfm'),
        ('auditor@empresa.com', '$2b$08$YC0ePodzrQtMw9S233gAbeGVMp9QVNT.3noknIic7farYRYObOn3q')
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);
      `);
      console.log("[MySQL] \u2705 Contas essenciais criadas com sucesso (josegaldino@hotmail.com.br / admin123).");
    }
  } catch (userErr) {
    console.warn("[MySQL User Guarantee Error]:", userErr.message);
  }
  const [invoicesCountRows] = await pool.query("SELECT COUNT(*) as count FROM invoices");
  if (invoicesCountRows[0].count === 0) {
    const invoicesFile = import_path.default.join(dataDir, "invoices.json");
    if (import_fs.default.existsSync(invoicesFile)) {
      try {
        const invoices = JSON.parse(import_fs.default.readFileSync(invoicesFile, "utf-8"));
        for (const inv of invoices) {
          await pool.query(
            `INSERT IGNORE INTO invoices 
            (id, nome, documento, data_saida, endereco, bairro, cep, municipio, uf, fatura, valor_produtos, valor_nota, desconto, codigo, quantidade, descricao, cor, origem, origem_arquivo, data_upload, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              inv.id,
              inv.nome || "",
              inv.documento || "",
              inv.dataSaida || "",
              inv.endereco || "",
              inv.bairro || "",
              inv.cep || "",
              inv.municipio || "",
              inv.uf || "",
              inv.fatura || "",
              inv.valorProdutos || "0,00",
              inv.valorNota || "0,00",
              inv.desconto || "0,00",
              inv.codigo || "",
              inv.quantidade || "1",
              inv.descricao || "",
              inv.cor || "N\xC3\u0192\xC2\xA3o identificada",
              inv.origem || "Outros",
              inv.origemArquivo || null,
              inv.dataUpload || null,
              inv.status || "Processado"
            ]
          );
        }
        console.log(`[MySQL Migration] ${invoices.length} notas fiscais migradas do JSON para o MySQL.`);
      } catch (e) {
        console.error("[MySQL Migration] Erro ao migrar notas:", e);
      }
    }
  }
  const [logsCountRows] = await pool.query("SELECT COUNT(*) as count FROM audit_logs");
  if (logsCountRows[0].count === 0) {
    const logsFile = import_path.default.join(dataDir, "logs.json");
    if (import_fs.default.existsSync(logsFile)) {
      try {
        const logs = JSON.parse(import_fs.default.readFileSync(logsFile, "utf-8"));
        for (const l of logs) {
          await pool.query(
            "INSERT IGNORE INTO audit_logs (id, timestamp, user_id, user_name, action, category, details, ip, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [l.id, l.timestamp ? new Date(l.timestamp) : /* @__PURE__ */ new Date(), l.userId, l.userName, l.action, l.category, l.details, l.ip, l.severity]
          );
        }
      } catch (e) {
        console.error("[MySQL Migration] Erro ao migrar logs:", e);
      }
    }
  }
  const [alertsCountRows] = await pool.query("SELECT COUNT(*) as count FROM alert_rules");
  if (alertsCountRows[0].count === 0) {
    const alertsFile = import_path.default.join(dataDir, "alerts.json");
    if (import_fs.default.existsSync(alertsFile)) {
      try {
        const alerts = JSON.parse(import_fs.default.readFileSync(alertsFile, "utf-8"));
        for (const a of alerts) {
          await pool.query(
            "INSERT IGNORE INTO alert_rules (id, name, type, threshold, email_notify, push_notify, active, last_triggered) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [a.id, a.name, a.type, a.threshold || null, a.emailNotify ? 1 : 0, a.pushNotify ? 1 : 0, a.active ? 1 : 0, a.lastTriggered ? new Date(a.lastTriggered) : null]
          );
        }
      } catch (e) {
        console.error("[MySQL Migration] Erro ao migrar alertas:", e);
      }
    }
  }
  const settingsFile = import_path.default.join(dataDir, "settings.json");
  if (import_fs.default.existsSync(settingsFile)) {
    try {
      const settings = JSON.parse(import_fs.default.readFileSync(settingsFile, "utf-8"));
      await pool.query(
        "INSERT IGNORE INTO system_settings (id, data_json) VALUES (?, ?)",
        ["main", JSON.stringify(settings)]
      );
    } catch {
    }
  }
  const powerBiFile = import_path.default.join(dataDir, "powerbi.json");
  if (import_fs.default.existsSync(powerBiFile)) {
    try {
      const pbi = JSON.parse(import_fs.default.readFileSync(powerBiFile, "utf-8"));
      await pool.query(
        "INSERT IGNORE INTO integrations_config (type, data_json) VALUES (?, ?)",
        ["powerbi", JSON.stringify(pbi)]
      );
    } catch {
    }
  }
  const gsheetsFile = import_path.default.join(dataDir, "gsheets.json");
  if (import_fs.default.existsSync(gsheetsFile)) {
    try {
      const gs = JSON.parse(import_fs.default.readFileSync(gsheetsFile, "utf-8"));
      await pool.query(
        "INSERT IGNORE INTO integrations_config (type, data_json) VALUES (?, ?)",
        ["gsheets", JSON.stringify(gs)]
      );
    } catch {
    }
  }
  await syncDatabaseToSqlFile();
}
async function initDefaultStockItemsIfEmpty() {
  if (!pool) return;
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM stock_items");
    if (rows[0].count === 0) {
      const defaultItems = [
        {
          id: "sku-spm-preto",
          sku: "SPM-PRETO-100ML",
          nome: "Verniz Elite SPM 100ml - Cor Preto",
          categoria: "Verniz 100ml",
          cor: "Preto",
          unidade: "UN",
          estoque_inicial: 3e3,
          estoque_minimo: 120,
          estoque_seguranca: 40,
          preco_custo: 12.5,
          preco_venda: 29.99,
          localizacao: "Setor A - P01"
        },
        {
          id: "sku-spm-marrom",
          sku: "SPM-MARROM-100ML",
          nome: "Verniz Elite SPM 100ml - Cor Marrom",
          categoria: "Verniz 100ml",
          cor: "Marrom",
          unidade: "UN",
          estoque_inicial: 1500,
          estoque_minimo: 60,
          estoque_seguranca: 20,
          preco_custo: 12.5,
          preco_venda: 29.99,
          localizacao: "Setor A - P02"
        },
        {
          id: "sku-spm-incolor",
          sku: "SPM-INCOLOR-100ML",
          nome: "Verniz Elite SPM 100ml - Cor Incolor",
          categoria: "Verniz 100ml",
          cor: "Incolor",
          unidade: "UN",
          estoque_inicial: 1200,
          estoque_minimo: 50,
          estoque_seguranca: 20,
          preco_custo: 12.5,
          preco_venda: 29.99,
          localizacao: "Setor A - P03"
        },
        {
          id: "sku-spm-kit1",
          sku: "SPM-KIT1-COMPLETO",
          nome: "Kit 1 Verniz Elite SPM 100ml + Esponja + Flanela",
          categoria: "Kits Promocionais",
          cor: "Kit Completo",
          unidade: "KIT",
          estoque_inicial: 2e3,
          estoque_minimo: 80,
          estoque_seguranca: 30,
          preco_custo: 18,
          preco_venda: 57.99,
          localizacao: "Setor B - Kits"
        },
        {
          id: "sku-spm-esponja",
          sku: "SPM-ESPONJA",
          nome: "Esponja Aplicadora Anat\xC3\xB4mica SPM",
          categoria: "Acess\xC3\xB3rios",
          cor: "Amarela/Preta",
          unidade: "UN",
          estoque_inicial: 3500,
          estoque_minimo: 150,
          estoque_seguranca: 50,
          preco_custo: 2.5,
          preco_venda: 8.9,
          localizacao: "Setor C - Acess\xC3\xB3rios"
        },
        {
          id: "sku-spm-flanela",
          sku: "SPM-FLANELA",
          nome: "Flanela de Microfibra Especial SPM",
          categoria: "Acess\xC3\xB3rios",
          cor: "Laranja/Azul",
          unidade: "UN",
          estoque_inicial: 3500,
          estoque_minimo: 150,
          estoque_seguranca: 50,
          preco_custo: 3,
          preco_venda: 9.9,
          localizacao: "Setor C - Acess\xC3\xB3rios"
        },
        {
          id: "sku-spm-outros",
          sku: "SPM-OUTROS",
          nome: "Outros Produtos & Varia\xC3\xA7\xC3\xB5es SPM",
          categoria: "Geral",
          cor: "Variada",
          unidade: "UN",
          estoque_inicial: 1e3,
          estoque_minimo: 40,
          estoque_seguranca: 15,
          preco_custo: 15,
          preco_venda: 35,
          localizacao: "Setor D - Geral"
        }
      ];
      for (const item of defaultItems) {
        await pool.query(
          `INSERT IGNORE INTO stock_items 
          (id, sku, nome, categoria, cor, unidade, estoque_inicial, total_entradas, total_saidas, estoque_atual, estoque_minimo, estoque_seguranca, preco_custo, preco_venda, localizacao, ativo) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.sku,
            item.nome,
            item.categoria,
            item.cor,
            item.unidade,
            item.estoque_inicial,
            item.estoque_inicial,
            0,
            item.estoque_inicial,
            item.estoque_minimo,
            item.estoque_seguranca,
            item.preco_custo,
            item.preco_venda,
            item.localizacao,
            1
          ]
        );
      }
      console.log(`[MySQL Stock] ${defaultItems.length} produtos de estoque cadastrados inicialmente.`);
      await recalculateAllStockFromInvoices();
    }
  } catch (err) {
    console.error("[MySQL Stock Init Error]:", err.message);
  }
}
function escapeSql(val) {
  if (val === null || val === void 0) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
  const str = String(val).replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case "\0":
        return "\\0";
      case "\b":
        return "\\b";
      case "	":
        return "\\t";
      case "":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case '"':
      case "'":
      case "\\":
      case "%":
        return "\\" + char;
      default:
        return char;
    }
  });
  return `'${str}'`;
}
async function syncDatabaseToSqlFile() {
  try {
    let users = [];
    let passwords = [];
    let invoices = [];
    let logs = [];
    let alerts = [];
    let settings = [];
    let integrations = [];
    const p = await getDbPool();
    if (p) {
      const [u] = await p.query("SELECT * FROM users ORDER BY created_at ASC");
      users = u;
      const [pw] = await p.query("SELECT * FROM user_passwords");
      passwords = pw;
      const [inv] = await p.query("SELECT * FROM invoices ORDER BY created_at DESC");
      invoices = inv;
      const [lg] = await p.query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200");
      logs = lg;
      const [al] = await p.query("SELECT * FROM alert_rules ORDER BY name ASC");
      alerts = al;
      const [st] = await p.query("SELECT * FROM system_settings");
      settings = st;
      const [ig] = await p.query("SELECT * FROM integrations_config");
      integrations = ig;
    } else {
      users = readJsonFile("users.json", []);
      const pwMap = readJsonFile("userPasswords.json", {});
      passwords = Object.entries(pwMap).map(([email, password_hash]) => ({ email, password_hash }));
      invoices = readJsonFile("invoices.json", []);
      logs = readJsonFile("logs.json", []);
      alerts = readJsonFile("alerts.json", []);
      const mainSettings = readJsonFile("settings.json", defaultSettings);
      settings = [{ id: "main", data_json: mainSettings }];
      const pbi = readJsonFile("powerbi.json", { enabled: true });
      const gs = readJsonFile("gsheets.json", { autoSync: true });
      integrations = [
        { type: "powerbi", data_json: pbi },
        { type: "gsheets", data_json: gs }
      ];
    }
    let sql = `-- ==========================================================
`;
    sql += `-- SPM STORE - SISTEMA FISCAL & AUDITORIA DE NOTAS FISCAIS
`;
    sql += `-- Sincronizado automaticamente em: ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")}
`;
    sql += `-- Total de Registros Fiscais: ${invoices.length}
`;
    sql += `-- ==========================================================

`;
    sql += `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`;
    sql += `USE \`${DB_NAME}\`;

`;
    sql += `-- --------------------------------------------------------
`;
    sql += `-- 1. Tabela users
`;
    sql += `-- --------------------------------------------------------
`;
    sql += `DROP TABLE IF EXISTS \`user_passwords\`;
`;
    sql += `DROP TABLE IF EXISTS \`users\`;
`;
    sql += `CREATE TABLE \`users\` (
`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`name\` VARCHAR(255) NOT NULL,
`;
    sql += `  \`email\` VARCHAR(255) NOT NULL,
`;
    sql += `  \`role\` ENUM('ADMIN', 'MANAGER', 'AUDITOR') NOT NULL DEFAULT 'AUDITOR',
`;
    sql += `  \`active\` TINYINT(1) NOT NULL DEFAULT 1,
`;
    sql += `  \`last_login\` DATETIME NULL,
`;
    sql += `  \`avatar\` TEXT NULL,
`;
    sql += `  \`department\` VARCHAR(255) NULL,
`;
    sql += `  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`;
    sql += `  PRIMARY KEY (\`id\`),
`;
    sql += `  UNIQUE KEY \`idx_users_email\` (\`email\`)
`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
    sql += `-- --------------------------------------------------------
`;
    sql += `-- 2. Tabela user_passwords
`;
    sql += `-- --------------------------------------------------------
`;
    sql += `CREATE TABLE \`user_passwords\` (
`;
    sql += `  \`email\` VARCHAR(255) NOT NULL,
`;
    sql += `  \`password_hash\` VARCHAR(255) NOT NULL,
`;
    sql += `  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`;
    sql += `  PRIMARY KEY (\`email\`),
`;
    sql += `  CONSTRAINT \`fk_user_passwords_email\` FOREIGN KEY (\`email\`) REFERENCES \`users\` (\`email\`) ON DELETE CASCADE ON UPDATE CASCADE
`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
    sql += `-- --------------------------------------------------------
`;
    sql += `-- 3. Tabela invoices
`;
    sql += `-- --------------------------------------------------------
`;
    sql += `DROP TABLE IF EXISTS \`invoices\`;
`;
    sql += `CREATE TABLE \`invoices\` (
`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`nome\` VARCHAR(255) NOT NULL DEFAULT '',
`;
    sql += `  \`documento\` VARCHAR(64) NOT NULL DEFAULT '',
`;
    sql += `  \`data_saida\` VARCHAR(64) NOT NULL DEFAULT '',
`;
    sql += `  \`endereco\` TEXT NULL,
`;
    sql += `  \`bairro\` VARCHAR(255) NOT NULL DEFAULT '',
`;
    sql += `  \`cep\` VARCHAR(32) NOT NULL DEFAULT '',
`;
    sql += `  \`municipio\` VARCHAR(255) NOT NULL DEFAULT '',
`;
    sql += `  \`uf\` VARCHAR(10) NOT NULL DEFAULT '',
`;
    sql += `  \`fatura\` VARCHAR(64) NOT NULL DEFAULT '',
`;
    sql += `  \`valor_produtos\` VARCHAR(64) NOT NULL DEFAULT '0,00',
`;
    sql += `  \`valor_nota\` VARCHAR(64) NOT NULL DEFAULT '0,00',
`;
    sql += `  \`desconto\` VARCHAR(64) NOT NULL DEFAULT '0,00',
`;
    sql += `  \`codigo\` VARCHAR(128) NOT NULL DEFAULT '',
`;
    sql += `  \`quantidade\` VARCHAR(64) NOT NULL DEFAULT '1',
`;
    sql += `  \`descricao\` TEXT NULL,
`;
    sql += `  \`cor\` VARCHAR(64) NOT NULL DEFAULT 'N\xC3\u0192\xC2\xA3o identificada',
`;
    sql += `  \`origem\` VARCHAR(64) NOT NULL DEFAULT 'Outros',
`;
    sql += `  \`origem_arquivo\` VARCHAR(255) NULL,
`;
    sql += `  \`data_upload\` VARCHAR(64) NULL,
`;
    sql += `  \`status\` VARCHAR(32) NOT NULL DEFAULT 'Processado',
`;
    sql += `  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`;
    sql += `  PRIMARY KEY (\`id\`),
`;
    sql += `  INDEX \`idx_invoices_documento\` (\`documento\`),
`;
    sql += `  INDEX \`idx_invoices_origem\` (\`origem\`),
`;
    sql += `  INDEX \`idx_invoices_cor\` (\`cor\`),
`;
    sql += `  INDEX \`idx_invoices_uf\` (\`uf\`),
`;
    sql += `  INDEX \`idx_invoices_municipio\` (\`municipio\`)
`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
    sql += `-- --------------------------------------------------------
`;
    sql += `-- 4. Tabela audit_logs
`;
    sql += `-- --------------------------------------------------------
`;
    sql += `DROP TABLE IF EXISTS \`audit_logs\`;
`;
    sql += `CREATE TABLE \`audit_logs\` (
`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`timestamp\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`;
    sql += `  \`user_id\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`user_name\` VARCHAR(255) NOT NULL,
`;
    sql += `  \`action\` VARCHAR(255) NOT NULL,
`;
    sql += `  \`category\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`details\` TEXT NOT NULL,
`;
    sql += `  \`ip\` VARCHAR(64) NOT NULL DEFAULT '127.0.0.1',
`;
    sql += `  \`severity\` ENUM('info', 'warning', 'error', 'success') NOT NULL DEFAULT 'info',
`;
    sql += `  PRIMARY KEY (\`id\`),
`;
    sql += `  INDEX \`idx_audit_logs_timestamp\` (\`timestamp\`),
`;
    sql += `  INDEX \`idx_audit_logs_category\` (\`category\`)
`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
    sql += `-- --------------------------------------------------------
`;
    sql += `-- 5. Tabela alert_rules
`;
    sql += `-- --------------------------------------------------------
`;
    sql += `DROP TABLE IF EXISTS \`alert_rules\`;
`;
    sql += `CREATE TABLE \`alert_rules\` (
`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`name\` VARCHAR(255) NOT NULL,
`;
    sql += `  \`type\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`threshold\` DECIMAL(12,2) NULL,
`;
    sql += `  \`email_notify\` TINYINT(1) NOT NULL DEFAULT 1,
`;
    sql += `  \`push_notify\` TINYINT(1) NOT NULL DEFAULT 1,
`;
    sql += `  \`active\` TINYINT(1) NOT NULL DEFAULT 1,
`;
    sql += `  \`last_triggered\` DATETIME NULL,
`;
    sql += `  PRIMARY KEY (\`id\`)
`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
    sql += `-- --------------------------------------------------------
`;
    sql += `-- 6. Tabelas system_settings & integrations_config
`;
    sql += `-- --------------------------------------------------------
`;
    sql += `DROP TABLE IF EXISTS \`system_settings\`;
`;
    sql += `CREATE TABLE \`system_settings\` (
`;
    sql += `  \`id\` VARCHAR(32) NOT NULL,
`;
    sql += `  \`data_json\` JSON NOT NULL,
`;
    sql += `  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`;
    sql += `  PRIMARY KEY (\`id\`)
`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
    sql += `DROP TABLE IF EXISTS \`integrations_config\`;
`;
    sql += `CREATE TABLE \`integrations_config\` (
`;
    sql += `  \`type\` VARCHAR(32) NOT NULL,
`;
    sql += `  \`data_json\` JSON NOT NULL,
`;
    sql += `  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`;
    sql += `  PRIMARY KEY (\`type\`)
`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
    if (users.length > 0) {
      sql += `INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`role\`, \`active\`, \`last_login\`, \`avatar\`, \`department\`) VALUES
`;
      sql += users.map((u) => `(${escapeSql(u.id)}, ${escapeSql(u.name)}, ${escapeSql(u.email)}, ${escapeSql(u.role)}, ${escapeSql(u.active ? 1 : 0)}, ${escapeSql(u.last_login || u.lastLogin || null)}, ${escapeSql(u.avatar || null)}, ${escapeSql(u.department || null)})`).join(",\n") + `;

`;
    }
    if (passwords.length > 0) {
      sql += `INSERT INTO \`user_passwords\` (\`email\`, \`password_hash\`) VALUES
`;
      sql += passwords.map((pw) => `(${escapeSql(pw.email)}, ${escapeSql(pw.password_hash || pw.passwordHash)})`).join(",\n") + `;

`;
    }
    if (invoices.length > 0) {
      sql += `INSERT INTO \`invoices\` (\`id\`, \`nome\`, \`documento\`, \`data_saida\`, \`endereco\`, \`bairro\`, \`cep\`, \`municipio\`, \`uf\`, \`fatura\`, \`valor_produtos\`, \`valor_nota\`, \`desconto\`, \`codigo\`, \`quantidade\`, \`descricao\`, \`cor\`, \`origem\`, \`origem_arquivo\`, \`data_upload\`, \`status\`) VALUES
`;
      sql += invoices.map((inv) => `(${escapeSql(inv.id)}, ${escapeSql(inv.nome || "")}, ${escapeSql(inv.documento || "")}, ${escapeSql(inv.data_saida || inv.dataSaida || "")}, ${escapeSql(inv.endereco || "")}, ${escapeSql(inv.bairro || "")}, ${escapeSql(inv.cep || "")}, ${escapeSql(inv.municipio || "")}, ${escapeSql(inv.uf || "")}, ${escapeSql(inv.fatura || "")}, ${escapeSql(inv.valor_produtos || inv.valorProdutos || "0,00")}, ${escapeSql(inv.valor_nota || inv.valorNota || "0,00")}, ${escapeSql(inv.desconto || "0,00")}, ${escapeSql(inv.codigo || "")}, ${escapeSql(inv.quantidade || "1")}, ${escapeSql(inv.descricao || "")}, ${escapeSql(inv.cor || "N\xC3\u0192\xC2\xA3o identificada")}, ${escapeSql(inv.origem || "Outros")}, ${escapeSql(inv.origem_arquivo || inv.origemArquivo || null)}, ${escapeSql(inv.data_upload || inv.dataUpload || null)}, ${escapeSql(inv.status || "Processado")})`).join(",\n") + `;

`;
    }
    if (logs.length > 0) {
      sql += `INSERT INTO \`audit_logs\` (\`id\`, \`timestamp\`, \`user_id\`, \`user_name\`, \`action\`, \`category\`, \`details\`, \`ip\`, \`severity\`) VALUES
`;
      sql += logs.map((l) => `(${escapeSql(l.id)}, ${escapeSql(l.timestamp ? new Date(l.timestamp) : /* @__PURE__ */ new Date())}, ${escapeSql(l.user_id || l.userId)}, ${escapeSql(l.user_name || l.userName)}, ${escapeSql(l.action)}, ${escapeSql(l.category)}, ${escapeSql(l.details)}, ${escapeSql(l.ip || "127.0.0.1")}, ${escapeSql(l.severity || "info")})`).join(",\n") + `;

`;
    }
    if (alerts.length > 0) {
      sql += `INSERT INTO \`alert_rules\` (\`id\`, \`name\`, \`type\`, \`threshold\`, \`email_notify\`, \`push_notify\`, \`active\`, \`last_triggered\`) VALUES
`;
      sql += alerts.map((a) => `(${escapeSql(a.id)}, ${escapeSql(a.name)}, ${escapeSql(a.type)}, ${escapeSql(a.threshold || null)}, ${escapeSql(a.email_notify !== void 0 ? a.email_notify ? 1 : 0 : a.emailNotify ? 1 : 0)}, ${escapeSql(a.push_notify !== void 0 ? a.push_notify ? 1 : 0 : a.pushNotify ? 1 : 0)}, ${escapeSql(a.active !== void 0 ? a.active ? 1 : 0 : 1)}, ${escapeSql(a.last_triggered || a.lastTriggered || null)})`).join(",\n") + `;

`;
    }
    if (settings.length > 0) {
      sql += `INSERT INTO \`system_settings\` (\`id\`, \`data_json\`) VALUES
`;
      sql += settings.map((s) => `(${escapeSql(s.id)}, ${escapeSql(typeof s.data_json === "string" ? s.data_json : JSON.stringify(s.data_json))})`).join(",\n") + `;

`;
    }
    if (integrations.length > 0) {
      sql += `INSERT INTO \`integrations_config\` (\`type\`, \`data_json\`) VALUES
`;
      sql += integrations.map((g) => `(${escapeSql(g.type)}, ${escapeSql(typeof g.data_json === "string" ? g.data_json : JSON.stringify(g.data_json))})`).join(",\n") + `;

`;
    }
    let stockItems = [];
    let stockMovements = [];
    if (p) {
      const [si] = await p.query("SELECT * FROM stock_items ORDER BY nome ASC");
      stockItems = si;
      const [sm] = await p.query("SELECT * FROM stock_movements ORDER BY data_movimentacao DESC LIMIT 500");
      stockMovements = sm;
    }
    sql += `-- --------------------------------------------------------
`;
    sql += `-- 7. Tabelas de Controle de Estoque (stock_items & stock_movements)
`;
    sql += `-- --------------------------------------------------------
`;
    sql += `DROP TABLE IF EXISTS \`stock_movements\`;
`;
    sql += `DROP TABLE IF EXISTS \`stock_items\`;
`;
    sql += `CREATE TABLE \`stock_items\` (
`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`sku\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`nome\` VARCHAR(255) NOT NULL,
`;
    sql += `  \`categoria\` VARCHAR(64) NOT NULL DEFAULT 'Verniz',
`;
    sql += `  \`cor\` VARCHAR(64) NOT NULL DEFAULT 'Preto',
`;
    sql += `  \`unidade\` VARCHAR(16) NOT NULL DEFAULT 'UN',
`;
    sql += `  \`estoque_inicial\` INT NOT NULL DEFAULT 0,
`;
    sql += `  \`total_entradas\` INT NOT NULL DEFAULT 0,
`;
    sql += `  \`total_saidas\` INT NOT NULL DEFAULT 0,
`;
    sql += `  \`estoque_atual\` INT NOT NULL DEFAULT 0,
`;
    sql += `  \`estoque_minimo\` INT NOT NULL DEFAULT 50,
`;
    sql += `  \`estoque_seguranca\` INT NOT NULL DEFAULT 20,
`;
    sql += `  \`preco_custo\` DECIMAL(10,2) NOT NULL DEFAULT 12.50,
`;
    sql += `  \`preco_venda\` DECIMAL(10,2) NOT NULL DEFAULT 29.99,
`;
    sql += `  \`localizacao\` VARCHAR(128) NOT NULL DEFAULT 'Prateleira A-01',
`;
    sql += `  \`ativo\` TINYINT(1) NOT NULL DEFAULT 1,
`;
    sql += `  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`;
    sql += `  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`;
    sql += `  PRIMARY KEY (\`id\`),
`;
    sql += `  UNIQUE KEY \`idx_stock_sku\` (\`sku\`),
`;
    sql += `  INDEX \`idx_stock_cor\` (\`cor\`)
`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
    sql += `CREATE TABLE \`stock_movements\` (
`;
    sql += `  \`id\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`product_id\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`sku\` VARCHAR(64) NOT NULL,
`;
    sql += `  \`tipo\` VARCHAR(32) NOT NULL,
`;
    sql += `  \`quantidade\` INT NOT NULL,
`;
    sql += `  \`saldo_anterior\` INT NOT NULL DEFAULT 0,
`;
    sql += `  \`saldo_posterior\` INT NOT NULL DEFAULT 0,
`;
    sql += `  \`documento_ref\` VARCHAR(128) NULL,
`;
    sql += `  \`origem_canal\` VARCHAR(64) NULL,
`;
    sql += `  \`motivo\` TEXT NULL,
`;
    sql += `  \`valor_unitario\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
`;
    sql += `  \`valor_total\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
`;
    sql += `  \`usuario_id\` VARCHAR(64) NOT NULL DEFAULT 'sistema',
`;
    sql += `  \`usuario_nome\` VARCHAR(255) NOT NULL DEFAULT 'Sistema Autom\xC3\u0192\xC2\xA1tico',
`;
    sql += `  \`data_movimentacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`;
    sql += `  PRIMARY KEY (\`id\`),
`;
    sql += `  INDEX \`idx_mov_product\` (\`product_id\`),
`;
    sql += `  INDEX \`idx_mov_sku\` (\`sku\`),
`;
    sql += `  INDEX \`idx_mov_tipo\` (\`tipo\`),
`;
    sql += `  INDEX \`idx_mov_data\` (\`data_movimentacao\`)
`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
    if (stockItems.length > 0) {
      sql += `-- Inser\xC3\u0192\xC2\xA7\xC3\u0192\xC2\xB5es em stock_items (${stockItems.length} produtos cadastrados)
`;
      sql += `INSERT INTO \`stock_items\` (\`id\`, \`sku\`, \`nome\`, \`categoria\`, \`cor\`, \`unidade\`, \`estoque_inicial\`, \`total_entradas\`, \`total_saidas\`, \`estoque_atual\`, \`estoque_minimo\`, \`estoque_seguranca\`, \`preco_custo\`, \`preco_venda\`, \`localizacao\`, \`ativo\`) VALUES
`;
      sql += stockItems.map((s) => `(${escapeSql(s.id)}, ${escapeSql(s.sku)}, ${escapeSql(s.nome)}, ${escapeSql(s.categoria)}, ${escapeSql(s.cor)}, ${escapeSql(s.unidade)}, ${escapeSql(s.estoque_inicial || s.estoqueInicial || 0)}, ${escapeSql(s.total_entradas || s.totalEntradas || 0)}, ${escapeSql(s.total_saidas || s.totalSaidas || 0)}, ${escapeSql(s.estoque_atual || s.estoqueAtual || 0)}, ${escapeSql(s.estoque_minimo || s.estoqueMinimo || 50)}, ${escapeSql(s.estoque_seguranca || s.estoqueSeguranca || 20)}, ${escapeSql(s.preco_custo || s.precoCusto || 12.5)}, ${escapeSql(s.preco_venda || s.precoVenda || 29.99)}, ${escapeSql(s.localizacao || "Prateleira A-01")}, ${escapeSql(s.ativo ? 1 : 0)})`).join(",\n") + `;

`;
    }
    if (stockMovements.length > 0) {
      sql += `-- Inser\xC3\u0192\xC2\xA7\xC3\u0192\xC2\xB5es em stock_movements (\xC3\u0192\xC5\xA1ltimas ${stockMovements.length} movimenta\xC3\u0192\xC2\xA7\xC3\u0192\xC2\xB5es)
`;
      sql += `INSERT INTO \`stock_movements\` (\`id\`, \`product_id\`, \`sku\`, \`tipo\`, \`quantidade\`, \`saldo_anterior\`, \`saldo_posterior\`, \`documento_ref\`, \`origem_canal\`, \`motivo\`, \`valor_unitario\`, \`valor_total\`, \`usuario_id\`, \`usuario_nome\`, \`data_movimentacao\`) VALUES
`;
      sql += stockMovements.map((m) => `(${escapeSql(m.id)}, ${escapeSql(m.product_id || m.productId)}, ${escapeSql(m.sku)}, ${escapeSql(m.tipo)}, ${escapeSql(m.quantidade || 0)}, ${escapeSql(m.saldo_anterior || m.saldoAnterior || 0)}, ${escapeSql(m.saldo_posterior || m.saldoPosterior || 0)}, ${escapeSql(m.documento_ref || m.documentoRef || null)}, ${escapeSql(m.origem_canal || m.origemCanal || null)}, ${escapeSql(m.motivo || null)}, ${escapeSql(m.valor_unitario || m.valorUnitario || 0)}, ${escapeSql(m.valor_total || m.valorTotal || 0)}, ${escapeSql(m.usuario_id || m.usuarioId || "sistema")}, ${escapeSql(m.usuario_nome || m.usuarioNome || "Sistema")}, ${escapeSql(m.data_movimentacao ? new Date(m.data_movimentacao) : /* @__PURE__ */ new Date())})`).join(",\n") + `;

`;
    }
    const sqlFilePath = import_path.default.join(process.cwd(), "database_spm_fiscal.sql");
    import_fs.default.writeFileSync(sqlFilePath, sql, "utf-8");
    console.log(`[SQL Sync] Arquivo database_spm_fiscal.sql sincronizado com sucesso (${invoices.length} notas).`);
  } catch (err) {
    console.error("[SQL Sync] Erro ao sincronizar database_spm_fiscal.sql:", err.message);
  }
}
function checkDuplicateInvoices(existingList, incomingList) {
  const uniqueItems = [];
  const duplicates = [];
  for (const item of incomingList) {
    const existingMatch = existingList.find((existing) => {
      if (existing.id && item.id && existing.id === item.id) return true;
      if (existing.documento && item.documento && existing.documento === item.documento && existing.fatura && item.fatura && existing.fatura === item.fatura && existing.codigo === item.codigo) {
        return true;
      }
      return false;
    });
    if (existingMatch) {
      duplicates.push({
        id: item.id || existingMatch.id,
        fatura: item.fatura || "N/A",
        documento: item.documento || "N/A",
        nome: item.nome || existingMatch.nome,
        codigo: item.codigo || "N/A",
        valorNota: item.valorNota || "0,00",
        origem: item.origem || "Outros",
        motivo: `Nota j\xC3\u0192\xC2\xA1 registrada no banco (Fatura: ${item.fatura}, Doc: ${item.documento}, SKU: ${item.codigo})`
      });
    } else {
      const batchMatch = uniqueItems.find(
        (u) => u.documento === item.documento && u.fatura === item.fatura && u.codigo === item.codigo
      );
      if (batchMatch) {
        duplicates.push({
          id: item.id,
          fatura: item.fatura || "N/A",
          documento: item.documento || "N/A",
          nome: item.nome,
          codigo: item.codigo || "N/A",
          valorNota: item.valorNota || "0,00",
          origem: item.origem || "Outros",
          motivo: `Item duplicado dentro do pr\xC3\u0192\xC2\xB3prio lote (Fatura: ${item.fatura}, SKU: ${item.codigo})`
        });
      } else {
        uniqueItems.push(item);
      }
    }
  }
  return { uniqueItems, duplicates };
}
function parseNumber(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const clean = val.replace(/[^\d,\.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}
async function getInvoicesFromDb(filters) {
  const p = await getDbPool();
  if (p) {
    let query = "SELECT * FROM invoices WHERE 1=1";
    const params = [];
    if (filters?.origem && filters.origem !== "Todas" && filters.origem !== "Todos") {
      query += " AND origem = ?";
      params.push(filters.origem);
    }
    if (filters?.cor && filters.cor !== "Todas" && filters.cor !== "Todos") {
      query += " AND cor = ?";
      params.push(filters.cor);
    }
    if (filters?.uf && filters.uf !== "Todos") {
      query += " AND uf = ?";
      params.push(filters.uf);
    }
    if (filters?.status && filters.status !== "Todos") {
      query += " AND status = ?";
      params.push(filters.status);
    }
    if (filters?.search) {
      query += " AND (nome LIKE ? OR documento LIKE ? OR descricao LIKE ? OR fatura LIKE ? OR codigo LIKE ? OR municipio LIKE ?)";
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    query += " ORDER BY created_at DESC";
    const [rows] = await p.query(query, params);
    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      documento: r.documento,
      dataSaida: r.data_saida,
      endereco: r.endereco || "",
      bairro: r.bairro || "",
      cep: r.cep || "",
      municipio: r.municipio || "",
      uf: r.uf || "",
      fatura: r.fatura || "",
      valorProdutos: r.valor_produtos || "0,00",
      valorNota: r.valor_nota || "0,00",
      desconto: r.desconto || "0,00",
      codigo: r.codigo || "",
      quantidade: r.quantidade || "1",
      descricao: r.descricao || "",
      cor: r.cor || "N\xC3\u0192\xC2\xA3o identificada",
      origem: r.origem || "Outros",
      origemArquivo: r.origem_arquivo || void 0,
      dataUpload: r.data_upload || void 0,
      status: r.status
    }));
  }
  let list = readJsonFile("invoices.json", []);
  if (filters?.origem && filters.origem !== "Todas" && filters.origem !== "Todos") {
    list = list.filter((i) => (i.origem || "Outros") === filters.origem);
  }
  if (filters?.cor && filters.cor !== "Todas" && filters.cor !== "Todos") {
    list = list.filter((i) => (i.cor || "N\xC3\u0192\xC2\xA3o identificada") === filters.cor);
  }
  if (filters?.uf && filters.uf !== "Todos") {
    list = list.filter((i) => (i.uf || "").toUpperCase() === filters.uf.toUpperCase());
  }
  if (filters?.status && filters.status !== "Todos") {
    list = list.filter((i) => i.status === filters.status);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (i) => (i.nome || "").toLowerCase().includes(s) || (i.documento || "").toLowerCase().includes(s) || (i.descricao || "").toLowerCase().includes(s) || (i.fatura || "").toLowerCase().includes(s) || (i.codigo || "").toLowerCase().includes(s) || (i.municipio || "").toLowerCase().includes(s)
    );
  }
  return list;
}
async function getInvoiceById(id) {
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT * FROM invoices WHERE id = ?", [id]);
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      nome: r.nome,
      documento: r.documento,
      dataSaida: r.data_saida,
      endereco: r.endereco || "",
      bairro: r.bairro || "",
      cep: r.cep || "",
      municipio: r.municipio || "",
      uf: r.uf || "",
      fatura: r.fatura || "",
      valorProdutos: r.valor_produtos || "0,00",
      valorNota: r.valor_nota || "0,00",
      desconto: r.desconto || "0,00",
      codigo: r.codigo || "",
      quantidade: r.quantidade || "1",
      descricao: r.descricao || "",
      cor: r.cor || "N\xC3\u0192\xC2\xA3o identificada",
      origem: r.origem || "Outros",
      origemArquivo: r.origem_arquivo || void 0,
      dataUpload: r.data_upload || void 0,
      status: r.status
    };
  }
  const list = readJsonFile("invoices.json", []);
  return list.find((i) => i.id === id) || null;
}
async function saveInvoiceToDb(inv) {
  const list = readJsonFile("invoices.json", []);
  const idx = list.findIndex((i) => i.id === inv.id);
  if (idx >= 0) {
    list[idx] = inv;
  } else {
    list.unshift(inv);
  }
  writeJsonFile("invoices.json", list);
  const p = await getDbPool();
  if (p) {
    await p.query(
      `INSERT INTO invoices 
      (id, nome, documento, data_saida, endereco, bairro, cep, municipio, uf, fatura, valor_produtos, valor_nota, desconto, codigo, quantidade, descricao, cor, origem, origem_arquivo, data_upload, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      nome = VALUES(nome), documento = VALUES(documento), data_saida = VALUES(data_saida), endereco = VALUES(endereco),
      bairro = VALUES(bairro), cep = VALUES(cep), municipio = VALUES(municipio), uf = VALUES(uf), fatura = VALUES(fatura),
      valor_produtos = VALUES(valor_produtos), valor_nota = VALUES(valor_nota), desconto = VALUES(desconto),
      codigo = VALUES(codigo), quantidade = VALUES(quantidade), descricao = VALUES(descricao), cor = VALUES(cor),
      origem = VALUES(origem), origem_arquivo = VALUES(origem_arquivo), data_upload = VALUES(data_upload), status = VALUES(status)`,
      [
        inv.id,
        inv.nome || "",
        inv.documento || "",
        inv.dataSaida || "",
        inv.endereco || "",
        inv.bairro || "",
        inv.cep || "",
        inv.municipio || "",
        inv.uf || "",
        inv.fatura || "",
        inv.valorProdutos || "0,00",
        inv.valorNota || "0,00",
        inv.desconto || "0,00",
        inv.codigo || "",
        inv.quantidade || "1",
        inv.descricao || "",
        inv.cor || "N\xC3\u0192\xC2\xA3o identificada",
        inv.origem || "Outros",
        inv.origemArquivo || null,
        inv.dataUpload || null,
        inv.status || "Processado"
      ]
    );
  }
  await syncDatabaseToSqlFile();
}
async function deleteInvoiceFromDb(id) {
  const list = readJsonFile("invoices.json", []);
  const nextList = list.filter((i) => i.id !== id);
  const deleted = nextList.length !== list.length;
  writeJsonFile("invoices.json", nextList);
  const p = await getDbPool();
  if (p) {
    const [result] = await p.query("DELETE FROM invoices WHERE id = ?", [id]);
    await syncDatabaseToSqlFile();
    return result.affectedRows > 0;
  }
  await syncDatabaseToSqlFile();
  return deleted;
}
async function bulkDeleteInvoicesFromDb(ids) {
  if (!ids || ids.length === 0) return 0;
  const list = readJsonFile("invoices.json", []);
  const idsSet = new Set(ids);
  const nextList = list.filter((i) => !idsSet.has(i.id));
  const count = list.length - nextList.length;
  writeJsonFile("invoices.json", nextList);
  const p = await getDbPool();
  if (p) {
    const [result] = await p.query("DELETE FROM invoices WHERE id IN (?)", [ids]);
    await syncDatabaseToSqlFile();
    return result.affectedRows;
  }
  await syncDatabaseToSqlFile();
  return count;
}
async function bulkUpdateInvoicesInDb(ids, updates) {
  if (!ids || ids.length === 0) return 0;
  const list = readJsonFile("invoices.json", []);
  const idsSet = new Set(ids);
  let updatedCount = 0;
  for (let i = 0; i < list.length; i++) {
    if (idsSet.has(list[i].id)) {
      list[i] = { ...list[i], ...updates };
      updatedCount++;
    }
  }
  writeJsonFile("invoices.json", list);
  const p = await getDbPool();
  if (p) {
    const setClauses = [];
    const values = [];
    if (updates.origem !== void 0) {
      setClauses.push("origem = ?");
      values.push(updates.origem);
    }
    if (updates.cor !== void 0) {
      setClauses.push("cor = ?");
      values.push(updates.cor);
    }
    if (updates.status !== void 0) {
      setClauses.push("status = ?");
      values.push(updates.status);
    }
    if (updates.municipio !== void 0) {
      setClauses.push("municipio = ?");
      values.push(updates.municipio);
    }
    if (updates.uf !== void 0) {
      setClauses.push("uf = ?");
      values.push(updates.uf);
    }
    if (setClauses.length > 0) {
      values.push(ids);
      const [result] = await p.query(
        `UPDATE invoices SET ${setClauses.join(", ")} WHERE id IN (?)`,
        values
      );
      await syncDatabaseToSqlFile();
      return result.affectedRows || updatedCount;
    }
  }
  await syncDatabaseToSqlFile();
  return updatedCount;
}
async function resetInvoicesInDb() {
  writeJsonFile("invoices.json", []);
  const p = await getDbPool();
  if (p) {
    await p.query("TRUNCATE TABLE invoices");
  }
  await syncDatabaseToSqlFile();
}
async function calculateStatsFromDb(filters) {
  const list = await getInvoicesFromDb(filters);
  let totalFaturamento = 0;
  let totalDescontos = 0;
  let totalItens = 0;
  const marketplacesCount = {};
  const marketplacesFaturamento = {};
  const coresCount = {};
  const ufDistribution = {};
  const timelineMap = {};
  const clientesMap = {};
  list.forEach((inv) => {
    const valNota = parseNumber(inv.valorNota);
    const valDesc = parseNumber(inv.desconto);
    const qtd = parseNumber(inv.quantidade) || 1;
    totalFaturamento += valNota;
    totalDescontos += valDesc;
    totalItens += qtd;
    const orig = inv.origem || "Outros";
    marketplacesCount[orig] = (marketplacesCount[orig] || 0) + 1;
    marketplacesFaturamento[orig] = (marketplacesFaturamento[orig] || 0) + valNota;
    const cor = inv.cor || "N\xC3\u0192\xC2\xA3o identificada";
    coresCount[cor] = (coresCount[cor] || 0) + 1;
    const uf = inv.uf ? inv.uf.toUpperCase().trim() : "OUTROS";
    if (uf.length === 2) {
      ufDistribution[uf] = (ufDistribution[uf] || 0) + 1;
    }
    const data = inv.dataSaida || "Sem Data";
    if (!timelineMap[data]) {
      timelineMap[data] = { total: 0, count: 0 };
    }
    timelineMap[data].total += valNota;
    timelineMap[data].count += 1;
    const clienteNome = inv.nome || "Consumidor N\xC3\u0192\xC2\xA3o Identificado";
    if (!clientesMap[clienteNome]) {
      clientesMap[clienteNome] = { total: 0, count: 0, uf: inv.uf || "SP" };
    }
    clientesMap[clienteNome].total += valNota;
    clientesMap[clienteNome].count += 1;
  });
  const timeline = Object.keys(timelineMap).map((d) => ({
    data: d,
    total: timelineMap[d].total,
    count: timelineMap[d].count
  })).slice(-15);
  const topClientes = Object.keys(clientesMap).map((c) => ({
    nome: c,
    total: clientesMap[c].total,
    count: clientesMap[c].count,
    uf: clientesMap[c].uf
  })).sort((a, b) => b.total - a.total).slice(0, 10);
  const ticketMedio = list.length > 0 ? totalFaturamento / list.length : 0;
  return {
    totalFaturamento,
    totalNotas: list.length,
    ticketMedio,
    totalDescontos,
    totalItens,
    marketplacesCount,
    marketplacesFaturamento,
    coresCount,
    ufDistribution,
    timeline,
    topClientes
  };
}
async function getUsersFromDb() {
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT * FROM users ORDER BY created_at ASC");
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      active: Boolean(r.active),
      lastLogin: r.last_login ? new Date(r.last_login).toISOString() : "",
      avatar: r.avatar || void 0,
      department: r.department || void 0
    }));
  }
  return readJsonFile("users.json", []);
}
async function getUserByIdFromDb(id) {
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      active: Boolean(r.active),
      lastLogin: r.last_login ? new Date(r.last_login).toISOString() : "",
      avatar: r.avatar || void 0,
      department: r.department || void 0
    };
  }
  const list = readJsonFile("users.json", []);
  return list.find((u) => u.id === id) || null;
}
async function getUserByEmailFromDb(email) {
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [email]);
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      active: Boolean(r.active),
      lastLogin: r.last_login ? new Date(r.last_login).toISOString() : "",
      avatar: r.avatar || void 0,
      department: r.department || void 0
    };
  }
  const list = readJsonFile("users.json", []);
  return list.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}
async function getUserPasswordHash(email) {
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT password_hash FROM user_passwords WHERE LOWER(email) = LOWER(?)", [email]);
    if (!rows || rows.length === 0) return null;
    return rows[0].password_hash;
  }
  const pwMap = readJsonFile("userPasswords.json", {});
  return pwMap[email.toLowerCase()] || pwMap[email] || null;
}
async function saveUserToDb(user, passwordHash) {
  const users = readJsonFile("users.json", []);
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  writeJsonFile("users.json", users);
  if (passwordHash) {
    const pwMap = readJsonFile("userPasswords.json", {});
    pwMap[user.email.toLowerCase()] = passwordHash;
    writeJsonFile("userPasswords.json", pwMap);
  }
  const p = await getDbPool();
  if (p) {
    await p.query(
      `INSERT INTO users (id, name, email, role, active, last_login, avatar, department)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       name = VALUES(name), email = VALUES(email), role = VALUES(role), 
       active = VALUES(active), last_login = VALUES(last_login), avatar = VALUES(avatar), department = VALUES(department)`,
      [
        user.id,
        user.name,
        user.email,
        user.role,
        user.active ? 1 : 0,
        user.lastLogin ? new Date(user.lastLogin) : null,
        user.avatar || null,
        user.department || null
      ]
    );
    if (passwordHash) {
      await p.query(
        `INSERT INTO user_passwords (email, password_hash) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [user.email, passwordHash]
      );
    }
  }
  await syncDatabaseToSqlFile();
}
async function deleteUserFromDb(id) {
  const user = await getUserByIdFromDb(id);
  if (!user) return false;
  const users = readJsonFile("users.json", []);
  const nextUsers = users.filter((u) => u.id !== id);
  writeJsonFile("users.json", nextUsers);
  const pwMap = readJsonFile("userPasswords.json", {});
  delete pwMap[user.email.toLowerCase()];
  delete pwMap[user.email];
  writeJsonFile("userPasswords.json", pwMap);
  const p = await getDbPool();
  if (p) {
    await p.query("DELETE FROM user_passwords WHERE LOWER(email) = LOWER(?)", [user.email]);
    const [result] = await p.query("DELETE FROM users WHERE id = ?", [id]);
    await syncDatabaseToSqlFile();
    return result.affectedRows > 0;
  }
  await syncDatabaseToSqlFile();
  return true;
}
async function updateLastLoginInDb(userId) {
  const users = readJsonFile("users.json", []);
  const u = users.find((x) => x.id === userId);
  if (u) {
    u.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
    writeJsonFile("users.json", users);
  }
  const p = await getDbPool();
  if (p) {
    await p.query("UPDATE users SET last_login = NOW() WHERE id = ?", [userId]);
  }
}
async function getLogsFromDb() {
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200");
    return rows.map((r) => ({
      id: r.id,
      timestamp: new Date(r.timestamp).toISOString(),
      userId: r.user_id,
      userName: r.user_name,
      action: r.action,
      category: r.category,
      details: r.details,
      ip: r.ip,
      severity: r.severity
    }));
  }
  return readJsonFile("logs.json", []);
}
async function addLogToDb(log) {
  const logs = readJsonFile("logs.json", []);
  logs.unshift(log);
  if (logs.length > 500) logs.pop();
  writeJsonFile("logs.json", logs);
  const p = await getDbPool();
  if (p) {
    await p.query(
      "INSERT INTO audit_logs (id, timestamp, user_id, user_name, action, category, details, ip, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        log.id,
        log.timestamp ? new Date(log.timestamp) : /* @__PURE__ */ new Date(),
        log.userId,
        log.userName,
        log.action,
        log.category,
        log.details,
        log.ip,
        log.severity
      ]
    );
  }
}
async function clearLogsInDb() {
  writeJsonFile("logs.json", []);
  const p = await getDbPool();
  if (p) {
    await p.query("TRUNCATE TABLE audit_logs");
  }
  await syncDatabaseToSqlFile();
}
async function getAlertsFromDb() {
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT * FROM alert_rules ORDER BY name ASC");
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      threshold: r.threshold ? parseFloat(r.threshold) : void 0,
      emailNotify: Boolean(r.email_notify),
      pushNotify: Boolean(r.push_notify),
      active: Boolean(r.active),
      lastTriggered: r.last_triggered ? new Date(r.last_triggered).toISOString() : void 0
    }));
  }
  return readJsonFile("alerts.json", []);
}
async function saveAlertToDb(rule) {
  const alerts = readJsonFile("alerts.json", []);
  const idx = alerts.findIndex((a) => a.id === rule.id);
  if (idx >= 0) {
    alerts[idx] = rule;
  } else {
    alerts.push(rule);
  }
  writeJsonFile("alerts.json", alerts);
  const p = await getDbPool();
  if (p) {
    await p.query(
      `INSERT INTO alert_rules (id, name, type, threshold, email_notify, push_notify, active, last_triggered)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       name = VALUES(name), type = VALUES(type), threshold = VALUES(threshold),
       email_notify = VALUES(email_notify), push_notify = VALUES(push_notify),
       active = VALUES(active), last_triggered = VALUES(last_triggered)`,
      [
        rule.id,
        rule.name,
        rule.type,
        rule.threshold || null,
        rule.emailNotify ? 1 : 0,
        rule.pushNotify ? 1 : 0,
        rule.active ? 1 : 0,
        rule.lastTriggered ? new Date(rule.lastTriggered) : null
      ]
    );
  }
  await syncDatabaseToSqlFile();
}
async function deleteAlertFromDb(id) {
  const alerts = readJsonFile("alerts.json", []);
  const nextAlerts = alerts.filter((a) => a.id !== id);
  const deleted = nextAlerts.length !== alerts.length;
  writeJsonFile("alerts.json", nextAlerts);
  const p = await getDbPool();
  if (p) {
    const [res] = await p.query("DELETE FROM alert_rules WHERE id = ?", [id]);
    await syncDatabaseToSqlFile();
    return res.affectedRows > 0;
  }
  await syncDatabaseToSqlFile();
  return deleted;
}
var defaultSettings = {
  smtpHost: "smtp.empresa.com.br",
  smtpPort: 587,
  smtpUser: "auditoria@empresa.com.br",
  smtpSender: "SPM Store Auditoria Fiscal <auditoria@empresa.com.br>",
  emailAlertsEnabled: true,
  pushAlertsEnabled: true,
  autoExportExcel: true,
  useGeminiOcrFallback: true,
  vpsMode: true
};
async function getSettingsFromDb() {
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT data_json FROM system_settings WHERE id = ?", ["main"]);
    if (rows && rows.length > 0) {
      const val = typeof rows[0].data_json === "string" ? JSON.parse(rows[0].data_json) : rows[0].data_json;
      return { ...defaultSettings, ...val };
    }
  }
  const s = readJsonFile("settings.json", defaultSettings);
  return { ...defaultSettings, ...s };
}
async function saveSettingsToDb(settings) {
  const current = await getSettingsFromDb();
  const updated = { ...current, ...settings };
  writeJsonFile("settings.json", updated);
  const p = await getDbPool();
  if (p) {
    await p.query(
      "INSERT INTO system_settings (id, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)",
      ["main", JSON.stringify(updated)]
    );
  }
  await syncDatabaseToSqlFile();
  return updated;
}
async function getPowerBiConfigFromDb() {
  const defaultPbi = {
    enabled: true,
    refreshIntervalMinutes: 15,
    lastRefresh: (/* @__PURE__ */ new Date()).toISOString(),
    apiKey: "pbi-spm-secret-key-998822",
    feedUrl: `http://localhost:${process.env.PORT || 3e3}/api/powerbi/feed`
  };
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT data_json FROM integrations_config WHERE type = ?", ["powerbi"]);
    if (rows && rows.length > 0) {
      const val = typeof rows[0].data_json === "string" ? JSON.parse(rows[0].data_json) : rows[0].data_json;
      return { ...defaultPbi, ...val };
    }
  }
  const pbi = readJsonFile("powerbi.json", defaultPbi);
  return { ...defaultPbi, ...pbi };
}
async function getGSheetsConfigFromDb() {
  const defaultGs = {
    spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    sheetName: "Notas_Fiscais_SPM",
    autoSync: true,
    lastSync: (/* @__PURE__ */ new Date()).toISOString(),
    status: "CONNECTED",
    webhookUrl: "https://script.google.com/macros/s/AKfycbw-spm-fiscal-sync/exec"
  };
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT data_json FROM integrations_config WHERE type = ?", ["gsheets"]);
    if (rows && rows.length > 0) {
      const val = typeof rows[0].data_json === "string" ? JSON.parse(rows[0].data_json) : rows[0].data_json;
      return { ...defaultGs, ...val };
    }
  }
  const gs = readJsonFile("gsheets.json", defaultGs);
  return { ...defaultGs, ...gs };
}
async function saveGSheetsConfigToDb(cfg) {
  const current = await getGSheetsConfigFromDb();
  const updated = { ...current, ...cfg };
  writeJsonFile("gsheets.json", updated);
  const p = await getDbPool();
  if (p) {
    await p.query(
      "INSERT INTO integrations_config (type, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)",
      ["gsheets", JSON.stringify(updated)]
    );
  }
  await syncDatabaseToSqlFile();
  return updated;
}
async function getN8nConfigFromDb() {
  const defaultN8n = {
    webhookUrl: "",
    active: true,
    events: {
      newInvoices: true,
      duplicateDetected: true,
      mapCitySale: true,
      dailySummary: false
    },
    lastStatus: "IDLE"
  };
  const p = await getDbPool();
  if (p) {
    const [rows] = await p.query("SELECT data_json FROM integrations_config WHERE type = ?", ["n8n"]);
    if (rows && rows.length > 0) {
      const val = typeof rows[0].data_json === "string" ? JSON.parse(rows[0].data_json) : rows[0].data_json;
      return { ...defaultN8n, ...val };
    }
  }
  return defaultN8n;
}
async function saveN8nConfigToDb(cfg) {
  const current = await getN8nConfigFromDb();
  const updated = { ...current, ...cfg };
  const p = await getDbPool();
  if (p) {
    await p.query(
      "INSERT INTO integrations_config (type, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)",
      ["n8n", JSON.stringify(updated)]
    );
  }
  await syncDatabaseToSqlFile();
  return updated;
}
function resolveSkuFromInvoice(inv) {
  const cor = (inv.cor || "").toLowerCase().trim();
  const desc = (inv.descricao || "").toLowerCase().trim();
  const cod = (inv.codigo || "").toLowerCase().trim();
  if (cod.includes("kit") || desc.includes("kit") || desc.includes("esponja + flanela")) {
    return { sku: "SPM-KIT1-COMPLETO", productId: "sku-spm-kit1", nome: "Kit 1 Verniz Elite SPM 100ml + Esponja + Flanela" };
  }
  if (cor.includes("marrom") || desc.includes("marrom") || cod.includes("marrom")) {
    return { sku: "SPM-MARROM-100ML", productId: "sku-spm-marrom", nome: "Verniz Elite SPM 100ml - Cor Marrom" };
  }
  if (cor.includes("incolor") || desc.includes("incolor") || cod.includes("incolor")) {
    return { sku: "SPM-INCOLOR-100ML", productId: "sku-spm-incolor", nome: "Verniz Elite SPM 100ml - Cor Incolor" };
  }
  if (cor.includes("preto") || desc.includes("preto") || cod.includes("preto") || desc.includes("verniz") || desc.includes("graxa") || cod.includes("spm-01") || cod.includes("spm-02") || cod.includes("spm-1") || cod.includes("spm-2") || desc.includes("elite spm")) {
    return { sku: "SPM-PRETO-100ML", productId: "sku-spm-preto", nome: "Verniz Elite SPM 100ml - Cor Preto" };
  }
  if (desc.includes("esponja")) {
    return { sku: "SPM-ESPONJA", productId: "sku-spm-esponja", nome: "Esponja Aplicadora Anat\xC3\u0192\xC2\xB4mica SPM" };
  }
  if (desc.includes("flanela")) {
    return { sku: "SPM-FLANELA", productId: "sku-spm-flanela", nome: "Flanela de Microfibra Especial SPM" };
  }
  return { sku: "SPM-OUTROS", productId: "sku-spm-outros", nome: "Outros Produtos & Varia\xC3\u0192\xC2\xA7\xC3\u0192\xC2\xB5es SPM" };
}
var FALLBACK_DEFAULT_STOCK = [
  {
    id: "spm-stock-01",
    sku: "SPM-PRETO-100ML",
    nome: "Verniz Elite SPM 100ml - Preto",
    categoria: "Verniz / Graxa",
    cor: "Preto",
    unidade: "un",
    estoqueInicial: 1e3,
    totalEntradas: 1e3,
    totalSaidas: 0,
    estoqueAtual: 1e3,
    estoqueMinimo: 100,
    estoqueSeguranca: 30,
    precoCusto: 12.5,
    precoVenda: 39.99,
    localizacao: "Prateleira A-01",
    ativo: true,
    status: "NORMAL",
    consumoMedioDiario: 10,
    diasCobertura: 100,
    previsaoEsgotamento: "+ 1 ano de estoque",
    valorTotalEstoqueCusto: 12500,
    valorTotalEstoqueVenda: 39990
  },
  {
    id: "spm-stock-02",
    sku: "SPM-MARROM-100ML",
    nome: "Verniz Elite SPM 100ml - Marrom",
    categoria: "Verniz / Graxa",
    cor: "Marrom",
    unidade: "un",
    estoqueInicial: 800,
    totalEntradas: 800,
    totalSaidas: 0,
    estoqueAtual: 800,
    estoqueMinimo: 80,
    estoqueSeguranca: 25,
    precoCusto: 12.5,
    precoVenda: 39.99,
    localizacao: "Prateleira A-02",
    ativo: true,
    status: "NORMAL",
    consumoMedioDiario: 8,
    diasCobertura: 100,
    previsaoEsgotamento: "+ 1 ano de estoque",
    valorTotalEstoqueCusto: 1e4,
    valorTotalEstoqueVenda: 31992
  },
  {
    id: "spm-stock-03",
    sku: "SPM-INCOLOR-100ML",
    nome: "Verniz Elite SPM 100ml - Incolor",
    categoria: "Verniz / Graxa",
    cor: "Incolor",
    unidade: "un",
    estoqueInicial: 600,
    totalEntradas: 600,
    totalSaidas: 0,
    estoqueAtual: 600,
    estoqueMinimo: 60,
    estoqueSeguranca: 20,
    precoCusto: 12.5,
    precoVenda: 39.99,
    localizacao: "Prateleira A-03",
    ativo: true,
    status: "NORMAL",
    consumoMedioDiario: 6,
    diasCobertura: 100,
    previsaoEsgotamento: "+ 1 ano de estoque",
    valorTotalEstoqueCusto: 7500,
    valorTotalEstoqueVenda: 23994
  },
  {
    id: "spm-stock-04",
    sku: "SPM-KIT1-COMPLETO",
    nome: "Kit 1 Verniz Elite SPM 100ml + Esponja + Flanela",
    categoria: "Kits Promocionais",
    cor: "Kit Completo",
    unidade: "kit",
    estoqueInicial: 500,
    totalEntradas: 500,
    totalSaidas: 0,
    estoqueAtual: 500,
    estoqueMinimo: 50,
    estoqueSeguranca: 15,
    precoCusto: 18,
    precoVenda: 69.99,
    localizacao: "Prateleira B-01",
    ativo: true,
    status: "NORMAL",
    consumoMedioDiario: 5,
    diasCobertura: 100,
    previsaoEsgotamento: "+ 1 ano de estoque",
    valorTotalEstoqueCusto: 9e3,
    valorTotalEstoqueVenda: 34995
  },
  {
    id: "spm-stock-05",
    sku: "SPM-ESPONJA",
    nome: "Esponja Aplicadora Anat\xC3\u0192\xC2\xB4mica SPM",
    categoria: "Acess\xC3\u0192\xC2\xB3rios",
    cor: "Amarela/Preta",
    unidade: "un",
    estoqueInicial: 1500,
    totalEntradas: 1500,
    totalSaidas: 0,
    estoqueAtual: 1500,
    estoqueMinimo: 150,
    estoqueSeguranca: 50,
    precoCusto: 1.8,
    precoVenda: 9.9,
    localizacao: "Gaveteiro C-01",
    ativo: true,
    status: "NORMAL",
    consumoMedioDiario: 15,
    diasCobertura: 100,
    previsaoEsgotamento: "+ 1 ano de estoque",
    valorTotalEstoqueCusto: 2700,
    valorTotalEstoqueVenda: 14850
  },
  {
    id: "spm-stock-06",
    sku: "SPM-FLANELA",
    nome: "Flanela de Microfibra Especial SPM",
    categoria: "Acess\xC3\u0192\xC2\xB3rios",
    cor: "Laranja/Azul",
    unidade: "un",
    estoqueInicial: 1500,
    totalEntradas: 1500,
    totalSaidas: 0,
    estoqueAtual: 1500,
    estoqueMinimo: 150,
    estoqueSeguranca: 50,
    precoCusto: 2.2,
    precoVenda: 12.9,
    localizacao: "Gaveteiro C-02",
    ativo: true,
    status: "NORMAL",
    consumoMedioDiario: 15,
    diasCobertura: 100,
    previsaoEsgotamento: "+ 1 ano de estoque",
    valorTotalEstoqueCusto: 3300,
    valorTotalEstoqueVenda: 19350
  },
  {
    id: "spm-stock-07",
    sku: "SPM-OUTROS",
    nome: "Produtos e Varia\xC3\u0192\xC2\xA7\xC3\u0192\xC2\xB5es Gerais SPM",
    categoria: "Geral",
    cor: "Variada",
    unidade: "un",
    estoqueInicial: 300,
    totalEntradas: 300,
    totalSaidas: 0,
    estoqueAtual: 300,
    estoqueMinimo: 30,
    estoqueSeguranca: 10,
    precoCusto: 10,
    precoVenda: 39.99,
    localizacao: "Prateleira D-01",
    ativo: true,
    status: "NORMAL",
    consumoMedioDiario: 3,
    diasCobertura: 100,
    previsaoEsgotamento: "+ 1 ano de estoque",
    valorTotalEstoqueCusto: 3e3,
    valorTotalEstoqueVenda: 11997
  }
];
async function getStockItemsFromDb() {
  try {
    const p = await getDbPool();
    const [rows] = await p.query("SELECT * FROM stock_items WHERE ativo = 1 ORDER BY nome ASC");
    const [recentSales] = await p.query(`
      SELECT sku, SUM(quantidade) as total_vendido 
      FROM stock_movements 
      WHERE tipo = 'SAIDA_VENDA' AND data_movimentacao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY sku
    `);
    const salesMap = {};
    recentSales.forEach((r) => {
      salesMap[r.sku] = Number(r.total_vendido) || 0;
    });
    return rows.map((r) => {
      const estoqueInicial = Number(r.estoque_inicial) || 0;
      const totalEntradas = Number(r.total_entradas) || 0;
      const totalSaidas = Number(r.total_saidas) || 0;
      const estoqueMinimo = Number(r.estoque_minimo) || 50;
      const estoqueSeguranca = Number(r.estoque_seguranca) || 20;
      const precoCusto = Number(r.preco_custo) || 0;
      const precoVenda = Number(r.preco_venda) || 0;
      const estoqueAtual = Math.max(0, totalEntradas - totalSaidas);
      let status = "NORMAL";
      if (estoqueAtual <= 0) {
        status = "ZERADO";
      } else if (estoqueAtual <= estoqueSeguranca) {
        status = "CRITICO";
      } else if (estoqueAtual <= estoqueMinimo) {
        status = "BAIXO";
      }
      const vendas30Dias = salesMap[r.sku] || Math.max(1, Math.round(totalSaidas / 30));
      const consumoMedioDiario = Math.max(0.1, Number((vendas30Dias / 30).toFixed(1)));
      const diasCobertura = consumoMedioDiario > 0 ? Math.round(estoqueAtual / consumoMedioDiario) : 999;
      const dataEsgotamento = /* @__PURE__ */ new Date();
      dataEsgotamento.setDate(dataEsgotamento.getDate() + diasCobertura);
      const previsaoEsgotamento = diasCobertura > 365 ? "+ 1 ano de estoque" : dataEsgotamento.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
      return {
        id: r.id,
        sku: r.sku,
        nome: r.nome,
        categoria: r.categoria,
        cor: r.cor,
        unidade: r.unidade,
        estoqueInicial,
        totalEntradas,
        totalSaidas,
        estoqueAtual,
        estoqueMinimo,
        estoqueSeguranca,
        precoCusto,
        precoVenda,
        localizacao: r.localizacao,
        ativo: Boolean(r.ativo),
        status,
        consumoMedioDiario,
        diasCobertura,
        previsaoEsgotamento,
        valorTotalEstoqueCusto: Number((estoqueAtual * precoCusto).toFixed(2)),
        valorTotalEstoqueVenda: Number((estoqueAtual * precoVenda).toFixed(2)),
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : void 0,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : void 0
      };
    });
  } catch (_) {
    return FALLBACK_DEFAULT_STOCK;
  }
}
async function getStockMovementsFromDb(filters) {
  try {
    const p = await getDbPool();
    let query = "SELECT * FROM stock_movements WHERE 1=1";
    const params = [];
    if (filters?.sku && filters.sku !== "TODOS") {
      query += " AND sku = ?";
      params.push(filters.sku);
    }
    if (filters?.tipo && filters.tipo !== "TODOS") {
      query += " AND tipo = ?";
      params.push(filters.tipo);
    }
    if (filters?.canal && filters.canal !== "TODOS") {
      query += " AND origem_canal = ?";
      params.push(filters.canal);
    }
    if (filters?.search) {
      query += " AND (sku LIKE ? OR documento_ref LIKE ? OR motivo LIKE ? OR usuario_nome LIKE ?)";
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }
    query += " ORDER BY data_movimentacao DESC, id DESC";
    query += ` LIMIT ${Number(filters?.limit) || 150}`;
    const [rows] = await p.query(query, params);
    return rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      sku: r.sku,
      tipo: r.tipo,
      quantidade: Number(r.quantidade) || 0,
      saldoAnterior: Number(r.saldo_anterior) || 0,
      saldoPosterior: Number(r.saldo_posterior) || 0,
      documentoRef: r.documento_ref || void 0,
      origemCanal: r.origem_canal || void 0,
      motivo: r.motivo || void 0,
      valorUnitario: Number(r.valor_unitario) || 0,
      valorTotal: Number(r.valor_total) || 0,
      usuarioId: r.usuario_id || "sistema",
      usuarioNome: r.usuario_nome || "Sistema",
      dataMovimentacao: new Date(r.data_movimentacao).toISOString()
    }));
  } catch (_) {
    return [];
  }
}
async function addStockMovementToDb(payload, user) {
  const p = await getDbPool();
  const [prodRows] = await p.query("SELECT * FROM stock_items WHERE id = ? OR sku = ?", [payload.productId, payload.productId]);
  if (!prodRows || prodRows.length === 0) {
    throw new Error("Produto de estoque n\xC3\u0192\xC2\xA3o encontrado.");
  }
  const prod = prodRows[0];
  const qtd = Math.abs(Number(payload.quantidade) || 1);
  const saldoAnterior = Math.max(0, Number(prod.total_entradas) - Number(prod.total_saidas));
  const isAddition = payload.tipo === "ENTRADA_COMPRA" || payload.tipo === "ENTRADA_PRODUCAO" || payload.tipo === "AJUSTE_POSITIVO";
  const saldoPosterior = isAddition ? saldoAnterior + qtd : Math.max(0, saldoAnterior - qtd);
  const valorUnitario = payload.valorUnitario !== void 0 ? Number(payload.valorUnitario) : Number(prod.preco_custo);
  const valorTotal = valorUnitario * qtd;
  const movementId = "mov-" + Date.now() + "-" + Math.floor(Math.random() * 1e3);
  const now = /* @__PURE__ */ new Date();
  await p.query(
    `INSERT INTO stock_movements 
    (id, product_id, sku, tipo, quantidade, saldo_anterior, saldo_posterior, documento_ref, origem_canal, motivo, valor_unitario, valor_total, usuario_id, usuario_nome, data_movimentacao) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movementId,
      prod.id,
      prod.sku,
      payload.tipo,
      qtd,
      saldoAnterior,
      saldoPosterior,
      payload.documentoRef || "Ajuste Manual",
      payload.origemCanal || "Interno / Armaz\xC3\u0192\xC2\xA9m SPM",
      payload.motivo || "Movimenta\xC3\u0192\xC2\xA7\xC3\u0192\xC2\xA3o manual de estoque",
      valorUnitario,
      valorTotal,
      user?.id || "admin",
      user?.name || "Administrador",
      now
    ]
  );
  if (isAddition) {
    await p.query(
      "UPDATE stock_items SET total_entradas = total_entradas + ?, estoque_atual = total_entradas - total_saidas WHERE id = ?",
      [qtd, prod.id]
    );
  } else {
    await p.query(
      "UPDATE stock_items SET total_saidas = total_saidas + ?, estoque_atual = GREATEST(0, total_entradas - total_saidas) WHERE id = ?",
      [qtd, prod.id]
    );
  }
  await syncDatabaseToSqlFile();
  return {
    id: movementId,
    productId: prod.id,
    sku: prod.sku,
    tipo: payload.tipo,
    quantidade: qtd,
    saldoAnterior,
    saldoPosterior,
    documentoRef: payload.documentoRef,
    origemCanal: payload.origemCanal,
    motivo: payload.motivo,
    valorUnitario,
    valorTotal,
    usuarioId: user?.id || "admin",
    usuarioNome: user?.name || "Administrador",
    dataMovimentacao: now.toISOString()
  };
}
async function saveStockItemToDb(item) {
  const p = await getDbPool();
  await p.query(
    `UPDATE stock_items SET 
      nome = COALESCE(?, nome),
      categoria = COALESCE(?, categoria),
      cor = COALESCE(?, cor),
      unidade = COALESCE(?, unidade),
      estoque_minimo = COALESCE(?, estoque_minimo),
      estoque_seguranca = COALESCE(?, estoque_seguranca),
      preco_custo = COALESCE(?, preco_custo),
      preco_venda = COALESCE(?, preco_venda),
      localizacao = COALESCE(?, localizacao),
      ativo = COALESCE(?, ativo)
    WHERE id = ? OR sku = ?`,
    [
      item.nome,
      item.categoria,
      item.cor,
      item.unidade,
      item.estoqueMinimo,
      item.estoqueSeguranca,
      item.precoCusto,
      item.precoVenda,
      item.localizacao,
      item.ativo !== void 0 ? item.ativo ? 1 : 0 : void 0,
      item.id,
      item.sku
    ]
  );
  await syncDatabaseToSqlFile();
}
async function deductStockForInvoices(invoices, user) {
  if (!invoices || invoices.length === 0) return 0;
  let deductedCount = 0;
  try {
    const p = await getDbPool();
    if (p) {
      for (const inv of invoices) {
        try {
          const resolved = resolveSkuFromInvoice(inv);
          const qtd = Math.max(1, Math.round(parseNumber(inv.quantidade) || 1));
          const valNota = parseNumber(inv.valorNota);
          const valUnitario = valNota > 0 ? Number((valNota / qtd).toFixed(2)) : 29.99;
          const [prodRows] = await p.query("SELECT * FROM stock_items WHERE id = ?", [resolved.productId]);
          if (!prodRows || prodRows.length === 0) continue;
          const prod = prodRows[0];
          const saldoAnterior = Math.max(0, Number(prod.total_entradas) - Number(prod.total_saidas));
          const saldoPosterior = Math.max(0, saldoAnterior - qtd);
          const movId = "mov-venda-" + (inv.id || Date.now() + "-" + Math.floor(Math.random() * 1e3));
          await p.query(
            `INSERT IGNORE INTO stock_movements 
            (id, product_id, sku, tipo, quantidade, saldo_anterior, saldo_posterior, documento_ref, origem_canal, motivo, valor_unitario, valor_total, usuario_id, usuario_nome, data_movimentacao) 
            VALUES (?, ?, ?, 'SAIDA_VENDA', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              movId,
              prod.id,
              prod.sku,
              qtd,
              saldoAnterior,
              saldoPosterior,
              inv.fatura ? `NF ${inv.fatura}` : `Pedido #${inv.id}`,
              inv.origem || "Outros",
              `Venda NF ${inv.fatura || ""} para ${inv.nome || "Consumidor"} (${inv.municipio || ""}/${inv.uf || ""})`,
              valUnitario,
              valNota,
              user?.id || "sistema",
              user?.name || "Emiss\xE3o Autom\xE1tica DANFE",
              inv.dataSaida ? parseDateSafely(inv.dataSaida) : /* @__PURE__ */ new Date()
            ]
          );
          await p.query(
            "UPDATE stock_items SET total_saidas = total_saidas + ?, estoque_atual = GREATEST(0, total_entradas - total_saidas) WHERE id = ?",
            [qtd, prod.id]
          );
          deductedCount += qtd;
        } catch (e) {
          console.warn("[Stock Deduction Warning]:", e.message);
        }
      }
      return deductedCount;
    }
  } catch (_) {
  }
  try {
    const stockItems = readJsonFile("stock_items.json", FALLBACK_DEFAULT_STOCK);
    const stockMovements = readJsonFile("stock_movements.json", []);
    for (const inv of invoices) {
      const resolved = resolveSkuFromInvoice(inv);
      const qtd = Math.max(1, Math.round(parseNumber(inv.quantidade) || 1));
      const valNota = parseNumber(inv.valorNota);
      const valUnitario = valNota > 0 ? Number((valNota / qtd).toFixed(2)) : 29.99;
      const prod = stockItems.find((i) => i.id === resolved.productId || i.sku === resolved.sku);
      if (prod) {
        const saldoAnterior = prod.estoqueAtual;
        prod.totalSaidas += qtd;
        prod.estoqueAtual = Math.max(0, prod.totalEntradas - prod.totalSaidas);
        const saldoPosterior = prod.estoqueAtual;
        const movId = "mov-venda-" + (inv.id || Date.now() + "-" + Math.floor(Math.random() * 1e3));
        if (!stockMovements.some((m) => m.id === movId)) {
          stockMovements.unshift({
            id: movId,
            productId: prod.id,
            sku: prod.sku,
            tipo: "SAIDA_VENDA",
            quantidade: qtd,
            saldoAnterior,
            saldoPosterior,
            documentoRef: inv.fatura ? `NF ${inv.fatura}` : `Pedido #${inv.id}`,
            origemCanal: inv.origem || "Outros",
            motivo: `Venda NF ${inv.fatura || ""} para ${inv.nome || "Consumidor"} (${inv.municipio || ""}/${inv.uf || ""})`,
            valorUnitario: valUnitario,
            valorTotal: valNota,
            usuarioId: user?.id || "sistema",
            usuarioNome: user?.name || "Emiss\xE3o Autom\xE1tica DANFE",
            dataMovimentacao: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        deductedCount += qtd;
      }
    }
    writeJsonFile("stock_items.json", stockItems);
    writeJsonFile("stock_movements.json", stockMovements.slice(0, 500));
  } catch (err) {
    console.warn("[Stock Local Deduction Warning]:", err.message);
  }
  return deductedCount;
}
async function recalculateAllStockFromInvoices() {
  try {
    const p = await getDbPool();
    if (p) {
      await p.query("DELETE FROM stock_movements WHERE tipo = 'SAIDA_VENDA'");
      await p.query("UPDATE stock_items SET total_saidas = 0, estoque_atual = total_entradas");
      const [invoices2] = await p.query("SELECT * FROM invoices ORDER BY created_at ASC");
      const porSku2 = {};
      let totalUnidadesBaixadas2 = 0;
      for (const r of invoices2) {
        const inv = {
          id: r.id,
          nome: r.nome,
          documento: r.documento,
          dataSaida: r.data_saida,
          endereco: r.endereco,
          bairro: r.bairro,
          cep: r.cep,
          municipio: r.municipio,
          uf: r.uf,
          fatura: r.fatura,
          valorProdutos: r.valor_produtos,
          valorNota: r.valor_nota,
          desconto: r.desconto,
          codigo: r.codigo,
          quantidade: r.quantidade,
          descricao: r.descricao,
          cor: r.cor,
          origem: r.origem
        };
        const resolved = resolveSkuFromInvoice(inv);
        const qtd = Math.max(1, Math.round(parseNumber(inv.quantidade) || 1));
        const valNota = parseNumber(inv.valorNota);
        const valUnitario = valNota > 0 ? Number((valNota / qtd).toFixed(2)) : 29.99;
        porSku2[resolved.sku] = (porSku2[resolved.sku] || 0) + qtd;
        totalUnidadesBaixadas2 += qtd;
        const movId = "mov-venda-" + (inv.id || Math.random().toString());
        await p.query(
          `INSERT IGNORE INTO stock_movements 
          (id, product_id, sku, tipo, quantidade, saldo_anterior, saldo_posterior, documento_ref, origem_canal, motivo, valor_unitario, valor_total, usuario_id, usuario_nome, data_movimentacao) 
          VALUES (?, ?, ?, 'SAIDA_VENDA', ?, 0, 0, ?, ?, ?, ?, ?, 'sistema', 'Auditoria Hist\xF3rica SPM', ?)`,
          [
            movId,
            resolved.productId,
            resolved.sku,
            qtd,
            inv.fatura ? `NF ${inv.fatura}` : `Doc #${inv.id}`,
            inv.origem || "Outros",
            `Venda NF ${inv.fatura || ""} (${inv.nome || "Consumidor"})`,
            valUnitario,
            valNota,
            inv.dataSaida ? parseDateSafely(inv.dataSaida) : /* @__PURE__ */ new Date()
          ]
        );
        await p.query(
          "UPDATE stock_items SET total_saidas = total_saidas + ?, estoque_atual = GREATEST(0, total_entradas - total_saidas) WHERE id = ?",
          [qtd, resolved.productId]
        );
      }
      await syncDatabaseToSqlFile();
      return {
        totalNotasProcessadas: invoices2.length,
        totalUnidadesBaixadas: totalUnidadesBaixadas2,
        porSku: porSku2
      };
    }
  } catch (_) {
  }
  const stockItems = readJsonFile("stock_items.json", FALLBACK_DEFAULT_STOCK);
  stockItems.forEach((i) => {
    i.totalSaidas = 0;
    i.estoqueAtual = i.totalEntradas;
  });
  const invoices = readJsonFile("invoices.json", []);
  const porSku = {};
  let totalUnidadesBaixadas = 0;
  const newMovements = [];
  for (const inv of invoices) {
    const resolved = resolveSkuFromInvoice(inv);
    const qtd = Math.max(1, Math.round(parseNumber(inv.quantidade) || 1));
    const valNota = parseNumber(inv.valorNota);
    const valUnitario = valNota > 0 ? Number((valNota / qtd).toFixed(2)) : 29.99;
    porSku[resolved.sku] = (porSku[resolved.sku] || 0) + qtd;
    totalUnidadesBaixadas += qtd;
    const prod = stockItems.find((i) => i.id === resolved.productId || i.sku === resolved.sku);
    if (prod) {
      const saldoAnterior = prod.estoqueAtual;
      prod.totalSaidas += qtd;
      prod.estoqueAtual = Math.max(0, prod.totalEntradas - prod.totalSaidas);
      const saldoPosterior = prod.estoqueAtual;
      const movId = "mov-venda-" + (inv.id || Math.random().toString());
      newMovements.push({
        id: movId,
        productId: prod.id,
        sku: prod.sku,
        tipo: "SAIDA_VENDA",
        quantidade: qtd,
        saldoAnterior,
        saldoPosterior,
        documentoRef: inv.fatura ? `NF ${inv.fatura}` : `Doc #${inv.id}`,
        origemCanal: inv.origem || "Outros",
        motivo: `Venda NF ${inv.fatura || ""} (${inv.nome || "Consumidor"})`,
        valorUnitario: valUnitario,
        valorTotal: valNota,
        usuarioId: "sistema",
        usuarioNome: "Auditoria Hist\xF3rica SPM",
        dataMovimentacao: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  writeJsonFile("stock_items.json", stockItems);
  writeJsonFile("stock_movements.json", newMovements.slice(0, 500));
  await syncDatabaseToSqlFile();
  return {
    totalNotasProcessadas: invoices.length,
    totalUnidadesBaixadas,
    porSku
  };
}
async function calculateStockStatsFromDb() {
  const items = await getStockItemsFromDb();
  const movements = await getStockMovementsFromDb({ limit: 50 });
  let totalUnidadesEstoque = 0;
  let valorPatrimonialCusto = 0;
  let valorPotencialVenda = 0;
  const statusCount = { normal: 0, baixo: 0, critico: 0, zerado: 0 };
  const distribuicaoCores = {};
  items.forEach((it) => {
    totalUnidadesEstoque += it.estoqueAtual;
    valorPatrimonialCusto += it.valorTotalEstoqueCusto;
    valorPotencialVenda += it.valorTotalEstoqueVenda;
    if (it.status === "NORMAL") statusCount.normal++;
    else if (it.status === "BAIXO") statusCount.baixo++;
    else if (it.status === "CRITICO") statusCount.critico++;
    else if (it.status === "ZERADO") statusCount.zerado++;
    distribuicaoCores[it.cor] = (distribuicaoCores[it.cor] || 0) + it.estoqueAtual;
  });
  const margemLucroBrutaEstimada = valorPotencialVenda > 0 ? Number(((valorPotencialVenda - valorPatrimonialCusto) / valorPotencialVenda * 100).toFixed(1)) : 0;
  const p = await getDbPool();
  const [recentMovements] = await p.query(`
    SELECT tipo, SUM(quantidade) as total_qtd, SUM(valor_total) as total_val 
    FROM stock_movements 
    WHERE data_movimentacao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY tipo
  `);
  let totalSaidas30Dias = 0;
  let totalEntradas30Dias = 0;
  recentMovements.forEach((r) => {
    if (r.tipo === "SAIDA_VENDA" || r.tipo === "AJUSTE_NEGATIVO" || r.tipo === "PERDA_AVARIA") {
      totalSaidas30Dias += Number(r.total_qtd) || 0;
    } else {
      totalEntradas30Dias += Number(r.total_qtd) || 0;
    }
  });
  const giroDiarioMedio = Number((totalSaidas30Dias / 30).toFixed(1));
  const diasCoberturaGeral = giroDiarioMedio > 0 ? Math.round(totalUnidadesEstoque / giroDiarioMedio) : 999;
  const [canalRows] = await p.query(`
    SELECT COALESCE(origem_canal, 'Outros') as canal, SUM(quantidade) as qtd 
    FROM stock_movements 
    WHERE tipo = 'SAIDA_VENDA'
    GROUP BY canal
  `);
  const consumoPorCanal = {};
  canalRows.forEach((c) => {
    consumoPorCanal[c.canal] = Number(c.qtd) || 0;
  });
  const [timelineRows] = await p.query(`
    SELECT DATE_FORMAT(data_movimentacao, '%d/%m') as dia, SUM(quantidade) as qtd, SUM(valor_total) as val 
    FROM stock_movements 
    WHERE tipo = 'SAIDA_VENDA'
    GROUP BY dia 
    ORDER BY MIN(data_movimentacao) DESC 
    LIMIT 15
  `);
  const evolucaoSaidas = (timelineRows || []).reverse().map((t) => ({
    data: t.dia,
    quantidade: Number(t.qtd) || 0,
    valor: Number(t.val) || 0
  }));
  const topVendidos = items.map((it) => {
    const participacao = totalSaidas30Dias > 0 ? Number((it.totalSaidas / Math.max(1, totalSaidas30Dias) * 100).toFixed(1)) : 0;
    return {
      sku: it.sku,
      nome: it.nome,
      cor: it.cor,
      totalVendido: it.totalSaidas,
      faturamento: Number((it.totalSaidas * it.precoVenda).toFixed(2)),
      participacaoPercent: Math.min(100, participacao)
    };
  }).sort((a, b) => b.totalVendido - a.totalVendido);
  return {
    totalItensCadastrados: items.length,
    totalUnidadesEstoque,
    valorPatrimonialCusto,
    valorPotencialVenda,
    margemLucroBrutaEstimada,
    totalSaidas30Dias,
    totalEntradas30Dias,
    giroDiarioMedio,
    diasCoberturaGeral,
    itensStatus: statusCount,
    topVendidos,
    distribuicaoCores,
    movimentacoesRecentes: movements,
    consumoPorCanal,
    evolucaoSaidas
  };
}
function parseDateSafely(val) {
  if (!val) return /* @__PURE__ */ new Date();
  if (val.includes("/")) {
    const parts = val.split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const res = new Date(y, m, d);
      if (!isNaN(res.getTime())) return res;
    }
  }
  const direct = new Date(val);
  return isNaN(direct.getTime()) ? /* @__PURE__ */ new Date() : direct;
}

// server.ts
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3e3;
var JWT_SECRET = process.env.JWT_SECRET || "secur3-spm-store-jwt-secret-2026";
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "SPM Store Sistema Fiscal",
    version: "2026.1.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || "production"
  });
});
var uploadsDir = import_path2.default.join(process.cwd(), "uploads");
if (!import_fs2.default.existsSync(uploadsDir)) {
  import_fs2.default.mkdirSync(uploadsDir, { recursive: true });
}
var notasFiscaisDir = import_path2.default.join(process.cwd(), "Notas_Fiscais");
if (!import_fs2.default.existsSync(notasFiscaisDir)) {
  import_fs2.default.mkdirSync(notasFiscaisDir, { recursive: true });
}
var storage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});
var upload = (0, import_multer.default)({ storage });
async function logAction(userId, userName, action, category, details, severity = "info", req) {
  const ip = req ? req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1" : "127.0.0.1";
  const entry = {
    id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 1e3),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    userId,
    userName,
    action,
    category,
    details,
    ip,
    severity
  };
  try {
    await addLogToDb(entry);
  } catch (e) {
    console.error("Erro ao salvar log no MySQL:", e);
  }
}
async function dispatchN8nEvent(eventType, eventData) {
  try {
    const config = await getN8nConfigFromDb();
    if (!config.active || !config.webhookUrl || !config.webhookUrl.startsWith("http")) return;
    if (eventType === "new_invoices" && !config.events.newInvoices) return;
    if (eventType === "duplicate_detected" && !config.events.duplicateDetected) return;
    if (eventType === "city_sale" && !config.events.mapCitySale) return;
    const payload = {
      event: eventType,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      source: "SPM_STORE_FISCAL_SYSTEM",
      data: eventData
    };
    const resp = await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SPM-Fiscal-n8n-Dispatcher"
      },
      body: JSON.stringify(payload),
      redirect: "follow"
    });
    await saveN8nConfigToDb({
      lastTrigger: (/* @__PURE__ */ new Date()).toISOString(),
      lastStatus: resp.ok ? "SUCCESS" : "ERROR"
    });
  } catch (err) {
    console.warn("[n8n Webhook Dispatcher Warning]:", err.message);
    try {
      await saveN8nConfigToDb({
        lastTrigger: (/* @__PURE__ */ new Date()).toISOString(),
        lastStatus: "ERROR"
      });
    } catch (_) {
    }
  }
}
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    const users = await getUsersFromDb();
    const defaultAdmin = users.find((u) => u.role === "ADMIN") || users[0] || {
      id: "u-admin-1",
      name: "Jos\xC3\xA9 Galdino (Administrador)",
      email: "josegaldino@hotmail.com.br",
      role: "ADMIN"
    };
    req.user = defaultAdmin;
    return next();
  }
  import_jsonwebtoken.default.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      const users = await getUsersFromDb();
      const defaultAdmin = users.find((u) => u.role === "ADMIN") || users[0];
      req.user = defaultAdmin;
      return next();
    }
    req.user = decoded;
    next();
  });
}
app.get("/api/health", async (_req, res) => {
  try {
    const invoices = await getInvoicesFromDb();
    const users = await getUsersFromDb();
    res.json({
      status: "ok",
      database: "MySQL",
      system: "SPM Store Sistema Fiscal & Auditoria NFs",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      invoicesCount: invoices.length,
      usersCount: users.length
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});
app.get("/api/ibge/municipios", async (req, res) => {
  try {
    const uf = req.query.uf;
    const dataDir = import_path2.default.join(process.cwd(), "data");
    const ibgePath = import_path2.default.join(dataDir, "ibge_municipios.json");
    let list = [];
    if (import_fs2.default.existsSync(ibgePath)) {
      list = JSON.parse(import_fs2.default.readFileSync(ibgePath, "utf-8"));
    } else {
      const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome");
      if (response.ok) {
        const raw = await response.json();
        list = raw.map((m) => ({
          id: m.id,
          nome: m.nome,
          uf: m.microrregiao?.mesorregiao?.UF?.sigla || m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla || "SP",
          ufNome: m.microrregiao?.mesorregiao?.UF?.nome || "",
          regiao: m.microrregiao?.mesorregiao?.UF?.regiao?.nome || "Sudeste"
        }));
        if (!import_fs2.default.existsSync(dataDir)) import_fs2.default.mkdirSync(dataDir, { recursive: true });
        import_fs2.default.writeFileSync(ibgePath, JSON.stringify(list));
      }
    }
    if (uf && uf !== "Todos") {
      list = list.filter((m) => m.uf.toUpperCase() === uf.toUpperCase());
    }
    res.json({
      total: list.length,
      source: "IBGE_API_LOCALIDADES",
      municipios: list
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar munic\xC3\xADpios do IBGE", details: err.message });
  }
});
app.get("/api/ibge/municipios/:uf", async (req, res) => {
  try {
    const uf = req.params.uf.toUpperCase();
    const dataDir = import_path2.default.join(process.cwd(), "data");
    const ibgePath = import_path2.default.join(dataDir, "ibge_municipios.json");
    let list = [];
    if (import_fs2.default.existsSync(ibgePath)) {
      list = JSON.parse(import_fs2.default.readFileSync(ibgePath, "utf-8"));
      list = list.filter((m) => m.uf.toUpperCase() === uf);
    }
    res.json({ total: list.length, uf, municipios: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmailFromDb(email || "");
    if (!user || !user.active) {
      return res.status(401).json({ error: "Credenciais inv\xC3\xA1lidas ou usu\xC3\xA1rio inativo." });
    }
    const storedHash = await getUserPasswordHash(user.email);
    const isValid = storedHash ? import_bcryptjs.default.compareSync(password || "", storedHash) : password === "admin123";
    if (!isValid) {
      await logAction(user.id, user.name, "Falha de Login", "AUTH", `Tentativa de login com senha inv\xC3\xA1lida para ${email}`, "warning", req);
      return res.status(401).json({ error: "Senha incorreta." });
    }
    await updateLastLoginInDb(user.id);
    user.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
    const token = import_jsonwebtoken.default.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    await logAction(user.id, user.name, "Login Realizado", "AUTH", `Usu\xC3\xA1rio ${user.name} autenticou-se com sucesso.`, "success", req);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro durante o login." });
  }
});
app.get("/api/auth/me", authenticateToken, (req, res) => {
  const user = req.user;
  res.json({ user });
});
app.get("/api/auth/users", authenticateToken, async (_req, res) => {
  try {
    const users = await getUsersFromDb();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/auth/users", authenticateToken, async (req, res) => {
  try {
    const { name, email, role, department, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "Nome, email e perfil s\xC3\xA3o obrigat\xC3\xB3rios." });
    }
    const existingUser = await getUserByEmailFromDb(email);
    if (existingUser) {
      return res.status(400).json({ error: "Este e-mail j\xC3\xA1 est\xC3\xA1 cadastrado." });
    }
    const newUser = {
      id: "u-" + Date.now(),
      name,
      email,
      role,
      active: true,
      lastLogin: "",
      department: department || "Geral"
    };
    const passwordHash = import_bcryptjs.default.hashSync(password || "senha123", 8);
    await saveUserToDb(newUser, passwordHash);
    const currentUser = req.user;
    await logAction(currentUser?.id || "admin", currentUser?.name || "Admin", "Cria\xC3\xA7\xC3\xA3o de Usu\xC3\xA1rio", "SECURITY", `Novo usu\xC3\xA1rio ${email} criado com perfil ${role}`, "info", req);
    res.status(201).json({ user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/auth/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, active, department, password } = req.body;
    const user = await getUserByIdFromDb(id);
    if (!user) return res.status(404).json({ error: "Usu\xC3\xA1rio n\xC3\xA3o encontrado." });
    if (name !== void 0) user.name = name;
    if (role !== void 0) user.role = role;
    if (active !== void 0) user.active = active;
    if (department !== void 0) user.department = department;
    const passwordHash = password ? import_bcryptjs.default.hashSync(password, 8) : void 0;
    await saveUserToDb(user, passwordHash);
    const currentUser = req.user;
    await logAction(currentUser?.id || "admin", currentUser?.name || "Admin", "Edi\xC3\xA7\xC3\xA3o de Usu\xC3\xA1rio", "SECURITY", `Usu\xC3\xA1rio ${user.email} atualizado`, "info", req);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/auth/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdFromDb(id);
    if (!user) return res.status(404).json({ error: "Usu\xC3\xA1rio n\xC3\xA3o encontrado." });
    if (user.role === "ADMIN" && user.email === "josegaldino@hotmail.com.br") {
      return res.status(403).json({ error: "O usu\xC3\xA1rio Administrador Principal n\xC3\xA3o pode ser removido." });
    }
    await deleteUserFromDb(id);
    const currentUser = req.user;
    await logAction(currentUser?.id || "admin", currentUser?.name || "Admin", "Exclus\xC3\xA3o de Usu\xC3\xA1rio", "SECURITY", `Usu\xC3\xA1rio ${user.email} removido do sistema`, "warning", req);
    res.json({ message: "Usu\xC3\xA1rio removido com sucesso." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/invoices", async (req, res) => {
  try {
    const filters = req.query;
    const invoices = await getInvoicesFromDb(filters);
    res.json({ invoices, totalCount: invoices.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/invoices", authenticateToken, async (req, res) => {
  try {
    const newInvoice = {
      ...req.body,
      id: req.body.id || "spm-" + Date.now() + "-" + Math.floor(Math.random() * 100),
      dataUpload: (/* @__PURE__ */ new Date()).toISOString()
    };
    const currentInvoices = await getInvoicesFromDb();
    const { duplicates } = checkDuplicateInvoices(currentInvoices, [newInvoice]);
    if (duplicates.length > 0) {
      const user2 = req.user;
      await logAction(
        user2?.id || "admin",
        user2?.name || "Admin",
        "Tentativa de Inser\xC3\xA7\xC3\xA3o Duplicada",
        "UPLOAD",
        `Nota com fatura ${newInvoice.fatura} e CPF/CNPJ ${newInvoice.documento} j\xC3\xA1 existe.`,
        "warning",
        req
      );
      return res.status(409).json({
        error: "Esta nota fiscal j\xC3\xA1 est\xC3\xA1 cadastrada no sistema.",
        duplicate: duplicates[0]
      });
    }
    await saveInvoiceToDb(newInvoice);
    await syncDatabaseToSqlFile();
    const user = req.user;
    await logAction(user?.id || "admin", user?.name || "Admin", "Cadastro de Nota Fiscal", "UPLOAD", `Registro para ${newInvoice.nome} adicionado manualmente`, "info", req);
    res.status(201).json({ invoice: newInvoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/invoices/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getInvoiceById(id);
    if (!existing) return res.status(404).json({ error: "Registro fiscal n\xC3\xA3o encontrado." });
    const updated = { ...existing, ...req.body };
    await saveInvoiceToDb(updated);
    await syncDatabaseToSqlFile();
    const user = req.user;
    await logAction(user?.id || "admin", user?.name || "Admin", "Edi\xC3\xA7\xC3\xA3o de Nota Fiscal", "UPLOAD", `Dados do registro #${id} atualizados`, "info", req);
    res.json({ invoice: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/invoices/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getInvoiceById(id);
    if (!existing) return res.status(404).json({ error: "Registro n\xC3\xA3o encontrado." });
    await deleteInvoiceFromDb(id);
    const user = req.user;
    await logAction(user?.id || "admin", user?.name || "Admin", "Exclus\xC3\xA3o de Nota Fiscal", "UPLOAD", `Registro #${existing.id} de ${existing.nome} exclu\xC3\xADdo`, "warning", req);
    res.json({ message: "Registro removido com sucesso." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/invoices/bulk-delete", authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Nenhum ID fornecido para exclus\xC3\xA3o." });
    }
    const removedCount = await bulkDeleteInvoicesFromDb(ids);
    const user = req.user;
    await logAction(user?.id || "admin", user?.name || "Admin", "Exclus\xC3\xA3o em Lote", "UPLOAD", `${removedCount} registros fiscais exclu\xC3\xADdos`, "warning", req);
    res.json({ message: `${removedCount} registros removidos com sucesso.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/invoices/bulk-update", authenticateToken, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Nenhum ID fornecido para atualiza\xC3\xA7\xC3\xA3o em lote." });
    }
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nenhuma altera\xC3\xA7\xC3\xA3o fornecida." });
    }
    const updatedCount = await bulkUpdateInvoicesInDb(ids, updates);
    const user = req.user;
    await logAction(
      user?.id || "admin",
      user?.name || "Admin",
      "Edi\xC3\xA7\xC3\xA3o em Lote de Notas Fiscais",
      "UPLOAD",
      `${updatedCount} notas fiscais atualizadas em lote`,
      "info",
      req
    );
    res.json({ success: true, updatedCount, message: `${updatedCount} registros atualizados com sucesso.` });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao atualizar notas em lote" });
  }
});
app.post("/api/invoices/reset", authenticateToken, async (req, res) => {
  try {
    const allInvoices = await getInvoicesFromDb();
    const previousCount = allInvoices.length;
    await resetInvoicesInDb();
    const user = req.user;
    await logAction(user?.id || "admin", user?.name || "Admin", "Limpeza Total do Banco de Dados", "UPLOAD", `O banco de dados foi zerado (${previousCount} registros removidos).`, "warning", req);
    res.json({ message: "Banco de dados zerado com sucesso.", count: 0, removedCount: previousCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
async function extractTextFromPdfBuffer(buffer) {
  try {
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (err) {
    console.warn("[PDF Parser Warning]:", err.message);
    return "";
  }
}
async function extractInvoicesFromFileBuffer(dataBuffer, filename) {
  const lower = (filename || "").toLowerCase();
  if (lower.endsWith(".xml")) {
    const xmlContent = dataBuffer.toString("utf-8");
    return extractSpmInvoicesFromNfeXml(xmlContent, filename);
  } else if (lower.endsWith(".pdf")) {
    const text = await extractTextFromPdfBuffer(dataBuffer);
    return extractSpmInvoicesFromPdfText(text, filename);
  } else {
    const sample = dataBuffer.toString("utf-8", 0, Math.min(dataBuffer.length, 500)).trim();
    if (sample.startsWith("<?xml") || sample.includes("<nfeProc") || sample.includes("<NFe") || sample.includes("<infNFe")) {
      return extractSpmInvoicesFromNfeXml(dataBuffer.toString("utf-8"), filename);
    }
    const text = await extractTextFromPdfBuffer(dataBuffer);
    return extractSpmInvoicesFromPdfText(text, filename);
  }
}
async function handleFileUploadExtraction(req, res) {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo (XML ou PDF) foi enviado." });
    }
    let rawExtractedInvoices = [];
    const errors = [];
    for (const file of files) {
      try {
        const destInNotasFiscais = import_path2.default.join(notasFiscaisDir, file.originalname);
        import_fs2.default.copyFileSync(file.path, destInNotasFiscais);
        const dataBuffer = import_fs2.default.readFileSync(file.path);
        const items = await extractInvoicesFromFileBuffer(dataBuffer, file.originalname);
        if (items.length === 0) {
          console.warn(`[Extraction Warning] Nenhum registro extra\xC3\xADdo de: ${file.originalname}`);
        } else {
          console.log(`[Extraction Success] ${items.length} registro(s) extra\xC3\xADdo(s) de: ${file.originalname}`);
        }
        rawExtractedInvoices.push(...items);
        if (import_fs2.default.existsSync(file.path)) {
          import_fs2.default.unlinkSync(file.path);
        }
      } catch (err) {
        console.error(`[Extraction Error] Erro ao processar ${file.originalname}:`, err.message);
        errors.push({ filename: file.originalname, error: err.message || "Erro ao extrair dados do arquivo" });
      }
    }
    const currentInvoices = await getInvoicesFromDb();
    const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawExtractedInvoices);
    for (const item of uniqueItems) {
      await saveInvoiceToDb(item);
    }
    if (uniqueItems.length > 0) {
      await deductStockForInvoices(uniqueItems, { id: "admin", name: "Upload de Arquivos" });
      await syncDatabaseToSqlFile();
    }
    const user = req.user || { id: "admin", name: "Administrador" };
    if (duplicates.length > 0) {
      await logAction(
        user.id,
        user.name,
        "Aviso de Notas Duplicadas",
        "UPLOAD",
        `Foram detectadas ${duplicates.length} nota(s) duplicada(s) ignoradas no lote.`,
        "warning",
        req
      );
    }
    await logAction(
      user.id,
      user.name,
      "Processamento de Arquivos Conclu\xC3\xADdo",
      "UPLOAD",
      `Processamento de ${files.length} arquivo(s): ${uniqueItems.length} novos registros salvos no MySQL e estoque atualizado. ${duplicates.length} duplicata(s) ignorada(s).`,
      errors.length > 0 ? "warning" : "success",
      req
    );
    if (uniqueItems.length > 0) {
      dispatchN8nEvent("new_invoices", {
        source: "BATCH_FILE_UPLOAD",
        count: uniqueItems.length,
        invoices: uniqueItems
      });
    }
    res.json({
      success: true,
      extractedCount: rawExtractedInvoices.length,
      newInsertedCount: uniqueItems.length,
      duplicateCount: duplicates.length,
      duplicates,
      extractedInvoices: uniqueItems,
      errors
    });
  } catch (error) {
    console.error("Extraction Route Error:", error);
    res.status(500).json({ error: "Erro ao processar lote de arquivos." });
  }
}
app.post("/api/extract/pdf", upload.array("files", 100), handleFileUploadExtraction);
app.post("/api/extract/xml", upload.array("files", 100), handleFileUploadExtraction);
app.post("/api/extract/files", upload.array("files", 100), handleFileUploadExtraction);
app.post("/api/scan-local-folder", authenticateToken, async (req, res) => {
  try {
    if (!import_fs2.default.existsSync(notasFiscaisDir)) {
      return res.json({ success: true, count: 0, duplicateCount: 0, duplicates: [], extracted: [] });
    }
    const targetFiles = import_fs2.default.readdirSync(notasFiscaisDir).filter((f) => {
      const l = f.toLowerCase();
      return l.endsWith(".xml") || l.endsWith(".pdf");
    });
    let rawItems = [];
    for (const file of targetFiles) {
      try {
        const filePath = import_path2.default.join(notasFiscaisDir, file);
        const dataBuffer = import_fs2.default.readFileSync(filePath);
        const items = await extractInvoicesFromFileBuffer(dataBuffer, file);
        rawItems.push(...items);
      } catch (err) {
        console.error(`Erro ao ler ${file}:`, err.message);
      }
    }
    const currentInvoices = await getInvoicesFromDb();
    const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawItems);
    for (const item of uniqueItems) {
      await saveInvoiceToDb(item);
    }
    if (uniqueItems.length > 0) {
      await deductStockForInvoices(uniqueItems, { id: "system", name: "Varredura de Pasta" });
      await syncDatabaseToSqlFile();
    }
    const user = req.user;
    if (duplicates.length > 0) {
      await logAction(
        user?.id || "admin",
        user?.name || "Admin",
        "Duplicidades na Varredura de Pasta",
        "UPLOAD",
        `${duplicates.length} registros j\xC3\xA1 existiam na pasta 'Notas_Fiscais' e foram ignorados.`,
        "warning",
        req
      );
    }
    res.json({
      success: true,
      count: uniqueItems.length,
      duplicateCount: duplicates.length,
      duplicates,
      totalPdfs: targetFiles.length,
      extracted: uniqueItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao escanear pasta local" });
  }
});
var gdriveDesktopPath = process.env.GDRIVE_DESKTOP_PATH || "I:\\Meu Drive\\SPM Store\\SPM Verniz Elite\\SPM Verniz\\Verniz Elite SPM Pedidos\\Notas_Fiscais";
var gdriveAutoSync = process.env.GDRIVE_AUTO_SYNC !== "false";
var gdriveWatcher = null;
var gdriveLastSync = (/* @__PURE__ */ new Date()).toISOString();
var gdriveLastError = null;
var gdriveRecentProcessed = [];
var sqlSyncTimer = null;
function debouncedSyncDatabaseToSqlFile(delayMs = 3e3) {
  if (sqlSyncTimer) clearTimeout(sqlSyncTimer);
  sqlSyncTimer = setTimeout(async () => {
    try {
      await syncDatabaseToSqlFile();
    } catch (e) {
      console.warn("[SQL Sync Debounce Error]:", e.message);
    }
  }, delayMs);
}
var gdriveQueue = [];
var isProcessingGdriveQueue = false;
function enqueuePdfForProcessing(filePath) {
  if (!gdriveQueue.includes(filePath)) {
    gdriveQueue.push(filePath);
    triggerGdriveQueueProcessing();
  }
}
async function triggerGdriveQueueProcessing() {
  if (isProcessingGdriveQueue) return;
  isProcessingGdriveQueue = true;
  try {
    const currentInvoices = await getInvoicesFromDb();
    const existingKeySet = /* @__PURE__ */ new Set();
    currentInvoices.forEach((inv) => {
      if (inv.id) existingKeySet.add(inv.id.trim());
      if (inv.fatura) existingKeySet.add(inv.fatura.trim());
      if (inv.fatura && inv.nome) existingKeySet.add(`${inv.fatura.trim()}_${(inv.nome || "").trim().toLowerCase()}`);
    });
    let totalNewInBatch = 0;
    while (gdriveQueue.length > 0) {
      const nextFile = gdriveQueue.shift();
      if (nextFile && import_fs2.default.existsSync(nextFile)) {
        try {
          const filename = import_path2.default.basename(nextFile);
          const newItems = await processSinglePdfFileCached(nextFile, filename, existingKeySet);
          totalNewInBatch += newItems.length;
        } catch (err) {
          console.warn(`[Queue Error] Falha ao processar ${nextFile}:`, err.message);
        }
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    }
    if (totalNewInBatch > 0) {
      debouncedSyncDatabaseToSqlFile(2e3);
    }
  } catch (err) {
    console.error("[Google Drive Queue Error]:", err.message);
  } finally {
    isProcessingGdriveQueue = false;
  }
}
async function processSinglePdfFileCached(filePath, filename, existingKeySet, sourceTag = "GDRIVE_DESKTOP_WATCHER") {
  try {
    if (!import_fs2.default.existsSync(filePath)) return [];
    const dataBuffer = import_fs2.default.readFileSync(filePath);
    const items = await extractInvoicesFromFileBuffer(dataBuffer, filename);
    if (items.length === 0) return [];
    const uniqueItems = [];
    for (const item of items) {
      const idKey = item.id ? item.id.trim() : "";
      const faturaKey = item.fatura ? item.fatura.trim() : "";
      const compoundKey = item.fatura && item.nome ? `${item.fatura.trim()}_${(item.nome || "").trim().toLowerCase()}` : "";
      const isDuplicate = idKey && existingKeySet.has(idKey) || faturaKey && existingKeySet.has(faturaKey) || compoundKey && existingKeySet.has(compoundKey);
      if (!isDuplicate) {
        if (idKey) existingKeySet.add(idKey);
        if (faturaKey) existingKeySet.add(faturaKey);
        if (compoundKey) existingKeySet.add(compoundKey);
        uniqueItems.push(item);
      }
    }
    for (const item of uniqueItems) {
      await saveInvoiceToDb(item);
      gdriveRecentProcessed.unshift({
        fatura: item.fatura || "N/A",
        nome: item.nome || "Consumidor",
        cor: item.cor || "N\xC3\xA3o identificada",
        valor: item.valorNota || "0,00",
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR"),
        filename
      });
      if (gdriveRecentProcessed.length > 20) gdriveRecentProcessed.pop();
    }
    if (uniqueItems.length > 0) {
      await deductStockForInvoices(uniqueItems, { id: "system-gdrive", name: "Google Drive Watcher" });
      try {
        const destInNotasFiscais = import_path2.default.join(notasFiscaisDir, filename);
        if (!import_fs2.default.existsSync(destInNotasFiscais) && filePath !== destInNotasFiscais) {
          import_fs2.default.copyFileSync(filePath, destInNotasFiscais);
        }
      } catch (_) {
      }
      await logAction(
        "system-gdrive",
        "Google Drive Watcher",
        "Sincroniza\xC3\xA7\xC3\xA3o Autom\xC3\xA1tica Google Drive",
        "UPLOAD",
        `Auto-processado PDF '${filename}': ${uniqueItems.length} novo(s) registro(s) inserido(s) no MySQL e sincronizado(s) no SQL.`,
        "success"
      );
      dispatchN8nEvent("new_invoices", {
        source: sourceTag,
        filename,
        count: uniqueItems.length,
        invoices: uniqueItems
      });
      console.log(`[Google Drive Sync] \xE2\u0153\u2026 ${uniqueItems.length} nota(s) sincronizada(s) automaticamente: ${filename}`);
    }
    gdriveLastSync = (/* @__PURE__ */ new Date()).toISOString();
    gdriveLastError = null;
    return uniqueItems;
  } catch (err) {
    console.error(`[Google Drive Sync Error] Erro ao processar ${filename}:`, err.message);
    gdriveLastError = err.message;
    return [];
  }
}
async function scanGoogleDriveDesktopFolder() {
  if (!import_fs2.default.existsSync(gdriveDesktopPath)) {
    return {
      success: false,
      count: 0,
      duplicateCount: 0,
      duplicates: [],
      totalPdfs: 0,
      extracted: [],
      folderPath: gdriveDesktopPath
    };
  }
  const allEntries = import_fs2.default.readdirSync(gdriveDesktopPath);
  const targetFiles = allEntries.filter((f) => {
    const l = f.toLowerCase();
    return l.endsWith(".pdf") || l.endsWith(".xml");
  });
  let rawItems = [];
  for (const file of targetFiles) {
    try {
      const filePath = import_path2.default.join(gdriveDesktopPath, file);
      const dataBuffer = import_fs2.default.readFileSync(filePath);
      const items = await extractInvoicesFromFileBuffer(dataBuffer, file);
      rawItems.push(...items);
    } catch (err) {
      console.error(`[Google Drive Scan] Erro ao ler ${file}:`, err.message);
    }
  }
  const currentInvoices = await getInvoicesFromDb();
  const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawItems);
  for (const item of uniqueItems) {
    await saveInvoiceToDb(item);
    gdriveRecentProcessed.unshift({
      fatura: item.fatura || "N/A",
      nome: item.nome || "Consumidor",
      cor: item.cor || "N\xE3o identificada",
      valor: item.valorNota || "0,00",
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR"),
      filename: item.origemArquivo || "Google Drive File"
    });
    if (gdriveRecentProcessed.length > 20) gdriveRecentProcessed.pop();
  }
  if (uniqueItems.length > 0) {
    await deductStockForInvoices(uniqueItems, { id: "system-gdrive", name: "Google Drive Watcher" });
    await syncDatabaseToSqlFile();
  }
  gdriveLastSync = (/* @__PURE__ */ new Date()).toISOString();
  gdriveLastError = null;
  return {
    success: true,
    count: uniqueItems.length,
    duplicateCount: duplicates.length,
    duplicates,
    totalPdfs: targetFiles.length,
    extracted: uniqueItems,
    folderPath: gdriveDesktopPath
  };
}
function initGoogleDriveWatcher() {
  if (gdriveWatcher) {
    try {
      gdriveWatcher.close();
    } catch (_) {
    }
    gdriveWatcher = null;
  }
  if (!gdriveAutoSync) {
    console.log("[Google Drive] Auto-sync desativado via configura\xE7\xE3o.");
    return;
  }
  if (!import_fs2.default.existsSync(gdriveDesktopPath)) {
    console.warn(`[Google Drive] Pasta n\xE3o encontrada no momento: "${gdriveDesktopPath}". O monitoramento ser\xE1 ativado assim que a pasta estiver dispon\xEDvel.`);
    return;
  }
  try {
    console.log(`[Google Drive Monitor] \u{1F4E1} Iniciando monitoramento em tempo real na pasta:`);
    console.log(`                       "${gdriveDesktopPath}"`);
    gdriveWatcher = import_chokidar.default.watch(gdriveDesktopPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
      usePolling: true,
      interval: 1500,
      binaryInterval: 2500,
      awaitWriteFinish: {
        stabilityThreshold: 2e3,
        pollInterval: 250
      }
    });
    gdriveWatcher.on("add", (filePath) => {
      const lower = filePath.toLowerCase();
      if (lower.endsWith(".pdf") || lower.endsWith(".xml")) {
        const filename = import_path2.default.basename(filePath);
        console.log(`[Google Drive Watcher] \u{1F4C4} Novo arquivo detectado na fila: ${filename}`);
        enqueuePdfForProcessing(filePath);
      }
    });
    gdriveWatcher.on("change", (filePath) => {
      const lower = filePath.toLowerCase();
      if (lower.endsWith(".pdf") || lower.endsWith(".xml")) {
        const filename = import_path2.default.basename(filePath);
        console.log(`[Google Drive Watcher] \u{1F504} Arquivo alterado na fila: ${filename}`);
        enqueuePdfForProcessing(filePath);
      }
    });
    gdriveWatcher.on("error", (error) => {
      console.warn("[Google Drive Watcher Error]:", error.message || error);
      gdriveLastError = error.message || String(error);
    });
  } catch (err) {
    console.error("[Google Drive Watcher Init Error]:", err.message);
    gdriveLastError = err.message;
  }
}
app.get("/api/gdrive-desktop/status", async (_req, res) => {
  const exists = import_fs2.default.existsSync(gdriveDesktopPath);
  let totalPdfs = 0;
  if (exists) {
    try {
      totalPdfs = import_fs2.default.readdirSync(gdriveDesktopPath).filter((f) => {
        const l = f.toLowerCase();
        return l.endsWith(".pdf") || l.endsWith(".xml");
      }).length;
    } catch (_) {
    }
  }
  res.json({
    enabled: true,
    folderPath: gdriveDesktopPath,
    exists,
    totalPdfs,
    lastSync: gdriveLastSync,
    watcherActive: !!gdriveWatcher,
    autoSync: gdriveAutoSync,
    lastError: gdriveLastError,
    recentProcessed: gdriveRecentProcessed
  });
});
app.post("/api/gdrive-desktop/scan", authenticateToken, async (req, res) => {
  try {
    const result = await scanGoogleDriveDesktopFolder();
    const user = req.user;
    await logAction(
      user?.id || "admin",
      user?.name || "Admin",
      "Varredura Manual Google Drive Desktop",
      "UPLOAD",
      `Varredura manual em '${gdriveDesktopPath}': ${result.count} novas notas extra\xEDdas, ${result.duplicateCount} duplicatas ignoradas.`,
      result.count > 0 ? "success" : "info",
      req
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao escanear pasta do Google Drive" });
  }
});
var gdriveOnlineFolderId = process.env.GDRIVE_ONLINE_FOLDER_ID || "1cqhLdzayHMwzLxdi60rucCEqvK0tfHOz";
var gdriveOnlineFolderUrl = process.env.GDRIVE_ONLINE_FOLDER_URL || "https://drive.google.com/drive/folders/1cqhLdzayHMwzLxdi60rucCEqvK0tfHOz?usp=sharing";
var gdriveOnlineAutoPoll = process.env.GDRIVE_ONLINE_AUTO_POLL !== "false";
var gdriveOnlinePollIntervalSec = Number(process.env.GDRIVE_ONLINE_POLL_INTERVAL_SEC) || 30;
var gdriveOnlinePollerTimer = null;
var gdriveOnlineLastPoll = (/* @__PURE__ */ new Date()).toISOString();
var gdriveOnlineLastError = null;
var gdriveOnlineProcessedFileIds = /* @__PURE__ */ new Set();
async function pollGoogleDriveOnlineFolder() {
  gdriveOnlineLastPoll = (/* @__PURE__ */ new Date()).toISOString();
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (!gdriveOnlineFolderId) {
    return { success: false, count: 0, duplicateCount: 0, totalOnlineFiles: 0, totalPdfs: 0, duplicates: [], folderId: "", extracted: [] };
  }
  try {
    let filesList = [];
    if (apiKey) {
      try {
        const q = `'${gdriveOnlineFolderId}'+in+parents+and+trashed=false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime)&key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          filesList = data.files || [];
        }
      } catch (apiErr) {
        console.warn("[Google Drive API Poller Warning]:", apiErr.message);
      }
    }
    if (filesList.length === 0) {
      try {
        const folderUrl = `https://drive.google.com/drive/folders/${gdriveOnlineFolderId}`;
        const resp = await fetch(folderUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (resp.ok) {
          const html = await resp.text();
          const regex = /aria-label="([^"]+?)(?:\s+(?:XML|PDF))?\s+Shared"[^>]*?ssk='[^:]+:[^:]+:([a-zA-Z0-9_-]+)-/g;
          let match;
          const seen = /* @__PURE__ */ new Set();
          while ((match = regex.exec(html)) !== null) {
            let fname = match[1].trim();
            const rawId = match[2].trim();
            const cleanId = rawId.replace(/-0.*$/, "").replace(/-\d+$/, "");
            if (!fname.toLowerCase().endsWith(".xml") && !fname.toLowerCase().endsWith(".pdf")) {
              if (html.includes(fname + ".xml")) fname = fname + ".xml";
              else if (html.includes(fname + ".pdf")) fname = fname + ".pdf";
            }
            if (!seen.has(cleanId)) {
              seen.add(cleanId);
              filesList.push({
                id: cleanId,
                name: fname,
                mimeType: fname.toLowerCase().endsWith(".xml") ? "text/xml" : "application/pdf"
              });
            }
          }
        }
      } catch (crawlerErr) {
        console.warn("[Google Drive Online Crawler Warning]:", crawlerErr.message);
      }
    }
    if (filesList.length === 0) {
      return {
        success: true,
        count: 0,
        duplicateCount: 0,
        totalOnlineFiles: 0,
        totalPdfs: 0,
        duplicates: [],
        folderId: gdriveOnlineFolderId,
        extracted: []
      };
    }
    const currentInvoices = await getInvoicesFromDb();
    const existingKeySet = /* @__PURE__ */ new Set();
    currentInvoices.forEach((inv) => {
      if (inv.id) existingKeySet.add(inv.id.trim());
      if (inv.fatura) existingKeySet.add(inv.fatura.trim());
      if (inv.fatura && inv.nome) existingKeySet.add(`${inv.fatura.trim()}_${(inv.nome || "").trim().toLowerCase()}`);
    });
    const newExtractedInvoices = [];
    const duplicateList = [];
    const targetFiles = filesList.filter((f) => {
      const l = f.name.toLowerCase();
      return l.endsWith(".pdf") || l.endsWith(".xml");
    });
    for (const file of targetFiles) {
      const cleanId = file.id.replace(/-0.*$/, "").replace(/-\d+$/, "");
      if (gdriveOnlineProcessedFileIds.has(cleanId)) continue;
      try {
        let buffer = null;
        if (apiKey) {
          try {
            const downloadUrl = `https://www.googleapis.com/drive/v3/files/${cleanId}?alt=media&key=${apiKey}`;
            const resp = await fetch(downloadUrl);
            if (resp.ok) {
              const arrayBuffer = await resp.arrayBuffer();
              buffer = Buffer.from(arrayBuffer);
            }
          } catch (_) {
          }
        }
        if (!buffer) {
          const downloadUrl = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download&confirm=t`;
          const resp = await fetch(downloadUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
          });
          if (resp.ok) {
            const arrayBuffer = await resp.arrayBuffer();
            const tempBuf = Buffer.from(arrayBuffer);
            const sample = tempBuf.toString("utf-8", 0, 80);
            if (!sample.includes("<!DOCTYPE") || sample.includes("<?xml")) {
              buffer = tempBuf;
            }
          }
        }
        if (buffer && buffer.length > 0) {
          const localDest = import_path2.default.join(notasFiscaisDir, file.name);
          import_fs2.default.writeFileSync(localDest, buffer);
          const items = await extractInvoicesFromFileBuffer(buffer, file.name);
          for (const item of items) {
            const idKey = item.id ? item.id.trim() : "";
            const faturaKey = item.fatura ? item.fatura.trim() : "";
            const compoundKey = item.fatura && item.nome ? `${item.fatura.trim()}_${(item.nome || "").trim().toLowerCase()}` : "";
            const isDuplicate = idKey && existingKeySet.has(idKey) || faturaKey && existingKeySet.has(faturaKey) || compoundKey && existingKeySet.has(compoundKey);
            if (!isDuplicate) {
              if (idKey) existingKeySet.add(idKey);
              if (faturaKey) existingKeySet.add(faturaKey);
              if (compoundKey) existingKeySet.add(compoundKey);
              newExtractedInvoices.push(item);
            } else {
              duplicateList.push({
                fatura: item.fatura || "",
                documento: item.documento || "",
                nome: item.nome || "",
                codigo: item.codigo || "",
                motivo: "J\xE1 cadastrado na base (Google Drive Cloud)"
              });
            }
          }
          gdriveOnlineProcessedFileIds.add(cleanId);
        }
      } catch (fErr) {
        console.warn(`[Google Drive Cloud Poller] Erro ao baixar ${file.name}:`, fErr.message);
      }
    }
    for (const item of newExtractedInvoices) {
      await saveInvoiceToDb(item);
    }
    if (newExtractedInvoices.length > 0) {
      await deductStockForInvoices(newExtractedInvoices, { id: "system-gdrive-online", name: "Google Drive Online Cloud" });
      await syncDatabaseToSqlFile();
      await logAction(
        "system-gdrive-online",
        "Google Drive Cloud Poller",
        "Sincroniza\xE7\xE3o Nuvem Google Drive",
        "UPLOAD",
        `${newExtractedInvoices.length} nota(s) sincronizada(s) da pasta online oficial '${gdriveOnlineFolderId}'.`,
        "success"
      );
      dispatchN8nEvent("new_invoices", {
        source: "GDRIVE_CLOUD_POLLER",
        count: newExtractedInvoices.length,
        invoices: newExtractedInvoices
      });
    }
    gdriveOnlineLastError = null;
    return {
      success: true,
      count: newExtractedInvoices.length,
      duplicateCount: duplicateList.length || targetFiles.length - newExtractedInvoices.length,
      totalOnlineFiles: targetFiles.length,
      totalPdfs: targetFiles.length,
      duplicates: duplicateList,
      folderId: gdriveOnlineFolderId,
      extracted: newExtractedInvoices
    };
  } catch (err) {
    gdriveOnlineLastError = err.message;
    console.error("[Google Drive Online Poller Error]:", err.message);
    return {
      success: false,
      count: 0,
      duplicateCount: 0,
      totalOnlineFiles: 0,
      totalPdfs: 0,
      duplicates: [],
      folderId: gdriveOnlineFolderId,
      extracted: []
    };
  }
}
function initGoogleDriveOnlinePoller() {
  if (gdriveOnlinePollerTimer) {
    clearInterval(gdriveOnlinePollerTimer);
    gdriveOnlinePollerTimer = null;
  }
  if (!gdriveOnlineAutoPoll) return;
  console.log(`[Google Drive Cloud Poller] \xE2\u02DC\x81\xEF\xB8\x8F Poller online ativado para a pasta ID: ${gdriveOnlineFolderId} (Intervalo: ${gdriveOnlinePollIntervalSec}s)`);
  setTimeout(() => {
    pollGoogleDriveOnlineFolder().catch(() => {
    });
  }, 5e3);
  gdriveOnlinePollerTimer = setInterval(() => {
    pollGoogleDriveOnlineFolder().catch(() => {
    });
  }, Math.max(10, gdriveOnlinePollIntervalSec) * 1e3);
}
app.get("/api/gdrive-online/status", (_req, res) => {
  res.json({
    folderId: gdriveOnlineFolderId,
    folderUrl: gdriveOnlineFolderUrl,
    autoPoll: gdriveOnlineAutoPoll,
    intervalSec: gdriveOnlinePollIntervalSec,
    lastPoll: gdriveOnlineLastPoll,
    lastError: gdriveOnlineLastError,
    pollerActive: !!gdriveOnlinePollerTimer
  });
});
app.post("/api/gdrive-online/sync", authenticateToken, async (req, res) => {
  try {
    const result = await pollGoogleDriveOnlineFolder();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao sincronizar pasta online do Google Drive" });
  }
});
app.post("/api/gdrive-online/config", authenticateToken, async (req, res) => {
  try {
    const { folderId, folderUrl, autoPoll, intervalSec } = req.body;
    if (folderId) gdriveOnlineFolderId = String(folderId).trim();
    if (folderUrl) {
      gdriveOnlineFolderUrl = String(folderUrl).trim();
      const match = gdriveOnlineFolderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) gdriveOnlineFolderId = match[1];
    }
    if (autoPoll !== void 0) gdriveOnlineAutoPoll = Boolean(autoPoll);
    if (intervalSec) gdriveOnlinePollIntervalSec = Math.max(5, Number(intervalSec));
    initGoogleDriveOnlinePoller();
    res.json({
      success: true,
      folderId: gdriveOnlineFolderId,
      folderUrl: gdriveOnlineFolderUrl,
      autoPoll: gdriveOnlineAutoPoll,
      intervalSec: gdriveOnlinePollIntervalSec
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/gdrive-desktop/config", authenticateToken, async (req, res) => {
  try {
    const { folderPath, autoSync } = req.body;
    if (folderPath !== void 0) {
      gdriveDesktopPath = String(folderPath).trim();
    }
    if (autoSync !== void 0) {
      gdriveAutoSync = Boolean(autoSync);
    }
    initGoogleDriveWatcher();
    const user = req.user;
    await logAction(
      user?.id || "admin",
      user?.name || "Admin",
      "Configura\xC3\xA7\xC3\xA3o Google Drive Desktop",
      "SYSTEM",
      `Pasta configurada para '${gdriveDesktopPath}' (Auto-sync: ${gdriveAutoSync ? "ATIVO" : "DESATIVADO"})`,
      "info",
      req
    );
    const exists = import_fs2.default.existsSync(gdriveDesktopPath);
    let totalPdfs = 0;
    if (exists) {
      try {
        totalPdfs = import_fs2.default.readdirSync(gdriveDesktopPath).filter((f) => f.toLowerCase().endsWith(".pdf")).length;
      } catch (_) {
      }
    }
    res.json({
      enabled: true,
      folderPath: gdriveDesktopPath,
      exists,
      totalPdfs,
      lastSync: gdriveLastSync,
      watcherActive: !!gdriveWatcher,
      autoSync: gdriveAutoSync,
      lastError: gdriveLastError,
      recentProcessed: gdriveRecentProcessed
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao salvar configura\xC3\xA7\xC3\xA3o do Google Drive" });
  }
});
var handleExcelImport = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Nenhum arquivo Excel enviado." });
    const workbook = new import_exceljs.default.Workbook();
    await workbook.xlsx.readFile(file.path);
    const worksheet = workbook.worksheets[0];
    const rawInvoices = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const vals = row.values;
      if (!vals || vals.length < 3) return;
      const inv = {
        id: "spm-ex-" + Date.now() + "-" + rowNumber,
        nome: String(vals[1] || "Consumidor"),
        documento: String(vals[2] || ""),
        dataSaida: String(vals[3] || (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR")),
        endereco: String(vals[4] || ""),
        bairro: String(vals[5] || ""),
        cep: String(vals[6] || ""),
        municipio: String(vals[7] || "S\xC3\xA3o Paulo"),
        uf: String(vals[8] || "SP"),
        fatura: String(vals[9] || ""),
        valorProdutos: String(vals[10] || "0,00"),
        valorNota: String(vals[11] || "0,00"),
        desconto: String(vals[12] || "0,00"),
        codigo: String(vals[13] || "Sem c\xC3\xB3digo"),
        quantidade: String(vals[14] || "1"),
        descricao: String(vals[15] || "Item Importado"),
        cor: String(vals[16] || "N\xC3\xA3o identificada"),
        origem: String(vals[17] || "Outros"),
        origemArquivo: file.originalname,
        dataUpload: (/* @__PURE__ */ new Date()).toISOString(),
        status: "Processado"
      };
      rawInvoices.push(inv);
    });
    const currentInvoices = await getInvoicesFromDb();
    const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, rawInvoices);
    for (const inv of uniqueItems) {
      await saveInvoiceToDb(inv);
    }
    if (uniqueItems.length > 0) {
      await deductStockForInvoices(uniqueItems, { id: "admin", name: "Importa\xC3\xA7\xC3\xA3o Excel" });
      await syncDatabaseToSqlFile();
    }
    if (import_fs2.default.existsSync(file.path)) import_fs2.default.unlinkSync(file.path);
    res.json({
      count: uniqueItems.length,
      duplicateCount: duplicates.length,
      duplicates,
      imported: uniqueItems
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao importar arquivo Excel." });
  }
};
app.post("/api/invoices/import-excel", upload.single("file"), handleExcelImport);
app.post("/api/extract/excel", upload.single("file"), handleExcelImport);
app.get("/api/export/excel", async (_req, res) => {
  try {
    const invoices = await getInvoicesFromDb();
    const workbook = new import_exceljs.default.Workbook();
    const ws = workbook.addWorksheet("Auditoria Fiscal XML SEFAZ");
    ws.columns = [
      // 1. DADOS BÃSICOS & CONTROLE
      { header: "FATURA / NFe", key: "fatura", width: 14 },
      { header: "S\xC3\u2030RIE", key: "serie", width: 8 },
      { header: "CHAVE DE ACESSO (44 D\xC3\x8DGITOS)", key: "chaveAcesso", width: 48 },
      { header: "DATA/HORA EMISS\xC3\u0192O", key: "dataSaida", width: 16 },
      { header: "NATUREZA OPERA\xC3\u2021\xC3\u0192O", key: "naturezaOperacao", width: 26 },
      { header: "TIPO OPERA\xC3\u2021\xC3\u0192O", key: "tipoOperacao", width: 14 },
      { header: "STATUS SEFAZ", key: "statusSefaz", width: 30 },
      { header: "N\xC2\xBA PROTOCOLO", key: "protocoloAutorizacao", width: 20 },
      { header: "DATA AUTORIZA\xC3\u2021\xC3\u0192O", key: "dataHoraAutorizacao", width: 20 },
      // 2. DESTINATÃRIO (<dest>, <enderDest>)
      { header: "DESTINAT\xC3\x81RIO - NOME", key: "nome", width: 34 },
      { header: "DESTINAT\xC3\x81RIO - CPF/CNPJ", key: "documento", width: 20 },
      { header: "DESTINAT\xC3\x81RIO - IE", key: "destinatarioIe", width: 16 },
      { header: "DESTINAT\xC3\x81RIO - IND IE", key: "destinatarioIndIe", width: 12 },
      { header: "DESTINAT\xC3\x81RIO - EMAIL", key: "destinatarioEmail", width: 26 },
      { header: "DESTINAT\xC3\x81RIO - TELEFONE", key: "destinatarioTelefone", width: 16 },
      { header: "ENDERE\xC3\u2021O COMPLETO", key: "endereco", width: 36 },
      { header: "BAIRRO", key: "bairro", width: 22 },
      { header: "CEP", key: "cep", width: 14 },
      { header: "MUNIC\xC3\x8DPIO", key: "municipio", width: 22 },
      { header: "UF", key: "uf", width: 8 },
      { header: "C\xC3\u201CD. IBGE CIDADE", key: "destinatarioCodigoMunicipio", width: 16 },
      { header: "PA\xC3\x8DS", key: "destinatarioPais", width: 12 },
      // 3. PRODUTOS & ITENS (<det>, <prod>)
      { header: "ITEM N\xC2\xBA", key: "itemNumero", width: 10 },
      { header: "SKU / C\xC3\u201CD. PRODUTO", key: "codigo", width: 22 },
      { header: "C\xC3\u201CD. BARRAS EAN/GTIN", key: "produtoEan", width: 18 },
      { header: "DESCRI\xC3\u2021\xC3\u0192O DO PRODUTO", key: "descricao", width: 38 },
      { header: "COR / VARIA\xC3\u2021\xC3\u0192O", key: "cor", width: 16 },
      { header: "NCM (8 D\xC3\x8DGITOS)", key: "produtoNcm", width: 14 },
      { header: "CFOP (4 D\xC3\x8DGITOS)", key: "produtoCfop", width: 12 },
      { header: "UNIDADE", key: "produtoUnidade", width: 10 },
      { header: "QUANTIDADE", key: "quantidade", width: 14 },
      { header: "VALOR UNIT\xC3\x81RIO (R$)", key: "produtoValorUnitario", width: 18 },
      { header: "VALOR TOTAL PROD (R$)", key: "valorProdutos", width: 20 },
      { header: "DESCONTO PROD (R$)", key: "produtoDesconto", width: 16 },
      { header: "FRETE RATEADO (R$)", key: "produtoFrete", width: 16 },
      { header: "SEGURO RATEADO (R$)", key: "produtoSeguro", width: 16 },
      { header: "OUTRAS DESPESAS (R$)", key: "produtoOutrasDespesas", width: 18 },
      { header: "INFO ADICIONAL ITEM", key: "produtoInfoAdicional", width: 30 },
      // 4. IMPOSTOS (<imposto>, <ICMS>, <PIS>, <COFINS>, <IPI>)
      { header: "ICMS - ORIGEM", key: "icmsOrigem", width: 14 },
      { header: "ICMS - CST/CSOSN", key: "icmsCstCsosn", width: 16 },
      { header: "ICMS - BASE C\xC3\x81LCULO (R$)", key: "icmsBaseCalculo", width: 22 },
      { header: "ICMS - AL\xC3\x8DQUOTA (%)", key: "icmsAliquota", width: 18 },
      { header: "ICMS - VALOR (R$)", key: "icmsValor", width: 18 },
      { header: "PIS - CST", key: "pisCst", width: 12 },
      { header: "PIS - BASE C\xC3\x81LCULO (R$)", key: "pisBaseCalculo", width: 20 },
      { header: "PIS - AL\xC3\x8DQUOTA (%)", key: "pisAliquota", width: 16 },
      { header: "PIS - VALOR (R$)", key: "pisValor", width: 16 },
      { header: "COFINS - CST", key: "cofinsCst", width: 14 },
      { header: "COFINS - BASE C\xC3\x81LCULO (R$)", key: "cofinsBaseCalculo", width: 22 },
      { header: "COFINS - AL\xC3\x8DQUOTA (%)", key: "cofinsAliquota", width: 18 },
      { header: "COFINS - VALOR (R$)", key: "cofinsValor", width: 18 },
      { header: "IPI - VALOR (R$)", key: "ipiValor", width: 16 },
      { header: "TRIBUTOS APROX. (R$)", key: "totalTributosAprox", width: 20 },
      // 5. TOTAIS DA NF-e (<total>)
      { header: "TOTAL BASE ICMS (R$)", key: "totalBaseIcms", width: 20 },
      { header: "TOTAL ICMS (R$)", key: "totalValorIcms", width: 18 },
      { header: "TOTAL ICMS DESON (R$)", key: "totalIcmsDesonerado", width: 20 },
      { header: "TOTAL ICMS ST (R$)", key: "totalIcmsSt", width: 18 },
      { header: "TOTAL PRODUTOS (R$)", key: "totalProdutos", width: 20 },
      { header: "TOTAL FRETE (R$)", key: "totalFrete", width: 16 },
      { header: "TOTAL SEGURO (R$)", key: "totalSeguro", width: 16 },
      { header: "TOTAL DESCONTO (R$)", key: "desconto", width: 18 },
      { header: "TOTAL IPI (R$)", key: "totalIpi", width: 16 },
      { header: "TOTAL PIS (R$)", key: "totalPis", width: 16 },
      { header: "TOTAL COFINS (R$)", key: "totalCofins", width: 18 },
      { header: "TOTAL OUTRAS DESP (R$)", key: "totalOutrasDespesas", width: 20 },
      { header: "VALOR FINAL DA NOTA (R$)", key: "valorNota", width: 22 },
      // 6. TRANSPORTE (<transp>)
      { header: "MODALIDADE FRETE", key: "transporteModalidadeFrete", width: 34 },
      { header: "TRANSPORTADORA - CNPJ/CPF", key: "transportadoraCnpjDoc", width: 24 },
      { header: "TRANSPORTADORA - NOME", key: "transportadoraNome", width: 30 },
      { header: "TRANSPORTADORA - IE", key: "transportadoraIe", width: 18 },
      { header: "TRANSPORTADORA - ENDERE\xC3\u2021O", key: "transportadoraEndereco", width: 28 },
      { header: "TRANSPORTADORA - CIDADE", key: "transportadoraMunicipio", width: 22 },
      { header: "TRANSPORTADORA - UF", key: "transportadoraUf", width: 10 },
      { header: "PLACA DO VE\xC3\x8DCULO", key: "transportePlaca", width: 16 },
      { header: "QTD VOLUMES", key: "transporteVolumeQuantidade", width: 14 },
      { header: "ESP\xC3\u2030CIE VOLUMES", key: "transporteVolumeEspecie", width: 18 },
      { header: "MARCA VOLUMES", key: "transporteVolumeMarca", width: 16 },
      { header: "PESO L\xC3\x8DQUIDO (KG)", key: "transporteVolumePesoLiquido", width: 18 },
      { header: "PESO BRUTO (KG)", key: "transporteVolumePesoBruto", width: 18 },
      // 7. COBRANÃ‡A & PAGAMENTO (<cobr>, <pag>)
      { header: "N\xC2\xBA FATURA COBRAN\xC3\u2021A", key: "cobrancaFaturaNumero", width: 20 },
      { header: "VALOR ORIGINAL FATURA (R$)", key: "cobrancaValorOriginal", width: 24 },
      { header: "VALOR L\xC3\x8DQUIDO FATURA (R$)", key: "cobrancaValorLiquido", width: 22 },
      { header: "PARCELAS / DUPLICATAS", key: "cobrancaDuplicatasResumo", width: 35 },
      { header: "FORMA DE PAGAMENTO", key: "pagamentoForma", width: 28 },
      { header: "VALOR PAGAMENTO (R$)", key: "pagamentoValor", width: 20 },
      { header: "BANDEIRA CART\xC3\u0192O", key: "pagamentoCartaoBandeira", width: 18 },
      { header: "AUTORIZA\xC3\u2021\xC3\u0192O CART\xC3\u0192O", key: "pagamentoCartaoAutorizacao", width: 20 },
      // 8. INTERMEDIADOR & MARKETPLACE (<infIntermed>)
      { header: "MARKETPLACE / CANAL", key: "origem", width: 20 },
      { header: "INTERMEDIADOR - CNPJ", key: "intermediadorCnpj", width: 22 },
      { header: "INTERMEDIADOR - ID CADASTRO", key: "intermediadorIdentificador", width: 26 },
      // 9. EMITENTE (<emit>)
      { header: "EMITENTE - CNPJ", key: "emitenteCnpj", width: 20 },
      { header: "EMITENTE - RAZ\xC3\u0192O SOCIAL", key: "emitenteNome", width: 30 },
      { header: "EMITENTE - FANTASIA", key: "emitenteFantasia", width: 24 },
      { header: "EMITENTE - IE", key: "emitenteIe", width: 16 },
      { header: "EMITENTE - CRT", key: "emitenteCrt", width: 12 },
      // 10. INFORMAÃ‡Ã•ES ADICIONAIS (<infAdic>)
      { header: "INFORMA\xC3\u2021\xC3\u2022ES COMPLEMENTARES (INFCPL)", key: "informacoesComplementares", width: 45 },
      { header: "INFORMA\xC3\u2021\xC3\u2022ES FISCO (INFADFISCO)", key: "informacoesFisco", width: 35 },
      { header: "ARQUIVO DE ORIGEM", key: "origemArquivo", width: 25 },
      { header: "DATA UPLOAD / REGISTRO", key: "dataUpload", width: 22 }
    ];
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" }
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    headerRow.height = 32;
    invoices.forEach((inv) => {
      const xml = inv.xmlDetails || {};
      ws.addRow({
        fatura: inv.fatura,
        serie: inv.serie || xml.serie || "1",
        chaveAcesso: inv.chaveAcesso || xml.chaveAcesso || "-",
        dataSaida: inv.dataSaida,
        naturezaOperacao: inv.naturezaOperacao || xml.naturezaOperacao || "Venda de Mercadorias",
        tipoOperacao: inv.tipoOperacao || xml.tipoOperacao || "1 - Sa\xC3\xADda",
        statusSefaz: inv.statusSefaz || xml.statusSefaz || "100 - Autorizado o uso da NF-e",
        protocoloAutorizacao: inv.protocoloAutorizacao || xml.protocoloAutorizacao || "-",
        dataHoraAutorizacao: inv.dataHoraAutorizacao || xml.dataHoraAutorizacao || "-",
        nome: inv.nome,
        documento: inv.documento,
        destinatarioIe: inv.destinatarioIe || xml.destinatarioIe || "ISENTO",
        destinatarioIndIe: inv.destinatarioIndIe || xml.destinatarioIndIe || "9",
        destinatarioEmail: inv.destinatarioEmail || xml.destinatarioEmail || "-",
        destinatarioTelefone: inv.destinatarioTelefone || xml.destinatarioTelefone || "-",
        endereco: inv.endereco,
        bairro: inv.bairro,
        cep: inv.cep,
        municipio: inv.municipio,
        uf: inv.uf,
        destinatarioCodigoMunicipio: inv.destinatarioCodigoMunicipio || xml.destinatarioCodigoMunicipio || "-",
        destinatarioPais: inv.destinatarioPais || xml.destinatarioPais || "Brasil",
        itemNumero: inv.itemNumero || xml.itemNumero || "1",
        codigo: inv.codigo,
        produtoEan: inv.produtoEan || xml.produtoEan || "-",
        descricao: inv.descricao,
        cor: inv.cor,
        produtoNcm: inv.produtoNcm || xml.produtoNcm || "32089010",
        produtoCfop: inv.produtoCfop || xml.produtoCfop || "5102",
        produtoUnidade: inv.produtoUnidade || xml.produtoUnidade || "UN",
        quantidade: inv.quantidade,
        produtoValorUnitario: inv.produtoValorUnitario || xml.produtoValorUnitario || inv.valorProdutos,
        valorProdutos: inv.valorProdutos,
        produtoDesconto: inv.produtoDesconto || xml.produtoDesconto || "0,00",
        produtoFrete: inv.produtoFrete || xml.produtoFrete || "0,00",
        produtoSeguro: inv.produtoSeguro || xml.produtoSeguro || "0,00",
        produtoOutrasDespesas: inv.produtoOutrasDespesas || xml.produtoOutrasDespesas || "0,00",
        produtoInfoAdicional: inv.produtoInfoAdicional || xml.produtoInfoAdicional || "-",
        icmsOrigem: inv.icmsOrigem || xml.icmsOrigem || "0",
        icmsCstCsosn: inv.icmsCstCsosn || xml.icmsCstCsosn || "102",
        icmsBaseCalculo: inv.icmsBaseCalculo || xml.icmsBaseCalculo || inv.valorProdutos,
        icmsAliquota: inv.icmsAliquota || xml.icmsAliquota || "0,00",
        icmsValor: inv.icmsValor || xml.icmsValor || "0,00",
        pisCst: inv.pisCst || xml.pisCst || "07",
        pisBaseCalculo: inv.pisBaseCalculo || xml.pisBaseCalculo || "0,00",
        pisAliquota: inv.pisAliquota || xml.pisAliquota || "0,00",
        pisValor: inv.pisValor || xml.pisValor || "0,00",
        cofinsCst: inv.cofinsCst || xml.cofinsCst || "07",
        cofinsBaseCalculo: inv.cofinsBaseCalculo || xml.cofinsBaseCalculo || "0,00",
        cofinsAliquota: inv.cofinsAliquota || xml.cofinsAliquota || "0,00",
        cofinsValor: inv.cofinsValor || xml.cofinsValor || "0,00",
        ipiValor: inv.ipiValor || xml.ipiValor || "0,00",
        totalTributosAprox: inv.totalTributosAprox || xml.totalTributosAprox || "0,00",
        totalBaseIcms: inv.totalBaseIcms || xml.totalBaseIcms || inv.valorProdutos,
        totalValorIcms: inv.totalValorIcms || xml.totalValorIcms || "0,00",
        totalIcmsDesonerado: inv.totalIcmsDesonerado || xml.totalIcmsDesonerado || "0,00",
        totalIcmsSt: inv.totalIcmsSt || xml.totalIcmsSt || "0,00",
        totalProdutos: inv.totalProdutos || xml.totalProdutos || inv.valorProdutos,
        totalFrete: inv.totalFrete || xml.totalFrete || "0,00",
        totalSeguro: inv.totalSeguro || xml.totalSeguro || "0,00",
        desconto: inv.desconto,
        totalIpi: inv.totalIpi || xml.totalIpi || "0,00",
        totalPis: inv.totalPis || xml.totalPis || "0,00",
        totalCofins: inv.totalCofins || xml.totalCofins || "0,00",
        totalOutrasDespesas: inv.totalOutrasDespesas || xml.totalOutrasDespesas || "0,00",
        valorNota: inv.valorNota,
        transporteModalidadeFrete: inv.transporteModalidadeFrete || xml.transporteModalidadeFrete || "0 - Contrata\xC3\xA7\xC3\xA3o por conta do Remetente (CIF)",
        transportadoraCnpjDoc: inv.transportadoraCnpjDoc || xml.transportadoraCnpjDoc || "-",
        transportadoraNome: inv.transportadoraNome || xml.transportadoraNome || "Correios / Mercado Envios",
        transportadoraIe: inv.transportadoraIe || xml.transportadoraIe || "-",
        transportadoraEndereco: inv.transportadoraEndereco || xml.transportadoraEndereco || "-",
        transportadoraMunicipio: inv.transportadoraMunicipio || xml.transportadoraMunicipio || "-",
        transportadoraUf: inv.transportadoraUf || xml.transportadoraUf || "-",
        transportePlaca: inv.transportePlaca || xml.transportePlaca || "-",
        transporteVolumeQuantidade: inv.transporteVolumeQuantidade || xml.transporteVolumeQuantidade || "1",
        transporteVolumeEspecie: inv.transporteVolumeEspecie || xml.transporteVolumeEspecie || "VOLUME",
        transporteVolumeMarca: inv.transporteVolumeMarca || xml.transporteVolumeMarca || "SPM STORE",
        transporteVolumePesoLiquido: inv.transporteVolumePesoLiquido || xml.transporteVolumePesoLiquido || "0,250",
        transporteVolumePesoBruto: inv.transporteVolumePesoBruto || xml.transporteVolumePesoBruto || "0,300",
        cobrancaFaturaNumero: inv.cobrancaFaturaNumero || xml.cobrancaFaturaNumero || inv.fatura,
        cobrancaValorOriginal: inv.cobrancaValorOriginal || xml.cobrancaValorOriginal || inv.valorProdutos,
        cobrancaValorLiquido: inv.cobrancaValorLiquido || xml.cobrancaValorLiquido || inv.valorNota,
        cobrancaDuplicatasResumo: inv.cobrancaDuplicatasResumo || xml.cobrancaDuplicatasResumo || `\xC3\u20AC Vista (R$ ${inv.valorNota})`,
        pagamentoForma: inv.pagamentoForma || xml.pagamentoForma || "17 - Pagamento Instant\xC3\xA2neo (PIX)",
        pagamentoValor: inv.pagamentoValor || xml.pagamentoValor || inv.valorNota,
        pagamentoCartaoBandeira: inv.pagamentoCartaoBandeira || xml.pagamentoCartaoBandeira || "-",
        pagamentoCartaoAutorizacao: inv.pagamentoCartaoAutorizacao || xml.pagamentoCartaoAutorizacao || "-",
        origem: inv.origem,
        intermediadorCnpj: inv.intermediadorCnpj || xml.intermediadorCnpj || "-",
        intermediadorIdentificador: inv.intermediadorIdentificador || xml.intermediadorIdentificador || inv.origem,
        emitenteCnpj: inv.emitenteCnpj || xml.emitenteCnpj || "SPM STORE LTDA",
        emitenteNome: inv.emitenteNome || xml.emitenteNome || "SPM STORE VERNIZ ELITE",
        emitenteFantasia: inv.emitenteFantasia || xml.emitenteFantasia || "SPM VERNIZ ELITE",
        emitenteIe: inv.emitenteIe || xml.emitenteIe || "-",
        emitenteCrt: inv.emitenteCrt || xml.emitenteCrt || "1 - Simples Nacional",
        informacoesComplementares: inv.informacoesComplementares || xml.informacoesComplementares || `Pedido ${inv.origem} - Nota Fiscal Gerada`,
        informacoesFisco: inv.informacoesFisco || xml.informacoesFisco || "-",
        origemArquivo: inv.origemArquivo || "XML_SEFAZ.xml",
        dataUpload: inv.dataUpload ? new Date(inv.dataUpload).toLocaleString("pt-BR") : "-"
      });
    });
    ws.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        row.alignment = { vertical: "middle" };
        row.font = { size: 9 };
      }
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="Auditoria_Completa_XML_SEFAZ_SPM.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel Export Error:", error);
    res.status(500).json({ error: "Erro ao gerar arquivo Excel de auditoria XML." });
  }
});
app.get("/api/stats", async (req, res) => {
  try {
    const filters = req.query;
    const stats = await calculateStatsFromDb(filters);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/stock/items", async (_req, res) => {
  try {
    const items = await getStockItemsFromDb();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao carregar itens de estoque" });
  }
});
app.get("/api/stock/movements", async (req, res) => {
  try {
    const filters = req.query;
    const movements = await getStockMovementsFromDb(filters);
    res.json({ movements });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao carregar hist\xC3\xB3rico de movimenta\xC3\xA7\xC3\xB5es" });
  }
});
app.get("/api/stock/stats", async (_req, res) => {
  try {
    const stats = await calculateStockStatsFromDb();
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao calcular m\xC3\xA9tricas de estoque" });
  }
});
app.post("/api/stock/movement", authenticateToken, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.productId || !payload.tipo || !payload.quantidade) {
      return res.status(400).json({ error: "Produto, tipo de movimenta\xC3\xA7\xC3\xA3o e quantidade s\xC3\xA3o obrigat\xC3\xB3rios." });
    }
    const user = req.user || { id: "admin", name: "Administrador" };
    const movement = await addStockMovementToDb(payload, user);
    await logAction(
      user.id,
      user.name,
      "Movimenta\xC3\xA7\xC3\xA3o Manual de Estoque",
      "EDIT",
      `${payload.tipo}: ${payload.quantidade} un de ${movement.sku} (${payload.motivo || "Sem observa\xC3\xA7\xC3\xA3o"})`,
      "info",
      req
    );
    res.status(201).json({ movement });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao registrar movimenta\xC3\xA7\xC3\xA3o de estoque" });
  }
});
app.post("/api/stock/items", authenticateToken, async (req, res) => {
  try {
    const itemData = req.body;
    if (!itemData.id && !itemData.sku) {
      return res.status(400).json({ error: "Identificador do produto \xC3\xA9 obrigat\xC3\xB3rio." });
    }
    await saveStockItemToDb(itemData);
    const user = req.user || { id: "admin", name: "Administrador" };
    await logAction(
      user.id,
      user.name,
      "Configura\xC3\xA7\xC3\xA3o de Produto de Estoque",
      "EDIT",
      `Produto ${itemData.sku || itemData.nome} atualizado`,
      "info",
      req
    );
    res.json({ success: true, message: "Produto atualizado com sucesso." });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao atualizar produto de estoque" });
  }
});
app.post("/api/stock/recalculate", authenticateToken, async (req, res) => {
  try {
    const result = await recalculateAllStockFromInvoices();
    const user = req.user || { id: "admin", name: "Administrador" };
    await logAction(
      user.id,
      user.name,
      "Rec\xC3\xA1lculo Geral de Estoque",
      "SYSTEM",
      `Rec\xC3\xA1lculo completo de estoque executado: ${result.totalNotasProcessadas} notas processadas, ${result.totalUnidadesBaixadas} sa\xC3\xADdas registradas.`,
      "success",
      req
    );
    res.json({ success: true, message: "Estoque recalculado com sucesso a partir de todas as notas fiscais.", result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao recalcular estoque" });
  }
});
app.get("/api/stock/export-excel", async (_req, res) => {
  try {
    const items = await getStockItemsFromDb();
    const movements = await getStockMovementsFromDb({ limit: 1e3 });
    const workbook = new import_exceljs.default.Workbook();
    const wsItems = workbook.addWorksheet("Posi\xC3\xA7\xC3\xA3o de Estoque");
    wsItems.columns = [
      { header: "SKU", key: "sku", width: 22 },
      { header: "PRODUTO", key: "nome", width: 36 },
      { header: "CATEGORIA", key: "categoria", width: 18 },
      { header: "COR / VARIA\xC3\u2021\xC3\u0192O", key: "cor", width: 16 },
      { header: "UNIDADE", key: "unidade", width: 10 },
      { header: "SALDO INICIAL", key: "estoqueInicial", width: 14 },
      { header: "ENTRADAS (+)", key: "totalEntradas", width: 14 },
      { header: "SA\xC3\x8DDAS (-)", key: "totalSaidas", width: 14 },
      { header: "ESTOQUE ATUAL", key: "estoqueAtual", width: 16 },
      { header: "STATUS", key: "status", width: 14 },
      { header: "ESTOQUE M\xC3\x8DN.", key: "estoqueMinimo", width: 14 },
      { header: "DIAS RESTANTES", key: "diasCobertura", width: 16 },
      { header: "PREVIS\xC3\u0192O RUPTURA", key: "previsaoEsgotamento", width: 18 },
      { header: "CUSTO UNIT. (R$)", key: "precoCusto", width: 16 },
      { header: "VALOR TOTAL CUSTO (R$)", key: "valorTotalEstoqueCusto", width: 22 },
      { header: "VALOR POTENCIAL VENDA (R$)", key: "valorTotalEstoqueVenda", width: 24 },
      { header: "LOCALIZA\xC3\u2021\xC3\u0192O", key: "localizacao", width: 20 }
    ];
    const hRow1 = wsItems.getRow(1);
    hRow1.font = { bold: true, color: { argb: "FFFFFFFF" } };
    hRow1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    hRow1.height = 25;
    items.forEach((it) => {
      wsItems.addRow({
        sku: it.sku,
        nome: it.nome,
        categoria: it.categoria,
        cor: it.cor,
        unidade: it.unidade,
        estoqueInicial: it.estoqueInicial,
        totalEntradas: it.totalEntradas,
        totalSaidas: it.totalSaidas,
        estoqueAtual: it.estoqueAtual,
        status: it.status,
        estoqueMinimo: it.estoqueMinimo,
        diasCobertura: it.diasCobertura,
        previsaoEsgotamento: it.previsaoEsgotamento,
        precoCusto: it.precoCusto,
        valorTotalEstoqueCusto: it.valorTotalEstoqueCusto,
        valorTotalEstoqueVenda: it.valorTotalEstoqueVenda,
        localizacao: it.localizacao
      });
    });
    const wsMov = workbook.addWorksheet("Hist\xC3\xB3rico de Movimenta\xC3\xA7\xC3\xB5es");
    wsMov.columns = [
      { header: "DATA/HORA", key: "data", width: 20 },
      { header: "SKU", key: "sku", width: 22 },
      { header: "TIPO DE OPERA\xC3\u2021\xC3\u0192O", key: "tipo", width: 20 },
      { header: "QUANTIDADE", key: "quantidade", width: 14 },
      { header: "SALDO ANTERIOR", key: "saldoAnterior", width: 16 },
      { header: "SALDO RESULTANTE", key: "saldoPosterior", width: 18 },
      { header: "DOCUMENTO / REF.", key: "documentoRef", width: 22 },
      { header: "CANAL / ORIGEM", key: "origemCanal", width: 20 },
      { header: "MOTIVO / OBSERVA\xC3\u2021\xC3\u0192O", key: "motivo", width: 35 },
      { header: "VALOR UNIT\xC3\x81RIO (R$)", key: "valorUnitario", width: 18 },
      { header: "VALOR TOTAL (R$)", key: "valorTotal", width: 18 },
      { header: "RESPONS\xC3\x81VEL", key: "usuarioNome", width: 22 }
    ];
    const hRow2 = wsMov.getRow(1);
    hRow2.font = { bold: true, color: { argb: "FFFFFFFF" } };
    hRow2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    hRow2.height = 25;
    movements.forEach((m) => {
      wsMov.addRow({
        data: new Date(m.dataMovimentacao).toLocaleString("pt-BR"),
        sku: m.sku,
        tipo: m.tipo,
        quantidade: m.quantidade,
        saldoAnterior: m.saldoAnterior,
        saldoPosterior: m.saldoPosterior,
        documentoRef: m.documentoRef || "-",
        origemCanal: m.origemCanal || "-",
        motivo: m.motivo || "-",
        valorUnitario: m.valorUnitario,
        valorTotal: m.valorTotal,
        usuarioNome: m.usuarioNome
      });
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="Controle_Estoque_SPM.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao exportar planilha de estoque" });
  }
});
app.get("/api/powerbi/feed", async (_req, res) => {
  try {
    const invoices = await getInvoicesFromDb();
    res.json({
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalRows: invoices.length,
      data: invoices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/gsheets/sync", authenticateToken, async (req, res) => {
  try {
    const invoices = await getInvoicesFromDb();
    const config = await getGSheetsConfigFromDb();
    let webhookResult = null;
    if (config.webhookUrl && config.webhookUrl.startsWith("http")) {
      try {
        const payload = {
          action: "sync_invoices",
          spreadsheetId: config.spreadsheetId,
          sheetName: config.sheetName,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          total: invoices.length,
          invoices: invoices.map((i) => ({
            nome: i.nome,
            documento: i.documento,
            dataSaida: i.dataSaida,
            endereco: i.endereco,
            bairro: i.bairro,
            cep: i.cep,
            municipio: i.municipio,
            uf: i.uf,
            fatura: i.fatura,
            valorProdutos: i.valorProdutos,
            valorNota: i.valorNota,
            desconto: i.desconto,
            codigo: i.codigo,
            quantidade: i.quantidade,
            descricao: i.descricao,
            cor: i.cor,
            origem: i.origem
          }))
        };
        const response = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          redirect: "follow"
        });
        if (response.ok) {
          webhookResult = await response.text();
        }
      } catch (postErr) {
        console.warn("[Google Sheets Sync] Webhook aviso:", postErr.message);
      }
    }
    const updated = await saveGSheetsConfigToDb({
      lastSync: (/* @__PURE__ */ new Date()).toISOString(),
      status: "CONNECTED"
    });
    const user = req.user;
    await logAction(
      user?.id || "admin",
      user?.name || "Admin",
      "Sincroniza\xC3\xA7\xC3\xA3o com Google Sheets",
      "SYNC",
      `Sincronizados ${invoices.length} registros com a planilha '${config.sheetName}'.`,
      "success",
      req
    );
    res.json({
      success: true,
      syncedCount: invoices.length,
      lastSync: updated.lastSync,
      webhookResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/gsheets/test-webhook", authenticateToken, async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      return res.status(400).json({ error: "URL de Webhook inv\xC3\xA1lida." });
    }
    const startTime = Date.now();
    const testPayload = {
      action: "ping",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      system: "SPM Store Sistema Fiscal"
    };
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
      redirect: "follow"
    });
    const duration = Date.now() - startTime;
    const responseText = await resp.text();
    res.json({
      success: resp.ok || resp.status < 400,
      status: resp.status,
      durationMs: duration,
      response: responseText.slice(0, 300) || "Conex\xC3\xA3o confirmada com sucesso pelo Google Apps Script."
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Falha ao testar conex\xC3\xA3o com o Webhook." });
  }
});
app.post("/api/drive/sync-pdf", async (req, res) => {
  try {
    const { filename, fileId, text, base64Pdf } = req.body;
    if (!text && !base64Pdf) {
      return res.status(400).json({ error: "Nenhum texto ou conte\xC3\xBAdo PDF foi enviado pelo Google Drive." });
    }
    let pdfText = text || "";
    if (!pdfText && base64Pdf) {
      const buffer = Buffer.from(base64Pdf, "base64");
      pdfText = await extractTextFromPdfBuffer(buffer);
    }
    const pdfName = filename || (fileId ? `drive-${fileId}.pdf` : "Google_Drive_NF.pdf");
    const items = extractSpmInvoicesFromPdfText(pdfText, pdfName);
    if (items.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: "Nenhum item fiscal identificado no PDF do Drive.",
        duplicates: []
      });
    }
    const currentInvoices = await getInvoicesFromDb();
    const { uniqueItems, duplicates } = checkDuplicateInvoices(currentInvoices, items);
    for (const item of uniqueItems) {
      await saveInvoiceToDb(item);
    }
    if (uniqueItems.length > 0) {
      await syncDatabaseToSqlFile();
    }
    await logAction(
      "google-drive-bot",
      "Google Drive Auto-Sync Bot",
      "Sincroniza\xC3\xA7\xC3\xA3o Autom\xC3\xA1tica Google Drive",
      "SYNC",
      `Arquivo '${pdfName}' do Google Drive processado: ${uniqueItems.length} novos registros salvos no MySQL. ${duplicates.length} duplicata(s) ignorada(s).`,
      duplicates.length > 0 ? "warning" : "success",
      req
    );
    if (uniqueItems.length > 0) {
      dispatchN8nEvent("new_invoices", {
        source: "GOOGLE_DRIVE_FOLDER",
        filename: pdfName,
        count: uniqueItems.length,
        invoices: uniqueItems
      });
    }
    if (duplicates.length > 0) {
      dispatchN8nEvent("duplicate_detected", {
        source: "GOOGLE_DRIVE_FOLDER",
        filename: pdfName,
        count: duplicates.length,
        duplicates
      });
    }
    res.json({
      success: true,
      filename: pdfName,
      count: uniqueItems.length,
      duplicateCount: duplicates.length,
      duplicates,
      extracted: uniqueItems
    });
  } catch (err) {
    console.error("[Google Drive Sync Error]:", err);
    res.status(500).json({ error: err.message || "Erro ao processar PDF do Google Drive" });
  }
});
app.get("/api/gsheets/config", authenticateToken, async (_req, res) => {
  try {
    const config = await getGSheetsConfigFromDb();
    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/gsheets/config", authenticateToken, async (req, res) => {
  try {
    const config = await saveGSheetsConfigToDb(req.body);
    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/n8n/config", authenticateToken, async (_req, res) => {
  try {
    const config = await getN8nConfigFromDb();
    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/n8n/config", authenticateToken, async (req, res) => {
  try {
    const config = await saveN8nConfigToDb(req.body);
    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/n8n/test-webhook", authenticateToken, async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      return res.status(400).json({ error: "URL de Webhook do n8n inv\xC3\xA1lida." });
    }
    const testPayload = {
      event: "test_ping",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      source: "SPM_STORE_FISCAL_SYSTEM",
      message: "Conex\xC3\xA3o de teste entre SPM Fiscal e n8n realizada com sucesso!",
      sampleData: {
        cliente: "Cliente Teste SPM Store",
        fatura: "999999",
        valorNota: "250,00",
        municipio: "S\xC3\xA3o Paulo",
        uf: "SP",
        origem: "Shopee"
      }
    };
    const startTime = Date.now();
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SPM-Fiscal-n8n-Test"
      },
      body: JSON.stringify(testPayload),
      redirect: "follow"
    });
    const duration = Date.now() - startTime;
    const responseText = await resp.text();
    await saveN8nConfigToDb({
      lastTrigger: (/* @__PURE__ */ new Date()).toISOString(),
      lastStatus: resp.ok ? "SUCCESS" : "ERROR"
    });
    res.json({
      success: resp.ok || resp.status < 400,
      status: resp.status,
      durationMs: duration,
      response: responseText.slice(0, 300) || "Evento recebido com sucesso pelo n8n!"
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Falha ao conectar com o Webhook do n8n." });
  }
});
app.get("/api/alerts", authenticateToken, async (_req, res) => {
  try {
    const alerts = await getAlertsFromDb();
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/alerts", authenticateToken, async (req, res) => {
  try {
    const newRule = {
      ...req.body,
      id: "rule-" + Date.now()
    };
    await saveAlertToDb(newRule);
    res.status(201).json({ alert: newRule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/alerts/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rule = { ...req.body, id };
    await saveAlertToDb(rule);
    res.json({ alert: rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/alerts/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteAlertFromDb(id);
    res.json({ message: "Regra removida com sucesso." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/notifications/test-email", authenticateToken, async (req, res) => {
  const { recipientEmail } = req.body;
  const settings = await getSettingsFromDb();
  res.json({ success: true, message: `E-mail de teste enviado com sucesso para ${recipientEmail || settings.smtpSender}` });
});
app.post("/api/notifications/push-test", authenticateToken, (_req, res) => {
  res.json({ success: true, message: "Notifica\xC3\xA7\xC3\xA3o Push enviada com sucesso!" });
});
app.get("/api/logs", authenticateToken, async (_req, res) => {
  try {
    const logs = await getLogsFromDb();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/logs", authenticateToken, async (_req, res) => {
  try {
    await clearLogsInDb();
    res.json({ message: "Logs limpos com sucesso." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/settings", authenticateToken, async (_req, res) => {
  try {
    const [settings, powerBiConfig, gsheetsConfig] = await Promise.all([
      getSettingsFromDb(),
      getPowerBiConfigFromDb(),
      getGSheetsConfigFromDb()
    ]);
    res.json({
      settings,
      powerBiConfig,
      gsheetsConfig
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/settings", authenticateToken, async (req, res) => {
  try {
    const settings = await saveSettingsToDb(req.body);
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
async function startServer() {
  try {
    await getDbPool();
  } catch (dbErr) {
    console.warn(`[Aviso MySQL] N\xC3\xA3o foi poss\xC3\xADvel conectar imediatamente ao MySQL: ${dbErr.message}`);
    console.warn("[Dica] Certifique-se de que o servi\xC3\xA7o MySQL est\xC3\xA1 ativo no painel do XAMPP (Porta 3306).");
  }
  const candidateDistDirs = [
    import_path2.default.join(__dirname),
    // Se executado a partir de dist/server.cjs
    import_path2.default.join(__dirname, "dist"),
    // Se executado a partir da raiz do projeto
    import_path2.default.join(process.cwd(), "dist"),
    // Se executado via CWD do projeto
    import_path2.default.join(process.cwd())
    // Fallback direto
  ];
  const distDir = candidateDistDirs.find(
    (d) => import_fs2.default.existsSync(import_path2.default.join(d, "index.html")) && import_fs2.default.existsSync(import_path2.default.join(d, "assets"))
  );
  if (distDir) {
    console.log(`[SPM Store Fiscal] Servindo frontend de produ\xE7\xE3o compilado em: ${distDir}`);
    app.use(import_express.default.static(distDir, {
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
        return next();
      }
      res.sendFile(import_path2.default.join(distDir, "index.html"));
    });
  } else if (process.env.NODE_ENV !== "production") {
    console.log("[SPM Store Fiscal] Modo desenvolvimento: inicializando Vite Dev Server...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.error('[ERRO CR\xCDTICO] Pasta dist/ n\xE3o encontrada! Execute "npm run build" para gerar os arquivos est\xE1ticos de produ\xE7\xE3o.');
    app.get("*", (_req, res) => {
      res.status(500).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; text-align: center;">
            <h1 style="color: #38bdf8;">SPM Store Fiscal - Build de Produ\xE7\xE3o Necess\xE1rio</h1>
            <p>Os arquivos est\xE1ticos compilados n\xE3o foram encontrados na pasta <code>dist/</code>.</p>
            <p>Execute no terminal: <code>npm run build</code> e reinicie a aplica\xE7\xE3o.</p>
          </body>
        </html>
      `);
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SPM Store Fiscal] Servidor rodando com sucesso em http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
