import * as modlib from "modlib";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function OnPlayerJoinGame(_eventPlayer: mod.Player) {
    modlib.ShowNotificationMessage(mod.Message(mod.stringkeys.hello, 1));
}