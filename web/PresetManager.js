
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
        name: "Both_2_Head",
        config: {
            nback: 2,
            nbackType: NBACK_TYPES.HEAD,
            type: PRESET_TYPES.BOTH
        }
    },
    {
        name: "Both_3_Torso",
        config: {
            nback: 3,
            nbackType: NBACK_TYPES.TORSO,
            type: PRESET_TYPES.BOTH
        }
    },
    {
        name: "Both_3_Hand",
        config: {
            nback: 4,
            nbackType: NBACK_TYPES.HAND,
            type: PRESET_TYPES.BOTH
        }
    },
    
];

export const getPresetConfigByName = (name) => {
    return PRESETS.find(preset => preset.name === name);
}
