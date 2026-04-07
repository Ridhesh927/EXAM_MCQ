const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.KILO_API_KEY;

const groqClient = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

const geminiClient = geminiApiKey
    ? new GoogleGenerativeAI(geminiApiKey)
    : null;

const normalizeProvider = (provider) => {
    const value = String(provider || 'auto').toLowerCase();
    if (value === 'groq' || value === 'gemini' || value === 'auto') return value;
    return 'auto';
};

const getProviderOrder = (provider) => {
    const normalized = normalizeProvider(provider);
    if (normalized === 'groq') return ['groq', 'gemini'];
    if (normalized === 'gemini') return ['gemini', 'groq'];

    const defaultProvider = normalizeProvider(process.env.AI_DEFAULT_PROVIDER || 'auto');
    if (defaultProvider === 'gemini') return ['gemini', 'groq'];
    return ['groq', 'gemini'];
};

const stripCodeFences = (text) => {
    if (!text) return '';
    return text
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
};

const callGroq = async ({ prompt, role, jsonMode, temperature, maxTokens, model }) => {
    if (!groqClient) {
        throw new Error('GROQ_API_KEY is not configured');
    }

    const completion = await groqClient.chat.completions.create({
        messages: [{ role: role || 'user', content: prompt }],
        model: model || 'llama-3.3-70b-versatile',
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
        throw new Error('No response from Groq');
    }

    return content;
};

const callGemini = async ({ prompt, jsonMode, temperature, maxTokens, model }) => {
    if (!geminiClient) {
        throw new Error('GEMINI_API_KEY or KILO_API_KEY is not configured');
    }

    const generativeModel = geminiClient.getGenerativeModel({
        model: model || 'gemini-1.5-flash',
    });

    const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: typeof temperature === 'number' ? temperature : 0.7,
            ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
    });

    const content = result?.response?.text();
    if (!content) {
        throw new Error('No response from Gemini');
    }

    return content;
};

const callWithFallback = async ({
    prompt,
    role,
    preferredProvider,
    jsonMode = false,
    temperature,
    maxTokens,
    groqModel,
    geminiModel,
}) => {
    const order = getProviderOrder(preferredProvider);
    const errors = [];

    for (const provider of order) {
        try {
            if (provider === 'groq') {
                const content = await callGroq({
                    prompt,
                    role,
                    jsonMode,
                    temperature,
                    maxTokens,
                    model: groqModel,
                });
                return { providerUsed: 'groq', content };
            }

            if (provider === 'gemini') {
                const content = await callGemini({
                    prompt,
                    jsonMode,
                    temperature,
                    maxTokens,
                    model: geminiModel,
                });
                return { providerUsed: 'gemini', content };
            }
        } catch (error) {
            errors.push(`${provider}: ${error.message}`);
        }
    }

    throw new Error(`All AI providers failed. ${errors.join(' | ')}`);
};

const generateJson = async (options) => {
    const { content, providerUsed } = await callWithFallback({ ...options, jsonMode: true });
    const cleaned = stripCodeFences(content);

    try {
        return {
            providerUsed,
            data: JSON.parse(cleaned),
        };
    } catch (error) {
        throw new Error(`Invalid JSON from ${providerUsed}: ${error.message}`);
    }
};

const generateText = async (options) => {
    return callWithFallback({ ...options, jsonMode: false });
};

module.exports = {
    generateJson,
    generateText,
};
