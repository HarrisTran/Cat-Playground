import { _decorator, CCBoolean, CCFloat, Component, Game, lerp, Node, Sprite, SpriteFrame, tween, UIOpacity, Vec3 } from 'cc';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { Currency } from '../../PlayerData/Currency';
import { getQuadLerper } from '../../Utilities/QuadraticInterpolation';
import { VFXCallback } from '../../VFXs/VFXCallback';
import { MainGameManager } from '../MainGameManager';
import { GameSound } from '../Managers/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('TrashItem')
export class TrashItem extends Component
{
    @property(Node)
    private appearanceNode: Node;
    @property(Sprite)
    private appearanceSprite: Sprite;
    @property(VFXCallback)
    private vfx: VFXCallback;
    @property(LocalizedLabel)
    private valueText: LocalizedLabel;
    @property(UIOpacity)
    private valueTextOapcity: UIOpacity;
    @property([SpriteFrame])
    private trashSprites: SpriteFrame[] = [];
    @property(CCBoolean)
    private isTutorial: boolean = false;

    @property(CCFloat)
    private dropUpDist: number = 20;
    @property(CCFloat)
    private dropTime: number = 0.4;

    @property(CCFloat)
    private collectFlyDist: number = 50;
    @property(CCFloat)
    private animTime: number = 0.2;
    @property(CCFloat)
    private fadeTime: number = 0.2;

    private _value: Currency;
    private _identifier: string;

    private _canCollect: boolean = false;

    private _tween: any = null;


    public get identifier(): string
    {
        return this._identifier;
    }

    public set identifier(value: string)
    {
        this._identifier = value;
    }

    protected start()
    {
        this.valueText.node.active = false;
    }

    protected onDestroy(): void
    {
        if (this._tween) {
            this._tween.stop();
        }
    }

    public setMoney(value: Currency)
    {
        this._value = value.clone();
        this.valueText.stringRaw = "+" + this._value.amount.toString();
    }

    public dropImmediately(toWhere: Vec3) {
        this._canCollect = true;
        this.node.worldPosition = toWhere;
    }

    public drop(toWhere: Vec3) {
        // TODO:
        // Play drop anim, code this in.
        let fromWhere = this.node.worldPosition;
        let mid = new Vec3((fromWhere.x + toWhere.x) / 2, fromWhere.y + this.dropUpDist, fromWhere.z);

        let quadLerper = getQuadLerper(fromWhere, mid, toWhere);

        let node = this.node;
        let tweenTarget = { t: 0 };

        this._tween = tween(tweenTarget).to(this.dropTime, { t: 1 },
            {
                easing: "quadOut",
                onUpdate: (target: any, ratio) => {
                    let t = target.t;
                    let x = lerp(fromWhere.x, toWhere.x, t);
                    let y = quadLerper(x);
                    node.worldPosition = new Vec3(x, y, node.worldPosition.z);
                },
                onComplete: (target) => {
                    this._canCollect = true;
                    this._tween = null;
                },
            }).start();
    }

    public onClick()
    {
        if (this._canCollect || this.isTutorial)
        {
            this.vfx.requestPlayDefaultClip();

            if (this.isTutorial)
            {
                this.valueText.stringRaw = "";
                this.playCollectAnim(null);
            }
            else
            {
                MainGameManager.instance.parkManager.collectTrash(this);
            }

            MainGameManager.instance.audioManager.playSfx(GameSound.UI_GRABOBJECT);
        }
    }

    public setSpriteIndex(index: number)
    {
        this.appearanceSprite.spriteFrame = this.trashSprites[index % this.trashSprites.length];
    }

    public playCollectAnim(onCompleteCallback?: () => void) {
        this.valueText.node.active = true;
        // this.valueText.string = "+" + this._value.amount;

        // TODO:
        // Play collect anim, code this in.
        this.appearanceNode.active = false;
        let opacityObj = this.valueTextOapcity;
        let node = this.node;
        tween(this.valueText.node).by(this.animTime, { position: new Vec3(0, this.collectFlyDist, 0) },
            {
                easing: "linear",
                onComplete: (target) => {
                    tween(opacityObj).to(this.fadeTime, { opacity: 0 },
                        {
                            easing: "quadOut",
                            onComplete(target) {
                                if (onCompleteCallback)
                                    onCompleteCallback();
                                node.destroy();
                                this._tween = null;
                            },
                        })
                        .start();
                },
            }).start();
    }

    public destroySelf() {
        this.node.destroy();
    }
}