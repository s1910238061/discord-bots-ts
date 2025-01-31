import { REST } from "@discordjs/rest";
import { Log } from "@helpers";
import { ICommand } from "commands/command-interfaces";
import { Routes } from "discord-api-types/v10";
import { Collection } from "discord.js";

const log = new Log("RegisterCommands");

export async function registerApplicationCommands(
    token: string,
    clientId: string,
    commands: Collection<string, ICommand>
) {
    const rest = new REST({ version: "10" }).setToken(token);

    // Will crash the bot if it fails
    await rest.put(Routes.applicationCommands(clientId), {
        body: commands.map(c => c.data.toJSON()),
    });

    log.info(`Registered ${commands.size} commands for every guild.`, "registerApplicationCommands");
}
