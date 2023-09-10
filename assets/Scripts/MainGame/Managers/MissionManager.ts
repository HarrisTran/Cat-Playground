import { _decorator, AudioClip, clamp, Component, Game, JsonAsset, log, Node, resources, SpriteAtlas, SpriteFrame } from 'cc';
import { Mission } from '../Missions/Mission';
import { MainGameManager } from '../MainGameManager';
import { MissionProgress } from '../../PlayerData/PlayerData';
import { GameEvent } from './GameEventManager';
import { MersenneTwister } from '../../Utilities/MersenneTwister';
import { GamePopupCode } from '../../Common/UI/GamePopupCode';
import { FacilityData } from '../Facilities/FacilityData';
const { ccclass, property } = _decorator;

/**
 * Class that governs player's reward and actions toward said reward.
 * This includes:
 *
 * - Dailiy rewards
 * - Missions and their progresses
 * - Achievements
 * 
 * Note that these rewards and their progresses do count towards player data.
 */
export class MissionManager
{
	private static readonly MISSION_DATA_PATH = "Jsons/Missions"
	private static readonly MISSION_SPRITE_PATH = "Sprites/MissionItemSprites"

	private _initializedJson: boolean = false;
	private _initializedSprites: boolean = false;
	private _jsonProgress: number = 0;
	private _spriteProgress: number = 0;

	private _allMissionMap: Map<string, Mission>;
	private _allMissionSprites: Map<string, SpriteFrame>;
	private _allDailyMissions: string[];

	private _activeMissions: Set<string>;
	private _ongoingProgresses: Map<string, MissionProgress>;
	private _completedMissions: Set<string>;
	private _missionSubsribeMap: Map<GameEvent, Set<string>>;

