import { useRef, useCallback, useState } from 'react';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';

interface HistorySnapshot {
    serialized: string;
    selectedIndex: number;
}

export function useEditorHistory(editSource: React.MutableRefObject<VectorSource>, selectedFeature: Feature | null) {
    const historyStackRef = useRef<HistorySnapshot[]>([]);
    const historyIndexRef = useRef(-1);
    const isRestoringHistoryRef = useRef(false);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const updateHistoryFlags = useCallback(() => {
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
    }, []);

    const pushHistorySnapshot = useCallback(() => {
        if (isRestoringHistoryRef.current) return;

        const format = new GeoJSON();
        const features = editSource.current.getFeatures();
        const serialized = JSON.stringify(
            format.writeFeaturesObject(features, {
                dataProjection: 'EPSG:3857',
                featureProjection: 'EPSG:3857'
            })
        );

        const selectedIndex = selectedFeature ? features.indexOf(selectedFeature) : -1;
        const currentSnapshot = historyStackRef.current[historyIndexRef.current];
        if (currentSnapshot && currentSnapshot.serialized === serialized && currentSnapshot.selectedIndex === selectedIndex) {
            return;
        }

        if (historyIndexRef.current < historyStackRef.current.length - 1) {
            historyStackRef.current = historyStackRef.current.slice(0, historyIndexRef.current + 1);
        }

        historyStackRef.current.push({ serialized, selectedIndex });
        if (historyStackRef.current.length > 100) {
            historyStackRef.current.shift();
        }
        historyIndexRef.current = historyStackRef.current.length - 1;
        updateHistoryFlags();
    }, [selectedFeature, editSource, updateHistoryFlags]);

    const restoreHistorySnapshot = useCallback((snapshot: HistorySnapshot) => {
        isRestoringHistoryRef.current = true;
        try {
            editSource.current.clear();
            const format = new GeoJSON();
            const parsed = JSON.parse(snapshot.serialized);
            const features = format.readFeatures(parsed, {
                dataProjection: 'EPSG:3857',
                featureProjection: 'EPSG:3857'
            });
            editSource.current.addFeatures(features);
        } finally {
            isRestoringHistoryRef.current = false;
        }
    }, [editSource]);

    const handleUndo = useCallback(() => {
        if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
            restoreHistorySnapshot(historyStackRef.current[historyIndexRef.current]);
            updateHistoryFlags();
        }
    }, [restoreHistorySnapshot, updateHistoryFlags]);

    const handleRedo = useCallback(() => {
        if (historyIndexRef.current < historyStackRef.current.length - 1) {
            historyIndexRef.current++;
            restoreHistorySnapshot(historyStackRef.current[historyIndexRef.current]);
            updateHistoryFlags();
        }
    }, [restoreHistorySnapshot, updateHistoryFlags]);

    return {
        historyStackRef,
        historyIndexRef,
        isRestoringHistoryRef,
        canUndo,
        canRedo,
        updateHistoryFlags,
        pushHistorySnapshot,
        restoreHistorySnapshot,
        handleUndo,
        handleRedo
    };
}
