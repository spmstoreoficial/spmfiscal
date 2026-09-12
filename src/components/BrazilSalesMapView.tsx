import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Invoice } from '../types';
import {
  fetchBrazilMunicipalitiesGeoJSON,
  SPGeoJSON,
  BASE_TILE_PROVIDERS,
  MapConnectionStatus
} from '../services/spGeoJsonService';
import { SP_MUNICIPALITIES, findMunicipioUniversal, searchMunicipalities } from '../data/spMunicipalities';
import { MunicipioDetailModal } from './MunicipioDetailModal';
import {
  Layers,
  Globe,
  Search,
  Building2,
  MapPin,
  Check
} from 'lucide-react';

// Fix for default Leaflet marker icon URLs
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface BrazilSalesMapViewProps {
  invoices: Invoice[];
  latestExtractedInvoices?: Invoice[];
  onSelectCity?: (cityName: string) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
  isTVMode?: boolean;
}

export const BrazilSalesMapView: React.FC<BrazilSalesMapViewProps> = ({
  invoices,
  onSelectCity,
  onSelectInvoice,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // States
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showGeoJsonBorders, setShowGeoJsonBorders] = useState(true);
  const [showSalesMarkers, setShowSalesMarkers] = useState(true);

  // Data & Selection
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [detailModalCity, setDetailModalCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingGeoJSON, setIsLoadingGeoJSON] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState<SPGeoJSON | null>(null);
  const [connStatus, setConnStatus] = useState<MapConnectionStatus>({
    provider: 'IBGE_API',
    providerName: 'IBGE Malhas Oficial (5.571 Municípios)',
    status: 'connecting',
    municipalitiesCount: 5571,
    lastSynced: new Date().toLocaleTimeString('pt-BR'),
    url: 'https://servicodados.ibge.gov.br'
  });

  // Calculate city sales aggregates
  const citySalesMap: Record<string, { totalNotas: number; totalFaturamento: number; invoices: Invoice[]; uf: string }> = useMemo(() => {
    const map: Record<string, { totalNotas: number; totalFaturamento: number; invoices: Invoice[]; uf: string }> = {};
    invoices.forEach(inv => {
      const c = (inv.municipio || 'São Paulo').trim();
      const norm = c.toLowerCase();
      if (!map[norm]) {
        map[norm] = { totalNotas: 0, totalFaturamento: 0, invoices: [], uf: inv.uf || 'SP' };
      }
      map[norm].totalNotas += 1;
      const valClean = (inv.valorNota || '0').replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
      map[norm].totalFaturamento += parseFloat(valClean) || 0;
      map[norm].invoices.push(inv);
    });
    return map;
  }, [invoices]);

  const totalFaturamento = useMemo(() => {
    return Object.values(citySalesMap).reduce((acc, c) => acc + c.totalFaturamento, 0);
  }, [citySalesMap]);

  const totalCidadesComVendas = Object.keys(citySalesMap).length;

  const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // 1. Initialize OpenStreetMap
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-14.235, -51.925], // Centro do Brasil
      zoom: 4.5,
      minZoom: 3.5,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false
    });

    // Custom Zoom Controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Single Standard Base Layer: OpenStreetMap Oficial
    const tileConfig = BASE_TILE_PROVIDERS.OSM_STANDARD;
    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      attribution: tileConfig.attribution
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Prevent any tooltips from sticking during pans, drags, or zooms
    map.on('movestart zoomstart', () => {
      map.eachLayer((l: any) => {
        if (typeof l.closeTooltip === 'function') {
          l.closeTooltip();
        }
      });
    });

    // Load IBGE GeoJSON Polygons for all 5,571 municipalities in Brazil
    setIsLoadingGeoJSON(true);
    fetchBrazilMunicipalitiesGeoJSON()
      .then(res => {
        if (res.data) {
          setGeoJsonData(res.data);
        }
        setConnStatus(res.status || {
          provider: 'IBGE_API',
          providerName: 'IBGE Malhas Oficial (5.571 Municípios)',
          status: 'connected',
          municipalitiesCount: res.data?.features?.length || 5571,
          lastSynced: new Date().toLocaleTimeString('pt-BR'),
          url: 'https://servicodados.ibge.gov.br'
        });
      })
      .catch(() => {
        setConnStatus(prev => ({ ...prev, status: 'cached' }));
      })
      .finally(() => {
        setIsLoadingGeoJSON(false);
      });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render IBGE Polygons for all 5,571 municipalities of Brazil
  useEffect(() => {
    if (!mapInstanceRef.current || !geoJsonData) return;
    const map = mapInstanceRef.current;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    if (!showGeoJsonBorders) return;

    const layer = L.geoJSON(geoJsonData as any, {
      style: (feature) => {
        const name = (feature?.properties?.name || feature?.properties?.nome || feature?.properties?.NM_MUN || '').toLowerCase();
        const sales = citySalesMap[name];
        const hasSales = Boolean(sales && sales.totalNotas > 0);

        return {
          fill: false,
          fillOpacity: 0,
          color: hasSales ? '#0284c7' : '#64748b',
          weight: hasSales ? 2 : 0.65,
          opacity: hasSales ? 0.9 : 0.45,
          dashArray: hasSales ? undefined : '2, 3'
        };
      },
      onEachFeature: (feature, layer) => {
        const name = feature?.properties?.name || feature?.properties?.nome || feature?.properties?.NM_MUN || 'Município';
        const uf = feature?.properties?.uf || '';
        const norm = name.toLowerCase();
        const sales = citySalesMap[norm];

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 2.5,
              color: '#0284c7',
              fill: true,
              fillColor: '#38bdf8',
              fillOpacity: 0.15
            });
            if (typeof l.openTooltip === 'function') {
              l.openTooltip();
            }
          },
          mouseout: (e) => {
            const l = e.target;
            if (geoJsonLayerRef.current) {
              geoJsonLayerRef.current.resetStyle(l);
            }
            if (typeof l.closeTooltip === 'function') {
              l.closeTooltip();
            }
          },
          click: (e) => {
            const l = e.target;
            if (typeof l.closeTooltip === 'function') {
              l.closeTooltip();
            }
            setSelectedCityName(name);
            setDetailModalCity(name);
            if (onSelectCity) onSelectCity(name);
          }
        });

        // Tooltip with municipality info and sales drilldown
        layer.bindTooltip(`
          <div class="font-sans text-xs p-1">
            <div class="flex items-center gap-1.5 border-b border-slate-700 pb-1 mb-1">
              <strong class="text-cyan-400 font-bold">${name}</strong>
              ${uf ? `<span class="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">${uf}</span>` : ''}
            </div>
            ${sales ? `<div class="text-emerald-400 font-bold font-mono">${formatBRL(sales.totalFaturamento)}</div><div class="text-slate-300 text-[10px]">${sales.totalNotas} notas fiscais emitidas</div>` : '<span class="text-slate-400 text-[10px]">Sem notas registradas</span>'}
          </div>
        `, { sticky: true, direction: 'auto', opacity: 0.95, className: 'custom-leaflet-tooltip' });
      }
    }).addTo(map);

    geoJsonLayerRef.current = layer;
  }, [geoJsonData, showGeoJsonBorders, citySalesMap, onSelectCity]);

  // 3. Render Sales Markers on Cities with Radar Beacons
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    if (!showSalesMarkers) return;

    Object.entries(citySalesMap).forEach(([normCity, data]) => {
      const cityMeta = findMunicipioUniversal(normCity) || SP_MUNICIPALITIES.find(m => m.nome.toLowerCase() === normCity);
      if (!cityMeta) return;

      const size = Math.min(Math.max(data.totalNotas * 5 + 20, 26), 46);

      const icon = L.divIcon({
        className: 'custom-sales-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="radar-ping-primary" style="width: ${size + 14}px; height: ${size + 14}px;"></div>
            <div class="w-[${size}px] h-[${size}px] rounded-full bg-cyan-600 border-2 border-white shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center justify-center font-extrabold text-white text-[11px] font-mono group-hover:scale-110 transition-transform" style="width: ${size}px; height: ${size}px;">
              ${data.totalNotas}
            </div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const marker = L.marker([cityMeta.lat, cityMeta.lng], { icon });

      marker.on('click', () => {
        if (marker.closeTooltip) marker.closeTooltip();
        setSelectedCityName(cityMeta.nome);
        setDetailModalCity(cityMeta.nome);
        if (onSelectCity) onSelectCity(cityMeta.nome);
      });

      marker.on('mouseout', () => {
        if (marker.closeTooltip) marker.closeTooltip();
      });

      marker.bindTooltip(`
        <div class="p-1.5 text-xs text-slate-100 font-sans">
          <div class="font-extrabold text-cyan-400 border-b border-slate-700 pb-1 mb-1">
            ${cityMeta.nome} - ${cityMeta.uf}
          </div>
          <div class="text-emerald-400 font-mono font-bold">${formatBRL(data.totalFaturamento)}</div>
          <div class="text-slate-300 text-[10px]">${data.totalNotas} notas fiscais emitidas</div>
        </div>
      `, { className: 'custom-leaflet-tooltip' });

      markersGroup.addLayer(marker);
    });
  }, [citySalesMap, showSalesMarkers, onSelectCity]);

  // Autocomplete search across all 5,571 municipalities in Brazil
  const handleSearchChange = (term: string) => {
    setSearchQuery(term);
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results = searchMunicipalities(term, 8);
    setSearchResults(results);
  };

  const handleSelectSearchResult = (mun: any) => {
    setSearchQuery(mun.nome);
    setIsSearching(false);
    setSelectedCityName(mun.nome);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([mun.lat, mun.lng], 11, { duration: 1.5 });
    }
  };

  const handleFlyToRegion = (region: 'brasil' | 'sp' | 'sul' | 'nordeste' | 'centro_oeste' | 'norte') => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (region === 'brasil') map.flyTo([-14.235, -51.925], 4.5, { duration: 1.5 });
    else if (region === 'sp') map.flyTo([-23.5505, -46.6333], 7.5, { duration: 1.5 });
    else if (region === 'sul') map.flyTo([-27.5954, -48.548], 6.5, { duration: 1.5 });
    else if (region === 'nordeste') map.flyTo([-12.9777, -38.5016], 6, { duration: 1.5 });
    else if (region === 'centro_oeste') map.flyTo([-15.7801, -47.9292], 6, { duration: 1.5 });
    else if (region === 'norte') map.flyTo([-3.119, -60.0217], 5.5, { duration: 1.5 });
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl bg-[#020617] font-sans">
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left: Search & Quick Region Bar */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2 pointer-events-auto">
        
        {/* Search Bar */}
        <div className="relative w-64 sm:w-80">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Buscar entre 5.571 municípios do Brasil (IBGE)..."
              className="w-full bg-[#0b1329]/95 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:border-cyan-500 text-xs outline-none shadow-2xl backdrop-blur placeholder-slate-400"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0b1329] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden z-50 text-xs max-h-56 overflow-y-auto">
              {searchResults.map(m => (
                <button
                  key={`${m.codigoIbge || m.nome}-${m.uf}`}
                  onClick={() => handleSelectSearchResult(m)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between border-b border-slate-800/60 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold">{m.nome}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {m.uf}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    IBGE: {m.codigoIbge || '-'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Region Pills */}
        <div className="flex items-center gap-1 bg-[#0b1329]/90 p-1 rounded-xl border border-slate-800 shadow-2xl backdrop-blur text-xs flex-wrap">
          <button
            onClick={() => handleFlyToRegion('brasil')}
            className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold hover:bg-cyan-900 transition"
          >
            🇧🇷 Brasil Todo
          </button>
          <button
            onClick={() => handleFlyToRegion('sp')}
            className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white font-bold hover:bg-slate-800 transition"
          >
            SP (645 Mun)
          </button>
          <button
            onClick={() => handleFlyToRegion('sul')}
            className="px-2 py-1 rounded-lg text-emerald-400 hover:text-emerald-300 font-bold hover:bg-slate-800 transition"
          >
            Sul
          </button>
          <button
            onClick={() => handleFlyToRegion('nordeste')}
            className="px-2 py-1 rounded-lg text-amber-400 hover:text-amber-300 font-bold hover:bg-slate-800 transition"
          >
            Nordeste
          </button>
          <button
            onClick={() => handleFlyToRegion('centro_oeste')}
            className="px-2 py-1 rounded-lg text-purple-400 hover:text-purple-300 font-bold hover:bg-slate-800 transition"
          >
            Centro-Oeste
          </button>
          <button
            onClick={() => handleFlyToRegion('norte')}
            className="px-2 py-1 rounded-lg text-teal-400 hover:text-teal-300 font-bold hover:bg-slate-800 transition"
          >
            Norte
          </button>
        </div>

      </div>

      {/* Top Right: Layer Switcher & Map Stats Badge */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2 pointer-events-auto">
        
        {/* IBGE & Sales Status Pill */}
        <div className="hidden md:flex items-center gap-2 bg-[#0b1329]/95 border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-cyan-300 font-mono font-bold">{totalCidadesComVendas} Cidades com Vendas</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-mono font-extrabold">{formatBRL(totalFaturamento)}</span>
        </div>

        {/* Layers Button */}
        <div className="relative">
          <button
            onClick={() => setShowLayersMenu(!showLayersMenu)}
            className="p-2 rounded-xl bg-[#0b1329]/95 border border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-white shadow-2xl backdrop-blur flex items-center gap-1.5 text-xs font-bold transition"
            title="Camadas Vetoriais"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Camadas</span>
          </button>

          {/* Layer Controls Dropdown */}
          {showLayersMenu && (
            <div className="absolute top-full right-0 mt-1 bg-[#0b1329] border border-cyan-500/40 rounded-xl shadow-2xl p-3 w-64 z-50 text-xs space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Base Cartográfica
                </span>
                <span className="text-[11px] text-cyan-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" /> OpenStreetMap
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Camadas Vetoriais (IBGE):
                </span>
                
                <label className="flex items-center justify-between px-2.5 py-2 text-slate-200 cursor-pointer hover:bg-slate-800/80 rounded-lg border border-slate-800 transition">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Malha IBGE (5.571 Mun)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showGeoJsonBorders}
                    onChange={e => setShowGeoJsonBorders(e.target.checked)}
                    className="rounded accent-cyan-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between px-2.5 py-2 text-slate-200 cursor-pointer hover:bg-slate-800/80 rounded-lg border border-slate-800 transition">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Marcadores de Vendas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSalesMarkers}
                    onChange={e => setShowSalesMarkers(e.target.checked)}
                    className="rounded accent-cyan-500 w-4 h-4"
                  />
                </label>
              </div>

              {isLoadingGeoJSON && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-cyan-300 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Carregando malha do Brasil...
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Left: IBGE Connection & Sync Pill */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2 pointer-events-none">
        <div className="bg-[#0b1329]/90 border border-slate-800 px-2.5 py-1 rounded-lg shadow-xl backdrop-blur text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-cyan-400" />
          <span>IBGE Malhas Oficial • 5.571 Municípios Conectados • OpenStreetMap</span>
        </div>
      </div>

      {/* Municipality Detail Modal (DRILLDOWN FOR ANY CITY IN BRAZIL) */}
      <MunicipioDetailModal
        isOpen={Boolean(detailModalCity)}
        onClose={() => setDetailModalCity(null)}
        cityName={detailModalCity}
        invoices={invoices}
        onSelectInvoice={inv => onSelectInvoice && onSelectInvoice(inv)}
      />

    </div>
  );
};
