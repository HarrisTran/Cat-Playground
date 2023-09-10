import { _decorator, CCFloat, color, Game, Layout, log, Node, ParticleSystem, ParticleSystem2D, Sprite, SpriteFrame, UITransform, } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { LocalizedLabel } from '../../../Common/LocalizedLabel';
import { Currency } from '../../../PlayerData/Currency';
import { PuzzleGameManager } from '../../../Puzzle/PuzzleGameManager';
import { MainGameManager } from '../../MainGameManager';
import { GameSound } from '../../Managers/AudioManager';
const { ccclass, property } = _decorator;

export interface IPopUpPuzzleComplete extends PopUpPuzzleComplete { }

@ccclass('PopUpPuzzleComplete')
export class PopUpPuzzleComplete extends PopupBase
{
    @property({ group: { name: "Components", id: "3", displayOrder: 3 }, type: LocalizedLabel })
    private scoreText: LocalizedLabel;
    @property({ group: { name: "Components", id: "3", displayOrder: 3 }, type: LocalizedLabel })
    private highscoreText: LocalizedLabel;
    @property({ group: { name: "Components", id: "3", displayOrder: 3 }, type: Sprite })
    private catImage: Sprite;
    @property({ group: { name: "Components", id: "3", displayOrder: 3 }, type: Layout })
    private payoutTextLayout: Layout;
    @property({ group: { name: "Components", id: "3", displayOrder: 3 }, type: [LocalizedLabel] })
    private payoutTexts: LocalizedLabel[] = [];
    @property({ group: { name: "Params", id: "3", displayOrder: 3 }, type: SpriteFrame })
    private catSpriteHighScore: SpriteFrame;
    @property({ group: { name: "Params", id: "3", displayOrder: 3 }, type: SpriteFrame })
    private catSpriteNoHighScore: SpriteFrame;
    @property({ group: { name: "Params", id: "3", displayOrder: 3 }, type: CCFloat })
    private updateScoreSpeed: number = 0.05;
    @property({ group: { name: "Params", id: "3", displayOrder: 3 }, type: CCFloat })
    private updateScoreTime: number = 1;
    @property({ group: { name: "Decor", id: "3", displayOrder: 3 }, type: Node})
    private decorHighScore: Node ;
    @property({ group: { name: "Decor", id: "3", displayOrder: 3 }, type: ParticleSystem2D})
    private fireworkParticle: ParticleSystem2D = null;
    @property({ group: { name: "Decor", id: "3", displayOrder: 3 }, type: Node})
    private confetti: Node = null;

    private _actualScore: number = 0;
    private _actualHighScore: number = 0;
    private _activeScore: number = 0;
    private _activeHighScore: number = 0;
    private _addRateScore: number;
    private _addRateHighscore: number;
    private _updateScore: boolean = false;
    private _updateHighScore: boolean = false;
    private _updateScoreTimer: number = 0;
    private _updateHighScoreTimer: number = 0;  
    private _isHighScore: boolean = false;  

    protected update(deltaTime: number)
    {
        if (this._updateScore)
        {
            this._updateScoreTimer -= deltaTime;

            if (this._updateScoreTimer < 0)
            {
                this._activeScore += this._addRateScore;
                this._updateScoreTimer += this.updateScoreSpeed;
            }

            if (this._activeScore >= this._actualScore)
            {
                this._activeScore = this._actualScore;
                this._updateScore = false;
            }

            this.setScoreHelper(this._activeScore);
        }

        if (this._updateHighScore)
        {
            this._updateHighScoreTimer -= deltaTime;

            if (this._updateHighScoreTimer < 0)
            {
                this._activeHighScore += this._addRateHighscore;
                this._updateHighScoreTimer += this.updateScoreSpeed;
            }

            if (this._activeHighScore >= this._actualHighScore)
            {
                this._activeHighScore = this._actualHighScore;
                this._updateHighScore = false;
            }

            this.setHighScoreHelper(this._activeHighScore);
        }
    }

    protected onShowStart(): void
    {
        super.onShowStart();

        this.setScoreHelper(0);
        this.setHighScoreHelper(0);
        MainGameManager.instance.audioManager.playSfx(GameSound.PUZZLE_GAME_CONCLUDE);
    }

    protected onShowEnd(): void
    {
        super.onShowEnd();
        this._updateScore = true;
        this._updateHighScore = true;
        if(this._isHighScore){
            this.fireworkParticle.resetSystem();
            this.panel.getComponent(UITransform).width = 660;
        }else{
            this.panel.getComponent(UITransform).width = 740;
        }
        MainGameManager.instance.audioManager.playSfx(this._isHighScore ? GameSound.PUZZLE_BREAKHIGHSCORE : GameSound.UI_COUNTPOINTLONG);
    }

    public setUpForShow(score: number, highscore: number, isHighScore: boolean, payouts: Currency[])
    {
        highscore = highscore ? highscore : 0;
        this._actualScore = score;
        this._activeScore = 0;
        this._addRateScore = Math.ceil(this._actualScore / (this.updateScoreTime / this.updateScoreSpeed));
        this._actualHighScore = highscore;
        this._activeHighScore = 0;
        this._isHighScore = isHighScore;
        this._addRateHighscore = Math.ceil(this._actualHighScore / (this.updateScoreTime / this.updateScoreSpeed));
        this.highscoreText.stringRaw = highscore.toString();
        this.catImage.spriteFrame = isHighScore ? this.catSpriteHighScore : this.catSpriteNoHighScore;
        this.decorHighScore.active = isHighScore;
        this.scoreText.color = isHighScore ? color('#B1F4DC') : color('#FFFFFF');
        this.confetti.active = isHighScore;

        let i = 0;
        for (let payout of payouts)
        {
            let text = this.payoutTexts[i];
            let set = payout.getRichTextString();
            text.stringRaw = `<color=#621824>+${set}</color>`;
            this.payoutTexts[i].node.active = true;
            ++i;
        }

        for (; i < this.payoutTexts.length; ++i)
        {
            this.payoutTexts[i].node.active = false;
        }

        this.payoutTextLayout.updateLayout();
    }

    public onQuitButton()
    {
        PuzzleGameManager.instance.gameUI.requestQuitToMain(false);
    }

    public onRestartButton()
    {
        PuzzleGameManager.instance.startNewGame();
    }

    private setScoreHelper(score: number)
    {
        this.scoreText.stringRaw = score.toString();
    }

    private setHighScoreHelper(score: number)
    {
        this.highscoreText.stringRaw = score.toString();
    }
}
