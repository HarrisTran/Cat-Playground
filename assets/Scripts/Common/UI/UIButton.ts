import { _decorator, Button, CCBoolean, CCFloat, CCString, Component, EventHandler, Sprite, SpriteFrame, sys, Tween, tween, Vec3 } from 'cc';
import { LocalizedLabel } from '../LocalizedLabel';
import { MainGameManager } from '../../MainGame/MainGameManager';
import { GameSound } from '../../MainGame/Managers/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('UIButton')
export class UIButton extends Component
{
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Sprite })
	private backgroundSprite: Sprite;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Sprite })
	private spriteIcon: Sprite;
	@property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
	private label: LocalizedLabel;

	@property({ group: { name: "Components", id: "1", displayOrder: 1 } })
	private playSound: boolean = true;
	@property({ group: { name: "Components", id: "1", displayOrder: 1 } })
	private customSound: string = "default";

	@property({ group: { name: "Params", id: "1", displayOrder: 1 }, type: CCFloat })
	private scaleValue: number = 0.7;
	@property({ group: { name: "Params", id: "1", displayOrder: 1 }, type: CCFloat })
	private scaleTime: number = 0.15;

	@property({ group: { name: "Events", id: "2", displayOrder: 1 }, type: [EventHandler] })
	private clickEvents: EventHandler[] = [];

	private _onClickCallbacks: (() => void)[] = [];

	private _clicked: boolean = false;

	public get interactable()
	{
		return this.getComponent(Button).interactable;
	}

	public set interactable(value: boolean)
	{
		this.getComponent(Button).interactable = value;
	}

	public setIconSprite(spriteFrame: SpriteFrame)
	{
		if (this.spriteIcon)
		{
			this.spriteIcon.spriteFrame = spriteFrame;

			// Other options, if occured
		}
	}

	public setBackgroundSprite(spriteFrame: SpriteFrame)
	{
		if (this.backgroundSprite)
		{
			this.backgroundSprite.spriteFrame = spriteFrame;

			// Other options, if occured
		}
	}

	public setLabel(text: string)
	{
		if (this.label)
		{
			this.label.stringKey = text;
		}
	}

	public setOnClickCallback(callback: () => void)
	{
		if (callback)
		{
			this._onClickCallbacks.push(callback);
		}
	}

	public clearAllCallbacks()
	{
		this._onClickCallbacks = [];
	}

	public onClick()
	{
		// if (this._clicked) return;

		if (this.playSound)
		{
			if (this.customSound === "default")
			{
				MainGameManager.instance.audioManager.playSfx(GameSound.UI_CLICKSOUND);
			}
			else
			{
				let sound = this.customSound as GameSound;
				if (sound)
				{
					MainGameManager.instance.audioManager.playSfx(sound);
				}
				else
				{
					console.warn("Custom sound " + this.customSound + " does not exists");
				}
			}
		}

		if (MainGameManager.instance)
		{
			MainGameManager.instance.touchEffectHelper.requestVfxByPosition(this.node.worldPosition);
		}

		// this._clicked = true;

		// let a = tween(this.node).to(this.scaleTime, { scale: new Vec3(this.scaleValue, this.scaleValue, 1) }, {
		// 	easing: "quartIn",
		// 	onComplete: (target) =>
		// 	{
		// 		EventHandler.emitEvents(this.clickEvents);

		// 		for (let callback of this._onClickCallbacks)
		// 		{
		// 			callback();
		// 		}
		// 	}
		// });
		// let b = tween(this.node).to(this.scaleTime, { scale: Vec3.ONE }, {
		// 	easing: "backOut",
		// 	onComplete: (target) =>
		// 	{
		// 		this._clicked = false;
		// 	}
		// });

		// tween(this.node).sequence(a, b).start();

		EventHandler.emitEvents(this.clickEvents);

		for (let callback of this._onClickCallbacks)
		{
			callback();
		}
	}
}

