import { useEffect, useCallback, useRef } from 'react';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import * as proj from 'ol/proj';
import { queryWMSLayers, LayerConfig, ParcelData } from '../utils/mapQueryUtils';
import { MAP_CONFIG } from '../utils/mapConstants';

interface UseMapInteractionsParams {
    mapInstance: React.MutableRefObject<Map | null>;
    highlightLayer: React.MutableRefObject<VectorLayer<VectorSource> | null>;
    locationLayer: React.MutableRefObject<VectorLayer<VectorSource> | null>;
    measureModeRef: React.MutableRefObject<string | boolean>;
    wmsLayerGroup: React.MutableRefObject<any>;
    activeLayerIdRef: React.MutableRefObject<string | null>;
    availableLayersRef: React.MutableRefObject<any[]>;
    visibleLayerIdsRef: React.MutableRefObject<string[]>;
    onParcelFound: (parcelData: ParcelData, coordinate: number[]) => void;
    onMouseMove: (coord: number[]) => void;
    setIsQuerying: (value: boolean) => void;
}

export const useMapInteractions = ({
    mapInstance,
    highlightLayer,
    locationLayer,
    measureModeRef,
    wmsLayerGroup,
    activeLayerIdRef,
    availableLayersRef,
    visibleLayerIdsRef,
    onParcelFound,
    onMouseMove,
    setIsQuerying
}: UseMapInteractionsParams) => {
    const queryTimeoutRef = useRef<NodeJS.Timeout>();

    // Handle single click - query WMS features
    const handleMapClick = useCallback(async (evt: any) => {
        // Skip if in measure mode
        if (measureModeRef.current) return;

        const map = mapInstance.current;
        if (!map) return;

        const view = map.getView();
        const resolution = view.getResolution();
        const projection = view.getProjection();
        const currentOlLayers = wmsLayerGroup.current?.getLayers().getArray() || [];

        if (currentOlLayers.length === 0) return;

        // Build target layer list: active layer first, then visible layers
        const targetLayerIds: string[] = [];
        if (activeLayerIdRef.current) {
            targetLayerIds.push(activeLayerIdRef.current);
        }
        visibleLayerIdsRef.current.forEach(id => {
            if (id !== activeLayerIdRef.current) {
                targetLayerIds.push(id);
            }
        });

        setIsQuerying(true);
        highlightLayer.current?.getSource()?.clear();

        try {
            const result = await queryWMSLayers(
                currentOlLayers,
                targetLayerIds,
                evt.coordinate,
                resolution!,
                projection,
                availableLayersRef.current
            );

            if (result) {
                onParcelFound(result.parcelData, evt.coordinate);
            }
        } finally {
            setIsQuerying(false);
        }
    }, [mapInstance, measureModeRef, wmsLayerGroup, activeLayerIdRef, availableLayersRef, visibleLayerIdsRef, highlightLayer, onParcelFound, setIsQuerying]);

    // Handle pointer move - update coordinates
    const handlePointerMove = useCallback((evt: any) => {
        if (!evt.dragging) {
            const lonLat = proj.toLonLat(evt.coordinate);
            onMouseMove(lonLat);
        }
    }, [onMouseMove]);

    // Setup map interactions and events
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        // Add click handler
        map.on('singleclick', handleMapClick);
        map.on('pointermove', handlePointerMove);

        // Monitor rotation changes
        const handleRotationChange = () => {
            // Rotation changed - component will handle state update
        };
        map.getView().on('change:rotation', handleRotationChange);

        // Monitor zoom changes
        const handleZoomChange = () => {
            // Zoom changed - component will handle state update
        };
        map.getView().on('change:resolution', handleZoomChange);

        return () => {
            map.un('singleclick', handleMapClick);
            map.un('pointermove', handlePointerMove);
            map.getView().un('change:rotation', handleRotationChange);
            map.getView().un('change:resolution', handleZoomChange);

            if (queryTimeoutRef.current) {
                clearTimeout(queryTimeoutRef.current);
            }
        };
    }, [mapInstance, handleMapClick, handlePointerMove]);

    return {
        queryTimeoutRef
    };
};
