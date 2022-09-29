import { fork, exec, ChildProcess } from "child_process";
import { fsutil } from "bdsx/fsutil";
import { events } from "bdsx/event";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { bedrockServer } from "bdsx/launcher";
import { command } from "bdsx/command";
import { CommandResultType } from "bdsx/commandresult";
import { CommandRawText } from "bdsx/bds/command";
import { TextPacket } from "bdsx/bds/packets";
import { defaultConfig } from "./defaultconfig";
import * as which from "which";
import * as path from "path";

let proc: ChildProcess;
let config: any;
const configPath = path.join(fsutil.projectPath, "plugin-configs/discord-chat/config.json");

if (!fsutil.isFileSync(configPath)) {
    const pcDir = path.join(fsutil.projectPath, "plugin-configs/");
    const dcDir = path.join(fsutil.projectPath, "plugin-configs/discord-chat/");
    if (!fsutil.isDirectorySync(pcDir)) {
        fsutil.mkdir(pcDir).then(
            (onfulfilled)=>{},
            (onrejected)=>{ console.log(`[discord-chat] Error creating default config.json file ${onrejected}`)}
        )
    }
    if (!fsutil.isDirectorySync(dcDir)) {
        fsutil.mkdir(dcDir).then(
            (onfulfilled)=>{},
            (onrejected)=>{ console.log(`[discord-chat] Error creating default config.json file ${onrejected}`)}
        )
    }
    if(!fsutil.isFileSync(configPath)){
        fsutil.writeFile(configPath,JSON.stringify(defaultConfig, null, 2)).then(
            (onfulfilled)=>{ console.log("[discord-chat] Created a default config.json file.\n[discord-chat] Please set your configuration values in the config.json!");},
            (onrejected)=>{ console.log(`[discord-chat] Error creating default config.json file ${onrejected}`)}
        )
    }
}

which("node", {}, (err, nodePath) => {
    const notFound = () => {
        throw new Error(
            "DiscordChat requires node.js (version >= 16.6.0) to be installed"
        );
    };
    if (err) notFound();
    exec("node -v", (err, out) => {
        if (err) notFound();
        const version = out.split("v")[1].split(".");
        if (
            parseInt(version[0]) < 16 ||
            (parseInt(version[0]) === 16 && parseInt(version[1]) < 6)
        )
            notFound();
        proc = fork(require.resolve("./discordBot"), {
            stdio: "inherit",
            execPath: nodePath,
        });
        console.log("[discord-chat] Config found: " + configPath);

        fsutil.readFile(configPath).then((data) => {
            config = JSON.parse(data);
            const { channel, token } = config;
            proc.send({ event: "ready", token, channel });
        });
        proc.on("message", (data) => {
            if (data.event === "command") {
                if(data.command === "list") proc.send({event: "commandReturn", returnValue: listCommand()}) ;
            }
        });
        proc.on("message", (data) => {
            if (data.event === "message") {
                tellAllRaw(data.message);
            }
        });
    });
});

enum ChatSettings {
    All,
    Game,
}

const playerSettings = new Map<string, ChatSettings>();

function tellAllRaw(text: string) {
    if (!bedrockServer.isLaunched()) return;
    const packet = TextPacket.allocate();
    packet.type = TextPacket.Types.Raw;
    packet.message = text;
    for (const i of bedrockServer.level.getPlayers()) {
        i.sendPacket(packet);
    }
    packet.dispose();
}
function listCommand(){
    const list = bedrockServer.executeCommand('list', CommandResultType.Data);
    return list.data.statusMessage;
}
events.packetBefore(MinecraftPacketIds.Text).on((ev) => {
    if (config.forceGameChat || playerSettings.get(ev.name) === ChatSettings.All) {
        proc.send({ event: "message", message: `${config.toDiscordChatPrefix.start}${ev.name}${config.toDiscordChatPrefix.end}${ev.message}` });
        tellAllRaw(`${config.inGameChatPrefix.start}${ev.name}${config.inGameChatPrefix.end}${ev.message}`);
        return CANCEL;
    }
});

events.serverOpen.on(() => {
    if(config.discordStartStopMessagesEnabled) proc.send({ event: "message", message: config.discordStartMessage });
    if(!config.forceGameChat){
        command.register("chat", "Changes chat target").overload(
            ({ target }, origin) => {
                if (!origin.getEntity()?.isPlayer()) return;
                switch (target.text) {
                    case "g":
                    case "game":
                        playerSettings.set(origin.getName(), ChatSettings.Game);
                        break;
                    case "d":
                    case "discord":
                    case "a":
                    case "all":
                        playerSettings.set(origin.getName(), ChatSettings.All);
                        break;
                }
            },
            {
                target: CommandRawText,
            }
        ); 
    }
});

events.playerJoin.on((evt)=>{
    if(config.discordJoinLeftMessagesEnabled) proc.send({ event: "message", message: `${config.discordJoinMessage.start}${evt.player.getName()}${config.discordJoinMessage.end}` });
    if(config.discordPresenceEnabled) proc.send({ event: "presence", message: "+"})
});
events.playerLeft.on((evt)=>{
    if(config.discordJoinLeftMessagesEnabled) proc.send({ event: "message", message: `${config.discordLeftMessage.start}${evt.player.getName()}${config.discordLeftMessage.end}` });
    if(config.discordPresenceEnabled) proc.send({ event: "presence", message: "-"})
});

events.serverLeave.on(() => {
    proc.send({ event: "message", message: config.discordStopMessage });
    if(config.discordPresenceEnabled) proc.send({ event: "presence", message: "stop"})
});
events.serverClose.on(() => {
    proc.send({ event: "destroy" });
});

export function sendToDiscord(msg: string) {
    proc.send({ event: "message", message: msg});
}
