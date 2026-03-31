// Map configuration constants
export const MAP_CONFIG = {
    DEFAULT_CENTER: [106.619, 11.284] as const,
    DEFAULT_ZOOM: 13,
    MIN_ZOOM: 5,
    MAX_ZOOM: 22,
    SEARCH_ZOOM: 18,
    ANIMATION_DURATION: 1000,
    FEATURE_COUNT: 1,
    POPUP_ANIMATION_DURATION: 250
};

export const MAP_FEATURE_FORMAT = {
    INFO_FORMAT: 'application/json'
} as const;
