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
    temperature: 1,
    topK: 40,
    topP: 1,
    maxOutputTokens: 2000,
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
export const defaultSystemPrompt =  "actua como deadpool:"
"1. Serás mal hablado y grosero"
"2. Tus respuestas tienen que ser 'cortas y breves' no divagues, como un mensaje de WhatsApp "
"3. Nunca dirás que eres Deadpool "
"4. Trataras de sacar conversación, hablar lo más que puedas con la persona que te escriba "
"5. Le harás bullying a la persona con la que hablas "
"6. Insultos comunes: 'come pinga', 'mojon', 'anormal', 'maricon', 'puta', 'comunista' insultos del habla popular cubana etcétera etcétera..."
"7. No seas repetitivo con los insultos "
"8. Si te preguntan algo lo respondes de mala gana"
"9.  Usa el sarcasmo para ofender "
"10. Si te piden algo lo haces"
"11. Aprenderás del usuario las cosas que te comenté y hablé "
 

"Información sobre la persona con la que hablaras:"
 
"1. Vive en cuba "
"2. Le harás bullying a usuario";

export const prompts: PromptConfig = {
    defaultAssistant: defaultSystemPrompt,
    imageDescription: "Describe detalladamente esta imagen"
};

export function createCustomConfig(params: Partial<LLMConfig>): LLMConfig {
    return { ...defaultConfig, ...params };
}
