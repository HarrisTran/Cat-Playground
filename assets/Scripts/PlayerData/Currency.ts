
export const SOFT_CURRENCY: string = "coin";
export const HARD_CURRENCY: string = "gem";
export const FISH_CURRENCY: string = "fish";
export const REAL_CURRENCY: string = "real";

const formatLookup =
[
	{ value: 1, symbol: "" },
	{ value: 1e3, symbol: "K" },
	{ value: 1e6, symbol: "M" },
	{ value: 1e9, symbol: "G" },
	{ value: 1e12, symbol: "T" },
	{ value: 1e15, symbol: "P" },
	{ value: 1e18, symbol: "E" }
	];

export function formatCurrencyNumber(n: number): string
{
	const rx = "/\.0+$|(\.[0-9]*[1-9])0+$/";
	var item = formatLookup.slice().reverse().find(function (item)
	{
		return n >= item.value;
	});

	if (item && item.symbol === "")
	{
		return n.toString();
	}

	return item ? (n / item.value).toFixed(1).replace(rx, "$1") + item.symbol : "0";
}

export class Currency
{

	public nameString: string;
	public amount: number;

	public get formattedAmount(): string
	{
		return formatCurrencyNumber(this.amount);
	}

	public clone(): Currency
	{
		let clone = new Currency();
		clone.nameString = this.nameString;
		clone.amount = this.amount;
		return clone;
	}

	public getRichTextString(formatted: boolean = true)
	{
		return formatted ? this.amount + `<img src='${this.nameString}'/>` : formatCurrencyNumber(this.amount);
	}

	public static getSoftCurrency(amount: number): Currency
	{
		let curr = new Currency();
		curr.nameString = SOFT_CURRENCY;
		curr.amount = amount;

		return curr;
	}

	public static getHardCurrency(amount: number): Currency
	{
		let curr = new Currency();
		curr.nameString = HARD_CURRENCY;
		curr.amount = amount;
		
		return curr;
	}
	
	public static getFishCurrency(amount: number): Currency
	{
		let curr = new Currency();
		curr.nameString = FISH_CURRENCY;
		curr.amount = amount;
		
		return curr;
	}

	public static getRealCurrency(amount: number): Currency
	{
		let curr = new Currency();
		curr.nameString = REAL_CURRENCY;
		curr.amount = amount;
		
		return curr;
	}

	public static compare(c1: Currency, c2: Currency): number
	{
		if (c1.nameString === c2.nameString)
		{
			return c1.amount - c2.amount;
		}
		else
		{
			if (c1.nameString === HARD_CURRENCY)
			{
				return 1;
			}
			else if (c1.nameString === SOFT_CURRENCY)
			{
				return -1;
			}
			else
			{
				throw new Error("Wrong name string cannot compare");
			}
		}
	}

	public toString(red: boolean) : string{
		if(red){
			return `<color=#dd3131>${this.formattedAmount}<img src="${this.nameString}"/></color>`;
		}
		return `<color=#23758D>${this.formattedAmount}<img src="${this.nameString}"/></color>`;
	}

	public multiply(n: number){
		let newCurrency = this.clone();
		newCurrency.amount = this.amount * n;
		return newCurrency;
	}
	
}
