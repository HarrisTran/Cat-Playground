import { _decorator, Animation, AnimationClip, AnimationState, CCFloat, CCInteger, clamp, Component, Node, Sprite, SpriteFrame, Tween, tween, v3, Vec3 } from 'cc';
import { CatFoodData } from './CatFoodData';
import { MainGameManager } from '../MainGameManager';
import { GameSound } from '../Managers/AudioManager';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { VFXCallback } from '../../VFXs/VFXCallback';
import { Currency, SOFT_CURRENCY } from '../../PlayerData/Currency';
import { GamePopupCode } from '../../Common/UI/GamePopupCode';
import { PopUpTip } from '../UI/PopUp/PopUpTip';
import { GameEventManager } from '../Managers/GameEventManager';
const { ccclass, property } = _decorator;

@ccclass('TipJar')
export class TipJar extends Component
{
    @property(Node)
    private notification: Node;
    @property(Sprite)
    private sprite: Sprite;
    @property(SpriteFrame)
    private spriteEmpty: SpriteFrame;
    @property(SpriteFrame)
    private spriteFull: SpriteFrame;

    private _value: Currency = null;
    private _notificationTween: Tween<Node> = null;

    public setTip(value: Currency)
    {
        if (this._value === null)
        {
            this._value = Currency.getSoftCurrency(0);
        }

        if (value.nameString === SOFT_CURRENCY)
        {
            this._value.amount += value.amount;
            this.sprite.spriteFrame = this.spriteFull;
        }

        this.popNotification();
    }

    public setAsNoTip()
    {
        this._value = null;
        this.stopNotification();
        this.sprite.spriteFrame = this.spriteEmpty;
    }

    public onClick()
    {
        if (MainGameManager.instance.mainGameUI && MainGameManager.instance.mainGameUI.inventoryModeOn) return;

        if (this._value !== null && this._value.amount > 0)
        {
            tween(this.node)
                .to(0.1, { scale: v3(1.1, 1.1, 1) })
                .to(0.1, { scale: v3(1, 1, 1) })
                .start();

            var tipPopup = MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_TIP).getComponent(PopUpTip);
            tipPopup.setTip(this._value, () =>
            {
                let value = this._value.clone();
                MainGameManager.instance.playerDataManager.addCurrency(value);
                MainGameManager.instance.playerDataManager.setTipJarCurrencyAsTaken();
                this.setAsNoTip();
                this.stopNotification();
            }, () =>
            {
                let value = this._value.clone();
                value.amount *= 2;
                MainGameManager.instance.playerDataManager.addCurrency(value);
                MainGameManager.instance.playerDataManager.setTipJarCurrencyAsTaken();
                this.setAsNoTip();
                this.stopNotification();
            });
            tipPopup.show();
        }
    }

    private popNotification()
    {
        if (this._notificationTween === null)
        {
            this.notification.active = true;

            this._notificationTween =
                tween(this.notification).sequence(
                    tween(this.notification)
                        .to(2, { scale: new Vec3(1.2, 1.2, 1) }, {easing: "backInOut"}),
                    tween(this.notification)
                        .to(2, { scale: new Vec3(1, 1, 1) }, { easing: "backInOut" })).repeatForever().start();
        }
    }

    private stopNotification()
    {
        if (this._notificationTween)
        {
            this._notificationTween.stop();
            this._notificationTween = null;
            this.notification.scale = Vec3.ONE;
        }

        this.notification.active = false;
    }
}

