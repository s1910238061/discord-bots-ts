import { User, Log, updateUserBalance, DateUtils, GuildSettingsCache, IUser } from "@helpers";
import { ChannelType, Client } from "discord.js";

const TAXATION_RATE = 0.1;
const log = new Log("Taxation");

export async function tax(client: Client) {
    const users = await User.find({ angryCoins: { $gt: 0 } }).exec();

    if (!users) {
        return;
    }

    let taxMoney = 0;

    for (const user of users) {
        if (user.userId === process.env.CLIENT_ID || DateUtils.isToday(user.lastTransaction)) {
            continue;
        }

        try {
            const taxationMoney = Math.ceil(user.angryCoins * TAXATION_RATE);
            user.angryCoins -= taxationMoney;
            taxMoney += taxationMoney;
            user.lastTransaction = new Date();
            await user.save();
        } catch (err) {
            log.error(err);
        }
    }

    const angryId = process.env.CLIENT_ID;

    if (taxMoney <= 0 || !angryId) {
        return;
    }

    await updateUserBalance({
        userId: angryId,
        amount: taxMoney,
        username: "Angry",
    });

    await broadcast(client, taxMoney, users);
}

async function broadcast(client: Client, taxMoney: number, users: IUser[]) {
    for (const [, guild] of client.guilds.cache) {
        const guildSettings = await GuildSettingsCache.get(guild.id);
        if (!guildSettings) {
            continue;
        }

        const channel = await client.channels.fetch(guildSettings.broadcastChannelId);
        if (channel?.type === ChannelType.GuildText) {
            channel.send(
                `The government has collected **${taxMoney}** angry coins in taxes. These have been collected from the following users: ${users
                    .map(u => u.userName)
                    .join(", ")}\n\nThank you for your cooperation.`
            );
        } else {
            log.error(`Could not find broadcast channel for guild ${guild.id}`);
        }
    }
}
