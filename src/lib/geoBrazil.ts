import { Invoice } from '../types';

export interface CityGeoLocation {
  nome: string;
  uf: string;
  lat: number;
  lng: number;
  regiao: 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte';
}

export interface CitySalesData extends CityGeoLocation {
  totalNotas: number;
  totalFaturamento: number;
  ticketMedio: number;
  marketplaces: Record<string, number>;
  produtosMaisVendidos: Array<{ descricao: string; quantidade: number }>;
  ultimasNotas: Invoice[];
  isNewNotification?: boolean;
}

export interface SaleNotification {
  id: string;
  cidade: string;
  uf: string;
  valor: number;
  cliente: string;
  origem: string;
  fatura: string;
  timestamp: string;
  lat: number;
  lng: number;
}

// 1. Catálogo pré-indexado de capitais e principais polos do Brasil
const BRAZIL_CAPITALS_AND_HUBS: Record<string, CityGeoLocation> = {
  // Sudeste
  'SAO PAULO-SP': { nome: 'São Paulo', uf: 'SP', lat: -23.5505, lng: -46.6333, regiao: 'Sudeste' },
  'CAMPINAS-SP': { nome: 'Campinas', uf: 'SP', lat: -22.9056, lng: -47.0608, regiao: 'Sudeste' },
  'GUARULHOS-SP': { nome: 'Guarulhos', uf: 'SP', lat: -23.4542, lng: -46.5337, regiao: 'Sudeste' },
  'SAO BERNARDO DO CAMPO-SP': { nome: 'São Bernardo do Campo', uf: 'SP', lat: -23.6914, lng: -46.5646, regiao: 'Sudeste' },
  'SANTO ANDRE-SP': { nome: 'Santo André', uf: 'SP', lat: -23.6639, lng: -46.5383, regiao: 'Sudeste' },
  'OSASCO-SP': { nome: 'Osasco', uf: 'SP', lat: -23.5329, lng: -46.792, regiao: 'Sudeste' },
  'SOROCABA-SP': { nome: 'Sorocaba', uf: 'SP', lat: -23.5015, lng: -47.4526, regiao: 'Sudeste' },
  'RIBEIRAO PRETO-SP': { nome: 'Ribeirão Preto', uf: 'SP', lat: -21.1767, lng: -47.8108, regiao: 'Sudeste' },
  'SANTOS-SP': { nome: 'Santos', uf: 'SP', lat: -23.9608, lng: -46.3336, regiao: 'Sudeste' },
  'SAO JOSE DOS CAMPOS-SP': { nome: 'São José dos Campos', uf: 'SP', lat: -23.1794, lng: -45.8869, regiao: 'Sudeste' },
  'PIRACICABA-SP': { nome: 'Piracicaba', uf: 'SP', lat: -22.7253, lng: -47.6492, regiao: 'Sudeste' },
  'BAURU-SP': { nome: 'Bauru', uf: 'SP', lat: -22.3147, lng: -49.0606, regiao: 'Sudeste' },
  'FRANCA-SP': { nome: 'Franca', uf: 'SP', lat: -20.5386, lng: -47.4008, regiao: 'Sudeste' },
  'JUNDIAI-SP': { nome: 'Jundiaí', uf: 'SP', lat: -23.1857, lng: -46.8978, regiao: 'Sudeste' },
  
  'RIO DE JANEIRO-RJ': { nome: 'Rio de Janeiro', uf: 'RJ', lat: -22.9068, lng: -43.1729, regiao: 'Sudeste' },
  'NITEROI-RJ': { nome: 'Niterói', uf: 'RJ', lat: -22.8833, lng: -43.1036, regiao: 'Sudeste' },
  'SAO GONCALO-RJ': { nome: 'São Gonçalo', uf: 'RJ', lat: -22.8268, lng: -43.0537, regiao: 'Sudeste' },
  'DUQUE DE CAXIAS-RJ': { nome: 'Duque de Caxias', uf: 'RJ', lat: -22.7856, lng: -43.3117, regiao: 'Sudeste' },
  'NOVA IGUACU-RJ': { nome: 'Nova Iguaçu', uf: 'RJ', lat: -22.7556, lng: -43.4603, regiao: 'Sudeste' },
  'PETROPOLIS-RJ': { nome: 'Petrópolis', uf: 'RJ', lat: -22.505, lng: -43.1789, regiao: 'Sudeste' },
  'VOLTA REDONDA-RJ': { nome: 'Volta Redonda', uf: 'RJ', lat: -22.5231, lng: -44.1042, regiao: 'Sudeste' },

  'BELO HORIZONTE-MG': { nome: 'Belo Horizonte', uf: 'MG', lat: -19.9167, lng: -43.9345, regiao: 'Sudeste' },
  'UBERLANDIA-MG': { nome: 'Uberlândia', uf: 'MG', lat: -18.9186, lng: -48.2772, regiao: 'Sudeste' },
  'CONTAGEM-MG': { nome: 'Contagem', uf: 'MG', lat: -19.9317, lng: -44.0536, regiao: 'Sudeste' },
  'JUIZ DE FORA-MG': { nome: 'Juiz de Fora', uf: 'MG', lat: -21.7595, lng: -43.3398, regiao: 'Sudeste' },
  'BETIM-MG': { nome: 'Betim', uf: 'MG', lat: -19.9678, lng: -44.1983, regiao: 'Sudeste' },
  'MONTES CLAROS-MG': { nome: 'Montes Claros', uf: 'MG', lat: -16.7281, lng: -43.8617, regiao: 'Sudeste' },
  'UBERABA-MG': { nome: 'Uberaba', uf: 'MG', lat: -19.7472, lng: -47.9392, regiao: 'Sudeste' },

  'VITORIA-ES': { nome: 'Vitória', uf: 'ES', lat: -20.3155, lng: -40.3128, regiao: 'Sudeste' },
  'VILA VELHA-ES': { nome: 'Vila Velha', uf: 'ES', lat: -20.3297, lng: -40.2925, regiao: 'Sudeste' },
  'SERRA-ES': { nome: 'Serra', uf: 'ES', lat: -20.1286, lng: -40.3078, regiao: 'Sudeste' },

  // Sul
  'CURITIBA-PR': { nome: 'Curitiba', uf: 'PR', lat: -25.4284, lng: -49.2733, regiao: 'Sul' },
  'LONDRINA-PR': { nome: 'Londrina', uf: 'PR', lat: -23.3045, lng: -51.1696, regiao: 'Sul' },
  'MARINGA-PR': { nome: 'Maringá', uf: 'PR', lat: -23.4205, lng: -51.9331, regiao: 'Sul' },
  'PONTA GROSSA-PR': { nome: 'Ponta Grossa', uf: 'PR', lat: -25.095, lng: -50.1619, regiao: 'Sul' },
  'CASCAVEL-PR': { nome: 'Cascavel', uf: 'PR', lat: -24.9578, lng: -53.4595, regiao: 'Sul' },
  'FOZ DO IGUACU-PR': { nome: 'Foz do Iguaçu', uf: 'PR', lat: -25.5478, lng: -54.5882, regiao: 'Sul' },

  'FLORIANOPOLIS-SC': { nome: 'Florianópolis', uf: 'SC', lat: -27.5954, lng: -48.548, regiao: 'Sul' },
  'JOINVILLE-SC': { nome: 'Joinville', uf: 'SC', lat: -26.3044, lng: -48.8464, regiao: 'Sul' },
  'BLUMENAU-SC': { nome: 'Blumenau', uf: 'SC', lat: -26.9194, lng: -49.0661, regiao: 'Sul' },
  'SAO JOSE-SC': { nome: 'São José', uf: 'SC', lat: -27.6136, lng: -48.6366, regiao: 'Sul' },
  'CRICIUMA-SC': { nome: 'Criciúma', uf: 'SC', lat: -28.6775, lng: -49.3697, regiao: 'Sul' },
  'CHAPECO-SC': { nome: 'Chapecó', uf: 'SC', lat: -27.1006, lng: -52.6152, regiao: 'Sul' },

  'PORTO ALEGRE-RS': { nome: 'Porto Alegre', uf: 'RS', lat: -30.0346, lng: -51.2177, regiao: 'Sul' },
  'CAXIAS DO SUL-RS': { nome: 'Caxias do Sul', uf: 'RS', lat: -29.1678, lng: -51.1794, regiao: 'Sul' },
  'CANOAS-RS': { nome: 'Canoas', uf: 'RS', lat: -29.9178, lng: -51.1836, regiao: 'Sul' },
  'PELOTAS-RS': { nome: 'Pelotas', uf: 'RS', lat: -31.7654, lng: -52.3376, regiao: 'Sul' },
  'SANTA MARIA-RS': { nome: 'Santa Maria', uf: 'RS', lat: -29.6842, lng: -53.8069, regiao: 'Sul' },
  'PASSO FUNDO-RS': { nome: 'Passo Fundo', uf: 'RS', lat: -28.2628, lng: -52.4067, regiao: 'Sul' },

  // Nordeste
  'SALVADOR-BA': { nome: 'Salvador', uf: 'BA', lat: -12.9714, lng: -38.5014, regiao: 'Nordeste' },
  'FEIRA DE SANTANA-BA': { nome: 'Feira de Santana', uf: 'BA', lat: -12.2664, lng: -38.9663, regiao: 'Nordeste' },
  'VITORIA DA CONQUISTA-BA': { nome: 'Vitória da Conquista', uf: 'BA', lat: -14.8661, lng: -40.8394, regiao: 'Nordeste' },
  'RECIFE-PE': { nome: 'Recife', uf: 'PE', lat: -8.0476, lng: -34.877, regiao: 'Nordeste' },
  'JABOATAO DOS GUARARAPES-PE': { nome: 'Jaboatão dos Guararapes', uf: 'PE', lat: -8.113, lng: -35.0153, regiao: 'Nordeste' },
  'OLINDA-PE': { nome: 'Olinda', uf: 'PE', lat: -8.0089, lng: -34.8553, regiao: 'Nordeste' },
  'CARUARU-PE': { nome: 'Caruaru', uf: 'PE', lat: -8.2836, lng: -35.9761, regiao: 'Nordeste' },
  'FORTALEZA-CE': { nome: 'Fortaleza', uf: 'CE', lat: -3.7172, lng: -38.5433, regiao: 'Nordeste' },
  'CAUCAIA-CE': { nome: 'Caucaia', uf: 'CE', lat: -3.7361, lng: -38.6531, regiao: 'Nordeste' },
  'JUAZEIRO DO NORTE-CE': { nome: 'Juazeiro do Norte', uf: 'CE', lat: -7.2131, lng: -39.3153, regiao: 'Nordeste' },
  'NATAL-RN': { nome: 'Natal', uf: 'RN', lat: -5.7945, lng: -35.211, regiao: 'Nordeste' },
  'MOSSORO-RN': { nome: 'Mossoró', uf: 'RN', lat: -5.1878, lng: -37.3442, regiao: 'Nordeste' },
  'JOAO PESSOA-PB': { nome: 'João Pessoa', uf: 'PB', lat: -7.1195, lng: -34.845, regiao: 'Nordeste' },
  'CAMPINA GRANDE-PB': { nome: 'Campina Grande', uf: 'PB', lat: -7.2219, lng: -35.8825, regiao: 'Nordeste' },
  'MACEIO-AL': { nome: 'Maceió', uf: 'AL', lat: -9.6658, lng: -35.735, regiao: 'Nordeste' },
  'ARACAJU-SE': { nome: 'Aracaju', uf: 'SE', lat: -10.9472, lng: -37.0731, regiao: 'Nordeste' },
  'TERESINA-PI': { nome: 'Teresina', uf: 'PI', lat: -5.092, lng: -42.8038, regiao: 'Nordeste' },
  'SAO LUIS-MA': { nome: 'São Luís', uf: 'MA', lat: -2.5307, lng: -44.3068, regiao: 'Nordeste' },
  'IMPERATRIZ-MA': { nome: 'Imperatriz', uf: 'MA', lat: -5.5266, lng: -47.4917, regiao: 'Nordeste' },

  // Centro-Oeste
  'BRASILIA-DF': { nome: 'Brasília', uf: 'DF', lat: -15.7975, lng: -47.8919, regiao: 'Centro-Oeste' },
  'GOIANIA-GO': { nome: 'Goiânia', uf: 'GO', lat: -16.6869, lng: -49.2648, regiao: 'Centro-Oeste' },
  'APARECIDA DE GOIANIA-GO': { nome: 'Aparecida de Goiânia', uf: 'GO', lat: -16.8228, lng: -49.2481, regiao: 'Centro-Oeste' },
  'ANAPOLIS-GO': { nome: 'Anápolis', uf: 'GO', lat: -16.3267, lng: -48.9533, regiao: 'Centro-Oeste' },
  'RIO VERDE-GO': { nome: 'Rio Verde', uf: 'GO', lat: -17.7922, lng: -50.9192, regiao: 'Centro-Oeste' },
  'CUIABA-MT': { nome: 'Cuiabá', uf: 'MT', lat: -15.6014, lng: -56.0979, regiao: 'Centro-Oeste' },
  'VARZEA GRANDE-MT': { nome: 'Várzea Grande', uf: 'MT', lat: -15.6469, lng: -56.1325, regiao: 'Centro-Oeste' },
  'RONDONOPOLIS-MT': { nome: 'Rondonópolis', uf: 'MT', lat: -16.4678, lng: -54.6361, regiao: 'Centro-Oeste' },
  'CAMPO GRANDE-MS': { nome: 'Campo Grande', uf: 'MS', lat: -20.4697, lng: -54.6201, regiao: 'Centro-Oeste' },
  'DOURADOS-MS': { nome: 'Dourados', uf: 'MS', lat: -22.2231, lng: -54.8117, regiao: 'Centro-Oeste' },

  // Norte
  'MANAUS-AM': { nome: 'Manaus', uf: 'AM', lat: -3.119, lng: -60.0217, regiao: 'Norte' },
  'BELEM-PA': { nome: 'Belém', uf: 'PA', lat: -1.4558, lng: -48.4902, regiao: 'Norte' },
  'ANANINDEUA-PA': { nome: 'Ananindeua', uf: 'PA', lat: -1.3639, lng: -48.3742, regiao: 'Norte' },
  'SANTAREM-PA': { nome: 'Santarém', uf: 'PA', lat: -2.4389, lng: -54.6997, regiao: 'Norte' },
  'PORTO VELHO-RO': { nome: 'Porto Velho', uf: 'RO', lat: -8.7619, lng: -63.9039, regiao: 'Norte' },
  'MACAPA-AP': { nome: 'Macapá', uf: 'AP', lat: 0.0389, lng: -51.0694, regiao: 'Norte' },
  'PALMAS-TO': { nome: 'Palmas', uf: 'TO', lat: -10.2491, lng: -48.3243, regiao: 'Norte' },
  'RIO BRANCO-AC': { nome: 'Rio Branco', uf: 'AC', lat: -9.9749, lng: -67.8243, regiao: 'Norte' },
  'BOA VISTA-RR': { nome: 'Boa Vista', uf: 'RR', lat: 2.8235, lng: -60.6758, regiao: 'Norte' }
};

