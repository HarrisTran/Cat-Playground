import { _decorator, CCFloat, Component, Game, Node, Vec3 } from 'cc';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { MainGameManager } from '../../MainGame/MainGameManager';
import { GameSound } from '../../MainGame/Managers/AudioManager';
import { formatHoursMinsSeconds } from '../../Utilities/NumberUtilities';
import { PopUpSetting } from '../../MainGame/UI/PopUp/PopUpSetting';
import { ScoreFloatup } from '../PuzzleComponents/ScoreFloatup';
import { IPopUpPuzzleComplete, PopUpPuzzleComplete } from '../../MainGame/UI/PopUp/PopUpPuzzleComplete';
import { IPuzzleContinueScreen } from '../../MainGame/UI/PopUp/PuzzleContinueScreen';
import { PuzzleGameManager } from '../PuzzleGameManager';
import { Currency } from '../../PlayerData/Currency';
const { ccclass, property } = _decorator;

@ccclass('PuzzleGameUI')
export class PuzzleGameUI extends Component
{
    @property({group: {name: "Main Game UI", id: "1", displayOrder: 1}, type: LocalizedLabel})
    public scoreText: LocalizedLabel;
    @property({group: {name: "Main Game UI", id: "1", displayOrder: 1}, type: LocalizedLabel})
    public comboText: LocalizedLabel;
    @property({group: {name: "Main Game UI", id: "1", displayOrder: 1}, type: LocalizedLabel})
    public highScoreText: LocalizedLabel;
    @property({group: {name: "Main Game UI", id: "1", displayOrder: 1}, type: LocalizedLabel})
    public fishText: LocalizedLabel;
    @property({group: {name: "Main Game UI", id: "1", displayOrder: 1}, type: LocalizedLabel})
    public timeText: LocalizedLabel;

    @property({ group: { name: "GameState Screen", id: "2", displayOrder: 1 }, type: Node })
    private inGameScreen: Node;
    @property({ group: { name: "GameState Screen", id: "2", displayOrder: 1 }, type: PopUpSetting })
    private pausePopup: PopUpSetting;
    @property({ group: { name: "GameState Screen", id: "2", displayOrder: 1 }, type: Node })
    private gameCompletePopupNode: Node;
    @property({ group: { name: "GameState Screen", id: "2", displayOrder: 1 }, type: Node })
    private gameContinueScreenNode: Node;

    @property({ group: { name: "Others", id: "2", displayOrder: 1 }, type: [ScoreFloatup] })
    private scoreFloatups: ScoreFloatup[] = [];
    @property({ group: { name: "Params", id: "2", displayOrder: 1 }, type: CCFloat })
    private updateScoreSpeed: number = 0.05;
    @property({ group: { name: "Params", id: "3", displayOrder: 3 }, type: CCFloat })
    private updateScoreTime: number = 1;

    private _allFloats: Set<ScoreFloatup>;
    private _freeFloats: Set<ScoreFloatup>;

    private _gameCompletePopup: IPopUpPuzzleComplete;
    private _gameContinueScreen: IPuzzleContinueScreen;

    private _actualScore: number = 0;
    private _activeScore: number = 0;
    private _updateRate: number = 0;
    private _updateScore: boolean = false;
    private _updateScoreTimer: number = 0;

    private _backLock: boolean = false;

    public get backLock(): boolean
    {
        return this._backLock;
    }

    public set backLock(value: boolean)
    {
        this._backLock = value;
    }

    protected onLoad(): void
    {
        for (let floatup of this.scoreFloatups)
        {
            floatup.manager = this;
            floatup.deactivate();
        }

        this._allFloats = new Set<ScoreFloatup>([...this.scoreFloatups]);
        this._freeFloats = new Set<ScoreFloatup>([...this.scoreFloatups]);

        this._gameCompletePopup = this.gameCompletePopupNode.getComponent("PopUpPuzzleComplete") as IPopUpPuzzleComplete;
        this._gameContinueScreen = this.gameContinueScreenNode.getComponent("PuzzleContinueScreen") as IPuzzleContinueScreen;
    }

