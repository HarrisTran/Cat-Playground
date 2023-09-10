export class DialogueData
{
	public count: number;
	public speakers: string[];
	public strings: string[];

	public from(rec: Record<string, any>)
	{
		this.count = rec["count"];
		this.strings = rec["strings"];
		this.speakers = rec["speakers"];
	}
}