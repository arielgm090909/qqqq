import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { image2text, askAboutImage, messageHistory } from './scripts/gemini'
import { commands, prompts, defaultSystemPrompt } from './config/llmConfig'
import "dotenv/config";
import { unlink } from 'fs/promises';

const PORT = process.env.PORT ?? 3009

import { welcomeFlow } from './flows/welcome.flow';
import { chat } from './scripts/gemini'

const imageFlow = addKeyword(EVENTS.MEDIA)
    .addAction(async (ctx, ctxFn) => {
        const userId = ctx.from;
        const localPath = await ctxFn.provider.saveFile(ctx, { path: './assets' });
        
        setTimeout(async () => {
            try {
                await unlink(localPath);
                messageHistory.removeLastImage(userId);
                console.log(`Imagen eliminada: ${localPath}`);
            } catch (error) {
                console.error('Error al eliminar imagen:', error);
            }
        }, 60000);

        const response = await image2text(prompts.imageDescription, localPath, userId);
        await ctxFn.flowDynamic([
            response,
            "Puedes hacerme preguntas específicas sobre esta imagen."
        ]);
    });

const mainFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(async (ctx, ctxFn) => {
        const bodyText: string = ctx.body.toLowerCase();
        const userId = ctx.from;

        // Manejar comando chat-off
        if (bodyText.startsWith(commands.chatOff)) {
            const targetUserId = bodyText.slice(commands.chatOff.length).trim() || userId;
            if (!targetUserId.match(/^[0-9]+$/)) {
                return await ctxFn.flowDynamic('Uso: /chat-off <número> o /chat-off');
            }
            messageHistory.setChatEnabled(targetUserId, false);
            return await ctxFn.flowDynamic(
                targetUserId === userId ? 
                'Chat desactivado. Ya no responderé a tus mensajes.' :
                `Chat desactivado para el número ${targetUserId}.`
            );
        }

        // Manejar comando chat-on
        if (bodyText.startsWith(commands.chatOn)) {
            const targetUserId = bodyText.slice(commands.chatOn.length).trim() || userId;
            if (!targetUserId.match(/^[0-9]+$/)) {
                return await ctxFn.flowDynamic('Uso: /chat-on <número> o /chat-on');
            }
            messageHistory.setChatEnabled(targetUserId, true);
            return await ctxFn.flowDynamic(
                targetUserId === userId ? 
                'Chat activado. He vuelto a estar disponible.' :
                `Chat activado para el número ${targetUserId}.`
            );
        }

        // Verificar si el chat está habilitado antes de procesar cualquier mensaje
        if (!messageHistory.isChatEnabled(userId)) {
            return; // No responder si el chat está desactivado
        }

        // Manejar comando de system prompt
        if (bodyText.startsWith(commands.systemPrompt)) {
            const parts = ctx.body.slice(commands.systemPrompt.length).trim().split(' ');
            
            // Verificar si el primer argumento es un número de teléfono
            const targetUserId = parts[0]?.match(/^[0-9]+$/) ? parts.shift() : userId;
            const newPrompt = parts.join(' ').trim();

            if (!newPrompt) {
                return await ctxFn.flowDynamic([
                    'Uso: /prompt <nuevo prompt del sistema>',
                    'o: /prompt <número> <nuevo prompt del sistema>'
                ]);
            }

            messageHistory.setSystemPrompt(targetUserId, newPrompt);
            const response = targetUserId === userId ? 
                'Prompt del sistema actualizado.' :
                `Prompt del sistema actualizado para el número ${targetUserId}.`;
            
            return await ctxFn.flowDynamic(response);
        }

        // Nuevo: verificar si es un comando reset con número de teléfono
        const resetCommand = commands.reset.find(cmd => bodyText.startsWith(cmd));
        if (resetCommand) {
            const targetUserId = bodyText.slice(resetCommand.length).trim();
            if (targetUserId.match(/^[0-9]+$/)) {
                messageHistory.resetUserChat(targetUserId);
                return await ctxFn.flowDynamic(`Chat reiniciado para el número ${targetUserId}. El prompt del sistema se mantiene.`);
            }
            messageHistory.resetUserChat(userId);
            return await ctxFn.flowDynamic('Chat reiniciado. El prompt del sistema se mantiene. ¿En qué puedo ayudarte?');
        }

        if (commands.greetings.some(keyword => bodyText.includes(keyword))) {
            return await ctxFn.gotoFlow(welcomeFlow);
        }

        if (commands.imageQuestions.some(indicator => bodyText.includes(indicator))) {
            const response = await askAboutImage(userId, ctx.body);
            return await ctxFn.flowDynamic(response);
        }

        const systemPrompt = messageHistory.getSystemPrompt(userId) || prompts.defaultAssistant;
        const response = await chat(systemPrompt, ctx.body, userId);
        await ctxFn.flowDynamic(response);
    });

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, mainFlow, imageFlow])

    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    httpServer(+PORT)
}

main()
