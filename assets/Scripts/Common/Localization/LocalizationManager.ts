import { JsonAsset, resources, sys } from "cc";
import { IManager } from "../../MainGame/Managers/IManager";
import { ILocalizationSubscriber } from "./ILocalizationSubscriber";
import { MainGameManager } from "../../MainGame/MainGameManager";

export class LocalizationManager
{
	private static _instance: LocalizationManager;

	public static get instance(): LocalizationManager
	{
		if (!this._instance)
		{
			this._instance = new LocalizationManager();
		}

		return this._instance;
	}

	private static STRING_BANK_PATH = "Jsons/Localizations";
	private static USER_LANGUAGE_KEY = "user_lan";
	public static DEFAULT_LANGUAGE_CODE = "en";

	private _currentLanguage: string;
	private _stringBank: Record<string, any>;

	private _initialized: boolean = false;
	private _loadProgress: number;

	private _subscribers: Set<ILocalizationSubscriber> = new Set<ILocalizationSubscriber>();

	public allMissingKeys: Set<string> = new Set<string>();

	public initialize()
	{
		this.setLanguage(this.getUserLanguage());

		this._initialized = true;
	}

	public progress(): number
	{
		return this._loadProgress;
	}

	public initializationCompleted(): boolean
	{
		return this._initialized;
	}

	public setLanguage(languageCode: string)
	{
		this._currentLanguage = languageCode;

		this.loadLanguageStringBank();

		MainGameManager.instance.playerDataManager.setLanguage(this._currentLanguage);
	}

	public getString(key: string): readonly [boolean, string]
	{
		if (!this._initialized || !this._stringBank)
		{
			return [false, key];
		}

		let obj = this._stringBank[key];
		if (obj)
		{
			return [true, obj as string];
		}
		else
		{
			this.allMissingKeys.add(key);
			return [false, key];
		}
	}

	public subscribe(sub: ILocalizationSubscriber)
	{
		this._subscribers.add(sub);
	}

	public unsubscribe(sub: ILocalizationSubscriber)
	{
		this._subscribers.delete(sub);
	}

	public toggleLanguage()
	{
		if (this._currentLanguage === "en")
		{
			this.setLanguage("vi");
		}
		else
		{
			this.setLanguage("en");
		}
	}

	private loadLanguageStringBank()
	{
		this._loadProgress = 0;
		this._initialized = false;
		this._stringBank = null;
		resources.load(LocalizationManager.STRING_BANK_PATH + "/" + this._currentLanguage, JsonAsset, (finished, total, item) =>
		{
			this._loadProgress = finished / total;
		},
		(err, asset) =>
		{
			if (err)
			{
				console.error(err);
			}
			else
			{
				this._stringBank = asset.json;
			}

			this._loadProgress = 1;
			this._initialized = true;

			this.notifyRefresh();
		});
	}

	private getUserLanguage(): string
	{
		return MainGameManager.instance.playerDataManager.getLanguage();
	}

	private notifyRefresh()
	{
		for (let sub of this._subscribers)
		{
			sub.notifyRefreshLocalization();
		}
	}
}