	public initialize()
	{
		this._jsonProgress = 0;
		this._initializedJson = false;
		// Load all missions
		resources.loadDir(MissionManager.MISSION_DATA_PATH, JsonAsset,
			(finished, total, item) =>
			{
				this._jsonProgress = finished / total;
			},
			(err, datas) => 
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					this._allMissionMap = new Map<string, Mission>();
					this._allDailyMissions = [];
					for (let data of datas)
					{
						let json = data.json;
						let mission = new Mission();
						mission.from(json);

						this._allMissionMap.set(mission.id, mission);

						if (mission.type === "daily")
						{
							this._allDailyMissions.push(mission.id);
						}
					}

					this._allDailyMissions.sort();
					this.loadMissionProgresses();
				}

				this._jsonProgress = 1;
				this._initializedJson = true;
			});

		this._spriteProgress = 0;
		this._initializedSprites = false;
		resources.loadDir(MissionManager.MISSION_SPRITE_PATH, SpriteAtlas,
			(finished, total, item) => {
				this._spriteProgress = finished / total;
			},
			(err, datas) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					this._allMissionSprites = new Map<string, SpriteFrame>();
					for (let atlas of datas)
					{
						for (let frame of atlas.getSpriteFrames())
						{
							let name = frame.name;
							this._allMissionSprites.set(name, frame);
						}
					}
				}

				this._spriteProgress = 1;
				this._initializedSprites = true;
			});
	}

	public progress(): number
	{
		let arr = [this._jsonProgress, this._spriteProgress];
		return arr.reduce((t, curr) => t + curr, 0) / arr.length;
	}

	public initializationCompleted(): boolean
	{
		let arr = [this._initializedJson, this._initializedSprites];
		return arr.every(x => x);
	}

	public getMission(id: string): Mission
	{
		return this._allMissionMap.get(id);
	}

	public getProgress(id: string): MissionProgress
	{
		return this._ongoingProgresses.get(id);
	}

	public getMissionSprite(spriteId: string): SpriteFrame
	{
		return this._allMissionSprites.get(spriteId);
	}

	public getIfTabsHasRewards(): boolean[]
	{
		let res = [false, false, false];
		for (let [id, progress] of this._ongoingProgresses)
		{
			let mission = this.getMission(id);

			let i = mission.type === "mission" ? 0 : (mission.type === "daily" ? 1 : 2);

			if (res[i]) continue;

			if (progress.progress >= mission.totalProgress)
			{
				res[i] = true; 
			}
		}

		return res;
	}

	public getAllDailyMissions(): string[]
	{
		return this._allDailyMissions.map(x => x);
	}

	public loadMissionProgresses()
	{
		// Load completed progresses
		this._completedMissions = new Set<string>(MainGameManager.instance.playerDataManager.getCompletedMissionIds());

		// Get the daily missions

		// Get active missions by cross checking prerequisites
		this._activeMissions = new Set<string>();
		for (let [id, mission] of this._allMissionMap)
		{
			// If completed, don't add
			if (this._completedMissions.has(id)) continue;

			// If has prerequisite and prerequisite is not completed, don't add
			let prerequisite = mission.prerequisite;
			if (prerequisite != "" && !this._completedMissions.has(prerequisite)) continue;

			// Add
			this._activeMissions.add(id);
		}

		// Load ongoing progresses
		let progresses = MainGameManager.instance.playerDataManager.getOngoingMissionProgresses();

		// Cross check with active map
		this._ongoingProgresses = new Map<string, MissionProgress>();
		for (let progress of progresses)
		{
			// Only if the mission is active does progress has any meanings
			if (this._allMissionMap.has(progress.missionId))
			{
				this._ongoingProgresses.set(progress.missionId, MissionProgress.clone(progress));
			}
		}

		// Add any missing
		for (let activeMission of this._activeMissions)
		{
			if (!this._ongoingProgresses.has(activeMission))
			{
				let progress = new MissionProgress();
				progress.missionId = activeMission;
				progress.progress = 0;
				progress.receivedReward = false;
				this._ongoingProgresses.set(activeMission, progress);
			}
		}


		// Verify completion
		for (let progress of progresses)
		{
			if (progress.progress >= this.getMission(progress.missionId).totalProgress)
			{
				// TODO: Complete mission
				this.requestMarkCompleteMission(progress.missionId);
			}
		}


		// Subscribe game event
		this._missionSubsribeMap = new Map<GameEvent, Set<string>>;
		for (let mp of this._ongoingProgresses.values())
		{
			for (let event of MissionProgress.getEventsToCatch(mp))
			{
				if (!this._missionSubsribeMap.has(event)) this._missionSubsribeMap.set(event, new Set<string>());

				this._missionSubsribeMap.get(event).add(mp.missionId);
			}
		}

		// Check for daily reset

		if (MainGameManager.instance.playerDataManager.shouldRefreshDaily)
		{
			MainGameManager.instance.playerDataManager.shouldRefreshDaily = false;
			this.resetDailyMissions();
		}

		// Check if purchase missions are already done
		this.immediatelyCheckCompletion();
	}

	public saveMissionProgresses()
	{
		console.log(this._ongoingProgresses);
		MainGameManager.instance.playerDataManager.setCompletedMissionIdsAsIs([...this._completedMissions]);
		MainGameManager.instance.playerDataManager.setMissionProgressesAsIs([...this._ongoingProgresses.values()]);
	}

	public resetDailyMissions()
	{
		for (let [id, progress] of this._ongoingProgresses)
		{
			if (this.getMission(progress.missionId).type === "daily")
			{
				progress.progress = 0;
			}
		}

		for (let id of this._completedMissions)
		{
			let mission = this.getMission(id);
			if (mission.type === "daily")
			{
				this._completedMissions.delete(id);
			}
		}

		this.saveMissionProgresses();
	}

	public requestMarkCompleteMission(id: string)
	{
		if (this._ongoingProgresses.has(id))
		{
			MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_COMPLETE_MISSION, MissionManager.getBaseMissionArg(), id);

			console.log("Mission " + id + " is marked as completed");
		}
		else
		{
			console.warn("Mission with id \"" + id + "\" has requested complettion, but is not in active mission list. Please check.");
		}
	}

	public collectRewardOf(id: string)
	{
		if (this._ongoingProgresses.has(id))
		{
			let mission = this.getMission(id);
			let progress = this.getProgress(id);

			if (progress.progress >= mission.totalProgress)
			{
				// TO DO: show collect popup or sth
				for (let payout of mission.payout)
				{
					MainGameManager.instance.playerDataManager.addCurrency(payout);
				}

				console.log(`Mission ${id} is completed.`);

				// Remove
				this.moveOngoingToCompletedHelper(id);
			}
		}
	}

	private static readonly SHOW_INVENTORY = "show_inventory";
	private static readonly SHOW_STORE = "show_store";
	private static readonly PLAY_PUZZLE = "play_puzzle";
	private static readonly ADD_DOG = "add_dog";
	private static readonly DOG_BOOST = "dog_boost";

	public getMissionGoAction(missionId: string): () => void
	{
		var goAction = this.getMission(missionId).goAction;

		if (goAction === MissionManager.SHOW_INVENTORY)
		{
			return () => MainGameManager.instance.mainGameUI.activateInventoryMode();
		}
		else if (goAction === MissionManager.SHOW_STORE)
		{
			return () => MainGameManager.instance.mainGameUI.getPopupManager().showPopUp(GamePopupCode.POPUP_STORE);
		}
		else if (goAction === MissionManager.PLAY_PUZZLE)
		{
			return () => MainGameManager.instance.requestPlayPuzzle();
		}
		else if (goAction === MissionManager.ADD_DOG)
		{
			return () => MainGameManager.instance.playerDataManager.addDog();
		}
		else if (goAction === MissionManager.DOG_BOOST)
		{
			return () => MainGameManager.instance.catManager.requestBoostDog();
		}
		else
		{
			return null;
		}
	}

	public onGameEvent(event: GameEvent, missionArg: any)
	{
		if (!this.initializationCompleted()) return;

		if (missionArg !== undefined && missionArg != null && this._missionSubsribeMap.has(event))
		{
			let all = this._missionSubsribeMap.get(event);

			let completed: MissionProgress[] = [];
			for (let id of all)
			{
				let mission = this.getMission(id);
				let progress = this.getProgress(id);

				for (let param of mission.eventParams)
				{
					let arg = missionArg.hasOwnProperty(param) ? (missionArg[param] as [string, number]) : [MISSION_ARG_TYPE_ADD, 0];

					let value = progress.progress;

					if (arg[0] === MISSION_ARG_TYPE_ADD)
					{
						value += arg[1] as number;
					}
					else if (arg[0] === MISSION_ARG_TYPE_MAX)
					{
						value = Math.max(arg[1] as number, value);
					}

					progress.progress = value;

					if (progress.progress >= mission.totalProgress)
					{
						progress.progress = clamp(progress.progress, 0, mission.totalProgress);
						continue;
					}
				}

				if (progress.progress >= mission.totalProgress)
				{
					completed.push(progress);
				}
			}

			for (let p of completed)
			{
				this.requestMarkCompleteMission(p.missionId);
			}

			MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_MISSION_CHANGE, MissionManager.getBaseMissionArg());
			this.saveMissionProgresses();
		}
	}

	public getAllActiveMissionIds(): string[]
	{
		let res = [];
		for (let [key, progress] of this._ongoingProgresses)
		{
			res.push(progress.missionId);
		}

		return res;
	}

	public getActiveStoryMissionId(): string[]
	{
		let res = [];
		for (let [key, progress] of this._ongoingProgresses)
		{
			if (this.getMission(progress.missionId).type === "mission")
			{
				res.push(progress.missionId);
			}
		}

		return res;
	}

	public getActiveDailyMissionIds(): string[]
	{
		let res = [];
		for (let [key, progress] of this._ongoingProgresses)
		{
			if (this.getMission(progress.missionId).type === "daily")
			{
				res.push(progress.missionId);
			}
		}

		return res;
	}


	public getActiveAchievementIds(): string[]
	{
		let res = [];
		for (let [key, progress] of this._ongoingProgresses)
		{
			if (this.getMission(progress.missionId).type === "achievement")
			{
				res.push(progress.missionId);
			}
		}

		return res;
	}

	public getCompletedButNotCollectedMissions(): string[]
	{
		let result = []
		for (var [id, progress] of this._ongoingProgresses)
		{
			let mission = this.getMission(id);
			if (progress.progress >= mission.totalProgress)
			{
				result.push(id);
			}
		}

		return result;
	}

	private moveOngoingToCompletedHelper(id: string)
	{
		if (this._ongoingProgresses.has(id))
		{
			let progress = this._ongoingProgresses.get(id);
			progress.receivedReward = true;
			let mission = this._allMissionMap.get(id);

			this._ongoingProgresses.delete(id);
			this._activeMissions.delete(id);
			this._completedMissions.add(id);

			for (let event of mission.eventsToCatch)
			{
				if (!this._missionSubsribeMap.has(event)) continue;

				this._missionSubsribeMap.get(event).delete(id);
			}

			// Refresh mission list
			// TEMP: Just reload
			this.saveMissionProgresses();
			this.loadMissionProgresses();

			if (this.getCompletedButNotCollectedMissions().length === 0)
			{
				MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_MISSION_CHANGE, MissionManager.getBaseMissionArg());
				MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_COLLECTED_ALL_COMPLETE_MISSION, MissionManager.getBaseMissionArg());
			}
		}
	}

	private createDailyMissionsForDate(count: number, date: Date): string[]
	{
		let midnightDate = new Date(date);
		midnightDate.setHours(0, 0, 0, 0);
		let unixTime = midnightDate.valueOf();

		var twister = new MersenneTwister(unixTime);

		let res = [];
		for (let i = 0; i < count; ++i)
		{
			let index = twister.genrand_int31() % this._allDailyMissions.length;
			res.push(this._allDailyMissions[index]);
		}

		return res;
	}

	private immediatelyCheckCompletion()
	{
		// Check purchases
		for (let [playerToy, count] of MainGameManager.instance.playerDataManager.getAllPlayerFacilityIds())
		{
			let a = MainGameManager.instance.playerDataManager.getAddFacilityMissionArg(playerToy);
			this.onGameEvent(GameEvent.EVENT_FACILITY_INVENTORY_ADD, a);
		}

		// Check dog bought

		if (MainGameManager.instance.playerDataManager.getPlayerHasDog())
		{
			let a = MissionManager.getBaseMissionArg();
			this.onGameEvent(GameEvent.EVENT_PARK_DOG_UNLOCKED, a);
		}
	}

	public static getBaseMissionArg(): MissionArgument
	{
		return { one: [MISSION_ARG_TYPE_ADD, 1] };
	}

	public getNeededFacilityInStoryMission() : string
	{
		let storyMissionOngoing = this.getActiveStoryMissionId()[0];
        let mission =  this.getMission(storyMissionOngoing);
        let missionProgress = this.getProgress(storyMissionOngoing).progress;
		
        if(mission.eventsToCatch[0] === "EVENT_FACILITY_INVENTORY_ADD" && (missionProgress<mission.totalProgress)){
            let eventParam = mission.eventParams[0]; // id of facility;
			return eventParam;
            //let facilityData : FacilityData = MainGameManager.instance.resourceManager.getFacilityData(eventParam);
            // const softCurrency = facilityData.prices[0];
            // const fishCurrency = Currency.getFishCurrency(facilityData.blockRequired);
            
            // if(getPlayerDataManager().checkBalance(softCurrency) && getPlayerDataManager().checkBalance(fishCurrency))
            // {
            //     this.shopButton.node.getChildByName("Ping").active = true;
            //     MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_STORE).getComponent(PopUpStore).idNotification = eventParam;
            // }
        }
		return null;
	}
}

export const MISSION_ARG_TYPE_ADD: string = "add";
export const MISSION_ARG_TYPE_MAX: string = "max";
	
export interface MissionArgument
{
	[key: string]: [string, number]
}