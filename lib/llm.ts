import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
    if (!client) {
        client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
            baseURL: process.env.OPENAI_BASE_URL || 'https://ai.opendoor.cn/v1',
        });
    }
    return client;
}

export function getModel(): string {
    return process.env.OPENAI_MODEL || 'gemini-2.5-pro-exp-03-25';
}
