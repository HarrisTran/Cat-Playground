import { _decorator, Button, Component, Node, Sprite } from 'cc';
import { PuzzleGameManager } from '../PuzzleGameManager';
import { Booster } from './Booster';
import { VFXCallback } from '../../VFXs/VFXCallback';
import { BoosterButton } from '../PuzzleComponents/BoosterButton';
import { MainGameManager } from '../../MainGame/MainGameManager';
import { GameEvent } from '../../MainGame/Managers/GameEventManager';
const { ccclass, property } = _decorator;

export interface IBoosterManager extends BoosterManager { }

@ccclass('BoosterManager')
export class BoosterManager extends Component
{
    @property(BoosterButton)
    private rotateButton: BoosterButton;
    @property(BoosterButton)
    private breakButton: BoosterButton;
    @property(BoosterButton)
    private renewButton: BoosterButton;


    private _boosterIsActive: boolean;
    private _activeBooster: Booster;

    public getDarkenableSprites(set: number): Sprite[]
    {
        if (set === 0)
        {
            let res: Sprite[] = [];
            if (MainGameManager.instance.playerDataManager.getPuzzleBoosterCount(Booster.BREAK) > 0)
            {
                res.push(this.breakButton.buttonSprite, this.breakButton.numbering);
            }
            if (MainGameManager.instance.playerDataManager.getPuzzleBoosterCount(Booster.RENEW) > 0)
            {
                res.push(this.renewButton.buttonSprite, this.renewButton.numbering);
            }
            return res;
        }
        else if (set === 1)
        {
            let res: Sprite[] = [];
            if (MainGameManager.instance.playerDataManager.getPuzzleBoosterCount(Booster.ROTATE) > 0)
            {
                res.push(this.rotateButton.buttonSprite, this.rotateButton.numbering);
            }
            if (MainGameManager.instance.playerDataManager.getPuzzleBoosterCount(Booster.RENEW) > 0)
            {
                res.push(this.renewButton.buttonSprite, this.renewButton.numbering);
            }
            return res;
        }

        return [];
    }

    protected onLoad()
    {
        this.rotateButton.setNumbering(0);
        this.breakButton.setNumbering(0);
        this.renewButton.setNumbering(0);
    }

    public activate()
    {
        this._boosterIsActive = false;

        this.refreshAppearance();
    }

    public deactivate()
    {
        this.rotateButton.interactable = false;
        this.breakButton.interactable = false;
        this.renewButton.interactable = false;

        this._boosterIsActive = false;
    }

    public onRotateBooster()
    {
        if (this._boosterIsActive && this._activeBooster === Booster.ROTATE)
        {
            this.cancelCurrentBooster();
            return;
        }
        this.activateBooster(Booster.ROTATE);
    }

    public onBreakBooster()
    {
        if (this._boosterIsActive && this._activeBooster === Booster.BREAK)
        {
            this.cancelCurrentBooster();
            return;
        }
        this.activateBooster(Booster.BREAK);
    }

    public onRenewBooster()
    {
        if (this._boosterIsActive && this._activeBooster === Booster.RENEW)
        {
            this.cancelCurrentBooster();
            return;
        }
        this.activateBooster(Booster.RENEW);
    }

    public activateBooster(booster: Booster)
    {
        if (this._boosterIsActive)
        {
            this.cancelCurrentBooster();
        }

        this._activeBooster = booster;

        this._boosterIsActive = true;

        PuzzleGameManager.instance.darkenHelper.requestDarken(booster);

        // handle game functions
        PuzzleGameManager.instance.onUseBooster(booster);

        this.refreshAppearance();
    }

    public registerBoosterUse(booster: Booster)
    {
        MainGameManager.instance.playerDataManager.usePuzzleBooster(booster);

        this.refreshAppearance();
    }

    public cancelCurrentBooster()
    {
        this.cancelBooster(this._activeBooster);
    }

    public cancelBooster(booster: Booster)
    {
        if (!this._boosterIsActive)
        {
            return;
        }

        this._boosterIsActive = false;

        PuzzleGameManager.instance.darkenHelper.requestBrighten(booster);

        // handle game functions
        PuzzleGameManager.instance.onCancelBooster(booster);

        this.refreshAppearance();
    }

    private refreshAppearance()
    {
        this.rotateButton.setNumbering(MainGameManager.instance.playerDataManager.getPuzzleBoosterCount(Booster.ROTATE));
        this.rotateButton.interactable = MainGameManager.instance.playerDataManager.getPuzzleBoosterCount(Booster.ROTATE) > 0;
        this.breakButton.setNumbering(MainGameManager.instance.playerDataManager.getPuzzleBoosterCount(Booster.BREAK));
        this.breakButton.interactable = MainGameManager.instance.playerDataManager.getPuzzleBoosterCount(Booster.BREAK) > 0;
        this.renewButton.setNumbering(MainGameManager.instance.playerDataManager.getPuzzleBoosterCount(Booster.RENEW));
        this.renewButton.interactable = MainGameManager.instance.playerDataManager.getPuzzleBoosterCount(Booster.RENEW) > 0;
    }
}