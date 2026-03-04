import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getModel } from '@/lib/llm';
import { Asset, AssetPrompt, getTypeLabel } from '@/lib/types';

const SYSTEM_PROMPT = `你是一位经验丰富的影视美术专家，擅长为AI图像生成工具（如Midjourney、Stable Diffusion）撰写中文提示词。

你的任务：
1. 根据剧本的整体风格、时代背景、美术调性，生成一段统一的【美学风格描述】，适用于所有资产。
2. 为每个资产的每个图片规格，生成完整的中文提示词，结构为：
   [资产外观描述], [美学风格描述], [规格控制描述]

【美学风格描述要求】
- 包含：画面风格（写实/概念/插画等）、视觉调性（色调/光影）、制作品质关键词
- 约50-80字

【资产外观描述要求】
- 基于资产的briefDescription展开，丰富视觉细节
- 人物：详细描述面部特征、发型、服装材质颜色、身材比例、姿态气质
- 场景：描述空间结构、主要建筑/陈设、光线来源、氛围色调、细节纹理
- 道具：描述形状、材质、颜色、磨损程度、特殊细节

【规格控制描述要求】
- 直接从specs数组中的description字段获取
- 例如：正面面部特写，纯白背景，4K超清，高细节

【输出格式】
返回纯JSON（不要markdown代码块）：
{
  "styleDescription": "写实风格，影视级制作品质，精细光线渲染...",
  "prompts": [
    {
      "assetId": "C001",
      "specName": "正面面部特写",
      "appearance": "...外观描述...",
      "style": "...（同styleDescription）...",
      "spec": "正面面部特写，纯白背景，4K超清，高细节",
      "fullPrompt": "...appearance..., ...style..., ...spec..."
    }
  ]
}`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { scriptText, assets } = body as { scriptText: string; assets: Asset[] };

        if (!scriptText || !assets?.length) {
            return NextResponse.json({ error: 'scriptText and assets are required' }, { status: 400 });
        }

        // Build asset summary for LLM
        const assetSummary = assets.map(a => ({
            id: a.id,
            name: a.name,
            type: getTypeLabel(a.type),
            briefDescription: a.briefDescription,
            isVariant: a.isVariant,
            variantLabel: a.variantLabel,
            specs: a.specs.map(s => ({ name: s.name, description: s.description })),
        }));

        const truncatedScript = scriptText.slice(0, 30000);
        const client = getOpenAIClient();
        const model = getModel();

        const completion = await client.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `剧本概要（前30000字）：\n${truncatedScript}\n\n资产列表：\n${JSON.stringify(assetSummary, null, 2)}\n\n请生成美学风格描述和所有资产的所有规格提示词。`,
                },
            ],
            temperature: 0.5,
            max_tokens: 65536,
        });

        const raw = completion.choices[0]?.message?.content ?? '';
        const jsonStr = raw.replace(/^```(?:json)?\n?/m, '').replace(/```\s*$/m, '').trim();

        let parsed: { styleDescription: string; prompts: AssetPrompt[] };
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            return NextResponse.json({ error: 'LLM returned invalid JSON', raw }, { status: 502 });
        }

        return NextResponse.json(parsed);
    } catch (err: unknown) {
        console.error('[agent2]', err);
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
