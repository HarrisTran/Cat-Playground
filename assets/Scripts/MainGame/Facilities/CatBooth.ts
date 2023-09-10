import { _decorator, Animation, AnimationClip, AnimationState, CCFloat, CCInteger, clamp, Component, Node, Sprite, tween, v3, Vec3 } from 'cc';
import { CatFoodData } from './CatFoodData';
import { MainGameManager } from '../MainGameManager';
import { GameSound } from '../Managers/AudioManager';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { VFXCallback } from '../../VFXs/VFXCallback';
const { ccclass, property } = _decorator;

@ccclass('CatBooth')
export class CatBooth extends Component
{
    @property({ type: Node })
    private queuePositionHost: Node;
    @property(Sprite)
    private clickFillBar: Sprite;
    @property(LocalizedLabel)
    private valueText: LocalizedLabel;
    @property({ type: CCInteger })
    private fillStep: number = 10;
    @property({ type: CCInteger })
    private fillMax: number = 100;
    @property({ type: CCFloat })
    private cooldown: number = 1;
    @property(Node)
    private box : Node;
    @property(Animation)
    private animation: Animation;
    

    private _fillAmount: number = 0;
    private _isCoolingDown: boolean = false;
    private _cooldDownTimer: number = 0;

    protected onLoad(): void
    {
        
    }

    protected start(): void
    {
        this.setFillAmount(0);
        this.animation.play("MainCatIdleMasked");
        this.animation.on(Animation.EventType.FINISHED, this.onAnimationFinished, this)
    }

    protected update(dt: number): void
    {
        if (this._isCoolingDown)
        {
            this._cooldDownTimer -= dt;
            if (this._cooldDownTimer < 0)
            {
                this.exitCooldown();
            }

            this.clickFillBar.fillRange = this._cooldDownTimer / this.cooldown;
            this.valueText.stringRaw = `${clamp(Math.floor((this._cooldDownTimer / this.cooldown * this.fillMax) / 10) * 10, 0, this.fillMax)}/${this.fillMax}`;
        }
    }

    public getQueuePosition(index: number): Vec3
    {
        let base = this.queuePositionHost.children[index].worldPosition;
        // base.add(this.queuePositionHost.children[index].position);
        return base;
    }

    public setFillAmount(value: number)
    {
        this._fillAmount = clamp(value, 0, this.fillMax);
        this.clickFillBar.fillRange = this._fillAmount / this.fillMax;
        this.valueText.stringRaw = `${this._fillAmount}/${this.fillMax}`;
    }

    public isFilled(): boolean
    {
        return this._fillAmount === this.fillMax;
    }

    // Appearance

    private refreshAppearance()
    {
        // TODO
    }

    onAnimationFinished(type: Animation.EventType, state: AnimationState)
    {
        if (state.name === "MainCatPull")
        {
            this.animation.play("MainCatIdleMasked");
        }
    }


    // User interaction

    public onClick()
    {
        if (MainGameManager.instance.mainGameUI && MainGameManager.instance.mainGameUI.inventoryModeOn) return;
        
        if (this._isCoolingDown)
        {
            return;
        }

        this.setFillAmount(this._fillAmount + this.fillStep);
        MainGameManager.instance.audioManager.playSfx(GameSound.MAINGAME_CLICKCALLGUEST);

        tween(this.box)
            .to(0.1, { scale: v3(1, 1.1, 1) })
            .to(0.05, { scale: v3(1, 1, 1) })
        .start();
        
        if (this.isFilled())
        {
            this.animation.play("MainCatPull");
            MainGameManager.instance.catManager.increaseLuredCat();
            this.enterCooldown();
        }
    }

    private enterCooldown()
    {
        if (!this._isCoolingDown)
        {
            this._isCoolingDown = true;
            this._cooldDownTimer = this.cooldown;
            this.clickFillBar.fillRange = 1;
        }
    }

    private exitCooldown()
    {
        if (this._isCoolingDown)
        {
            this._isCoolingDown = false;
            this._fillAmount = 0;
            this.clickFillBar.fillRange = 0;
        }
    }
}

