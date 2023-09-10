import { JsonAsset, log, randomRange, resources, sys} from 'cc';
import { MissionProgress, PlayerData, PlayerMissionRecord, PlayerPreference } from "../../PlayerData/PlayerData";
import { IManager } from "./IManager";
import { MainGameManager } from '../MainGameManager';
import { Currency, FISH_CURRENCY, HARD_CURRENCY, REAL_CURRENCY, SOFT_CURRENCY } from '../../PlayerData/Currency';
import { GameEvent } from './GameEventManager';
import { makeRandomId } from '../../Common/MakeId';
import { GAME_ID, LOGIN_GET_URL, REGISTER_POST_URL } from '../../Common/GameConfig';
import Http from '../../Common/Http';
import { CompletedSessionData, PuzzleSession, PuzzleStatistics } from '../../PlayerData/PuzzleStatistics';
import { MISSION_ARG_TYPE_ADD, MISSION_ARG_TYPE_MAX, MissionArgument, MissionManager } from './MissionManager';
import { Booster } from '../../Puzzle/UI/Booster';
import { Mission } from '../Missions/Mission';
import { last } from '../../Utilities/ArrayExtensions';
import { ResourceManager } from './ResourceManager';

/**
 * Class to manage saving, loading player data.
 * 
 * DO NOT access PlayerData directly. Always go through this manager.
 * 
 * In the future, if needed, should also handle server player data.
 */
export class PlayerDataManager implements IManager
{
    private static readonly PLAYER_ID_KEY = "playerDeviceId";
    private static readonly PLAYER_NAME_KEY = "playerName";
    private static readonly PLAYER_DATA_KEY = "playerData";
    private static readonly PLAYER_PUZZLE_HIGHSCORE = "puzzleHighScore";
    private static readonly PLAYER_PUZZLE_STATISTICS = "puzzleStats";

    private static readonly PLAYER_PREFERENCE_KEY = "preference";

    private static readonly NEW_PROFILE_JSON_PATH: string = "Jsons/new_profile_data";

    
    // Cached data
    private _playerData: PlayerData = null;
    private _puzzleStatistics: PuzzleStatistics = null;

    // Immediate accessors
    private _currencies: Map<string, Currency>;
    private _inventoryFacilities: Map<string, Object>;
    private _parkFacilities: Object[];
    private _missionRecord: PlayerMissionRecord;
    private _boosterCount: Map<Booster, number>;

    private _hasDog: boolean;
    private _adFree: boolean;
    private _tutorialPlayed: boolean;
    private _catTypeServed: string[];

    //Checked data
    private _hasCheckIn: boolean = false;
    private _lastCheckinDate: Date = new Date();
    private _checkinIndex: number = 0;


    private _tipJarCurrency: Currency = null;


    private _initialized: boolean = false;
    private _isNewPlayer: boolean;
    private _isBrokenPlayerData: boolean;

    private _jsonNewProfileDone: boolean = false;
    private _jsonNewProfileProgress: number = 0;

    private _newProfileData: PlayerData;


    public get hasPlayerData(): boolean
    {
        return this._playerData !== null;
    }

    public get isNewPlayer(): boolean
    {
        return this._isNewPlayer;
    }

    public set isNewPlayer(value: boolean)
    {
        this._isNewPlayer = value;
    }

    public get isBrokenPlayerData(): boolean
    {
        return this._isBrokenPlayerData;
    }

    public get playerRegisterParams(): object
    {
        return {
            deviceId: this.getDeviceId(),
            platform: sys.platform,
            os: sys.os,
            playerName: this.getName(),
            game: GAME_ID
        };
    }

    public get playerServerLoginParams(): object
    {
        return {
            deviceId: this.getDeviceId(),
            playerName: this.getName(),
            gameId: GAME_ID
        };
    }

    private _shouldRefreshDaily: boolean = false;
    public get shouldRefreshDaily(): boolean
    {
        return this._shouldRefreshDaily;
    }

    public set shouldRefreshDaily(value: boolean)
    {
        this._shouldRefreshDaily = value;
    }

