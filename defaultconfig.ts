export const defaultConfig = {
    "token": "your bot token",
    "channel": "chat channel id",
    "forceGameChat": false,
    "inGameChatPrefix":{
        "start": "<§9",
        "end": "§r> "
    },
    "toDiscordChatPrefix":{
        "start": "***",
        "end": "***: "
    },
    "toInGameChatPrefix":{
        "start": "[§9Discord§r] ",
        "end": ": ",
        "returnDiscordName": "displayName"
    },
    "discordStartStopMessagesEnabled": false,
    "discordStartMessage": "***Server:*** Discord Bot Ready!",
    "discordStopMessage": "***Server:*** Discord Bot Stopped!",
    "discordJoinLeftMessagesEnabled": false,
    "discordJoinMessage": {
        "start": "```diff\n+ <",
        "end": "> has joined the server!\n```"
    },
    "discordLeftMessage": {
        "start": "```diff\n+ <",
        "end": "> has left the server!\n```"
    },
    "discordPresenceEnabled": false,
    "discordPresence": {
        "amountSingular": "person",
        "amountPlural": "people",
        "status": " currently on the Minecraft Server"
    },
    "discordSlashCommandEnabled": false,
    "discordSlashCommandInitialize": false,
    "discordSlashCommandListName": "list",
    "discordSlashCommandListText": "Lists number of players and online player names.",
    "guildId": "your discord server id. only needed to register slash command",
    "botId": "your bot id. only needed to register slash command"
}
