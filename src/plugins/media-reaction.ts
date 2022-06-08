import { MessageUtils } from '@helpers';
import type { Message } from 'discord.js';


export async function react(message: Message) {
    if (MessageUtils.contains(message, "medien") || MessageUtils.contains(message, "theorie")) {

        const medienMessage = await message.reply("Medientheorie!");
        await medienMessage.react("❤️");
        await medienMessage.react("♥");
        return true;
    }

    return false;
} 