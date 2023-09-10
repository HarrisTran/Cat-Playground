export class CatData
{
	id: string;
	nameString: string;
	description: string;
	moveSpeed: number;
	moveDelayTime: number;
	
	public from(rec: Record<string, any>)
	{
		this.id = rec["id"] as string;
		this.nameString = rec["nameString"] as string;
		this.description = rec["description"] as string;
		this.moveSpeed = rec["moveSpeed"] as number;
		this.moveDelayTime = rec["moveDelayTime"] as number;
	}
	
	public clone(): CatData
	{
		let newData = Object.assign({}, this);
		return newData;
	}
}