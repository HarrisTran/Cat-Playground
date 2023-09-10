import { Currency } from "../../PlayerData/Currency";

export class FacilityData
{
	id: string;
	nameString: string;
	description: string;
	type: string;
	blockRequired: number;
	prices: Currency[];
	playTime: number;
	payout: Currency[];
	rechargeTime: number;

	public from(rec: Record<string, any>)
	{
		this.id = rec["id"] as string;
		this.nameString = rec["nameString"] as string;
		this.description = rec["description"] as string;
		this.type = rec["type"] as string;
		this.blockRequired = rec["blockRequired"] as number;
		this.prices = [];

		for (let obj of rec["prices"])
		{
			let price = new Currency();
			price.nameString = obj.nameString;
			price.amount = obj.amount;
			this.prices.push(price);
		}

		this.playTime = rec["playTime"] as number;

		this.payout = [];

		for (let obj of rec["payout"])
		{
			let curr = new Currency();
			curr.nameString = obj.nameString;
			curr.amount = obj.amount;
			this.payout.push(curr);
		}

		this.rechargeTime = rec["rechargeTime"] as number;
	}

	public clone(): FacilityData
	{
		let newData = Object.assign({}, this);
		newData.payout = this.payout.map((v) => 
		{
			return v.clone();
		})
		return newData;
	}
}