    public playerGetChecking(isGet: boolean = false): Record<string, any> | any {
        if (isGet) {
            const data = {
                hasCheckedIn: this._hasCheckIn,
                checkinIndex: this._checkinIndex,
                lastCheckinDate: this._lastCheckinDate
            };
            return data;
        }
        if (this._checkinIndex >= 7) return false;
        if (!this._hasCheckIn) {
            const data: Record<string, any>[] = this._newProfileData?.questionReceivers[String(this._checkinIndex)] || [];
            for (const v of data) {
                this.addCurrency(v as Currency);
            }
            this._hasCheckIn = true;
            this._lastCheckinDate = new Date();
    
            // to do
            // save storage
            this.savePlayerDataToDisk();
        }
        
        return true;
    }


    public initialize()
    {
        // Load device id
        let id = this.getDeviceId();
        let name = this.getName();

        if (id && name)
        {
            this.isNewPlayer = false;
        }
        else
        {
            let newId = makeRandomId(8);
            let name = makeRandomId(8);

            sys.localStorage.setItem(PlayerDataManager.PLAYER_ID_KEY, newId);
            sys.localStorage.setItem(PlayerDataManager.PLAYER_NAME_KEY, name);

            this.isNewPlayer = true;
        }

        // Load new player profile
        this._jsonNewProfileDone = false;
        this._jsonNewProfileProgress = 0;
        resources.load(PlayerDataManager.NEW_PROFILE_JSON_PATH, JsonAsset, (err, asset) =>
        {
            if (err)
            {
                console.error(err);
            }
            else
            {
                this._newProfileData = new PlayerData();
                this._newProfileData.from(asset.json);
            }

            this._jsonNewProfileProgress = 1;
            this._jsonNewProfileDone = true;
        });

        this._initialized = true;
    }

    public progress(): number
    {
        return (this._initialized ? 1 : 0 + this._jsonNewProfileProgress) / 2;
    }

    public initializationCompleted(): boolean
    {
        return this._initialized && this._jsonNewProfileDone;
    }

    public login(onComplete: (successful: boolean, errMessage: string, data: any) => void)
    {
        Http.get(LOGIN_GET_URL, this.playerServerLoginParams, (err, data) =>
        {
            if (err != null && err != undefined)
            {
                // TODO: Make readable err message
                onComplete(false, "Cannot connect to server.\nError message: " + err, data);

                console.log("Login failed");
            }
            else
            {
                this.loadPlayerDataFromDisk();

                // TODO: Player Data Manager save data
                this.loadPlayerDataFromServer(data);

                // TODO: Compare both version, or sth


                this.calculateTipJarCurrency(this._playerData.lastModifiedDate, new Date());

                console.log("Logged in: ", data);
                onComplete(true, null, data);
            }
        });
    }

    public register(onComplete: (successful: boolean, errMessage: string, data: any) => void)
    {
        Http.post(REGISTER_POST_URL, this.playerRegisterParams, (err, data) =>
        {
            if (err != null && err != undefined)
            {
                // TODO: Make readable err message
                onComplete(false, "Cannot connect to server.\nError message: " + err, null);
                console.log("Register failed");
            }
            else
            {
                this.loadPlayerDataFromDisk();

                // TODO: Player Data Manager save data
                this.loadPlayerDataFromServer(data);

                // TODO: Compare both version, or sth

                console.log("Registered: ", data);
                onComplete(true, null, data);
            }
        });
    }

