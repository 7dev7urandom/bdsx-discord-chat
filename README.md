
# discordlink Plugin
The plugin for bdsx

To use it, run the plugin once or make a `config.json` file in (bdsx root folder)\plugin-configs\discord-chat\ with the following contents:

```json
{
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
```
If the plugin is ran once then you will need to fill out the config.json after it generates.

The attribute forceGameChat set to true will force gamechat <---> discord for all players. Setting it to false will let players opt in with the chat command in game.

The attribute "discordSlashCommandInitialize" only needs to be set to true when initializing the slash command or updating the slash command.
