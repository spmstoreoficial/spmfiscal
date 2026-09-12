import { SP_MUNICIPALITIES } from '../data/spMunicipalities';
import { getMunicipioNameByIbge } from '../data/ibgeNamesMap';

export interface SPFeatureProperties {
  codarea?: string;
  codigoIbge?: string;
  name?: string;
  nome?: string;
  NM_MUN?: string;
  CD_MUN?: string;
  uf?: string;
  [key: string]: unknown;
}

export interface SPGeoJSON {
  type: string;
  features: Array<{
    type: string;
    properties: SPFeatureProperties;
    geometry: {
      type: string;
      coordinates: unknown;
    };
  }>;
}

export interface MapConnectionStatus {
  provider: 'IBGE_API' | 'GEODATA_BR' | 'DATAGEO_SP';
  providerName: string;
  status: 'connected' | 'connecting' | 'cached' | 'error';
  municipalitiesCount: number;
  lastSynced: string;
  url: string;
}

export const STORAGE_KEY_BRAZIL_GEOJSON = 'brazil_municipalities_geojson_v1';
export const STORAGE_KEY_GEOJSON = 'sp_municipalities_geojson_ibge_v1';

export const UF_CODE_TO_NAME: Record<string, { uf: string; nome: string }> = {
  '11': { uf: 'RO', nome: 'Rondônia' },
  '12': { uf: 'AC', nome: 'Acre' },
  '13': { uf: 'AM', nome: 'Amazonas' },
  '14': { uf: 'RR', nome: 'Roraima' },
  '15': { uf: 'PA', nome: 'Pará' },
  '16': { uf: 'AP', nome: 'Amapá' },
  '17': { uf: 'TO', nome: 'Tocantins' },
  '21': { uf: 'MA', nome: 'Maranhão' },
  '22': { uf: 'PI', nome: 'Piauí' },
  '23': { uf: 'CE', nome: 'Ceará' },
  '24': { uf: 'RN', nome: 'Rio Grande do Norte' },
  '25': { uf: 'PB', nome: 'Paraíba' },
  '26': { uf: 'PE', nome: 'Pernambuco' },
  '27': { uf: 'AL', nome: 'Alagoas' },
  '28': { uf: 'SE', nome: 'Sergipe' },
  '29': { uf: 'BA', nome: 'Bahia' },
  '31': { uf: 'MG', nome: 'Minas Gerais' },
  '32': { uf: 'ES', nome: 'Espírito Santo' },
  '33': { uf: 'RJ', nome: 'Rio de Janeiro' },
  '35': { uf: 'SP', nome: 'São Paulo' },
  '41': { uf: 'PR', nome: 'Paraná' },
  '42': { uf: 'SC', nome: 'Santa Catarina' },
  '43': { uf: 'RS', nome: 'Rio Grande do Sul' },
  '50': { uf: 'MS', nome: 'Mato Grosso do Sul' },
  '51': { uf: 'MT', nome: 'Mato Grosso' },
  '52': { uf: 'GO', nome: 'Goiás' },
  '53': { uf: 'DF', nome: 'Distrito Federal' }
};

/**
 * Provedor de Mapa Base OpenStreetMap Oficial 100% Gratuito
 */
export const BASE_TILE_PROVIDERS = {
  OSM_STANDARD: {
    id: 'osm',
    name: '🌐 OpenStreetMap Oficial',
    description: 'Cartografia colaborativa global completa e 100% gratuita',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    subdomains: 'abc',
    detectRetina: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
  }
};

/**
 * Normaliza propriedades do GeoJSON para garantir identificação precisa de cada município e UF do Brasil
 */
export function normalizeGeoJSONNames(geojson: SPGeoJSON): SPGeoJSON {
  if (!geojson || !Array.isArray(geojson.features)) return geojson;

  geojson.features.forEach(feature => {
    if (!feature.properties) {
      feature.properties = {};
    }

    const props = feature.properties;
    const rawId = (feature as any).id || (feature as any).ID || props.id || props.CD_MUN || props.CD_GEOCMU || props.codarea || props.codigoIbge || props.GEOCODIGO || '';
    const codArea = String(rawId).trim();
    let resolvedName = String(props.NM_MUN || props.NM_MUNICIP || props.nome || props.name || props.Nome || props.NOME || props.MUNICIPIO || '').trim();

    // Se o nome veio vazio ou genérico, resolve diretamente pelo código IBGE oficial
    if (!resolvedName || resolvedName.toLowerCase().includes('municipio')) {
      const nameFromCode = getMunicipioNameByIbge(codArea);
      if (nameFromCode) {
        resolvedName = nameFromCode;
      }
    }

    if (codArea) {
      props.codarea = codArea;
      props.codigoIbge = codArea;
      props.CD_MUN = codArea;

      // Descobre a UF pelo prefixo do código IBGE de 2 dígitos
      if (!props.uf && codArea.length >= 2) {
        const ufPrefix = codArea.substring(0, 2);
        if (UF_CODE_TO_NAME[ufPrefix]) {
          props.uf = UF_CODE_TO_NAME[ufPrefix].uf;
        }
      }

      if (!resolvedName) {
        const found = getMunicipioNameByIbge(codArea);
        if (found) resolvedName = found;
      }
    }

    if (resolvedName) {
      props.nome = resolvedName;
      props.name = resolvedName;
      props.NM_MUN = resolvedName;
    }
  });

  return geojson;
}

