/**
 * Serviço de Integração Oficial com a API de Localidades do IBGE
 * Carrega e indexa todos os 5.571 municípios do Brasil em memória e localStorage.
 */

export interface IBGEMunicipio {
  id: number;
  nome: string;
  uf: string;
  ufNome?: string;
  regiao?: string;
  normalized?: string;
}

const IBGE_CACHE_KEY = 'spm_ibge_municipios_cache_v1';
let memoryCache: IBGEMunicipio[] | null = null;
let isFetching = false;
let fetchPromise: Promise<IBGEMunicipio[]> | null = null;

export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Carrega todos os municípios do Brasil
 * 1. Memória RAM (0ms)
 * 2. LocalStorage (1ms)
 * 3. Endpoint Local /api/ibge/municipios
 * 4. Fallback: API Oficial do IBGE (https://servicodados.ibge.gov.br/api/v1/localidades/municipios)
 */
export async function loadAllIBGEMunicipios(): Promise<IBGEMunicipio[]> {
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  // 1. Tentar ler do LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const cached = localStorage.getItem(IBGE_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 5000) {
          memoryCache = parsed;
          return parsed;
        }
      } catch (e) {}
    }
  }

  fetchPromise = (async () => {
    isFetching = true;
    try {
      // 2. Tentar Endpoint Interno
      const localRes = await fetch('/api/ibge/municipios');
      if (localRes.ok) {
        const data = await localRes.json();
        if (data.municipios && data.municipios.length > 0) {
          const formatted: IBGEMunicipio[] = data.municipios.map((m: any) => ({
            id: m.id,
            nome: m.nome,
            uf: m.uf,
            ufNome: m.ufNome || '',
            regiao: m.regiao || 'Sudeste',
            normalized: normalizeText(`${m.nome} ${m.uf}`)
          }));

          memoryCache = formatted;
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localStorage.setItem(IBGE_CACHE_KEY, JSON.stringify(formatted));
            } catch (e) {}
          }
          return formatted;
        }
      }

      // 3. Tentar API Oficial do IBGE
      const ibgeRes = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
      if (ibgeRes.ok) {
        const rawData = await ibgeRes.json();
        const formatted: IBGEMunicipio[] = rawData.map((m: any) => ({
          id: m.id,
          nome: m.nome,
          uf: m.microrregiao?.mesorregiao?.UF?.sigla || m['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla || 'SP',
          ufNome: m.microrregiao?.mesorregiao?.UF?.nome || '',
          regiao: m.microrregiao?.mesorregiao?.UF?.regiao?.nome || 'Sudeste',
          normalized: normalizeText(`${m.nome} ${m.microrregiao?.mesorregiao?.UF?.sigla || ''}`)
        }));

        memoryCache = formatted;
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem(IBGE_CACHE_KEY, JSON.stringify(formatted));
          } catch (e) {}
        }
        return formatted;
      }
    } catch (err) {
      console.warn('Falha ao carregar IBGE API:', err);
    } finally {
      isFetching = false;
      fetchPromise = null;
    }

    return memoryCache || [];
  })();

  return fetchPromise;
}

/**
 * Busca municípios por nome e opcionalmente UF
 */
export async function searchIBGEMunicipios(
  term: string, 
  uf?: string, 
  limit = 40
): Promise<IBGEMunicipio[]> {
  const all = await loadAllIBGEMunicipios();
  if (!all || all.length === 0) return [];

  const normTerm = normalizeText(term);
  const targetUf = uf && uf !== 'Todos' ? uf.toUpperCase().trim() : null;

  let filtered = all;
  if (targetUf) {
    filtered = filtered.filter(m => m.uf.toUpperCase() === targetUf);
  }

  if (!normTerm) {
    return filtered.slice(0, limit);
  }

  return filtered
    .filter(m => {
      const matchName = m.normalized ? m.normalized.includes(normTerm) : normalizeText(m.nome).includes(normTerm);
      return matchName;
    })
    .slice(0, limit);
}

/**
 * Encontra um município exato ou aproximado
 */
export async function findIBGEMunicipio(nome: string, uf?: string): Promise<IBGEMunicipio | null> {
  const all = await loadAllIBGEMunicipios();
  if (!all || all.length === 0) return null;

  const normNome = normalizeText(nome);
  const targetUf = uf ? uf.toUpperCase().trim() : null;

  // Busca exata com UF
  const exact = all.find(m => 
    normalizeText(m.nome) === normNome && (!targetUf || m.uf.toUpperCase() === targetUf)
  );
  if (exact) return exact;

  // Busca aproximada
  const partial = all.find(m => 
    (normalizeText(m.nome).startsWith(normNome) || normNome.startsWith(normalizeText(m.nome))) &&
    (!targetUf || m.uf.toUpperCase() === targetUf)
  );

  return partial || null;
}
