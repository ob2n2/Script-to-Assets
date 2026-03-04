import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getModel } from '@/lib/llm';
import { Asset, AssetType, getSpecsForType, getTypePrefix } from '@/lib/types';

const SYSTEM_PROMPT = `你是一位专业的影视美术资产统筹，精通剧本分析。
你的任务是阅读用户提供的剧本，按照人物、场景、道具在剧本中**首次出场的顺序**，梳理所有主要美术资产。

【输出规则】
1. 所有资产分为三类：character（人物）、scene（场景）、prop（道具）
2. 若某资产在剧情中有外观变化（换装、损毁、特殊状态等），在该资产后增加一个variant条目，isVariant=true
3. briefDescription：一句话，描述该资产的外貌（人物需含年龄/体型/着装/气质；场景需含表演空间大小/周围环境细节；道具需含材质/颜色/大小）
4. episodes：写出现的集数范围，如"第1-3集"或"全集出现"
5. importance：1-5整数，5为主要角色/核心场景
6. 编号规则：人物C001起，场景S001起，道具P001起，变体在父编号后加-A、-B

【输出格式】
返回纯JSON，结构如下（不要添加markdown代码块标记）：
{
  "assets": [
    {
      "id": "C001",
      "name": "李明",
      "type": "character",
      "briefDescription": "30岁男性，身材高挑，身着现代都市商务正装，眼神锐利，气质沉稳",
      "episodes": "全集",
      "importance": 5,
      "isVariant": false
    },
    {
      "id": "C001-A",
      "name": "李明（受伤后）",
      "type": "character",
      "briefDescription": "同C001，但身着破损衬衫，面部有伤口，蓬乱头发，疲惫憔悴",
      "episodes": "第8-10集",
      "importance": 4,
      "isVariant": true,
      "variantLabel": "受伤形态",
      "parentId": "C001"
    }
  ]
}`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { scriptText } = body;

        if (!scriptText || typeof scriptText !== 'string') {
            return NextResponse.json({ error: 'scriptText is required' }, { status: 400 });
        }

        const truncated = scriptText.slice(0, 800000); // ~1M token context window max
        const client = getOpenAIClient();
        const model = getModel();

        const completion = await client.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `以下是剧本内容，请进行资产梳理：\n\n${truncated}` },
            ],
            temperature: 0.3,
            max_tokens: 65536,
        });

        const raw = completion.choices[0]?.message?.content ?? '';

        // Strip possible markdown code fences
        const jsonStr = raw.replace(/^```(?:json)?\n?/m, '').replace(/```\s*$/m, '').trim();

        let parsed: { assets: Partial<Asset>[] };
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            return NextResponse.json({ error: 'LLM returned invalid JSON', raw }, { status: 502 });
        }

        // Enrich assets with specs
        const assets: Asset[] = (parsed.assets || []).map((a) => {
            const type: AssetType = (a.type as AssetType) || 'prop';
            // Regenerate a clean ID if missing
            const id = a.id || `${getTypePrefix(type)}${String(Math.random()).slice(2, 5)}`;
            return {
                ...a,
                id,
                type,
                name: a.name || '未命名',
                briefDescription: a.briefDescription || '',
                episodes: a.episodes || '未知',
                importance: Math.min(5, Math.max(1, a.importance || 3)),
                isVariant: a.isVariant || false,
                specs: getSpecsForType(type),
            } as Asset;
        });

        return NextResponse.json({ assets });
    } catch (err: unknown) {
        console.error('[agent1]', err);
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
