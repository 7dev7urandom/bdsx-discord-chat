import {
    Client,
    TextChannel,
    GatewayIntentBits,
    ActivityType,
    REST,
    SlashCommandBuilder,
    Routes,
} from "discord.js";
import { fsutil } from "bdsx/fsutil";
import * as path from "path";

let config: any;
const configPath = path.join(
    fsutil.projectPath,
    "plugin-configs/discord-chat/config.json"
);
const playerAmount = { online: 0 };

const configPromise = fsutil.readFile(configPath).then((data) => {
    config = JSON.parse(data);
});

process.on("message", async (data: any) => {
    if (data.event === "ready") {
        await configPromise;
        start(config.token, config.channel);
    }
});

function start(token: string, channelId: string) {
    const client = new Client({
        intents:
            GatewayIntentBits.Guilds |
            GatewayIntentBits.GuildMessages |
            GatewayIntentBits.MessageContent,
    });
    client.login(token);
    client.on("ready", async () => {
        if (config.discordSlashCommandInitialize) {
            initiateSlashCommands();
            config.discordSlashCommandInitialize = false;
            fsutil.writeFile(configPath, JSON.stringify(config, null, 2)).then(
                (onfulfilled) => {
                    console.log("[discord-chat] updated config.json file.");
                },
                (onrejected) => {
                    console.log(
                        `[discord-chat] Error updating config.json file. ${onrejected}`
                    );
                }
            );
        }
        const channel = (await client.channels.fetch(channelId)) as TextChannel;
        if (!channel) throw new Error("Can't get the channel from discord");
        if (config.discordPresenceEnabled)
            client.user?.setPresence({
                status: "online",
                activities: [
                    {
                        name: `${playerAmount.online} ${
                            playerAmount.online === 1
                                ? config.discordPresence.amountSingular
                                : config.discordPresence.amountPlural
                        }${config.discordPresence.status}`,
                        type: ActivityType.Playing,
                    },
                ],
            });
        client.on("messageCreate", (message: any) => {
            if (message.channel.id !== channelId) return;
            if (message.author.bot) return;
            let discordName: string;
            if (config.toInGameChatPrefix.returnDiscordName === "both") {
                discordName =
                    message.member.displayName === message.member.user.username
                        ? message.member.displayName
                        : `${message.member.displayName} (${message.member.user.username})`;
            } else {
                discordName =
                    config.toInGameChatPrefix.returnDiscordName ===
                    "displayName"
                        ? message.member.displayName
                        : message.member.user.username;
            }
            tellAllRaw(
                `${config.toInGameChatPrefix.start}${discordName}${config.toInGameChatPrefix.end}${message.content}`
            );
        });
        if (config.discordSlashCommandEnabled) { 
            client.on("interactionCreate", async interaction => {
                if (!interaction.isChatInputCommand()) return;
                if (interaction.commandName === "list" && !interaction.replied) {
                    slashCommand("list");
                }
                process.on("message", (data) => {
                    if (data.event === "commandReturn" && !interaction.replied) {
                        interaction.reply(data.returnValue);
                    }else if (data.event === "commandReturn" && interaction.replied) {
                        interaction.editReply(data.returnValue);
                    }
                });
            });
        }
        process.on("message", (data: any) => {
            if (data.event === "message") {
                channel.send(data.message);
            } else if (
                config.discordPresenceEnabled &&
                data.event === "presence"
            ) {
                if (data.message === "+") playerAmount.online++;
                else if (data.message === "-") playerAmount.online--;
                if (data.message !== "stop")
                    client.user?.setActivity({
                        name: `${playerAmount.online} ${
                            playerAmount.online === 1
                                ? config.discordPresence.amountSingular
                                : config.discordPresence.amountPlural
                        }${config.discordPresence.status}`,
                        type: ActivityType.Playing,
                    });
                else if (data.message === "stop")
                    client.user?.setPresence({
                        status: "invisible",
                    });
            } else if (data.event === "destroy") {
                client.destroy();
                console.log("Discord client destroyed");
                process.exit(0);
            }
        });
        process.on("unhandledRejection", async (err) => {
            console.error("Unhandled Promise Rejection:\n", err);
        });
        process.on("uncaughtException", async (err) => {
            console.error("Uncaught Promise Exception:\n", err);
        });
        process.on("warning", async (err) => {
            console.error("Multiple Resolves:\n", err);
        });
    });
}

function tellAllRaw(message: string) {
    process.send!({ event: "message", message });
}

function slashCommand(command: string) {
    return process.send!({ event: "command", command });
}

function initiateSlashCommands() {
    const rest = new REST({ version: "10" }).setToken(config.token);
    const commands = [];
    commands.push(
        new SlashCommandBuilder()
            .setName(config.discordSlashCommandListName)
            .setDescription(config.discordSlashCommandListText)
    );
    commands.map((command) => {
        command.toJSON();
    });
    rest.put(Routes.applicationGuildCommands(config.botId, config.guildId), {
        body: commands,
    })
        .then((data: any) => {
            console.log(
                `Successfully registered ${data.length} application commands.`
            );
        })
        .catch(console.error);
}
