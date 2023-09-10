import { Currency } from "../../PlayerData/Currency";

export class CatFoodData
{
	id: string;
	nameString: string;
	description: string;
    price: Currency;
    queueCapacity: number;

	public from(rec: Record<string, any>)
	{
		this.id = rec["id"] as string;
		this.nameString = rec["nameString"] as string;
        this.description = rec["description"] as string;
        this.price = new Currency();
        this.price.nameString = rec["price"].nameString;
        this.price.amount = rec["price"].amount;
		this.queueCapacity = rec["moveDelayTime"] as number;
	}

	public clone(): CatFoodData
	{
        let newData = Object.assign({}, this);
        newData.price = this.price.clone();
		return newData;
	}
}