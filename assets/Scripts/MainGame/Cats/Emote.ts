import { _decorator, CCFloat, Component, Node, Sprite, SpriteFrame, Tween, tween, v3, Vec3 } from 'cc';
import { MainGameManager } from '../MainGameManager';
import { Currency, SOFT_CURRENCY } from '../../PlayerData/Currency';
import { GamePopupCode } from '../../Common/UI/GamePopupCode';
import { PopUpTip } from '../UI/PopUp/PopUpTip';
const { ccclass, property } = _decorator;

export enum EmoteType
{
    NONE = 0,
    ANGRY = 1,
    COIN,
    EYE_GLARE
}

class TweenTarget
{
    public dummy: number
    }

@ccclass('Emote')
export class Emote extends Component
{
    @property([SpriteFrame])
    private emoteSprites: SpriteFrame[] = [];

    @property(Node)
    private appearance: Node;
    @property(Sprite)
    private sprite: Sprite;
    @property({ type: CCFloat })
    private flashTime: number = 0.5;
    @property(Vec3)
    private targetScale: Vec3 = new Vec3();

    private _type: EmoteType = EmoteType.NONE;
    private _moveTween: Tween<TweenTarget>;
    private _dummyTarget: TweenTarget;

    protected start(): void
    {
        this._moveTween = null;
        this._dummyTarget = null;
        this.appearance.scale = Vec3.ONE;
        this.appearance.active = false;
    }

    public activate(type: EmoteType, times: number)
    {
        if (this._type === type) return;
        if (type === EmoteType.NONE)
        {
            this.deactivate();
            return;
        }

        this._type = type;
        this.sprite.spriteFrame = this.emoteSprites[this._type];

        if (this._moveTween)
        {
            this.deactivate();
        }

        this.appearance.active = true;
        this._dummyTarget = new TweenTarget();
        this._dummyTarget.dummy = 0;
        this._moveTween =
            tween(this._dummyTarget).sequence(
                tween(this._dummyTarget)
                    .to(this.flashTime, { dummy: 1}, {onComplete: (_) => this.appearance.scale = this.targetScale.clone()}),
                tween(this._dummyTarget)
                    .to(this.flashTime, { dummy: 0 }, { onComplete: (_) => this.appearance.scale = Vec3.ONE }))
            .repeat(times)
            .call(() => this.deactivate())
            .start();
    }

    public deactivate()
    {
        if (this._moveTween)
        {
            this._moveTween.stop();
            this._moveTween = null;
            this._dummyTarget = null;
            this.appearance.scale = Vec3.ONE;
            this.appearance.active = false;
        }
    }
}

