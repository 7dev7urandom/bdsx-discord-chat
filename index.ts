import { Channel, Client, TextChannel } from 'discord.js';
import { fsutil } from 'bdsx/fsutil';
import path = require('path');
import { events } from 'bdsx/event';
import { MinecraftPacketIds } from 'bdsx/bds/packetids';
import { CANCEL } from 'bdsx/common';
import { bedrockServer } from 'bdsx/launcher';
import { command } from 'bdsx/command';
import { CommandRawText } from 'bdsx/bds/command';
import { TextPacket } from 'bdsx/bds/packets';
import { serverInstance } from 'bdsx/bds/server';

enum ChatSettings {
    All,
    Game
}

const pSettings = new Map<string, ChatSettings>();

const client = new Client();
let config: any;
let channel: TextChannel;
const x = path.join(fsutil.projectPath, 'discordconfig.json');
console.log(x);

fsutil.readFile(x).then(data => {
    config = JSON.parse(data);
    const { token } = config;
    client.login(token);
});

client.on('message', message => {
    if(message.channel.id !== config.channel) return;
    if(message.author.bot) return;
    // console.log("Message from discord " + message.content);
    if(bedrockServer.isLaunched()) {
        // let msg = message.content;
        // msg = msg.replace(/@(\w+)/g, )
        // bedrockServer.executeCommand(`tellraw @a ${JSON.stringify({"rawtext": [{"text": `[§9Discord§r] ${message.member.displayName}: ${message.content}`}]})}`);
        tellAllRaw(`[§9Discord§r] ${message.member.displayName}: ${message.content}`);
    }
});

client.on('ready', () => {
    const tmpChannel = client.channels.get(config.channel);
    if(!tmpChannel) throw new Error("Can't get the channel from discord");
    channel = tmpChannel as TextChannel;
});

events.packetBefore(MinecraftPacketIds.Text).on(ev => {
    if(pSettings.get(ev.name) === ChatSettings.All) {
        channel.send(ev.name + ": " + ev.message);
        tellAllRaw('<§9' + ev.name + '§r> ' + ev.message);
        // console.log(ev.name);
        // ev.message = ev.message + "fdasfdsa"
        // ev.type = TextPacket.Types.Raw;
        // bedrockServer.executeCommand(`tellraw @a ${JSON.stringify({"rawtext": [{"text": `<§9${ev.name}§r> ${ev.message}`}]})}`);
        return CANCEL;
    }
});

events.serverOpen.on(() => {
    command.register('chat', 'Changes chat target').overload(({ target }, origin) => {
        if(!origin.getEntity()?.isPlayer()) return;
        switch(target.text) {
            case 'g':
            case 'game':
                pSettings.set(origin.getName(), ChatSettings.Game);
                break;
            case 'd':
            case 'discord':
            case 'a':
            case 'all':
                pSettings.set(origin.getName(), ChatSettings.All);
                break;
        }
    }, {
        target: CommandRawText
    });
});
events.serverClose.on(() => {
        client.destroy();
});

function tellAllRaw(text: string) {
    const packet = TextPacket.create();
    packet.type = TextPacket.Types.Raw;
    packet.message = text;
    for(const i of serverInstance.minecraft.getLevel().players.toArray()) {
        i.sendPacket(packet);
    }
    packet.dispose();
}