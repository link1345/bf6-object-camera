type RuntimeSpawnPrefab =
    | mod.RuntimeSpawn_Common
    | mod.RuntimeSpawn_Abbasid
    | mod.RuntimeSpawn_Aftermath
    | mod.RuntimeSpawn_Badlands
    | mod.RuntimeSpawn_Battery
    | mod.RuntimeSpawn_Capstone
    | mod.RuntimeSpawn_Contaminated
    | mod.RuntimeSpawn_Dumbo
    | mod.RuntimeSpawn_Eastwood
    | mod.RuntimeSpawn_FireStorm
    | mod.RuntimeSpawn_Limestone
    | mod.RuntimeSpawn_Outskirts
    | mod.RuntimeSpawn_Subsurface
    | mod.RuntimeSpawn_Tungsten
    | mod.RuntimeSpawn_Granite_Downtown
    | mod.RuntimeSpawn_Granite_Marina
    | mod.RuntimeSpawn_Granite_MilitaryRnD
    | mod.RuntimeSpawn_Granite_MilitaryStorage
    | mod.RuntimeSpawn_Granite_ResidentialNorth
    | mod.RuntimeSpawn_Granite_TechCenter
    | mod.RuntimeSpawn_Granite_Underground
    | mod.RuntimeSpawn_Sand;

type RuntimeSpawnEnum = [string, string | RuntimeSpawnPrefab][];

type RuntimeSpawnEntry = {
    prefab: RuntimeSpawnPrefab;
    name: string;
};

const DISPLAY_Y = 500;
const OBJECT_DROP_Y = 2;
const DISPLAY_X = 0;
const OBJECT_Y = DISPLAY_Y - OBJECT_DROP_Y;
const DISPLAY_Z = 3;

const DISPLAY_CENTER = mod.CreateVector(DISPLAY_X, OBJECT_Y, DISPLAY_Z);
const DISPLAY_ROTATION = mod.CreateVector(0, 0, 0);
const DISPLAY_SCALE = mod.CreateVector(1, 1, 1);
const CAMERA_ID = 100;
const INVALID_CAMERA_POSITION_EPSILON = 0.001;
const CAMERA_HEIGHT = 4;
const CAMERA_ORBIT_RADIUS = 10;
const CAMERA_ORBIT_STEPS = 120;
const CAMERA_START_X = DISPLAY_X;
const CAMERA_START_Y = DISPLAY_Y + CAMERA_HEIGHT;
const CAMERA_START_Z = DISPLAY_Z - 45;
const CAMERA_VIEW_X = DISPLAY_X;
const CAMERA_VIEW_Y = DISPLAY_Y + CAMERA_HEIGHT;
const CAMERA_VIEW_Z = DISPLAY_Z - CAMERA_ORBIT_RADIUS;
const CAMERA_START_POSITION = mod.CreateVector(CAMERA_START_X, CAMERA_START_Y, CAMERA_START_Z);
const CAMERA_VIEW_POSITION = mod.CreateVector(CAMERA_VIEW_X, CAMERA_VIEW_Y, CAMERA_VIEW_Z);
const CAMERA_START_ROTATION = createLookAtRotation(CAMERA_START_X, CAMERA_START_Y, CAMERA_START_Z);
const CAMERA_VIEW_ROTATION = createLookAtRotation(CAMERA_VIEW_X, CAMERA_VIEW_Y, CAMERA_VIEW_Z);
const CAMERA_MOVE_SECONDS = 5;
const CAMERA_ORBIT_TIME_SECONDS = 10;
const SWITCH_TIME_SECONDS = 15;
const COUNTDOWN_SECONDS = 5;

let hasStartedShowcase = false;
let spawnedObject: mod.Object | null = null;
let activeViewer: mod.Player | null = null;

export async function OnGameModeStarted(): Promise<void> {
    mod.EnableAllPlayerDeploy(true);
    mod.SetSpawnMode(mod.SpawnModes.AutoSpawn);
    await mod.Wait(1);
    mod.DeployAllPlayers();
}

export async function OnPlayerDeployed(eventPlayer: mod.Player): Promise<void> {
    if (hasStartedShowcase) {
        setPlayerToFixedCamera(eventPlayer);
        return;
    }

    hasStartedShowcase = true;
    activeViewer = eventPlayer;

    const cameraReady = await moveViewerCameraToDisplay(eventPlayer);
    if (!cameraReady) {
        hasStartedShowcase = false;
        return;
    }

    await showStartCountdown(eventPlayer);
    runCameraOrbitLoop();
    await runRuntimeSpawnShowcase();
}

