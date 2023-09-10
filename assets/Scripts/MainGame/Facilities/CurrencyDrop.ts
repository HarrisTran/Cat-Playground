import { _decorator, CCFloat, Component, Game, lerp, log, Node, tween, UIOpacity, Vec3 } from 'cc';
import { Currency } from '../../PlayerData/Currency';
import { MainGameManager } from '../MainGameManager';
import { getQuadLerper as get2DQuadLerper } from '../../Utilities/QuadraticInterpolation';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { VFXCallback } from '../../VFXs/VFXCallback';
import { GameSound } from '../Managers/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('CurrencyDrop')
export class CurrencyDrop extends Component
{
    @property(Node)
    private appearanceNode: Node;
    @property(VFXCallback)
    private vfx: VFXCallback;

    @property(CCFloat)
    private dropUpDist: number = 20;
    @property(CCFloat)
    private dropTime: number = 0.4;

    private _value: Currency;
    private _identifier: string;

    private _assignToBeCollectedByDog: boolean = false;
    private _canCollect: boolean = false;
    private _isCollected: boolean = false;

    private _tween: any = null;
    

    public get identifier(): string
    {
        return this._identifier;
    }

    public set identifier(value: string)
    {
        this._identifier = value;
    }

    public get assignedToBeColelctedByDog(): boolean
    {
        return this._assignToBeCollectedByDog;
    }

    public set assignedToBeColelctedByDog(value: boolean)
    {
        this._assignToBeCollectedByDog = value;
    }

    public get isCollected(): boolean
    {
        return this._isCollected;
    }

    protected start()
    {
        this.vfx.node.active = false;
        if (!MainGameManager.instance.tutorialManager.isPlayingTutorial)
        {
            let propagator = this.node.getComponentInChildren("TutorialPropagator");
            propagator.destroy();
        }
    }

    protected onDestroy(): void
    {
        if (this._tween)
        {
            this._tween.stop();
        }
    }

    public setMoney(value: Currency)
    {
        this._value = value.clone();
    }

    public dropImmediately(toWhere: Vec3)
    {
        this._canCollect = true;
        this.node.worldPosition = toWhere;
        this._isCollected = false;
    }

    public drop(toWhere: Vec3)
    {
        // TODO:
        // Play drop anim, code this in.
        let fromWhere = this.node.worldPosition;
        let mid = new Vec3((fromWhere.x + toWhere.x) / 2, fromWhere.y + this.dropUpDist, fromWhere.z);

        let quadLerper = get2DQuadLerper(fromWhere, mid, toWhere);

        let node = this.node;
        let tweenTarget = { t: 0 };

        MainGameManager.instance.audioManager.playSfx(GameSound.COIN_DROP);

        this._tween = tween(tweenTarget).to(this.dropTime, { t: 1 },
            {
                easing: "quadOut",
                onUpdate: (target: any, ratio) =>
                {
                    let t = target.t;
                    let x = lerp(fromWhere.x, toWhere.x, t);
                    let y = quadLerper(x);
                    node.worldPosition = new Vec3(x, y, node.worldPosition.z);
                },
                onComplete: (target) =>
                {
                    this._isCollected = false;
                    this._canCollect = true;
                    this._tween = null;
                },
            }).start();
    }

    public onClick()
    {
        if (this._canCollect && !this._isCollected)
        {
            this._isCollected = true;
            this.vfx.requestPlayDefaultClip();
            setTimeout(() => {
                MainGameManager.instance.parkManager.collectCurrency(this);
            }, 1000);

            MainGameManager.instance.audioManager.playSfx(GameSound.PUZZLE_GRABPUZZLE);
        }
    }

    public playCollectAnim(onCompleteCallback?: () => void)
    {
        MainGameManager.instance.currencyVfxSpawner.requestEffectToBar(this._value, this.node.worldPosition, onCompleteCallback,
            Math.min(5, Math.ceil(this._value.amount / 50)));
        this.destroySelf();
    }


    public destroySelf()
    {
        this.node.destroy();
    }
}


