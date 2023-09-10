import { _decorator, Button, CCBoolean, CCFloat, CCString, Component, EventHandler, Layout, Sprite, SpriteFrame, sys, Tween, tween, Vec3 } from 'cc';
import { LocalizedLabel } from '../LocalizedLabel';
import { MainGameManager } from '../../MainGame/MainGameManager';
import { GameSound } from '../../MainGame/Managers/AudioManager';
import { Currency, FISH_CURRENCY, formatCurrencyNumber, HARD_CURRENCY, SOFT_CURRENCY } from '../../PlayerData/Currency';
import { GameEvent } from '../../MainGame/Managers/GameEventManager';
import { UIButton } from './UIButton';
const { ccclass, property } = _decorator;

@ccclass('UIButtonCurrency')
export class UIButtonCurrency extends Component
{
	@property(SpriteFrame)
	private coinIcon: SpriteFrame;
	@property(SpriteFrame)
	private gemIcon: SpriteFrame;
	@property(SpriteFrame)
	private fishIcon: SpriteFrame;
	@property(Layout)
	private layout: Layout;
	@property(Sprite)
	private iconSprite: Sprite;
	@property(LocalizedLabel)
	private valueLabel: LocalizedLabel;
	@property(UIButton)
	private uiButton: UIButton;

	private _value: Currency;

	protected start(): void
	{
		this._value = Currency.getSoftCurrency(0);
		MainGameManager.instance.gameEventManager.on(GameEvent.EVENT_CURRENCY_CHANGE, this.onCurrencyChange, this);
		this.onCurrencyChange(this._value.nameString, 0, MainGameManager.instance.playerDataManager.getCurrency(this._value.nameString));
	}

	protected onDestroy(): void
	{
		MainGameManager.instance.gameEventManager.off(GameEvent.EVENT_CURRENCY_CHANGE, this.onCurrencyChange, this);
	}

	public setValue(currency: Currency)
	{
		this._value = currency.clone();

		var type = currency.nameString;

		if (type === SOFT_CURRENCY)
		{
			this.iconSprite.spriteFrame = this.coinIcon;
		}
		else if (type === HARD_CURRENCY)
		{
			this.iconSprite.spriteFrame = this.gemIcon;
		}
		else if (type === FISH_CURRENCY)
		{
			this.iconSprite.spriteFrame = this.fishIcon;
		}
		else
		{
			this.iconSprite.spriteFrame = null;
		}

		this.layout.updateLayout();
		this.valueLabel.stringRaw = formatCurrencyNumber(currency.amount);

		this.onCurrencyChange(this._value.nameString, 0, MainGameManager.instance.playerDataManager.getCurrency(this._value.nameString));
	}

	private onCurrencyChange(nameString: string, lastAmount: number, finalAmount: number)
	{
		if (this._value.nameString === nameString)
		{
			this.uiButton.interactable = this._value.amount <= finalAmount;
		}
	}
}

