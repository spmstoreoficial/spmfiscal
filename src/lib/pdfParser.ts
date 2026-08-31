import { Invoice, DanfeParsedData, DanfeParsedItem } from '../types';

/**
 * Motor de Extração de Dados em JavaScript para DANFE (SPM Store).
 * Extrai rigorosamente apenas os campos definidos no código JavaScript fornecido:
 * - NOME
 * - CPF / CNPJ (documento)
 * - DATA NF-e (dataSaida)
 * - ENDEREÇO
 * - BAIRRO
 * - CEP
 * - CIDADE (municipio)
 * - UF
 * - FATURAS (fatura)
 * - VALOR TOTAL (valorProdutos)
 * - VALOR FINAL (valorNota)
 * - DESCONTO
 * - CÓDIGO
 * - QUANTIDADE
 * - DESCRIÇÃO
 * - COR (Preto | Marrom | Incolor | Não identificada)
 * - MARKETPLACE (Shopee | Mercado Livre | WhatsApp | TikTok | Outros)
 */
export function parseDanfeText(text: string): DanfeParsedData {
  if (!text) {
    text = '';
  }

  const buscar = function (regex: RegExp): string {
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const dados: Partial<DanfeParsedData> = {};

  // -- CABEÇALHO --
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
  if (!dados.municipio || dados.municipio === 'Não encontrado') {
    const matchMun = text.match(/Munic[ií]pio[\s\r\n]+([\s\S]+?)[\s\r\n]+UF/i);
    if (matchMun) {
      const linhasMun = matchMun[1].trim().split(/[\r\n]+/);
      dados.municipio = linhasMun[0].trim();
    }
  }

  dados.uf = buscar(/UF[\s\r\n]+([A-Z]{2})/i);
  const matchFatura = text.match(/Faturas[\s\S]*?\n(\d{3,})/i) || text.match(/Faturas[\s\S]*?Valor\s*[\r\n\t ]+(\d+)/i);
  dados.fatura = matchFatura ? matchFatura[1].trim() : buscar(/N[°º]\s*(\d+)/i);
  if (!dados.fatura) dados.fatura = 'Não encontrada';

  dados.valorProdutos = buscar(/Valor total dos produtos[\s\r\n]+([\d\,\.]+)/i);
  dados.valorNota = buscar(/Valor total da nota[\s\r\n]+([\d\,\.]+)/i);
  dados.desconto = buscar(/Desconto[\s\r\n]+([\d\,\.]+)/i);

  // -- ORIGEM DO MARKETPLACE --
  const textoGeral = text.toLowerCase();
  let origemGeral = 'Outros';
  if (textoGeral.includes('shopee')) origemGeral = 'Shopee';
  else if (textoGeral.includes('mercado livre') || textoGeral.includes('mercadolivre')) origemGeral = 'Mercado Livre';
  else if (textoGeral.includes('whatsapp')) origemGeral = 'WhatsApp';
  else if (textoGeral.includes('tiktok')) origemGeral = 'TikTok';

  // -- ITENS --
  dados.itens = [];

  // 1. Tentar tabela estruturada com pipes "|"
  const regexTabelaPipes = /Código\s*\|\s*Descrição.*?%IPI[\s\r\n]+([\s\S]+?)(?:Cálculo do ISSQN|Cálculo do ISSON|Dados adicionais|Total aproximado)/i;
  const matchTabelaPipes = text.match(regexTabelaPipes);

  if (matchTabelaPipes) {
    const tabelaStr = matchTabelaPipes[1];
    const colunas = tabelaStr.split('|');

    if (colunas.length >= 2) {
      const blocoCodigos = colunas[0].trim().replace(/-\s*[\r\n]+\s*/g, '-');
      let codigos = blocoCodigos.split(/[\r\n]+/).map(c => c.trim()).filter(c => c !== '');
      if (codigos.length === 0) codigos = ['Sem código'];

      const blocoDescricoes = colunas[1] ? colunas[1].trim() : '';
      const descLinhas = blocoDescricoes.split(/[\r\n]+/).map(l => l.trim()).filter(l => l !== '');
      const descricoes: string[] = [];

      if (descLinhas.length > 0) {
        const primeiraPalavra = descLinhas[0].split(' ')[0];
        let currentDesc = descLinhas[0];

        for (let idx = 1; idx < descLinhas.length; idx++) {
          if (descLinhas[idx].indexOf(primeiraPalavra) === 0 && descricoes.length < codigos.length - 1) {
            descricoes.push(currentDesc);
            currentDesc = descLinhas[idx];
          } else {
            currentDesc += ' ' + descLinhas[idx];
          }
        }
        descricoes.push(currentDesc);
      }

      while (descricoes.length < codigos.length) {
        descricoes.push(descricoes[0] || 'Descrição não encontrada');
      }

      const blocoQtdes = (colunas.length >= 6) ? colunas[colunas.length - 2] + ' ' + colunas[colunas.length - 3] : tabelaStr;
      const qtdesMatch = blocoQtdes.match(/\b\d+(?:,\d+)?\b/g);
      const qtdes = qtdesMatch ? qtdesMatch : [];

      while (qtdes.length < codigos.length) {
        qtdes.push('1');
      }

      for (let j = 0; j < codigos.length; j++) {
        const cod = codigos[j];
        const desc = descricoes[j];
        const qtde = qtdes[j] || '1';

        // --- MIRA PARA COR ---
        let cor = 'Não identificada';
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
          cor: cor,
          origem: origemGeral
        });
      }
    }
  }

  // 2. Tentar tabela de itens direta (DANFE sem pipes, padrão PDF)
  if (dados.itens.length === 0) {
    const regexSecao = /Itens da nota fiscal[\s\S]*?Código[\s\S]*?%IPI[\s\r\n]+([\s\S]+?)(?:Cálculo do ISSQN|Cálculo do ISSON|Dados adicionais|Total aproximado|$)/i;
    const matchSecao = text.match(regexSecao);

    if (matchSecao) {
      // Desfazer quebras de linha em hífens (ex: SPM-Shopee-\nPreto-1 -> SPM-Shopee-Preto-1)
      const blocoTratado = matchSecao[1].replace(/-\s*[\r\n]+\s*/g, '-');
      const linhas = blocoTratado.split(/[\r\n]+/).map(l => l.trim()).filter(l => l !== '');
      
      const codigos = linhas.filter(l => /^SPM-|^COD-|^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+/i.test(l));
      const outrasLinhas = linhas.filter(l => !codigos.includes(l) && !l.includes('Cálculo do') && !l.includes('Inscrição Municipal'));

      if (codigos.length > 0) {
        const descTexto = outrasLinhas.join(' ');
        const descLimpa = descTexto.replace(/\s+\d{8}\s+[\s\S]*$/, '').trim();

        for (const cod of codigos) {
          let cor = 'Não identificada';
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
          const qtde = mQtde ? mQtde[1] : '1';

          dados.itens.push({
            codigo: cod,
            descricao: descLimpa || 'Verniz Elite SPM',
            quantidade: qtde,
            cor: cor,
            origem: origemGeral
          });
        }
      }
    }
  }

  // 3. Fallback (Para casos extremos)
  if (dados.itens.length === 0) {
    const descFbMatch = text.match(/(?:Verniz[^\n\r]+)/ig);
    const codFbMatch = text.replace(/-\s*[\r\n]+\s*/g, '-').match(/SPM-[A-Za-z0-9_-]+/ig);

    const qtdFb = Math.max((codFbMatch ? codFbMatch.length : 1), (descFbMatch ? descFbMatch.length : 1));

    for (let f = 0; f < qtdFb; f++) {
      const codF = codFbMatch ? (codFbMatch[f] || codFbMatch[0]) : 'Sem código';
      const descF = descFbMatch ? (descFbMatch[f] || descFbMatch[0]) : 'Item sem descrição';

      let corF = 'Não identificada';
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
        quantidade: '1',
        cor: corF,
        origem: origemGeral
      });
    }
  }

  return {
    nome: dados.nome || 'Não encontrado',
    documento: dados.documento || '',
    dataSaida: dados.dataSaida || '',
    endereco: dados.endereco || '',
    bairro: dados.bairro || '',
    cep: dados.cep || '',
    municipio: dados.municipio || '',
    uf: dados.uf || '',
    fatura: dados.fatura || '',
    valorProdutos: dados.valorProdutos || '0,00',
    valorNota: dados.valorNota || '0,00',
    desconto: dados.desconto || '0,00',
    itens: dados.itens || []
  };
}

/**
 * Converte o resultado de parseDanfeText em uma lista de registros de notas (um por item/linha)
 */
export function extractSpmInvoicesFromPdfText(text: string, filename = 'documento.pdf'): Invoice[] {
  const parsed = parseDanfeText(text);
  const rows: Invoice[] = [];
  const baseId = 'spm-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

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
      codigo: 'Sem código',
      quantidade: '1',
      descricao: 'Item sem descrição',
      cor: 'Não identificada',
      origem: 'Outros',
      origemArquivo: filename,
      dataUpload: new Date().toISOString(),
      status: 'Processado'
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
        dataUpload: new Date().toISOString(),
        status: 'Processado'
      });
    });
  }

  return rows;
}
