import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OnPlayerJoinGame } from '../mods/Script';
import { setupBfPortalMock, type BfPortalModMock, createFake } from "../test-support/bfportal-vitest-mock.generated";

import stringkeys from "../dist/Strings.json";

export let modMock: BfPortalModMock;

beforeEach(() => {
    vi.resetAllMocks();

    modMock = setupBfPortalMock({
        GetObjId: () => 100,
        Message(
            msg: string | number | mod.Player,
            msgArg0?: string | number | mod.Player,
            msgArg1?: string | number | mod.Player,
            msgArg2?: string | number | mod.Player,
        ): mod.Message {
            return {
                __test: true,
                msg,
                args: [msgArg0, msgArg1, msgArg2],
            } as unknown as mod.Message;
        },
    }, { stringkeys });
});

describe('OnPlayerJoinGame', () => {
    it('When a player joins the game, send a message', async () => {
        await OnPlayerJoinGame(createFake<mod.Player>());
        expect(modMock.DisplayNotificationMessage).toHaveBeenCalledWith({
            "__test": true,
            "args": [
                1,
                undefined,
                undefined,
            ],
            "msg": "Hello World {}",
        },);
    });
});