import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  BellRing, 
  Navigation, 
  Radio, 
  Sparkles, 
  Layers, 
  Filter, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  Building2, 
  Search, 
  ArrowUpRight, 
  User as UserIcon, 
  Tag, 
  Package, 
  Calendar, 
  Compass, 
  SlidersHorizontal, 
  FileText,
  Maximize2,
  Minimize2,
  Tv,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../lib/api';
import { 
  CitySalesData, 
  SaleNotification, 
  OrderGeoItem,
  groupInvoicesByCity,
  getOrdersGeoLocations
} from '../lib/geoBrazil';

// Helper component to smoothly center/fly the map when an order or city is selected
function MapController({ center, zoom }: { center: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 10, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

interface BrazilSalesMapViewProps {
  invoices: Invoice[];
  latestExtractedInvoices?: Invoice[];
}

type MapTileStyle = 'dark' | 'street' | 'satellite';
type ViewMode = 'orders' | 'cities';

export const BrazilSalesMapView: React.FC<BrazilSalesMapViewProps> = ({ 
  invoices = [],
  latestExtractedInvoices = []
}) => {
  const [ordersData, setOrdersData] = useState<OrderGeoItem[]>([]);
  const [citiesData, setCitiesData] = useState<CitySalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection and Map state
  const [selectedOrder, setSelectedOrder] = useState<OrderGeoItem | null>(null);
  const [selectedCity, setSelectedCity] = useState<CitySalesData | null>(null);
  const [mapTarget, setMapTarget] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(4.5);
  const [viewMode, setViewMode] = useState<ViewMode>('orders');
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('dark');
  
  // TV / Fullscreen Expansion Mode
  const [isTvExpanded, setIsTvExpanded] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCor, setSelectedCor] = useState<string>('Todas');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('Todos');
  const [selectedUF, setSelectedUF] = useState<string>('Todos');
  const [selectedSKU, setSelectedSKU] = useState<string>('Todos');

  // Real-time sales ticker
  const [liveNotifications, setLiveNotifications] = useState<SaleNotification[]>([]);
  const [activeAlertItem, setActiveAlertItem] = useState<string | null>(null);

  // Load and geocode data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadOrders = async () => {
      let currentInvoices = invoices;
      if (!currentInvoices || currentInvoices.length === 0) {
        try {
          const res = await api.getInvoices();
          if (res && res.invoices && res.invoices.length > 0) {
            currentInvoices = res.invoices;
          }
        } catch (e) {
          console.error('Error fetching fallback invoices for map:', e);
        }
      }

      const orders = await getOrdersGeoLocations(currentInvoices || []);
      const cities = await groupInvoicesByCity(currentInvoices || []);

      if (isMounted) {
        setOrdersData(orders);
        setCitiesData(cities);
        setIsLoading(false);

        // Se houver novas notas extraídas, gerar notificações automáticas
        if (latestExtractedInvoices && latestExtractedInvoices.length > 0) {
          const newNotifs: SaleNotification[] = latestExtractedInvoices.slice(0, 10).map((inv, idx) => {
            const valClean = (inv.valorNota || '0').replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
            const valNum = parseFloat(valClean) || 0;
            const match = orders.find(o => o.fatura === inv.fatura || o.cliente === inv.nome);

            return {
              id: `notif-${Date.now()}-${idx}`,
              cidade: inv.municipio || 'São Paulo',
              uf: inv.uf || 'SP',
              valor: valNum,
              cliente: inv.nome || 'Consumidor Final',
              origem: inv.origem || 'Shopee',
              fatura: inv.fatura || 'N/A',
              timestamp: new Date().toLocaleTimeString('pt-BR'),
              lat: match ? match.lat : -23.5505,
              lng: match ? match.lng : -46.6333
            };
          });

          setLiveNotifications(newNotifs);
          if (newNotifs.length > 0) {
            setActiveAlertItem(newNotifs[0].cliente);
            setMapTarget([newNotifs[0].lat, newNotifs[0].lng]);
            setMapZoom(9);
          }
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [invoices, latestExtractedInvoices]);

  // Lista dinâmica de SKUs para o Mapa
  const uniqueSkus = useMemo(() => {
    const skus = new Set<string>();
    ordersData.forEach(ord => {
      if (ord.sku && ord.sku.trim()) {
        skus.add(ord.sku.trim());
      }
    });
    return Array.from(skus).sort();
  }, [ordersData]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return ordersData.filter(ord => {
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        ord.cliente.toLowerCase().includes(term) ||
        ord.endereco.toLowerCase().includes(term) ||
        ord.bairro.toLowerCase().includes(term) ||
        ord.cidade.toLowerCase().includes(term) ||
        ord.cep.includes(term) ||
        ord.documento.includes(term) ||
        ord.fatura.includes(term) ||
        ord.descricaoVerniz.toLowerCase().includes(term) ||
        ord.sku.toLowerCase().includes(term);

      const matchCor = selectedCor === 'Todas' || 
        ord.corVerniz.toLowerCase().includes(selectedCor.toLowerCase()) ||
        (selectedCor === 'Preto' && /preto/i.test(ord.corVerniz)) ||
        (selectedCor === 'Marrom' && /marrom/i.test(ord.corVerniz)) ||
        (selectedCor === 'Incolor' && /incolor/i.test(ord.corVerniz));

      const matchMarketplace = selectedMarketplace === 'Todos' || 
        ord.origem.toLowerCase().includes(selectedMarketplace.toLowerCase());

      const matchUF = selectedUF === 'Todos' || 
        ord.uf.trim().toUpperCase() === selectedUF.trim().toUpperCase();

      const matchSKU = selectedSKU === 'Todos' || 
        ord.sku.trim().toLowerCase() === selectedSKU.trim().toLowerCase();

      return matchSearch && matchCor && matchMarketplace && matchUF && matchSKU;
    });
  }, [ordersData, searchTerm, selectedCor, selectedMarketplace, selectedUF, selectedSKU]);

  // Filtered cities list
  const filteredCities = useMemo(() => {
    return citiesData.filter(city => {
      const term = searchTerm.toLowerCase();
      const matchSearch = city.nome.toLowerCase().includes(term) || city.uf.toLowerCase().includes(term);
      const matchMarketplace = selectedMarketplace === 'Todos' || (city.marketplaces[selectedMarketplace] && city.marketplaces[selectedMarketplace] > 0);
      const matchUF = selectedUF === 'Todos' || city.uf === selectedUF;
      return matchSearch && matchMarketplace && matchUF;
    });
  }, [citiesData, searchTerm, selectedMarketplace, selectedUF]);

  // Metrics
  const totalFaturamento = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + o.valor, 0);
  }, [filteredOrders]);

  const vernizPretoCount = useMemo(() => filteredOrders.filter(o => o.corVerniz.toLowerCase() === 'preto').length, [filteredOrders]);
  const vernizMarromCount = useMemo(() => filteredOrders.filter(o => o.corVerniz.toLowerCase() === 'marrom').length, [filteredOrders]);
  const vernizIncolorCount = useMemo(() => filteredOrders.filter(o => o.corVerniz.toLowerCase() === 'incolor').length, [filteredOrders]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleFocusOrder = (order: OrderGeoItem) => {
    setSelectedOrder(order);
    setActiveAlertItem(order.cliente);
    setMapTarget([order.lat, order.lng]);
    setMapZoom(12);
  };

  const handleFocusCity = (city: CitySalesData) => {
    setSelectedCity(city);
    setActiveAlertItem(city.nome);
    setMapTarget([city.lat, city.lng]);
    setMapZoom(10);
  };

  // Custom high-visibility marker icons for TV displays
  const createOrderMarkerIcon = (order: OrderGeoItem) => {
    const isSelected = selectedOrder?.id === order.id;
    const isAlertActive = activeAlertItem === order.cliente;
    const cor = order.corVerniz.toLowerCase();

    let colorBg = 'bg-slate-950 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
    let ringPulse = 'map-radar-pulse';
    let badgeText = 'Preto';
    let shortCode = 'P';

    if (cor === 'marrom') {
      colorBg = 'bg-amber-950 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]';
      ringPulse = 'map-radar-pulse';
      badgeText = 'Marrom';
      shortCode = 'M';
    } else if (cor === 'incolor') {
      colorBg = 'bg-sky-950 border-sky-400 text-sky-100 shadow-[0_0_15px_rgba(56,189,248,0.4)]';
      ringPulse = 'map-radar-pulse';
      badgeText = 'Incolor';
      shortCode = 'I';
    }

    return L.divIcon({
      className: 'custom-tv-order-pin',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isAlertActive || isSelected ? '<div class="map-radar-pulse-emerald"></div>' : '<div class="map-radar-pulse"></div>'}
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border-2 flex items-center justify-center font-mono font-extrabold text-xs sm:text-sm shadow-2xl transition-all duration-300 group-hover:scale-125 ${colorBg} ${isSelected ? 'scale-125 ring-4 ring-cyan-400' : ''}">
            <span>${shortCode}</span>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const createCityMarkerIcon = (city: CitySalesData) => {
    const isSelected = selectedCity?.nome === city.nome;
    return L.divIcon({
      className: 'custom-tv-city-pin',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-10 h-10 rounded-full bg-cyan-600 border-2 border-cyan-300 text-white font-mono font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-300 group-hover:scale-125 ${isSelected ? 'scale-125 ring-4 ring-cyan-400' : ''}">
            ${city.totalNotas}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header Card */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Tv className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Modo TV & Painel Cartográfico
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                100% Livre (Sem API Key)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Mapa do Brasil</span>
              <span className="text-cyan-400 font-mono">•</span>
              <span className="text-slate-200">Compradores de Verniz & Endereços</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Visualização ampliada de alta visibilidade para telas grandes e televisores. Acompanhe a rota de entrega de cada verniz vendido.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* View Mode Toggle: Orders vs Cities */}
            <div className="bg-[#020617] p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => setViewMode('orders')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'orders' 
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Por Pedido</span>
              </button>
              <button
                onClick={() => setViewMode('cities')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'cities' 
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Por Cidade</span>
              </button>
            </div>

            {/* Toggle TV Expanded Max Width */}
            <button
              onClick={() => setIsTvExpanded(prev => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                isTvExpanded 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Expandir área total do mapa para Modo TV"
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>{isTvExpanded ? 'Modo TV Max' : 'Expandir TV'}</span>
            </button>

            {/* Reset Zoom */}
            <button
              onClick={() => {
                setMapTarget([-14.235, -51.925]);
                setMapZoom(4.5);
                setSelectedOrder(null);
                setSelectedCity(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
              title="Resetar visão geral do Brasil"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Visão Brasil</span>
            </button>
          </div>
        </div>

        {/* Verniz Stats Badges (Large for TV) */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
          <div className="bg-[#020617] px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 shadow-inner">
            <span className="text-slate-400 font-medium">Total Pedidos:</span>
            <span className="font-mono font-black text-white text-base">{filteredOrders.length}</span>
          </div>

          <div className="bg-[#020617] px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 shadow-inner">
            <span className="w-3 h-3 rounded-full bg-slate-950 border-2 border-cyan-400"></span>
            <span className="text-slate-300 font-medium">Verniz Preto:</span>
            <span className="font-mono font-black text-cyan-400 text-base">{vernizPretoCount}</span>
          </div>

          <div className="bg-[#020617] px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 shadow-inner">
            <span className="w-3 h-3 rounded-full bg-amber-600 border border-amber-300"></span>
            <span className="text-slate-300 font-medium">Verniz Marrom:</span>
            <span className="font-mono font-black text-amber-400 text-base">{vernizMarromCount}</span>
          </div>

          <div className="bg-[#020617] px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 shadow-inner">
            <span className="w-3 h-3 rounded-full bg-sky-300 border border-sky-100"></span>
            <span className="text-slate-300 font-medium">Verniz Incolor:</span>
            <span className="font-mono font-black text-sky-300 text-base">{vernizIncolorCount}</span>
          </div>

          <div className="bg-[#020617] px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 ml-auto shadow-inner">
            <span className="text-slate-400 font-medium">Faturamento Total:</span>
            <span className="font-mono font-black text-emerald-400 text-base">{formatBRL(totalFaturamento)}</span>
          </div>
        </div>
      </div>

      {/* Main Map + Collapsible Side Drawer */}
      <div className={`grid gap-4 transition-all duration-300 ${isTvExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        
        {/* Map Container (Extended Height for TV) */}
        <div className={`bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl space-y-3 relative ${isTvExpanded ? 'w-full' : 'lg:col-span-2'}`}>
          
          {/* Controls Bar: Search, Cor, Marketplace, Map Layer Style */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Search Box */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar comprador, rua, bairro, CEP, NF ou código..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#020617] border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Cor do Verniz */}
              <select
                value={selectedCor}
                onChange={(e) => setSelectedCor(e.target.value)}
                className="py-1.5 px-3 text-xs sm:text-sm font-bold rounded-xl border border-slate-800 bg-[#020617] text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Todas">Todas as Cores</option>
                <option value="Preto">🖤 Preto</option>
                <option value="Marrom">🤎 Marrom</option>
                <option value="Incolor">💎 Incolor</option>
              </select>

              {/* Marketplace */}
              <select
                value={selectedMarketplace}
                onChange={(e) => setSelectedMarketplace(e.target.value)}
                className="py-1.5 px-3 text-xs sm:text-sm font-bold rounded-xl border border-slate-800 bg-[#020617] text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Todos">Todos os Canais</option>
                <option value="Shopee">Shopee</option>
                <option value="Mercado Livre">Mercado Livre</option>
                <option value="TikTok">TikTok</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>

              {/* SKU Filter no Mapa */}
              <select
                value={selectedSKU}
                onChange={(e) => setSelectedSKU(e.target.value)}
                className="py-1.5 px-3 text-xs sm:text-sm font-bold rounded-xl border border-slate-800 bg-[#020617] text-slate-200 focus:outline-none focus:border-cyan-500 font-mono max-w-[160px] truncate"
                title="Filtrar pedidos no mapa por Código SKU"
              >
                <option value="Todos">Todos os SKUs ({uniqueSkus.length})</option>
                {uniqueSkus.map(sku => (
                  <option key={sku} value={sku}>{sku}</option>
                ))}
              </select>

              {/* Map Style Selector (100% Free - 0 API Key) */}
              <div className="flex items-center gap-0.5 bg-[#020617] p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setTileStyle('dark')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    tileStyle === 'dark' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mapa Dark Pro (Esri Canvas)"
                >
                  Dark
                </button>
                <button
                  onClick={() => setTileStyle('street')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    tileStyle === 'street' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mapa de Ruas (OpenStreetMap)"
                >
                  Ruas
                </button>
                <button
                  onClick={() => setTileStyle('satellite')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    tileStyle === 'satellite' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Satélite de Alta Resolução (Esri Imagery)"
                >
                  Satélite
                </button>
              </div>

              {/* Drawer Toggle in TV mode */}
              {isTvExpanded && (
                <button
                  onClick={() => setIsDrawerOpen(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    isDrawerOpen 
                      ? 'bg-cyan-600 text-white border-cyan-500' 
                      : 'bg-[#020617] text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>{isDrawerOpen ? 'Ocultar Lista' : 'Ver Compradores'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Leaflet Map - MASSIVE HEIGHT FOR TV DISPLAYS (760px - 860px) */}
          <div className="w-full h-[680px] sm:h-[760px] lg:h-[820px] 2xl:h-[880px] rounded-2xl overflow-hidden relative border border-slate-800 bg-[#020617] shadow-inner">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                <p className="text-sm font-mono text-cyan-300">Geolocalizando endereços e pedidos de verniz no Brasil...</p>
              </div>
            ) : (
              <MapContainer
                center={[-14.235, -51.925]}
                zoom={4.5}
                minZoom={3.5}
                maxZoom={18}
                scrollWheelZoom={true}
                className="w-full h-full"
              >
                <MapController center={mapTarget} zoom={mapZoom} />

                {/* 100% Free Public Tile Layers (ZERO API KEYS REQUIRED) */}
                {tileStyle === 'dark' && (
                  <>
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    />
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                    />
                  </>
                )}

                {tileStyle === 'street' && (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                )}

                {tileStyle === 'satellite' && (
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                )}

                {/* View Mode: Individual Orders */}
                {viewMode === 'orders' && filteredOrders.map((order, idx) => (
                  <Marker
                    key={order.id || `ord-marker-${idx}`}
                    position={[
                      Number.isFinite(order.lat) ? order.lat : -23.5505,
                      Number.isFinite(order.lng) ? order.lng : -46.6333
                    ]}
                    icon={createOrderMarkerIcon(order)}
                    eventHandlers={{
                      click: () => handleFocusOrder(order)
                    }}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-4 min-w-[280px] sm:min-w-[320px] text-slate-100 font-sans space-y-3">
                        
                        {/* Header with NF and Marketplace */}
                        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                          <span className="font-mono font-black text-sm text-cyan-400 tracking-wider">
                            NF #{order.fatura}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 uppercase">
                            {order.origem}
                          </span>
                        </div>

                        {/* Customer / Buyer */}
                        <div>
                          <span className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-cyan-400" /> Quem Comprou:
                          </span>
                          <p className="font-extrabold text-base text-white mt-0.5">{order.cliente}</p>
                          {order.documento && (
                            <p className="text-xs font-mono text-slate-400 mt-0.5">CPF/CNPJ: {order.documento}</p>
                          )}
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-[#020617] p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                          <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Endereço de Entrega:
                          </span>
                          <p className="text-slate-100 font-semibold text-sm">{order.endereco}</p>
                          <p className="text-slate-400">Bairro: {order.bairro} | CEP: {order.cep}</p>
                          <p className="font-black text-cyan-300 text-sm mt-0.5">{order.cidade} - {order.uf}</p>
                        </div>

                        {/* Varnish Details */}
                        <div className="bg-[#020617] p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                          <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-amber-400" /> Verniz Adquirido:
                          </span>
                          <p className="text-white font-bold text-sm truncate">{order.descricaoVerniz}</p>
                          
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Cor:</span>
                              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                order.corVerniz.toLowerCase() === 'preto' ? 'bg-slate-950 text-white border border-slate-700' :
                                order.corVerniz.toLowerCase() === 'marrom' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                                order.corVerniz.toLowerCase() === 'incolor' ? 'bg-sky-950 text-sky-200 border border-sky-700' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {order.corVerniz}
                              </span>
                            </div>
                            <span className="font-mono text-slate-200 font-bold">Qtd: {order.quantidade} un</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-400">Valor Final:</span>
                            <span className="font-mono font-black text-emerald-400 text-sm">
                              {formatBRL(order.valor)}
                            </span>
                          </div>
                        </div>

                        {order.dataSaida && (
                          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Data de Emissão: {order.dataSaida}
                          </div>
                        )}

                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* View Mode: Grouped Cities */}
                {viewMode === 'cities' && filteredCities.map((city, idx) => (
                  <Marker
                    key={`city-${city.nome}-${city.uf}-${idx}`}
                    position={[
                      Number.isFinite(city.lat) ? city.lat : -23.5505,
                      Number.isFinite(city.lng) ? city.lng : -46.6333
                    ]}
                    icon={createCityMarkerIcon(city)}
                    eventHandlers={{
                      click: () => handleFocusCity(city)
                    }}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-4 min-w-[240px] text-slate-100 font-sans space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                          <span className="font-extrabold text-base text-cyan-400">{city.nome} - {city.uf}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {city.regiao}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Faturado:</span>
                            <span className="font-mono font-black text-emerald-400 text-sm">{formatBRL(city.totalFaturamento)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Notas de Verniz:</span>
                            <span className="font-mono font-bold text-white text-sm">{city.totalNotas}</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              </MapContainer>
            )}

            {/* Floating Side Panel Overlay in TV mode */}
            {isTvExpanded && isDrawerOpen && (
              <div className="absolute top-4 right-4 z-[500] w-80 sm:w-96 max-h-[calc(100%-2rem)] bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-right-4">
                
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-white text-sm">
                      {viewMode === 'orders' ? 'Compradores de Verniz' : 'Cidades'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold bg-[#020617] px-2 py-0.5 rounded border border-slate-800">
                      {viewMode === 'orders' ? `${filteredOrders.length} Pedidos` : `${filteredCities.length} Cidades`}
                    </span>
                    <button 
                      onClick={() => setIsDrawerOpen(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Orders Cards List */}
                <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[560px]">
                  {filteredOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    const cor = order.corVerniz.toLowerCase();

                    return (
                      <div
                        key={order.id}
                        onClick={() => handleFocusOrder(order)}
                        className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/20'
                            : 'bg-[#020617]/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-xs">
                          <span className="font-mono font-bold text-cyan-400">NF #{order.fatura}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold uppercase text-[10px] border border-slate-700">
                            {order.origem}
                          </span>
                        </div>

                        <div>
                          <span className="text-xs sm:text-sm font-bold text-white block truncate">{order.cliente}</span>
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{order.endereco} - {order.bairro} ({order.cidade}/{order.uf})</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cor === 'preto' ? 'bg-slate-900 text-white border border-slate-700' :
                            cor === 'marrom' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                            cor === 'incolor' ? 'bg-sky-950 text-sky-200 border border-sky-700' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            Verniz {order.corVerniz}
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {formatBRL(order.valor)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Clique para focar no mapa</span>
                  <span className="text-cyan-400 font-mono font-bold">100% Interativo</span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Normal Grid Side Drawer (when NOT in TV Expanded Max Width) */}
        {!isTvExpanded && (
          <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-white text-sm">
                    {viewMode === 'orders' ? 'Compradores de Verniz' : 'Ranking de Cidades'}
                  </h3>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold bg-[#020617] px-2 py-0.5 rounded border border-slate-800">
                  {viewMode === 'orders' ? `${filteredOrders.length} Pedidos` : `${filteredCities.length} Cidades`}
                </span>
              </div>

              {/* Orders Cards List */}
              <div className="space-y-2 mt-3 max-h-[700px] overflow-y-auto pr-1">
                {filteredOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  const cor = order.corVerniz.toLowerCase();

                  return (
                    <div
                      key={order.id}
                      onClick={() => handleFocusOrder(order)}
                      className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/20'
                          : 'bg-[#020617] border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-xs">
                        <span className="font-mono font-bold text-cyan-400">NF #{order.fatura}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase text-[10px] border border-slate-700">
                          {order.origem}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs sm:text-sm font-bold text-white block truncate">{order.cliente}</span>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{order.endereco} - {order.bairro} ({order.cidade}/{order.uf})</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cor === 'preto' ? 'bg-slate-900 text-white border border-slate-700' :
                          cor === 'marrom' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                          cor === 'incolor' ? 'bg-sky-950 text-sky-200 border border-sky-700' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          Verniz {order.corVerniz}
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatBRL(order.valor)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Clique para focar no mapa</span>
              <span className="text-cyan-400 font-mono font-bold">100% Interativo</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
