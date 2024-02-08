
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
    // Walking only
    {
        name: "A_Walking_only",
        id: "A",
        config: {
            nback: 1,
            nbackType: NBACK_TYPES.HEAD,
            type: PRESET_TYPES.WALKING_ONLY
        }
    },
    // Nback only
    // nback 1
    {
        name: "B_Nback_only_1_Head",
        id: "B",
        config: {
            nback: 1,
            nbackType: NBACK_TYPES.HEAD,
            type: PRESET_TYPES.NBACK_ONLY
        }
    },
    {
        name: "C_Nback_only_1_Hand",
        id: "C",
        config: {
            nback: 1,
            nbackType: NBACK_TYPES.HAND,
            type: PRESET_TYPES.NBACK_ONLY
        }
    },
    {
        name: "D_Nback_only_1_Torso",
        id: "D",
        config: {
            nback: 1,
            nbackType: NBACK_TYPES.TORSO,
            type: PRESET_TYPES.NBACK_ONLY
        }
    },
    // nback 2
    {
        name: "E_Nback_only_2_Head",
        id: "E",
        config: {
            nback: 2,
            nbackType: NBACK_TYPES.HEAD,
            type: PRESET_TYPES.NBACK_ONLY
        }
    },
    {
        name: "F_Nback_only_2_Hand",
        id: "F",
        config: {
            nback: 2,
            nbackType: NBACK_TYPES.HAND,
            type: PRESET_TYPES.NBACK_ONLY
        }
    },
    {
        name: "G_Nback_only_2_Torso",
        id: "G",
        config: {
            nback: 2,
            nbackType: NBACK_TYPES.TORSO,
            type: PRESET_TYPES.NBACK_ONLY
        }
    },
    // Both
    // nback 1
    {
        name: "H_Both_1_Head",
        id: "H",
        config: {
            nback: 1,
            nbackType: NBACK_TYPES.HEAD,
            type: PRESET_TYPES.BOTH
        }
    },
    {
        name: "I_Both_1_Hand",
        id: "I",
        config: {
            nback: 1,
            nbackType: NBACK_TYPES.HAND,
            type: PRESET_TYPES.BOTH
        }
    },
    {
        name: "J_Both_1_Torso",
        id: "J",
        config: {
            nback: 1,
            nbackType: NBACK_TYPES.TORSO,
            type: PRESET_TYPES.BOTH
        }
    },
    // nback 2
    {
        name: "K_Both_2_Head",
        id: "K",
        config: {
            nback: 2,
            nbackType: NBACK_TYPES.HEAD,
            type: PRESET_TYPES.BOTH
        }
    },
    {
        name: "L_Both_2_Hand",
        id: "L",
        config: {
            nback: 2,
            nbackType: NBACK_TYPES.HAND,
            type: PRESET_TYPES.BOTH
        }
    },
    {
        name: "M_Both_2_Torso",
        id: "M",
        config: {
            nback: 2,
            nbackType: NBACK_TYPES.TORSO,
            type: PRESET_TYPES.BOTH
        }
    }
    
];

export const getPresetConfigByName = (name) => {
    return PRESETS.find(preset => preset.name === name);
}
