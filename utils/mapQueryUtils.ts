import TileLayer from 'ol/layer/Tile';
import { Projection } from 'ol/proj';
import { MAP_CONFIG, MAP_FEATURE_FORMAT } from './mapConstants';

export interface LayerConfig {
    id: string;
    type?: string;
    category?: string;
    layers: string;
}

export interface ParcelData {
    id: string;
    gid: number;
    geometry: any;
    properties: Record<string, any>;
}

/**
 * Query WMS layer for features at a given coordinate
 * Only queries STANDARD layers (skips PLANNING and XYZ)
 */
export const queryWMSFeature = async (
    olLayer: TileLayer<any>,
    coordinate: number[],
    resolution: number,
    projection: Projection,
    config: LayerConfig
): Promise<ParcelData | null> => {
    try {
        const source = olLayer.getSource();
        if (!source || !source.getFeatureInfoUrl) {
            return null;
        }

        const url = source.getFeatureInfoUrl(coordinate, resolution, projection, {
            'INFO_FORMAT': MAP_FEATURE_FORMAT.INFO_FORMAT,
            'FEATURE_COUNT': MAP_CONFIG.FEATURE_COUNT
        });

        if (!url) {
            return null;
        }

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`WMS query failed for layer ${config.id}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (data.features?.length > 0) {
            const feature = data.features[0];
            const tableName = config.layers.includes(':') 
                ? config.layers.split(':').pop() 
                : config.layers;

            return {
                id: feature.id,
                gid: feature.properties.gid || parseInt(feature.id.split('.').pop() || '0'),
                geometry: feature.geometry,
                properties: { ...feature.properties, tableName }
            };
        }

        return null;
    } catch (error) {
        console.error(`Error querying WMS layer ${config.id}:`, error);
        return null;
    }
};

/**
 * Query multiple WMS layers in priority order (active layer first, then visible layers)
 */
export const queryWMSLayers = async (
    currentOlLayers: any[],
    targetLayerIds: string[],
    coordinateLatLng: number[],
    resolution: number,
    projection: Projection,
    availableLayers: LayerConfig[]
): Promise<{ parcelData: ParcelData; layerId: string } | null> => {
    for (const layerId of targetLayerIds) {
        const config = availableLayers.find(c => c.id === layerId);

        // Skip PLANNING layers and XYZ sources
        if (!config || config.type === 'XYZ' || config.category === 'PLANNING') {
            continue;
        }

        const olLayer = currentOlLayers.find(l => l.get('layerId') === layerId) as TileLayer<any>;
        if (!olLayer) {
            continue;
        }

        const parcelData = await queryWMSFeature(olLayer, coordinateLatLng, resolution, projection, config);
        if (parcelData) {
            return { parcelData, layerId };
        }
    }

    return null;
};