    public fakeLogin()
    {
        this.loadPlayerDataFromDisk();

        // REAL New day check
        const newDateMidnight = new Date();
        const newDate = new Date();
        newDateMidnight.setHours(0, 0, 0, 0);
        const lastDate = new Date(this._lastCheckinDate);
        const lastDateMidnight = new Date(this._lastCheckinDate);
        lastDate.setHours(0, 0, 0, 0);
        // nguoi choi co the checkin ko 
        if (this._hasCheckIn && (lastDate.getTime() < newDateMidnight.getTime() ))
        {
            // co the checkin
             this._checkinIndex += 1;
            this._hasCheckIn = false;
        }

        // Check daily missions
        if (lastDateMidnight.getTime() < newDateMidnight.getTime())
        {
            this._shouldRefreshDaily = true;
        }

        if (!this.isNewPlayer || !this.getPlayerDoneTutorial())
        {
            let lastModifiedDate = new Date(this._playerData.lastModifiedDate);
            // TODO: Compare both version, or sth
            this.calculateTipJarCurrency(lastModifiedDate, newDate);
        }
        else
        {
            this._tipJarCurrency = Currency.getSoftCurrency(0);
        }

        console.log("Logged in: ", "fake_login", this._playerData);
    }

    public loadPlayerDataFromDisk()
    {
        // TODO: Asyncronize this
        let dataString = sys.localStorage.getItem(PlayerDataManager.PLAYER_DATA_KEY);

        this._isBrokenPlayerData = false;

        if (dataString === null || dataString === undefined)
        {
            // No player data
            this._playerData = null;

            this.createNewProfile();
        }
        else
        {
            // Has player data
            let data = JSON.parse(dataString);
            if (data !== null && data !== undefined)
            {
                // Valid player data
                this._playerData = data;
                this.loadDataHelper();

                this.loadPuzzleStaticticsFromDiskHelper();
            }
            else
            {
                // Broken player data
                this._playerData = null;
                this._isBrokenPlayerData = true;

                // TODO: Maybe try to load backup?
                this.createNewProfile();
            }
        }

        MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_PROFILE_LOADED, MissionManager.getBaseMissionArg());
        console.log("Player Data:", this._playerData);
    }

    public loadPlayerDataFromServer(json: object)
    {
        // TODO
    }

    public savePlayerDataToDisk()
    {
        this._playerData.currencies.forEach((c) => {
            let newVal = this._currencies.get(c.nameString);
            c.amount = newVal.amount;
        });

        this._playerData.parkFacilities = [...this._parkFacilities];
        this._playerData.inventoryFacilities = [...this._inventoryFacilities.values()];
        this._playerData.missionRecord = PlayerMissionRecord.clone(this._missionRecord);

        this._playerData.puzzleInventory.hammerCount = this._boosterCount.get(Booster.BREAK);
        this._playerData.puzzleInventory.rotateCount = this._boosterCount.get(Booster.ROTATE);
        this._playerData.puzzleInventory.renewCount = this._boosterCount.get(Booster.RENEW);

        this._playerData.hasDog = this._hasDog;
        this._playerData.tutorialPlayed = this._tutorialPlayed;
        this._playerData.adFree = this._adFree;
        this._playerData.catTypeServed = [...this._catTypeServed];

        this._playerData.hasCheckIn = this._hasCheckIn;
        this._playerData.lastCheckinDate = this._lastCheckinDate;
        this._playerData.checkinIndex = this._checkinIndex;

        this._playerData.lastModifiedDate = new Date();

        let dataString = JSON.stringify(this._playerData);

        console.log("Saved data: ", this._playerData);
        sys.localStorage.setItem(PlayerDataManager.PLAYER_DATA_KEY, dataString);
        MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_PROFILE_SAVED, MissionManager.getBaseMissionArg());

    }

    public savePlayerDataToServer()
    {
        // TODO
    }

    public resetPlayerData()
    {
        sys.localStorage.removeItem(PlayerDataManager.PLAYER_DATA_KEY);
        sys.localStorage.removeItem(PlayerDataManager.PLAYER_PUZZLE_HIGHSCORE);
    }

    public createNewProfile()
    {
        this._playerData = this._newProfileData.clone();
        this.loadDataHelper();

        // Create statistics
        this._puzzleStatistics = new PuzzleStatistics();

        MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_NEW_PROFILE_CREATED, MissionManager.getBaseMissionArg());
    }

    private loadDataHelper()
    {
        this._currencies = new Map<string, Currency>();
        this._playerData.currencies.forEach((c) =>
        {
            let a = new Currency();
            a.nameString = c.nameString;
            a.amount = c.amount;
            this._currencies.set(c.nameString, a);
        })

        this._parkFacilities = [...this._playerData.parkFacilities];

        this._inventoryFacilities = new Map<string, Object>();
        this._playerData.inventoryFacilities.forEach((f) =>
        {
            this._inventoryFacilities.set(f["id"], f);
        })

        this._missionRecord = PlayerMissionRecord.clone(this._playerData.missionRecord);

        this._boosterCount = new Map<Booster, number>();
        this._boosterCount.set(Booster.BREAK, this._playerData.puzzleInventory.hammerCount);
        this._boosterCount.set(Booster.ROTATE, this._playerData.puzzleInventory.rotateCount);
        this._boosterCount.set(Booster.RENEW, this._playerData.puzzleInventory.renewCount);

        this._hasDog = this._playerData.hasDog;
        this._tutorialPlayed = this._playerData.tutorialPlayed;
        this._adFree = this._playerData.adFree;
        this._catTypeServed = [...this._playerData.catTypeServed];

        this._hasCheckIn = this._playerData.hasCheckIn;
        this._lastCheckinDate = this._playerData.lastCheckinDate;
        this._checkinIndex = this._playerData.checkinIndex;
    }


    // Server params getters

    public getPlayerAddInventoryParams(toyId: string, level: number): object
    {
        return {
            toyId: toyId,
            level: level,
            player: this.getDeviceId()
        }
    }

    // Things getters, setters

    public getDeviceId(): string
    {
        return sys.localStorage.getItem(PlayerDataManager.PLAYER_ID_KEY);
    }

    public getName(): string
    {
        return sys.localStorage.getItem(PlayerDataManager.PLAYER_NAME_KEY);
    }

    public setName(value: string)
    {
        this._playerData.name = value;
        this.savePlayerDataToDisk();
    }

    public setCurrency(value: Currency)
    {
        let last = this._currencies.get(value.nameString);
        this._currencies.set(value.nameString, value);

        let arg = MissionManager.getBaseMissionArg();
        arg.coin = [MISSION_ARG_TYPE_ADD, value.nameString === SOFT_CURRENCY ? value.amount : 0];
        arg.gem = [MISSION_ARG_TYPE_ADD, value.nameString === HARD_CURRENCY ? value.amount : 0];
        arg.fish = [MISSION_ARG_TYPE_ADD, value.nameString === FISH_CURRENCY ? value.amount : 0];

        MainGameManager.instance.gameEventManager.emit(
            GameEvent.EVENT_CURRENCY_CHANGE, arg, value.nameString, last, this._currencies.get(value.nameString).amount);
        
        this.savePlayerDataToDisk();
	}

	public getCurrency(currencyNameString: string): number
	{
		if (this._currencies.has(currencyNameString))
		{
            return this._currencies.get(currencyNameString).amount;
		}

		return 0;
	}


	public addCurrency(value: Currency)
	{
		if (this._currencies.has(value.nameString))
        {
            let last = this._currencies.get(value.nameString).amount;
            this._currencies.get(value.nameString).amount += value.amount;

            let arg = MissionManager.getBaseMissionArg();
            arg.coin = [MISSION_ARG_TYPE_ADD, value.nameString === SOFT_CURRENCY ? value.amount : 0];
            arg.gem = [MISSION_ARG_TYPE_ADD, value.nameString === HARD_CURRENCY ? value.amount : 0];
            arg.fish = [MISSION_ARG_TYPE_ADD, value.nameString === FISH_CURRENCY ? value.amount : 0];

            MainGameManager.instance.gameEventManager.emit(
                GameEvent.EVENT_CURRENCY_CHANGE, arg, value.nameString, last, this._currencies.get(value.nameString).amount);
            MainGameManager.instance.gameEventManager.emit(
                GameEvent.EVENT_CURRENCY_ADD, arg, value.nameString, value.amount, this._currencies.get(value.nameString).amount);
            
            this.savePlayerDataToDisk();
		}
	}

	public checkBalance(value: Currency): boolean
	{
		if (this._currencies.has(value.nameString))
		{
			return this._currencies.get(value.nameString).amount >= value.amount;
		}

		return false;
	}

	public subtractCurrency(value: Currency): boolean
	{
		let hasEnough = this.checkBalance(value);
		if (hasEnough)
        {
            let last = this._currencies.get(value.nameString).amount;
            this._currencies.get(value.nameString).amount -= value.amount;

            let arg = MissionManager.getBaseMissionArg();
            arg.coin = [MISSION_ARG_TYPE_ADD, value.nameString === SOFT_CURRENCY ? value.amount : 0];
            arg.gem = [MISSION_ARG_TYPE_ADD, value.nameString === HARD_CURRENCY ? value.amount : 0];
            arg.fish = [MISSION_ARG_TYPE_ADD, value.nameString === FISH_CURRENCY ? value.amount : 0];

            MainGameManager.instance.gameEventManager.emit(
                GameEvent.EVENT_CURRENCY_CHANGE, arg, value.nameString, last, this._currencies.get(value.nameString).amount);
            MainGameManager.instance.gameEventManager.emit(
                GameEvent.EVENT_CURRENCY_LOSE, arg, value.nameString, value.amount, this._currencies.get(value.nameString).amount);
            
            this.savePlayerDataToDisk();
		}

		return hasEnough;
    }

    public getParkFacilities(): string[]
    {
        return this._parkFacilities.map(c => c["id"]);
    }

    public setParkFacility(index: number, id: string)
    {
        let oldId = this._parkFacilities[index]["id"];
        this._parkFacilities[index]["id"] = id;

        let missionArg1 = MissionManager.getBaseMissionArg();
        let missionArg2 = MissionManager.getBaseMissionArg();
        missionArg2[id] = [MISSION_ARG_TYPE_MAX, this.getFacilityInParkCount(id)];

        MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_PARK_REMOVE_FACILITY, missionArg1,
            oldId, index);
        MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_PARK_SET_FACILITY, missionArg2,
            id, index);
        
        this.savePlayerDataToDisk();
    }

    public clearParkFacility()
    {
        for (let i = 0; i < this._parkFacilities.length; ++i)
        {
            this._parkFacilities[i]["id"] = "empty";
        }
    }

    public getTipJarCurrency(): [boolean, Currency]
    {
        if (this._tipJarCurrency === null || this._tipJarCurrency === undefined || this._tipJarCurrency.amount === 0)
        {
            return [false, null];
        }
        else
        {
            return [true, this._tipJarCurrency.clone()];
        }
    }

    public setTipJarCurrencyAsTaken()
    {
        if (this._tipJarCurrency !== null && this._tipJarCurrency !== undefined)
        {
            this._tipJarCurrency = null;
        }
    }

    /**
     * DO NOT USE
     * 
     * TODO: DEPRECATED, PLEASE REMOVE
     * 
     * @deprecated
     * @returns 
     */
    public getAllInventoryFacilityIds(): string[]
    {
        let res: string[] = [];
        for (let [key, obj] of this._inventoryFacilities)
        {
            res.push(obj["id"]);
        }

        return res;
    }

    public getFacilityAvailableCount(id: string): number
    {
        return this.getFacilityTotalCount(id) - this.getFacilityInParkCount(id);
    }

    /**
     * Get how many facilities of the same id the player has
     * @param id the id
     * @returns the amount
     */
    public getFacilityTotalCount(id: string): number
    {
        if (this._inventoryFacilities.has(id))
        {
            return this._inventoryFacilities.get(id)["amount"];
        }
        else
        {
            return 0;
        }
    }

    /**
     * Gets how many facilities of this type does player has in park.
     * @param id the id
     * @returns the amount
     */
    public getFacilityInParkCount(id: string): number
    {
        let count = 0;
        for (let facility of this._parkFacilities)
        {
            if (facility["id"] === id)
            {
                count += 1;
            }
        }

        return count;
    }

    /**
     * Gets all facility ids and how many of them the player has. This counts the amount set in park and in inventory.
     * 
     * Will not returns facilities that the player does not have.
     * 
     * @returns An array of [id: string, amount: number]. The result is sorted by id.
     */
    public getAllPlayerFacilityIds(): (readonly [string, number])[]
    {
        let result: (readonly [string, number])[] = [];
        for (let [_, value] of this._inventoryFacilities)
        {
            let id = value["id"];
            let count = value["count"]
            result.push([id, count]);
        }

        result.sort((a, b) => a[0].localeCompare(b[0]));
        return result;
    }

    /**
     * Gets all facility ids and how many of the that is in the inventory. If all is set in park, still includes but count is zero
     * 
     * Will not return faclities that player does not have, or has all set in park.
     * 
     * @returns An array of [id: string, amount: number]. The result is sorted by id.
     */
    public getAllAvailablePlayerFacilities(): (readonly [string, number])[]
    {
        let map = new Map<string, number>();

        for (let value of this._inventoryFacilities.values())
        {
            let id = value["id"];
            let count = value["amount"];
            map.set(value["id"], value["amount"]);
        }

        for (let facility of this._parkFacilities)
        {
            var id = facility["id"];
            if (id === "empty") continue;

            if (!this._inventoryFacilities.has(id))
            {
                console.warn(`Player data has facility id ${id} but this does not exist in facility inventory, something has went wrong, please check.`);
            }

            map.set(id, map.get(id) - 1);
        }

        let result: (readonly [string, number])[] = [];
        for (let [id, count] of map) {
            result.push([id, count]);
        }

        result.sort((a, b) => this.compareId(a[0], b[0]));

        return result;
    }

    /**
     * Adds a facility to inventory. Please remember that this does not check upper bounds, so it can goes to infinity.
     * @param id Id of the facility to add.
     */
    public addFacilityToInventory(id: string, amount: number)
    {
        if (this._inventoryFacilities.has(id))
        {
            let curr = this._inventoryFacilities.get(id)["amount"];
            this._inventoryFacilities.get(id)["amount"] = curr + amount;
        }
        else
        {
            this._inventoryFacilities.set(id,
            {
                id: id,
                level: 1,
                amount: amount
            });
        }

        let missionArg = this.getAddFacilityMissionArg(id);
        MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_FACILITY_INVENTORY_ADD, missionArg,
            id, amount);
        
        this.savePlayerDataToDisk();
    }

    public getAddFacilityMissionArg(id: string): MissionArgument
    {
        let missionArg = MissionManager.getBaseMissionArg();
        missionArg[id] = [MISSION_ARG_TYPE_MAX, this.getFacilityTotalCount(id)];
        missionArg.all = [MISSION_ARG_TYPE_MAX, this.getAllPlayerFacilityIds().length];
        return missionArg;
    }

    /**
     * Gets the level of the facillity id
     * @param id the id
     * @returns the level
     */
    public getFacilityLevel(id: string): number
    {
        if (this._inventoryFacilities.has(id))
        {
            return this._inventoryFacilities.get(id)["level"];
        }
        else
        {
            return 0;
        }
    }

    /**
     * Sets facility level. Note that this does not check upper bounds.
     * @param id the id
     * @param level the level to set
     */
    public setFacilityLevel(id: string, level: number)
    {
        if (level < 0 || !this._inventoryFacilities.has(id))
        {
            return;
        }

        var oldLevel = this._inventoryFacilities.get(id)["level"];
        this._inventoryFacilities.get(id)["level"] = level;
        let change = level - oldLevel;

        // TODO: Test this
        let missionArg = MissionManager.getBaseMissionArg();
        missionArg[id + "_level"] = [MISSION_ARG_TYPE_MAX, change];
        MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_FACILITY_INVENTORY_LEVEL_UP, missionArg,
            id, level);
        
        this.savePlayerDataToDisk();
    }

    public getPuzzleHighScore(): number
    {
        let value = sys.localStorage.getItem(PlayerDataManager.PLAYER_PUZZLE_HIGHSCORE);
        if (value === null)
        {
            sys.localStorage.setItem(PlayerDataManager.PLAYER_PUZZLE_HIGHSCORE, "0");
            return 0;
        }
        else
        {
            let intValue = parseInt(value);

            if (isNaN(intValue))
            {
                sys.localStorage.setItem(PlayerDataManager.PLAYER_PUZZLE_HIGHSCORE, "0");
                return 0;
            }
            else
            {
                return intValue;
            }
        }
    }

    public setPuzzleHighScore(value: number)
    {
        // TODO: better this
        sys.localStorage.setItem(PlayerDataManager.PLAYER_PUZZLE_HIGHSCORE, value.toString());
    }

    /**
     * Adds booster to player inventory.
     * @param boosterType type to add
     * @param count how many to add
     */
    public addPuzzleBooster(boosterType: Booster, count: number)
    {
        this._boosterCount.set(boosterType, this._boosterCount.get(boosterType) + count);

        this.savePlayerDataToDisk();
    }

    /**
     * Gets the booster count to player inventory.
     * @param boosterType type
     */
    public getPuzzleBoosterCount(boosterType: Booster): number
    {
        return this._boosterCount.get(boosterType);
    }


    /**
     * Uses one booster
     * @param boosterType booster to use
     * @returns whether this is allowed, if false: player has run out of booster.
     */
    public usePuzzleBooster(boosterType: Booster): boolean
    {
        if (this._boosterCount.get(boosterType) > 0)
        {
            this._boosterCount.set(boosterType, this._boosterCount.get(boosterType) - 1);
            this.savePlayerDataToDisk();
            return true;
        }

        return false;
    }

    public getCompletedMissionIds(): string[]
    {
        return this._missionRecord.completedMissions.map(x => x);
    }

    public setCompletedMissionIdsAsIs(ids: string[])
    {
        this._missionRecord.completedMissions = ids;
        this.savePlayerDataToDisk();
    }

    public getOngoingMissionProgresses(): MissionProgress[]
    {
        return [...this._missionRecord.onGoingMissionProgresses];
    }

    public setMissionProgressesAsIs(progresses: MissionProgress[])
    {
        this._missionRecord.onGoingMissionProgresses = progresses;
        this.savePlayerDataToDisk();
    }


    // Methods
    public addCompletedPuzzleSession(session: PuzzleSession)
    {
        if (session.sessionCompleted)
        {
            this._puzzleStatistics.completedSessions.push(new CompletedSessionData(Date.now(), session));
        }
        this.savePuzzleStaticticsToDisk();
    }

    public saveOngoingSession(session: PuzzleSession)
    {
        this._puzzleStatistics.onGoingSession = session;
        this.savePuzzleStaticticsToDisk();
    }

    public clearOngoingSession()
    {
        this._puzzleStatistics.onGoingSession = null;
        this.savePuzzleStaticticsToDisk();
    }

    public getOnGoingSession()
    {
        return this._puzzleStatistics.onGoingSession;
    }

    public getPlayerHasDog(): boolean
    {
        return this._hasDog;
    }

    public addDog()
    {
        if (!this._hasDog)
        {
            this._hasDog = true;
            MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_PARK_DOG_UNLOCKED, MissionManager.getBaseMissionArg());
            this.savePlayerDataToDisk();
        }
    }

    public getPlayerDoneTutorial(): boolean
    {
        return this._tutorialPlayed;
    }

    public setPlayerDoneTutorial()
    {
        this._tutorialPlayed = true;
        this.savePlayerDataToDisk();
    }

    public getIsAdFree(): boolean
    {
        return this._adFree;
    }

    public setAdFree(): void
    {
        this._adFree = true;
        this.savePlayerDataToDisk();
    }

    /**
     * @deprecated
     */
    public resetTutorial()
    {
        sys.localStorage.setItem("tut_done", "");
    }

    public getPuzzleStaticticsCSV(): string
    {
        if (!this._puzzleStatistics) return "";
        return PuzzleStatistics.toCSVString(this._puzzleStatistics);
    }

    private _preferenceCache: PlayerPreference = null;

    public getMusicOn(): boolean
    {
        if (!this._preferenceCache) this.loadPreference();

        return this._preferenceCache.musicOn;
    }

    public getSfxOn(): boolean
    {
        if (!this._preferenceCache) this.loadPreference();

        return this._preferenceCache.sfxOn;
    }

    public getLanguage(): string
    {
        if (!this._preferenceCache) this.loadPreference();

        return this._preferenceCache.language;
    }

    public setMusic(on: boolean)
    {
        if (!this._preferenceCache) this.loadPreference();

        this._preferenceCache.musicOn = on;

        this.savePreference();
    }

    public setSfx(on: boolean)
    {
        if (!this._preferenceCache) this.loadPreference();

        this._preferenceCache.sfxOn = on;

        this.savePreference();
    }

    public setLanguage(lan: string)
    {
        if (!this._preferenceCache) this.loadPreference();

        this._preferenceCache.language = lan;

        this.savePreference();
    }

    public setCatShowUp(id: string)
    {
        if (this._catTypeServed.indexOf(id) < 0)
        {
            this._catTypeServed.push(id);
        }

        let a = MissionManager.getBaseMissionArg();
        a.total = [ MISSION_ARG_TYPE_MAX, this._catTypeServed.length];
        MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_CAT_SHOW_UP, a, id);
        this.savePlayerDataToDisk();
    }

    public getCatTypesServed(): string[]
    {
        return [...this._catTypeServed];
    }

    private loadPreference()
    {
        let value = sys.localStorage.getItem(PlayerDataManager.PLAYER_PREFERENCE_KEY);

        if (!value)
        {
            this._preferenceCache = PlayerPreference.getNew();
        }
        else
        {
            try
            {
                this._preferenceCache = JSON.parse(value);
            }
            catch (e)
            {
                this._preferenceCache = PlayerPreference.getNew();
            }
        }
    }

    private savePreference()
    {
        sys.localStorage.setItem(PlayerDataManager.PLAYER_PREFERENCE_KEY, JSON.stringify(this._preferenceCache));
    }


    // Helpers
    private loadPuzzleStaticticsFromDiskHelper()
    {
        var stats = sys.localStorage.getItem(PlayerDataManager.PLAYER_PUZZLE_STATISTICS);
        if (stats)
        {
            this._puzzleStatistics = JSON.parse(stats) as PuzzleStatistics;
        }
        else
        {
            this._puzzleStatistics = new PuzzleStatistics();
        }
    }

    private savePuzzleStaticticsToDisk()
    {
        sys.localStorage.setItem(PlayerDataManager.PLAYER_PUZZLE_STATISTICS, JSON.stringify(this._puzzleStatistics));
    }

    private calculateTipJarCurrency(lastTime: Date, now: Date)
    {
        let T = (now.getTime() - lastTime.getTime()) / 1000;

        T = Math.min(5 * 3600, T);

        let pas = [];
        for (let f of this.getParkFacilities())
        {
            let facility = MainGameManager.instance.resourceManager.getFacilityData(f);
            let p = facility.payout[this.getFacilityLevel(f) - 1] ? facility.payout[this.getFacilityLevel(f) - 1].amount : 0;
            let t = facility.playTime !== 0 ? 1 / facility.playTime : 1;
            pas.push(p * T * t);
        }

        let value = Math.max(0, Math.floor(pas.reduce((t, curr) => t + curr, 0) / 50));
        let fluct = value * 0.1;

        value = value += randomRange(-fluct, fluct);
        console.log(value);

        this._tipJarCurrency = Currency.getSoftCurrency(Math.floor(value));
    }

    private compareId(a: string, b: string): number
    {
        let ax = a.lastIndexOf("Toy_");
        let bx = b.lastIndexOf("Toy_");
        if (ax !== -1 && bx !== -1)
        {
            ax = ax + 4;
            bx = bx + 4;

            let numa = parseInt(a.substring(ax));
            let numb = parseInt(b.substring(ax));

            if (isNaN(numa) || isNaN(numb))
            {
                return a.localeCompare(b);
            }
            else
            {
                return numa - numb;
            }
        }
        else
        {
            return a.localeCompare(b);
        }
    }
}

