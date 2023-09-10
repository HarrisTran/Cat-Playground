import { _decorator, Component, Sprite } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { LocalizedLabel } from '../../../Common/LocalizedLabel';
import { PuzzleGameManager } from '../../../Puzzle/PuzzleGameManager';
import { MainGameManager } from '../../MainGameManager';
import { GameSound } from '../../Managers/AudioManager';
const { ccclass, property } = _decorator;

export interface IPuzzleContinueScreen extends PuzzleContinueScreen { }

@ccclass('PuzzleContinueScreen')
export class PuzzleContinueScreen extends Component
{
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Sprite })
    private timerImage: Sprite;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
    private timerText: LocalizedLabel;

    private _totalTime: number;
    private _isActivated: boolean = false;l
    private _timeLeft: number;

    protected update(dt: number): void
    {
        if (this._isActivated)
        {
            this._timeLeft -= dt;

            this.setTimer(this._timeLeft);

            if (this._timeLeft <= 0)
            {
                this.onTimerReachedZero();
            }
        }
    }

    public startScreen(time: number)
    {
        this.node.active = true;
        this._totalTime = time;
        this._timeLeft = time;
        this._isActivated = true;

        MainGameManager.instance.audioManager.playSfx(GameSound.COUNT_DOWN);
    }

    public onSkip()
    {
        this.onTimerReachedZero();
    }

    public onContinueWithGems()
    {
        PuzzleGameManager.instance.continueWhenGameOver();
    }

    public onContinueWithAds()
    {
        PuzzleGameManager.instance.continueWhenGameOver();
    }

    private setTimer(time: number)
    {
        this.timerImage.fillRange = time / this._totalTime;
        this.timerText.stringRaw = Math.floor(time).toString();
    }

    private onTimerReachedZero()
    {
        this._isActivated = false;
        this.node.active = false;
        PuzzleGameManager.instance.confirmEndGame();
    }
}

