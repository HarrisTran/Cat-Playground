import { _decorator, Component } from 'cc';
import { IManager } from './IManager';
import { MainGameManager } from '../MainGameManager';
import { GameEventManager } from './GameEventManager';


const { ccclass, property } = _decorator;


@ccclass('AdManager')
export class AdManager extends Component implements IManager
{
    private _initialized: boolean = false;

    public initialize()
    {
        this._initialized = true;
    }
    public progress(): number
    {
        return this._initialized ? 1 : 0;
    }
    public initializationCompleted(): boolean
    {
        return this._initialized;
    }

    private _isInAd: boolean;
    private _onDoneAction: () => void = null;
    private _onCancelAction: () => void = null;

    public requestAd(checkForAdFree: boolean, onDoneAction?: () => void, onCancelAction?: () => void)
    {
        if (this._isInAd) return;

        if (checkForAdFree)
        {
            if (MainGameManager.instance.playerDataManager.getIsAdFree())
            {
                if (onDoneAction)
                {
                    onDoneAction();
                    return;
                }
            }
        }

        this._isInAd = true;
        this._onDoneAction = onDoneAction;
        this._onCancelAction = onCancelAction;

        // TODO
        this.concludeAd(true);
    }

    private onFinishAd()
    {
        // TODO

        this.concludeAd(true);
    }

    private onCancelAd()
    {
        // TODO

        this.concludeAd(false);
    }

    private concludeAd(completed: boolean)
    {
        this._isInAd = false;

        if (completed && this._onDoneAction)
        {
            this._onDoneAction();
        }
        else if (!completed && this._onCancelAction)
        {
            this._onCancelAction();
        }

        this._onDoneAction = null;
        this._onCancelAction = null;
    }
}