async function moveViewerCameraToDisplay(player: mod.Player): Promise<boolean> {
    const camera = mod.GetFixedCamera(CAMERA_ID);

    mod.StopActiveMovementForObject(camera);
    mod.SetObjectTransform(camera, mod.CreateTransform(CAMERA_START_POSITION, CAMERA_START_ROTATION));
    await mod.Wait(0.2);
    //logObjectPosition("camera start", camera);

    if (!isFixedCameraMoved(camera)) {
        console.log("FixedCamera ObjId " + CAMERA_ID + " did not move. Place a FixedCamera with this ObjId in Godot, or change CAMERA_ID.");
        return false;
    }

    setPlayerToFixedCamera(player);

    mod.SetObjectTransformOverTime(
        camera,
        mod.CreateTransform(CAMERA_VIEW_POSITION, CAMERA_VIEW_ROTATION),
        CAMERA_MOVE_SECONDS,
        false,
        false
    );
    await mod.Wait(CAMERA_MOVE_SECONDS);
    mod.SetObjectTransform(camera, mod.CreateTransform(CAMERA_VIEW_POSITION, CAMERA_VIEW_ROTATION));
    //logObjectPosition("camera view", camera);
    return true;
}

function setPlayerToFixedCamera(player: mod.Player): void {
    mod.SetCameraTypeForPlayer(player, mod.Cameras.Fixed, CAMERA_ID);
}

function isFixedCameraMoved(camera: mod.Object): boolean {
    const position = mod.GetObjectPosition(camera);

    return (
        distanceAbs(mod.XComponentOf(position), CAMERA_START_X) < INVALID_CAMERA_POSITION_EPSILON &&
        distanceAbs(mod.YComponentOf(position), CAMERA_START_Y) < INVALID_CAMERA_POSITION_EPSILON &&
        distanceAbs(mod.ZComponentOf(position), CAMERA_START_Z) < INVALID_CAMERA_POSITION_EPSILON
    );
}

function distanceAbs(a: number, b: number): number {
    return Math.abs(a - b);
}

async function showStartCountdown(player: mod.Player): Promise<void> {
    for (let secondsLeft = COUNTDOWN_SECONDS; secondsLeft > 0; secondsLeft--) {
        console.log("Showcase starts in ", secondsLeft);
        await mod.Wait(1);
    }
}

async function runCameraOrbitLoop(): Promise<void> {
    const camera = mod.GetFixedCamera(CAMERA_ID);

    while (true) {
        for (let i = 0; i < CAMERA_ORBIT_STEPS; i++) {
            const angle = (Math.PI * 2 * i) / CAMERA_ORBIT_STEPS;
            mod.SetObjectTransform(camera, createCameraOrbitTransform(angle));
            await mod.Wait(CAMERA_ORBIT_TIME_SECONDS / CAMERA_ORBIT_STEPS);
        }
    }
}

function createCameraOrbitTransform(angle: number): mod.Transform {
    const x = DISPLAY_X + Math.sin(angle) * CAMERA_ORBIT_RADIUS;
    const z = DISPLAY_Z - Math.cos(angle) * CAMERA_ORBIT_RADIUS;

    return mod.CreateTransform(
        mod.CreateVector(x, DISPLAY_Y + CAMERA_HEIGHT, z),
        createLookAtRotation(x, DISPLAY_Y + CAMERA_HEIGHT, z)
    );
}

function createLookAtRotation(fromX: number, fromY: number, fromZ: number): mod.Vector {
    const dx = DISPLAY_X - fromX;
    const dy = DISPLAY_Y - fromY;
    const dz = DISPLAY_Z - fromZ;
    const distanceXZ = Math.sqrt(dx * dx + dz * dz);
    const pitch = -Math.atan2(dy, distanceXZ);
    const yaw = Math.atan2(dx, dz);

    return mod.CreateVector(pitch, yaw, 0);
}

async function runRuntimeSpawnShowcase(): Promise<void> {
    const prefabs = getCurrentLevelPrefabs();

    if (prefabs.length === 0) {
        console.log("No RuntimeSpawn prefab list was found for the current map.");
        return;
    }

    let prefabIndex = 0;

    while (true) {
        cleanupSpawnedObject();

        const entry = prefabs[prefabIndex];
        const obj = mod.SpawnObject(entry.prefab, DISPLAY_CENTER, DISPLAY_ROTATION, DISPLAY_SCALE);

        if (obj !== -1) {
            spawnedObject = obj;
            console.log("Showing: " + entry.name);
            //logObjectPosition("spawned object", obj);
        } else {
            console.log("Failed to spawn: " + entry.name);
        }

        prefabIndex = (prefabIndex + 1) % prefabs.length;
        await mod.Wait(SWITCH_TIME_SECONDS);
    }
}

function cleanupSpawnedObject(): void {
    if (spawnedObject === null) {
        return;
    }

    mod.StopActiveMovementForObject(spawnedObject);
    mod.UnspawnObject(spawnedObject);
    spawnedObject = null;
}

function logObjectPosition(label: string, object: mod.Object): void {
    const position = mod.GetObjectPosition(object);

    console.log(
        label +
        " position: x=" +
        mod.XComponentOf(position) +
        ", y=" +
        mod.YComponentOf(position) +
        ", z=" +
        mod.ZComponentOf(position)
    );
}

