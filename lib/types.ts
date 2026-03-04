// =============================================
// Shared TypeScript types for Script to Assets
// =============================================

export type AssetType = 'character' | 'scene' | 'prop';

export type ImageSpec = {
    name: string;        // e.g. "正面面部特写"
    ratio: string;       // e.g. "3:4"
    description: string; // e.g. "面部特写，白色背景，4K超清"
};

export type AssetVariant = {
    variantLabel: string;       // e.g. "换装后"
    description: string;        // brief description of this variant
};

export type Asset = {
    id: string;                  // e.g. "C001"
    name: string;
    type: AssetType;
    briefDescription: string;   // one-sentence appearance/environment description
    episodes: string;            // e.g. "第1-5集" or "全集"
    importance: number;          // 1–5
    isVariant: boolean;
    variantLabel?: string;       // e.g. "战损形态"
    parentId?: string;           // parent asset id if this is a variant
    specs: ImageSpec[];          // image specs for this asset type
};

export type AssetPrompt = {
    assetId: string;
    specName: string;
    appearance: string;
    style: string;
    spec: string;
    fullPrompt: string;
};

export type Agent1Response = {
    assets: Asset[];
};

export type Agent2Response = {
    styleDescription: string;
    prompts: AssetPrompt[];
};

// ---- Image spec definitions per asset type ----
export const CHARACTER_SPECS: ImageSpec[] = [
    { name: '正面面部特写', ratio: '3:4', description: '正面面部特写，纯白背景，4K超清，高细节' },
    { name: '全身正面', ratio: '9:16', description: '全身正面站立，纯白背景，4K超清' },
    { name: '三视图', ratio: '16:9', description: '正面、侧面、背面三视图排列，设计参考图，纯白背景' },
];

export const SCENE_SPECS: ImageSpec[] = [
    { name: '氛围图', ratio: '21:9', description: '超宽幅电影构图，氛围概念图，电影级色调' },
    { name: '鸟瞰空间关系图', ratio: '16:9', description: '鸟瞰视角，空间布局关系图，建筑平面感' },
    { name: '表演场景图', ratio: '16:9', description: '人视角，表演空间，叙事感镜头' },
];

export const PROP_SPECS: ImageSpec[] = [
    { name: '道具图', ratio: '1:1', description: '产品级道具展示，纯白背景，正面45度视角，4K超清' },
];

export function getSpecsForType(type: AssetType): ImageSpec[] {
    switch (type) {
        case 'character': return CHARACTER_SPECS;
        case 'scene': return SCENE_SPECS;
        case 'prop': return PROP_SPECS;
    }
}

export function getTypeLabel(type: AssetType): string {
    switch (type) {
        case 'character': return '人物';
        case 'scene': return '场景';
        case 'prop': return '道具';
    }
}

export function getTypePrefix(type: AssetType): string {
    switch (type) {
        case 'character': return 'C';
        case 'scene': return 'S';
        case 'prop': return 'P';
    }
}

export function starsString(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
}
