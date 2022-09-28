import { Channel, Client, TextChannel, GatewayIntentBits } from "discord.js";
process.on("message", (data) => {
    if (data.event === "ready") {
        start(data.token, data.channel);
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
        const channel = (await client.channels.fetch(channelId)) as TextChannel;
        if (!channel) throw new Error("Can't get the channel from discord");
        client.on("messageCreate", (message) => {
            if (message.channel.id !== channelId) return;
            if (message.author.bot) return;
            console.log("Message from discord " + message.content);
            tellAllRaw(
                `[§9Discord§r] ${message.member?.displayName}: ${message.content}`
            );
        });
        process.on("message", (data) => {
            if (data.event === "message") {
                channel.send(data.message);
            } else if (data.event === "destroy") {
                client.destroy();
                console.log("Discord client destroyed");
                process.exit(0);
            }
        });
    });
}

function tellAllRaw(message: string) {
    process.send!({ event: "message", message });
}
