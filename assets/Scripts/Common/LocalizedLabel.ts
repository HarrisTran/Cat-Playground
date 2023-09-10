import { __private, _decorator, CCString, Color, Component, Label, RichText } from 'cc';
import { LocalizationManager } from './Localization/LocalizationManager';
import { ILocalizationSubscriber } from './Localization/ILocalizationSubscriber';
const { ccclass, property, type } = _decorator;

export const STR_RAW_STRING = "STR_RAW_STRING";

@ccclass('LocalizedLabel')
export class LocalizedLabel extends Component implements ILocalizationSubscriber
{
	private _stringKey: string = "";
	private _rawString: string = "";
	private _params: Map<string, string> = null;

	@property(Label)
	private label: Label;
	@property(RichText)
	private richText: RichText;

	public get stringKey(): string
	{
		return this._stringKey;
	}

	public set stringKey(value: string)
	{
		this._stringKey = value;

		if (this._stringKey === STR_RAW_STRING)
		{
			console.warn("stringKey should not be set to ", STR_RAW_STRING, " but it will run fine.");
		}

		this.refreshLabel();
	}

	public get stringRaw(): string
	{
		return this._rawString;
	}

	public set stringRaw(value: string)
	{
		this._stringKey = STR_RAW_STRING;
		this._rawString = value;

		this.refreshLabel();
	}

	public get color(): Color
	{
		return this.label ? this.label.color : Color.TRANSPARENT;
	}

	public set color(value: Color)
	{
		if (this.label)
			this.label.color = value;
	}

	public onLoad(): void
	{
		this._params = new Map<string, string>();
		if (this.label)
			this.stringKey = this.label.string.trim();
		else if (this.richText)
			this.stringKey = this.richText.string.trim();
	}

	public onEnable(): void
	{
		if (LocalizationManager.instance.initializationCompleted())
		{
			this.refreshLabel();
		}
		LocalizationManager.instance.subscribe(this);
	}

	public onDisable(): void
	{
		LocalizationManager.instance.unsubscribe(this);
	}

	public notifyRefreshLocalization()
	{
		if (this.stringKey === STR_RAW_STRING) return;
		this.refreshLabel();
	}

	public setParams(...args: (readonly [string, string])[])
	{
		for (let [paramName, value] of args)
		{
			if (this._params === null)
			{
				this._params = new Map<string, string>();
			}

			if (this._params.has(paramName))
			{
				this._params.delete(paramName);
			}
			this._params.set(paramName, value);
		}

		this.refreshLabel();
	}

	public clearParams()
	{
		this._params.clear();
		this.refreshLabel();
	}

	private replaceParams(str: string): string
	{
		if (this._params)
		{
			for (let [key, value] of this._params)
			{
				str = str.replace("{" + key + "}", value);
			}
		}

		return str;
	}

	private refreshLabel()
	{
		if (this.stringKey !== STR_RAW_STRING)
		{
			let [_, value] = LocalizationManager.instance.getString(this.stringKey);
			this._rawString = value;
		}

		let value = this._rawString;
		value = this.replaceParams(value);

		if (this.label)
			this.label.string = value;
		
		if (this.richText)
			this.richText.string = value;
	}
}
