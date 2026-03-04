import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { Asset, AssetPrompt, getTypeLabel, starsString } from '@/lib/types';

const HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF111111' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
    color: { argb: 'FFFFFFFF' },
    bold: true,
    size: 11,
};

const BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF2a2a2a' } },
    left: { style: 'thin', color: { argb: 'FF2a2a2a' } },
    bottom: { style: 'thin', color: { argb: 'FF2a2a2a' } },
    right: { style: 'thin', color: { argb: 'FF2a2a2a' } },
};

const TYPE_COLORS: Record<string, string> = {
    character: 'FF1e3a6e',
    scene: 'FF0c3d44',
    prop: 'FF3d2c06',
};

const TYPE_TEXT: Record<string, string> = {
    character: 'FF3b82f6',
    scene: 'FF06b6d4',
    prop: 'FFf59e0b',
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { assets, prompts, styleDescription } = body as {
            assets: Asset[];
            prompts: AssetPrompt[];
            styleDescription: string;
        };

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Script to Assets';
        workbook.created = new Date();

        // ======================================
        // Sheet 1: Assets
        // ======================================
        const assetSheet = workbook.addWorksheet('资产清单', {
            properties: { tabColor: { argb: 'FF3b82f6' } },
            views: [{ state: 'frozen', ySplit: 1 }],
        });

        assetSheet.columns = [
            { header: '编号', key: 'id', width: 12 },
            { header: '类型', key: 'type', width: 10 },
            { header: '名称', key: 'name', width: 18 },
            { header: '变体标签', key: 'variantLabel', width: 14 },
            { header: '简要介绍', key: 'description', width: 50 },
            { header: '出场集数', key: 'episodes', width: 14 },
            { header: '重要程度', key: 'importance', width: 12 },
            { header: '图片规格（名称 | 比例）', key: 'specs', width: 36 },
        ];

        // Style header row
        const headerRow = assetSheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = HEADER_FILL;
            cell.font = HEADER_FONT;
            cell.border = BORDER;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        headerRow.height = 28;

        for (const asset of assets) {
            const row = assetSheet.addRow({
                id: asset.id,
                type: getTypeLabel(asset.type),
                name: asset.name,
                variantLabel: asset.variantLabel || '',
                description: asset.briefDescription,
                episodes: asset.episodes,
                importance: starsString(asset.importance),
                specs: asset.specs.map(s => `${s.name} | ${s.ratio}`).join('\n'),
            });

            const bgColor = asset.isVariant ? 'FF1a1a1a' : (TYPE_COLORS[asset.type] || 'FF111111');
            const textColor = TYPE_TEXT[asset.type] || 'FFaaaaaa';

            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.border = BORDER;
                cell.alignment = { vertical: 'middle', wrapText: true };
                cell.font = { color: { argb: 'FFdddddd' }, size: 10 };
            });

            // Colorize ID and type cells
            const idCell = row.getCell('id');
            idCell.font = { color: { argb: textColor }, bold: true, size: 10 };
            const typeCell = row.getCell('type');
            typeCell.font = { color: { argb: textColor }, size: 10 };

            row.height = Math.max(30, asset.specs.length * 18);
        }

        // ======================================
        // Sheet 2: Prompts
        // ======================================
        const promptSheet = workbook.addWorksheet('提示词', {
            properties: { tabColor: { argb: 'FFec4899' } },
            views: [{ state: 'frozen', ySplit: 2 }],
        });

        if (styleDescription) {
            const styleRow = promptSheet.addRow(['【统一美学风格描述】', styleDescription]);
            styleRow.eachCell((cell, colNum) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1004' } };
                cell.font = colNum === 1
                    ? { color: { argb: 'FFf59e0b' }, bold: true, size: 10 }
                    : { color: { argb: 'FFdddddd' }, size: 10 };
                cell.alignment = { wrapText: true, vertical: 'middle' };
                cell.border = BORDER;
            });
            styleRow.height = 40;
            promptSheet.mergeCells(`B1:H1`);
        }

        promptSheet.columns = [
            { header: '编号', key: 'assetId', width: 12 },
            { header: '资产名称', key: 'assetName', width: 18 },
            { header: '类型', key: 'assetType', width: 10 },
            { header: '图片规格', key: 'specName', width: 16 },
            { header: '比例', key: 'ratio', width: 8 },
            { header: '资产外观描述', key: 'appearance', width: 45 },
            { header: '美学风格描述', key: 'style', width: 40 },
            { header: '规格控制描述', key: 'spec', width: 28 },
            { header: '完整提示词', key: 'fullPrompt', width: 60 },
        ];

        const pHeaderRow = promptSheet.getRow(promptSheet.rowCount);
        pHeaderRow.eachCell((cell) => {
            cell.fill = HEADER_FILL;
            cell.font = HEADER_FONT;
            cell.border = BORDER;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        pHeaderRow.height = 28;

        // Build asset lookup
        const assetMap = new Map<string, Asset>(assets.map(a => [a.id, a]));

        for (const prompt of prompts) {
            const asset = assetMap.get(prompt.assetId);
            if (!asset) continue;

            const specObj = asset.specs.find(s => s.name === prompt.specName);

            const row = promptSheet.addRow({
                assetId: prompt.assetId,
                assetName: asset.name,
                assetType: getTypeLabel(asset.type),
                specName: prompt.specName,
                ratio: specObj?.ratio || '',
                appearance: prompt.appearance,
                style: prompt.style,
                spec: prompt.spec,
                fullPrompt: prompt.fullPrompt,
            });

            const bgColor = TYPE_COLORS[asset.type] || 'FF111111';
            const textColor = TYPE_TEXT[asset.type] || 'FFaaaaaa';

            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.border = BORDER;
                cell.alignment = { vertical: 'middle', wrapText: true };
                cell.font = { color: { argb: 'FFdddddd' }, size: 10 };
            });

            row.getCell('assetId').font = { color: { argb: textColor }, bold: true, size: 10 };
            row.getCell('assetType').font = { color: { argb: textColor }, size: 10 };
            // Highlight full prompt cell
            row.getCell('fullPrompt').font = { color: { argb: 'FFffffff' }, size: 10 };
            row.height = 52;
        }

        // ======================================
        // Stream response
        // ======================================
        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('剧本资产统筹表.xlsx')}`,
            },
        });
    } catch (err: unknown) {
        console.error('[export]', err);
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