// Coordenadas aproximadas dos centros dos estados (UF) caso o município não seja mapeado
const STATE_FALLBACK_COORDS: Record<string, { lat: number; lng: number; nome: string; regiao: CityGeoLocation['regiao'] }> = {
  SP: { lat: -23.5505, lng: -46.6333, nome: 'São Paulo', regiao: 'Sudeste' },
  RJ: { lat: -22.9068, lng: -43.1729, nome: 'Rio de Janeiro', regiao: 'Sudeste' },
  MG: { lat: -19.9167, lng: -43.9345, nome: 'Minas Gerais', regiao: 'Sudeste' },
  ES: { lat: -20.3155, lng: -40.3128, nome: 'Espírito Santo', regiao: 'Sudeste' },
  PR: { lat: -25.4284, lng: -49.2733, nome: 'Paraná', regiao: 'Sul' },
  SC: { lat: -27.5954, lng: -48.5480, nome: 'Santa Catarina', regiao: 'Sul' },
  RS: { lat: -30.0346, lng: -51.2177, nome: 'Rio Grande do Sul', regiao: 'Sul' },
  BA: { lat: -12.9714, lng: -38.5014, nome: 'Bahia', regiao: 'Nordeste' },
  PE: { lat: -8.0476, lng: -34.8770, nome: 'Pernambuco', regiao: 'Nordeste' },
  CE: { lat: -3.7172, lng: -38.5433, nome: 'Ceará', regiao: 'Nordeste' },
  RN: { lat: -5.7945, lng: -35.2110, nome: 'Rio Grande do Norte', regiao: 'Nordeste' },
  PB: { lat: -7.1195, lng: -34.8450, nome: 'Paraíba', regiao: 'Nordeste' },
  AL: { lat: -9.6658, lng: -35.7350, nome: 'Alagoas', regiao: 'Nordeste' },
  SE: { lat: -10.9472, lng: -37.0731, nome: 'Sergipe', regiao: 'Nordeste' },
  PI: { lat: -5.0920, lng: -42.8038, nome: 'Piauí', regiao: 'Nordeste' },
  MA: { lat: -2.5307, lng: -44.3068, nome: 'Maranhão', regiao: 'Nordeste' },
  DF: { lat: -15.7975, lng: -47.8919, nome: 'Distrito Federal', regiao: 'Centro-Oeste' },
  GO: { lat: -16.6869, lng: -49.2648, nome: 'Goiás', regiao: 'Centro-Oeste' },
  MT: { lat: -15.6014, lng: -56.0979, nome: 'Mato Grosso', regiao: 'Centro-Oeste' },
  MS: { lat: -20.4697, lng: -54.6201, nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste' },
  AM: { lat: -3.1190, lng: -60.0217, nome: 'Amazonas', regiao: 'Norte' },
  PA: { lat: -1.4558, lng: -48.4902, nome: 'Pará', regiao: 'Norte' },
  RO: { lat: -8.7619, lng: -63.9039, nome: 'Rondônia', regiao: 'Norte' },
  AP: { lat: 0.0389, lng: -51.0694, nome: 'Amapá', regiao: 'Norte' },
  TO: { lat: -10.2491, lng: -48.3243, nome: 'Tocantins', regiao: 'Norte' },
  AC: { lat: -9.9749, lng: -67.8243, nome: 'Acre', regiao: 'Norte' },
  RR: { lat: 2.8235, lng: -60.6758, nome: 'Roraima', regiao: 'Norte' }
};

export function normalizeCityName(cityName: string): string {
  if (!cityName) return '';
  return cityName
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve as coordenadas geográficas de uma cidade brasileira.
 * 1. Procura no catálogo pré-indexado (0ms)
 * 2. Se não encontrar, tenta consultar a API de Localidades/IBGE ou Nominatim com cache
 * 3. Se falhar, usa o centro do Estado (UF)
 */
export async function getCityCoordinates(municipioRaw: string, ufRaw: string): Promise<CityGeoLocation> {
  const uf = (ufRaw || 'SP').toUpperCase().trim();
  const normalizedCity = normalizeCityName(municipioRaw);
  const key = `${normalizedCity}-${uf}`;

  // 1. Catálogo instantâneo
  if (BRAZIL_CAPITALS_AND_HUBS[key]) {
    return BRAZIL_CAPITALS_AND_HUBS[key];
  }

  // 2. Cache Local no Browser
  const cacheKey = `geo_cache_${key}`;
  if (typeof window !== 'undefined' && window.localStorage) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
  }

  // 3. Consulta API do OpenStreetMap Nominatim / IBGE
  try {
    const query = encodeURIComponent(`${municipioRaw}, ${uf}, Brasil`);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
      headers: { 'Accept-Language': 'pt-BR' }
    });

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const stateInfo = STATE_FALLBACK_COORDS[uf] || { regiao: 'Sudeste' as const };
        const geoResult: CityGeoLocation = {
          nome: municipioRaw || item.display_name.split(',')[0],
          uf: uf,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          regiao: stateInfo.regiao
        };

        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(cacheKey, JSON.stringify(geoResult));
        }

        return geoResult;
      }
    }
  } catch (err) {
    // Silently fall back to state coordinates
  }

  // 4. Fallback por Estado
  const fallback = STATE_FALLBACK_COORDS[uf] || STATE_FALLBACK_COORDS['SP'];
  return {
    nome: municipioRaw || fallback.nome,
    uf: uf,
    lat: fallback.lat + (Math.random() - 0.5) * 0.15, // pequeno jitter para não sobrepor tudo no mesmo ponto exato
    lng: fallback.lng + (Math.random() - 0.5) * 0.15,
    regiao: fallback.regiao
  };
}

