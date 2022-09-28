import { fork, exec, ChildProcess } from "child_process";
import { fsutil } from "bdsx/fsutil";
import path = require("path");
import { events } from "bdsx/event";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { bedrockServer } from "bdsx/launcher";
import { command } from "bdsx/command";
import { CommandRawText } from "bdsx/bds/command";
import { TextPacket } from "bdsx/bds/packets";
import which = require("which");

let proc: ChildProcess;
let config: any;

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
        const configPath = path.join(fsutil.projectPath, "discordconfig.json");
        console.log("Config found: " + configPath);

        fsutil.readFile(configPath).then((data) => {
            config = JSON.parse(data);
            const { channel, token } = config;
            proc.send({ event: "ready", token, channel });
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

events.packetBefore(MinecraftPacketIds.Text).on((ev) => {
    if (playerSettings.get(ev.name) === ChatSettings.All) {
        proc.send({ event: "message", message: `${ev.name}: ${ev.message}` });
        tellAllRaw(`<§9${ev.name}§r> ${ev.message}`);
        return CANCEL;
    }
});

events.serverOpen.on(() => {
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
});
events.serverClose.on(() => {
    proc.send({ event: "destroy" });
});