// Memory cache for all Brazil municipalities GeoJSON
let memoryBrazilGeoJson: SPGeoJSON | null = null;

/**
 * Baixa a malha dos 5.571 municípios de todo o Brasil (IBGE) com tolerância a falhas e cache
 */
export async function fetchBrazilMunicipalitiesGeoJSON(
  forceOnline = false
): Promise<{ data: SPGeoJSON | null; status: MapConnectionStatus }> {
  const connectionStatus: MapConnectionStatus = {
    provider: 'IBGE_API',
    providerName: 'IBGE Malhas Oficial (5.571 Municípios)',
    status: 'connecting',
    municipalitiesCount: 0,
    lastSynced: new Date().toLocaleTimeString('pt-BR'),
    url: 'https://servicodados.ibge.gov.br'
  };

  // 1. Cache em Memória
  if (!forceOnline && memoryBrazilGeoJson && memoryBrazilGeoJson.features.length > 5000) {
    connectionStatus.status = 'cached';
    connectionStatus.municipalitiesCount = memoryBrazilGeoJson.features.length;
    return { data: memoryBrazilGeoJson, status: connectionStatus };
  }

  // 2. Cache Local (Session / Local Storage)
  if (!forceOnline) {
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY_BRAZIL_GEOJSON);
      if (cached) {
        const parsed = JSON.parse(cached) as SPGeoJSON;
        if (parsed && Array.isArray(parsed.features) && parsed.features.length >= 5000) {
          const normalized = normalizeGeoJSONNames(parsed);
          memoryBrazilGeoJson = normalized;
          connectionStatus.status = 'cached';
          connectionStatus.municipalitiesCount = normalized.features.length;
          return { data: normalized, status: connectionStatus };
        }
      }
    } catch (err) {
      console.warn('Cache de malha Brasil não disponível:', err);
    }
  }

  // 3. Endpoints oficiais em ordem de velocidade e confiabilidade
  const endpoints = [
    'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-100-mun.json',
    'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio',
    'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-35-mun.json'
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json, application/vnd.geo+json'
        }
      });

      if (response.ok) {
        const data = (await response.json()) as SPGeoJSON;
        if (data && Array.isArray(data.features) && data.features.length >= 500) {
          const normalized = normalizeGeoJSONNames(data);
          memoryBrazilGeoJson = normalized;

          try {
            sessionStorage.setItem(STORAGE_KEY_BRAZIL_GEOJSON, JSON.stringify(normalized));
          } catch {}

          connectionStatus.status = 'connected';
          connectionStatus.municipalitiesCount = normalized.features.length;
          connectionStatus.url = url;
          return { data: normalized, status: connectionStatus };
        }
      }
    } catch (err) {
      console.warn(`Falha ao carregar malha de ${url}, tentando próximo provedor:`, err);
    }
  }

  connectionStatus.status = 'error';
  return { data: null, status: connectionStatus };
}

/**
 * Função retrocompatível que carrega a malha de municípios
 */
export async function fetchSPMunicipalitiesGeoJSON(
  forceOnline = false
): Promise<{ data: SPGeoJSON | null; status: MapConnectionStatus }> {
  return fetchBrazilMunicipalitiesGeoJSON(forceOnline);
}

// Memory cache for individual municipality polygons
const singleMunGeoJsonCache = new Map<string, any>();

/**
 * Baixa o polígono oficial exato da malha do município do IBGE (qualquer município do Brasil)
 */
export async function fetchMunicipalityPolygonIBGE(codigoIbge: string): Promise<any | null> {
  if (!codigoIbge) return null;
  const cleanCode = codigoIbge.trim();

  // 1. Memória
  if (singleMunGeoJsonCache.has(cleanCode)) {
    return singleMunGeoJsonCache.get(cleanCode);
  }

  // 2. LocalStorage Cache
  const storageKey = `mun_polygon_${cleanCode}`;
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      singleMunGeoJsonCache.set(cleanCode, parsed);
      return parsed;
    }
  } catch {}

  // 3. URLs oficiais do IBGE
  const urls = [
    `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${cleanCode}?formato=application/vnd.geo+json&qualidade=intermediaria`,
    `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${cleanCode}?formato=application/vnd.geo+json`,
    `https://servicodados.ibge.gov.br/api/v2/malhas/${cleanCode}?formato=application/vnd.geo+json`
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        headers: { Accept: 'application/json, application/vnd.geo+json' }
      });
      if (resp.ok) {
        const geojson = await resp.json();
        if (geojson && (geojson.type === 'Feature' || geojson.type === 'FeatureCollection' || geojson.type === 'GeometryCollection' || geojson.geometry || geojson.coordinates)) {
          singleMunGeoJsonCache.set(cleanCode, geojson);
          try {
            localStorage.setItem(storageKey, JSON.stringify(geojson));
          } catch {}
          return geojson;
        }
      }
    } catch {}
  }

  return null;
}
