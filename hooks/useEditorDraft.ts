import { useRef, useCallback } from 'react';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import { isEmpty as isExtentEmpty } from 'ol/extent';
import Map from 'ol/Map';

const DRAFT_KEY = 'editor_draft_v1';

export function useEditorDraft(
    editSource: React.MutableRefObject<VectorSource>,
    mapInstance: React.MutableRefObject<Map | null>,
    onFeaturesLoaded: () => void
) {
    const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const saveDraft = useCallback(() => {
        if (editSource.current.getFeatures().length === 0) return;
        const format = new GeoJSON();
        const geojson = format.writeFeaturesObject(editSource.current.getFeatures(), {
            dataProjection: 'EPSG:3857',
            featureProjection: 'EPSG:3857'
        });
        localStorage.setItem(DRAFT_KEY, JSON.stringify(geojson));
    }, []);

    const clearDraft = useCallback(() => {
        localStorage.removeItem(DRAFT_KEY);
    }, []);

    const loadDraft = useCallback(() => {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return false;
        try {
            const parsed = JSON.parse(raw);
            const format = new GeoJSON();
            const features = format.readFeatures(parsed, {
                dataProjection: 'EPSG:3857',
                featureProjection: 'EPSG:3857'
            }) as Feature[];
            if (features.length > 0) {
                editSource.current.clear();
                editSource.current.addFeatures(features);
                const extent = editSource.current.getExtent();
                if (extent && !isExtentEmpty(extent)) {
                    mapInstance.current?.getView().fit(extent, { padding: [100, 100, 100, 100], duration: 600 });
                }
                onFeaturesLoaded();
                return true;
            }
        } catch {
            localStorage.removeItem(DRAFT_KEY);
        }
        return false;
    }, [editSource, mapInstance, onFeaturesLoaded]);

    const startAutoSave = useCallback((handler: () => void) => {
        if (autoSaveTimerRef.current) {
            clearInterval(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setInterval(handler, 5000);
    }, []);

    const stopAutoSave = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearInterval(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
    }, []);

    return {
        DRAFT_KEY,
        autoSaveTimerRef,
        saveDraft,
        clearDraft,
        loadDraft,
        startAutoSave,
        stopAutoSave
    };
}
