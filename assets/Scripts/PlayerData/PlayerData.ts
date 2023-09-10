import { clamp, sys } from "cc";
import { makeRandomId } from "../Common/MakeId";
import { MainGameManager } from "../MainGame/MainGameManager";
import { GameEvent } from "../MainGame/Managers/GameEventManager";
import { Mission } from "../MainGame/Missions/Mission";
import { Currency } from "./Currency";
import { LocalizationManager } from "../Common/Localization/LocalizationManager";

/**
 * Class to keep player playing data: name, levels, currencies, etc.
 */
export class PlayerData
{
	public deviceId: string;							// User id
	public name: string;								// Park name
	public currencies: Currency[];						// Player's currency balances.
	public parkFacilities: Object[];					// All facilities that players have.
	public inventoryFacilities: Object[];				// All facilities that players have.
	public missionRecord: PlayerMissionRecord;
	public puzzleInventory: PuzzleInventory;
	public hasDog: boolean;
	public tutorialPlayed: boolean;
	public adFree: boolean;
	public catTypeServed: string[];
	
	public questionReceivers: Record<string, Record<string, any>[]>;
	public hasCheckIn: boolean;
	public lastCheckinDate: Date;
	public checkinIndex: number;

	public lastModifiedDate: Date;


	// change record to class PlayerData
	public from(rec: Record<string, any>)
	{
		// Randomize device id
		this.deviceId = makeRandomId(64);
		this.name = rec["name"];

		this.currencies = rec["currencies"].map((c) =>
		{
			let curr = new Currency();
			curr.nameString = c.nameString;
			curr.amount = c.amount;
			return curr;
		});

		this.parkFacilities = rec["parkFacilities"] as Object[];
		this.inventoryFacilities = rec["inventoryFacilities"] as Object[];

		if (rec.hasOwnProperty("missionRecord"))
		{
			try {
				this.missionRecord = rec["missionRecord"] as PlayerMissionRecord;
			}
			catch (e)
			{
				this.missionRecord = new PlayerMissionRecord();
				this.missionRecord.completedMissions = [];
				this.missionRecord.onGoingMissionProgresses = [];
			}
		}
		else
		{
			this.missionRecord = new PlayerMissionRecord();
			this.missionRecord.completedMissions = [];
			this.missionRecord.onGoingMissionProgresses = [];
		}

		this.puzzleInventory = new PuzzleInventory();
		this.puzzleInventory.rotateCount = rec["puzzleInventory"].rotateCount;
		this.puzzleInventory.hammerCount = rec["puzzleInventory"].hammerCount;
		this.puzzleInventory.renewCount = rec["puzzleInventory"].renewCount;

		this.hasDog = rec["hasDog"];
		this.tutorialPlayed = rec["tutorialPlayed"];
		this.adFree = rec.hasOwnProperty("adFree") ? rec["adFree"] : false;
		this.catTypeServed = rec.hasOwnProperty("catTypeServed") ? rec["catTypeServed"] : [];

		this.questionReceivers = rec?.questionReceivers || {}
		this.hasCheckIn = rec?.isChecked || false;
		this.lastCheckinDate = rec?.timeCurrentChecked || new Date(1);
		this.checkinIndex = rec?.numCheckDate || 0;

		this.lastModifiedDate = new Date();
 	}

	public clone(): PlayerData
	{
		let newData = new PlayerData();
		newData.name = this.name;
		newData.currencies = this.currencies.map(c => c.clone());
		newData.parkFacilities = [...this.parkFacilities];
		newData.inventoryFacilities = [...this.inventoryFacilities];
		newData.missionRecord = PlayerMissionRecord.clone(this.missionRecord);
		newData.puzzleInventory = this.puzzleInventory.clone();
		newData.hasDog = this.hasDog;
		newData.tutorialPlayed = this.tutorialPlayed;
		newData.adFree = this.adFree;
		newData.catTypeServed = [...this.catTypeServed];

		newData.questionReceivers = JSON.parse(JSON.stringify(this.questionReceivers)) as Record<string, Record<string, any>[]>;	// TEMP
		newData.hasCheckIn = this.hasCheckIn;
		newData.lastCheckinDate = this.lastCheckinDate;
		newData.checkinIndex = this.checkinIndex;

		newData.lastModifiedDate = this.lastModifiedDate;

		return newData;
	}
}

export class PlayerMissionRecord
{
	public completedMissions: string[];
	public onGoingMissionProgresses: MissionProgress[];
	
	public static clone(c: PlayerMissionRecord): PlayerMissionRecord
	{
		let a = new PlayerMissionRecord();
		a.completedMissions = [...c.completedMissions];
		a.onGoingMissionProgresses = c.onGoingMissionProgresses.map(x => MissionProgress.clone(x));

		return a;
	}
}

export class MissionProgress
{
	public missionId: string;
	public progress: number;
	public receivedReward: boolean;

	public static getEventsToCatch(mp: MissionProgress): GameEvent[]
	{
		return MainGameManager.instance.missionManager.getMission(mp.missionId).eventsToCatch;
	}

	public static getEventParams(mp: MissionProgress): string[]
	{
		return MainGameManager.instance.missionManager.getMission(mp.missionId).eventParams;
	}

	public static clone(base: MissionProgress): MissionProgress
	{
		let res = new MissionProgress();
		res.missionId = base.missionId;
		res.progress = base.progress;
		res.receivedReward = base.receivedReward;

		return res;
	}
}

export class PuzzleInventory
{
	public rotateCount: number;
	public hammerCount: number;
	public renewCount: number;

	public clone(): PuzzleInventory
	{
		var res = new PuzzleInventory();
		res.rotateCount = this.rotateCount;
		res.hammerCount = this.hammerCount;
		res.renewCount = this.renewCount;
		return res;
	}
}

export class PlayerPreference
{
	public musicOn: boolean;
	public sfxOn: boolean;
	public language: string;

	public clone(): PlayerPreference
	{
		let pref = new PlayerPreference();
		pref.musicOn = this.musicOn;
		pref.sfxOn = this.sfxOn;
		pref.language = this.language;

		return pref;
	}

	public static getNew(): PlayerPreference
	{
		let pref = new PlayerPreference();
		pref.musicOn = true;
		pref.sfxOn = true;

		let lan = LocalizationManager.DEFAULT_LANGUAGE_CODE;
		try
		{
			let code = sys.languageCode.split('-')[0];

			if (code === "en") lan = "en";
			else if (code === "vi") lan = "vi";
			else throw new Error("Dummy error");
		}
		catch (e)
		{
			lan = LocalizationManager.DEFAULT_LANGUAGE_CODE;
		}

		pref.language = lan;

		return pref;
	}

}