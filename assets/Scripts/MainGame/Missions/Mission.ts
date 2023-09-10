import { Currency } from "../../PlayerData/Currency";
import { GameEvent } from "../Managers/GameEventManager";

export class Mission
{
	public id: string;					// Mission id.
	public nameString: string;			// String for mission name.
	public type: string; 				// "daily", "mission", or achievement.
	public imageId: string;
	public prerequisite: string;
	public eventsToCatch: GameEvent[];		// Events that this mission should catch.
	public eventParams: string[];		// Params to influence the count, this is hard-coded.
	public totalProgress: number;		// Total progress required.
	public payout: Currency[];			// Payout for compleing the mission.
	public goAction: string;

	public from(rec: Record<string, any>)
	{
		this.id = rec["id"] as string;
		this.nameString = rec["nameString"] as string;
		this.prerequisite = rec["prerequisite"] as string;

		this.type = rec["type"] as string;
		this.eventsToCatch = [];

		for (let eventName of rec["eventsToCatch"] as string[])
		{
			let event = GameEvent[eventName];
			this.eventsToCatch.push(event);
		}

		this.eventParams = rec["eventParams"] as string[];
		this.totalProgress = rec["totalProgress"] as number;
		this.imageId = rec["imageId"] as string;
		this.goAction = rec["goAction"] as string;

		this.payout = [];
		for (let obj of rec["payout"])
		{
			let curr = new Currency();
			curr.nameString = obj.nameString;
			curr.amount = obj.amount;
			this.payout.push(curr);
		}
	}

	public clone(): Mission
	{
		let mission = new Mission();
		mission.id = this.id;
		mission.nameString = this.nameString;
		mission.type = this.type;
		mission.imageId = this.imageId;
		mission.prerequisite = this.prerequisite;
		mission.eventsToCatch = this.eventsToCatch.map(x => x);
		mission.eventParams = this.eventParams.map(x => x);
		mission.totalProgress = this.totalProgress;
		mission.payout = this.payout.map(x => x.clone());
		mission.goAction = this.goAction;

		return mission;
	}
}