function getCurrentLevelPrefabs(): RuntimeSpawnEntry[] {
    const currentRuntimeSpawnEnum = getCurrentRuntimeSpawnEnum();
    if (currentRuntimeSpawnEnum === null) {
        return [];
    }
    return enumValues(currentRuntimeSpawnEnum);
}

function getCurrentRuntimeSpawnEnum(): RuntimeSpawnEnum | null {
    if (mod.IsCurrentMap(mod.Maps.Abbasid)) return Object.entries(mod.RuntimeSpawn_Abbasid);
    if (mod.IsCurrentMap(mod.Maps.Aftermath)) return Object.entries(mod.RuntimeSpawn_Aftermath);
    if (mod.IsCurrentMap(mod.Maps.Badlands)) return Object.entries(mod.RuntimeSpawn_Badlands);
    if (mod.IsCurrentMap(mod.Maps.Battery)) return Object.entries(mod.RuntimeSpawn_Battery);
    if (mod.IsCurrentMap(mod.Maps.Capstone)) return Object.entries(mod.RuntimeSpawn_Capstone);
    if (mod.IsCurrentMap(mod.Maps.Contaminated)) return Object.entries(mod.RuntimeSpawn_Contaminated);
    if (mod.IsCurrentMap(mod.Maps.Dumbo)) return Object.entries(mod.RuntimeSpawn_Dumbo);
    if (mod.IsCurrentMap(mod.Maps.Eastwood)) return Object.entries(mod.RuntimeSpawn_Eastwood);
    if (mod.IsCurrentMap(mod.Maps.Firestorm)) return Object.entries(mod.RuntimeSpawn_FireStorm);
    if (mod.IsCurrentMap(mod.Maps.Granite_ClubHouse)) return Object.entries(mod.RuntimeSpawn_Granite_ResidentialNorth);
    if (mod.IsCurrentMap(mod.Maps.Granite_MainStreet)) return Object.entries(mod.RuntimeSpawn_Granite_Downtown);
    if (mod.IsCurrentMap(mod.Maps.Granite_Marina)) return Object.entries(mod.RuntimeSpawn_Granite_Marina);
    if (mod.IsCurrentMap(mod.Maps.Granite_MilitaryRnD)) return Object.entries(mod.RuntimeSpawn_Granite_MilitaryRnD);
    if (mod.IsCurrentMap(mod.Maps.Granite_MilitaryStorage)) return Object.entries(mod.RuntimeSpawn_Granite_MilitaryStorage);
    if (mod.IsCurrentMap(mod.Maps.Granite_TechCampus)) return Object.entries(mod.RuntimeSpawn_Granite_TechCenter);
    if (mod.IsCurrentMap(mod.Maps.Granite_Underground)) return Object.entries(mod.RuntimeSpawn_Granite_Underground);
    if (mod.IsCurrentMap(mod.Maps.Limestone)) return Object.entries(mod.RuntimeSpawn_Limestone);
    if (mod.IsCurrentMap(mod.Maps.Outskirts)) return Object.entries(mod.RuntimeSpawn_Outskirts);
    if (mod.IsCurrentMap(mod.Maps.Sand)) return Object.entries(mod.RuntimeSpawn_Sand);
    if (mod.IsCurrentMap(mod.Maps.Subsurface)) return Object.entries(mod.RuntimeSpawn_Subsurface);
    if (mod.IsCurrentMap(mod.Maps.Tungsten)) return Object.entries(mod.RuntimeSpawn_Tungsten);
    return null;
}

function enumValues(runtimeSpawnEnum: RuntimeSpawnEnum): RuntimeSpawnEntry[] {
    const result: RuntimeSpawnEntry[] = [];

    for (const [key, value] of runtimeSpawnEnum) {
        result.push({
            prefab: value as RuntimeSpawnPrefab,
            name: key,
        });
    }

    return result;
}

function isPlaceableObjectName(name: string): boolean {
    return !(
        startsWith(name, "FX_") ||
        startsWith(name, "fx_") ||
        startsWith(name, "SFX_") ||
        startsWith(name, "UI_") ||
        startsWith(name, "WorldIcon") ||
        startsWith(name, "VehicleSpawner") ||
        startsWith(name, "Loot") ||
        startsWith(name, "AreaTrigger") ||
        startsWith(name, "InteractPoint") ||
        startsWith(name, "Objective") ||
        startsWith(name, "AutoCapture") ||
        startsWith(name, "DefaultCapture") ||
        startsWith(name, "DefaultSpawn") ||
        startsWith(name, "Soldier") ||
        startsWith(name, "Weapon") ||
        startsWith(name, "BattlePickup") ||
        startsWith(name, "Muzzle_") ||
        startsWith(name, "Scope_") ||
        startsWith(name, "Ammo_") ||
        startsWith(name, "Gadget_")
    );
}

function startsWith(value: string, prefix: string): boolean {
    return value.substring(0, prefix.length) === prefix;
}
