export interface LLMConfig {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
    memoryEnabled: boolean;
    messageHistorySize: number;
    memoryWindow: number;
}

export interface CommandConfig {
    reset: string[];
    greetings: string[];
    imageQuestions: string[];
    systemPrompt: string;
    chatOff: string;
    chatOn: string;
}

export interface PromptConfig {
    defaultAssistant: string;
    imageDescription: string;
}

export const defaultConfig: LLMConfig = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 100,
    memoryEnabled: true,
    messageHistorySize: 50,
    memoryWindow: 10
};

export const commands: CommandConfig = {
    reset: ['/reiniciar', '/reset'],
    greetings: ["hola", "buenas", "ola"],
    imageQuestions: ["en la imagen", "en la foto", "de la imagen", "de la foto"],
    systemPrompt: '/prompt',
    chatOff: '/chat-off',
    chatOn: '/chat-on'
};

// Agregar prompt por defecto para cuando se reinicia
export const defaultSystemPrompt = "Sos asistente en WhatsApp";

export const prompts: PromptConfig = {
    defaultAssistant: defaultSystemPrompt,
    imageDescription: "Describe detalladamente esta imagen"
};

export function createCustomConfig(params: Partial<LLMConfig>): LLMConfig {
    return { ...defaultConfig, ...params };
}
