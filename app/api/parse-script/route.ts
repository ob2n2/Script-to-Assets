import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
            return NextResponse.json({ error: 'Only .docx files are supported' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;

        if (!text || text.trim().length < 50) {
            return NextResponse.json({ error: 'Could not extract text from file, or file is too short.' }, { status: 422 });
        }

        return NextResponse.json({ text, filename: file.name, length: text.length });
    } catch (err: unknown) {
        console.error('[parse-script]', err);
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}


