import { _decorator, Toggle } from "cc";
import { PopupBase } from "../../../Common/UI/PopupBase";
import { MainGameManager } from "../../MainGameManager";
import { MUSIC_CHANNEL_NAME, SFX_CHANNEL_NAME } from "../../Managers/AudioManager";
import { Currency, formatCurrencyNumber, SOFT_CURRENCY } from "../../../PlayerData/Currency";
import { PlayerDataManager } from "../../Managers/PlayerDataManager";
import { UIButtonCurrency } from "../../../Common/UI/UIButtonCurrency";
import { LocalizedLabel } from "../../../Common/LocalizedLabel";

const { ccclass, property } = _decorator;

@ccclass('PopUpTip')
export class PopUpTip extends PopupBase
{
	@property(LocalizedLabel)
	private tipLabel: LocalizedLabel;
	
	private _value: Currency;

	private _onCollectButton: () => void;
	private _onDoubleButton: () => void;

	protected onHideStart(): void
	{
		super.onHideStart();

		this._onCollectButton = null;
		this._onDoubleButton = null;
	}

	public onCollectButton()
	{
		if (this._onCollectButton)
		{
			this._onCollectButton();
		}

		this.hide();
	}

	public setTip(value: Currency, onCollectButton: () => void, onDoubleButton: () => void)
	{
		if (value.nameString !== SOFT_CURRENCY)
		{
			throw new Error("PopupTip cannot receive currency other than value");
		}

		this._value = value.clone();
		this._onCollectButton = onCollectButton;
		this._onDoubleButton = onDoubleButton;

		this.tipLabel.stringRaw = "+" + formatCurrencyNumber(value.amount);
	}

	public onAdButton()
	{
		if (this._onDoubleButton)
		{
			this._onDoubleButton();
		}

		this.hide();
	}
}