    protected start()
    {
        
    }

    protected update(deltaTime: number)
    {
        if (this._updateScore)
        {
            this._updateScoreTimer -= deltaTime;

            if (this._updateScoreTimer < 0)
            {
                this._activeScore += this._updateRate;
            }

            if (this._activeScore >= this._actualScore)
            {
                this._activeScore = this._actualScore;
                this._updateScore = false;
            }

            this.setScoreHelper(this._activeScore);
        }
    }

    public onGameStart()
    {
        this.inGameScreen.active = true;
        this.pausePopup.hideImmediately();
        this._gameCompletePopup.hideImmediately();
        this._gameContinueScreen.node.active = false;
    }

    public onGameUnpause()
    {
        this.inGameScreen.active = true;
        this.pausePopup.hide();
        this._gameCompletePopup.hideImmediately();
        this._gameContinueScreen.node.active = false;
    }

    public onPauseScreen()
    {
        this.inGameScreen.active = true;
        this.pausePopup.show();
        this._gameCompletePopup.hideImmediately();
        this._gameContinueScreen.node.active = false;
    }

    public onGameOver()
    {
        this.inGameScreen.active = false;
        this.pausePopup.hideImmediately();
        this._gameCompletePopup.hideImmediately();

        this.returnAllScoreFloatups();

        this._gameContinueScreen.startScreen(5);    // TEMP
    }

    public onConcludeGame(score: number, highscore: number, isHighScore: boolean, payouts: Currency[])
    {
        this.inGameScreen.active = false;
        this.pausePopup.hideImmediately();
        this._gameContinueScreen.node.active = false;

        this._gameCompletePopup.setUpForShow(score, highscore, isHighScore, payouts);
        this._gameCompletePopup.show();
    }

    public setScore(score: number)
    {
        this._actualScore = score;
        this._updateRate = Math.ceil((this._actualScore - this._activeScore) / (this.updateScoreTime / this.updateScoreSpeed));
        this._updateScore = true;
    }

    public setCombo(combo: number)
    {
        this.comboText.setParams(["combo", combo.toString()]);
    }

    public setHighScore(score: number)
    {
        this.highScoreText.stringRaw = score.toString();
    }

    public setFish(count: number)
    {
        this.fishText.stringRaw = count.toString();
    }

    public setTime(secondTimes: number)
    {
        this.timeText.stringRaw = formatHoursMinsSeconds(secondTimes);
    }

    public requestShowScoreFloatup(blockPlace: Vec3, score: number, combo: number, lineBroke: number)
    {
        if (this._freeFloats.size === 0) return;

        let float = this._freeFloats.values().next().value as ScoreFloatup;

        float.show(blockPlace, score, combo, lineBroke);
    }

    public returnScoreFloatup(floatup: ScoreFloatup)
    {
        floatup.deactivate();
        this._freeFloats.add(floatup);
    }

    public returnAllScoreFloatups()
    {
        this._freeFloats.clear();
        for (let floatup of this._allFloats)
        {
            floatup.deactivate();
            this._freeFloats.add(floatup);
        }
    }

    public onQuitToMainButton()
    {
        this.requestQuitToMain(true);
    }

    public requestQuitToMain(doDialogue: boolean)
    {
        if (this._backLock)
        {
            if (doDialogue)
                MainGameManager.instance.dialogueManager.playDialogue("PLAY_PUZZLE_LOCK");
        }
        else
        {
            PuzzleGameManager.instance.requestBackToMainScene();
        }
    }

    public onConcludeGameButton()
    {
        this.pausePopup.hide();
        PuzzleGameManager.instance.confirmEndGame();
    }

    public onContinueButton()
    {
        PuzzleGameManager.instance.continueWhenGameOver();
    }

    public onPauseButton()
    {
        PuzzleGameManager.instance.togglePauseState();
    }

    private setScoreHelper(score: number)
    {
        this.scoreText.stringRaw = score.toString();
    }
}

