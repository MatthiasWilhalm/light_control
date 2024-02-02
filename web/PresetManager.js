
export const INIT_CONFIG = {
    pathMode: 8, // 8 or 24
    participantId: "0",
};

export const NBACK_TYPES = {
    HEAD: "head",
    TORSO: "torso",
    HAND: "hand"
};

export const PRESET_TYPES = {
    NBACK_ONLY: "nbackonly",
    WALKING_ONLY: "walkingonly",
    BOTH: "both"
};

export const INIT_PRESET = {
    name: "Default Config",
    config: {
        nback: 1,
        nbackType: NBACK_TYPES.HEAD,
        type: PRESET_TYPES.BOTH
    }
};


export const PRESETS = [
    {
        name: "Config 1",
        config: {
            nback: 2,
            nbackType: NBACK_TYPES.HEAD,
            type: PRESET_TYPES.BOTH
        }
    }
];

export const getPresetConfigByName = (name) => {
    return PRESETS.find(preset => preset.name === name);
}