function parseMoney(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const clean = val.replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

/**
 * Agrupa faturas e calcula métricas consolidadas por cidade brasileira
 */
export async function groupInvoicesByCity(invoices: Invoice[]): Promise<CitySalesData[]> {
  const cityMap: Record<string, {
    nome: string;
    uf: string;
    notas: Invoice[];
    totalFaturamento: number;
    marketplaces: Record<string, number>;
    produtosMap: Record<string, number>;
  }> = {};

  for (const inv of invoices) {
    const mun = (inv.municipio || 'São Paulo').trim();
    const uf = (inv.uf || 'SP').trim().toUpperCase();
    const key = `${normalizeCityName(mun)}-${uf}`;

    if (!cityMap[key]) {
      cityMap[key] = {
        nome: mun,
        uf,
        notas: [],
        totalFaturamento: 0,
        marketplaces: {},
        produtosMap: {}
      };
    }

    const val = parseMoney(inv.valorNota);
    cityMap[key].notas.push(inv);
    cityMap[key].totalFaturamento += val;

    const orig = inv.origem || 'Outros';
    cityMap[key].marketplaces[orig] = (cityMap[key].marketplaces[orig] || 0) + 1;

    const prodDesc = (inv.descricao || 'Produto').trim();
    const qtd = parseInt(inv.quantidade || '1', 10) || 1;
    cityMap[key].produtosMap[prodDesc] = (cityMap[key].produtosMap[prodDesc] || 0) + qtd;
  }

  const result: CitySalesData[] = [];

  for (const key of Object.keys(cityMap)) {
    const item = cityMap[key];
    const geo = await getCityCoordinates(item.nome, item.uf);

    const produtosMaisVendidos = Object.keys(item.produtosMap)
      .map(desc => ({ descricao: desc, quantidade: item.produtosMap[desc] }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    const totalNotas = item.notas.length;
    const ticketMedio = totalNotas > 0 ? item.totalFaturamento / totalNotas : 0;

    result.push({
      ...geo,
      nome: item.nome,
      uf: item.uf,
      totalNotas,
      totalFaturamento: item.totalFaturamento,
      ticketMedio,
      marketplaces: item.marketplaces,
      produtosMaisVendidos,
      ultimasNotas: item.notas.slice(0, 10)
    });
  }

  return result.sort((a, b) => b.totalFaturamento - a.totalFaturamento);
}
