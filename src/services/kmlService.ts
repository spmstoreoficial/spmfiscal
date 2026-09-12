/**
 * KML and GeoJSON parser service to handle custom layers exported from Google Maps,
 * Google Earth, QGIS, or Geopandas.
 */

export interface CustomLayerFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  properties: {
    name: string;
    description: string;
    color?: string;
    strokeColor?: string;
    fillColor?: string;
    [key: string]: any;
  };
}

export interface CustomLayerData {
  id: string;
  name: string;
  filename: string;
  type: 'kml' | 'geojson';
  features: CustomLayerFeature[];
  visible: boolean;
  opacity: number;
  color?: string;
  importedAt: string;
}

export const STORAGE_KEY_CUSTOM_LAYERS = 'sp_painel_custom_kml_layers_v1';

/**
 * Parses a KML XML string into a list of GeoJSON features
 */
export function parseKMLToGeoJSON(kmlText: string, layerName = 'Camada Google Maps'): CustomLayerData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, 'text/xml');

  const placemarks = xmlDoc.querySelectorAll('Placemark');
  const features: CustomLayerFeature[] = [];

  placemarks.forEach((pm, index) => {
    const name = pm.querySelector('name')?.textContent?.trim() || `Ponto ${index + 1}`;
    const description = pm.querySelector('description')?.textContent?.trim() || '';

    // 1. Point
    const point = pm.querySelector('Point coordinates');
    if (point && point.textContent) {
      const coords = point.textContent.trim().split(',');
      if (coords.length >= 2) {
        const lng = parseFloat(coords[0].trim());
        const lat = parseFloat(coords[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            properties: {
              name,
              description
            }
          });
        }
      }
    }

    // 2. LineString
    const lineString = pm.querySelector('LineString coordinates');
    if (lineString && lineString.textContent) {
      const rawCoords = lineString.textContent.trim().split(/\s+/);
      const coords: [number, number][] = [];
      rawCoords.forEach(pair => {
        const parts = pair.split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parts[0].trim());
          const lat = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            coords.push([lng, lat]);
          }
        }
      });
      if (coords.length > 0) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coords
          },
          properties: {
            name,
            description
          }
        });
      }
    }

    // 3. Polygon
    const polygon = pm.querySelector('Polygon outerBoundaryIs LinearRing coordinates') ||
                    pm.querySelector('Polygon coordinates');
    if (polygon && polygon.textContent) {
      const rawCoords = polygon.textContent.trim().split(/\s+/);
      const coords: [number, number][] = [];
      rawCoords.forEach(pair => {
        const parts = pair.split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parts[0].trim());
          const lat = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            coords.push([lng, lat]);
          }
        }
      });
      if (coords.length > 0) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coords]
          },
          properties: {
            name,
            description
          }
        });
      }
    }
  });

  return {
    id: `layer-${Date.now()}`,
    name: layerName,
    filename: `${layerName}.kml`,
    type: 'kml',
    features,
    visible: true,
    opacity: 0.75,
    color: '#06b6d4',
    importedAt: new Date().toLocaleTimeString('pt-BR')
  };
}

/**
 * Parses a GeoJSON string directly into a CustomLayerData object
 */
export function parseGeoJSONToCustomLayer(jsonText: string, layerName = 'Camada GeoJSON'): CustomLayerData {
  const parsed = JSON.parse(jsonText);
  const rawFeatures = parsed.features || (parsed.type === 'Feature' ? [parsed] : []);

  const features: CustomLayerFeature[] = rawFeatures.map((f: any, idx: number) => ({
    type: 'Feature',
    geometry: f.geometry,
    properties: {
      name: f.properties?.name || f.properties?.nome || f.properties?.NM_MUN || f.properties?.Name || `Elemento ${idx + 1}`,
      description: f.properties?.description || f.properties?.descricao || f.properties?.Description || JSON.stringify(f.properties || {}),
      ...f.properties
    }
  }));

  return {
    id: `layer-${Date.now()}`,
    name: layerName,
    filename: `${layerName}.geojson`,
    type: 'geojson',
    features,
    visible: true,
    opacity: 0.75,
    color: '#3b82f6',
    importedAt: new Date().toLocaleTimeString('pt-BR')
  };
}
