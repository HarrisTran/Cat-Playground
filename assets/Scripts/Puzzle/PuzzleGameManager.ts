import { _decorator, Canvas, CCBoolean, CCFloat, CCInteger, Component, find, game, Game, Node, randomRange, UITransform, Vec3 } from 'cc';
import { IBoosterManager } from './UI/BoosterManager';
import { Booster } from './UI/Booster';
import { IPuzzleGrid } from './PuzzleComponents/PuzzleGrid';
import { LimitConstraint } from './PuzzleComponents/LimitConstraint';
import { ITetrominoQueue } from './PuzzleComponents/TetrominoQueue';
import { ControlMode, PuzzlePlayerControl } from './PuzzlePlayerControl';
import { PuzzleGameUI } from './UI/PuzzleGameUI';
import { MainGameManager } from '../MainGame/MainGameManager';
import { PieceBlockPool } from './PieceBlockPool';
import { Currency } from '../PlayerData/Currency';
import { GameMusic, GameSound } from '../MainGame/Managers/AudioManager';
import { PieceAppearanceCount, PuzzleSession, SavedPieceData } from '../PlayerData/PuzzleStatistics';
import { PredefinedTetrominoPieces } from './PuzzleComponents/TetrominoDefinedData';
import { getScoreSoundOf } from '../Utilities/OtherUtilities';
import { PuzzleLevelData } from './PuzzleLevelData';
import { GameEvent } from '../MainGame/Managers/GameEventManager';
import { MISSION_ARG_TYPE_ADD, MISSION_ARG_TYPE_MAX, MissionManager } from '../MainGame/Managers/MissionManager';
import { PuzzleDarkenHelper } from './PuzzleDarkenHelper';
import { VFXCallback } from '../VFXs/VFXCallback';
import { FishDropVFXHelper } from '../VFXs/FishDropVFXHelper';
const { ccclass, property } = _decorator;

enum PuzzleGameState
{
    NONE = 0,               // Invalid, begin state
    INIT,                   // Initialize things (board, controls, etc.)
    START_GAME,             // The game is started
    IN_GAME,                // In game
    PAUSE_GAME,             // The game is paused
    GAME_OVER,              // The game is over
    CONCLUDE_GAME           // The player concludes the game, by choosing restart or quit.
}

@ccclass('PuzzleGameManager')
export class PuzzleGameManager extends Component
{
    private static _instance: PuzzleGameManager;

    public static get instance(): PuzzleGameManager
    {
        return this._instance;
    }

    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: Node})
    public puzzleGridNode: Node;
    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: Node})
    public tetrominoQueueNode: Node;
    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: PuzzlePlayerControl})
    public playerControl: PuzzlePlayerControl;
    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: Canvas})
    public canvas: Canvas;
    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: PuzzleGameUI})
    public gameUI: PuzzleGameUI;
    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: PuzzleDarkenHelper})
    public darkenHelper: PuzzleDarkenHelper;
    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: Node})
    public boosterManagerNode: Node;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: VFXCallback })
    public hammerVfx: VFXCallback;

    @property({ group: { name: "Timings", id: "2", displayOrder: 1 }, type: CCFloat })
    public newPieceAnimTime: number = 0.5;
    @property({ group: { name: "Timings", id: "2", displayOrder: 1 }, type: CCFloat })
    public lineClearAnimTime: number = 0.5;
    @property({ group: { name: "Timings", id: "2", displayOrder: 1 }, type: CCFloat })
    public gameOverAnimTime: number = 0.5;
    @property({ group: { name: "VFX", id: "3", displayOrder: 1 }, type: FishDropVFXHelper })
    public fishDropVFX : FishDropVFXHelper = null;

    @property({ type: CCInteger })
    private blockSetScore: number = 1;
    @property({ type: CCInteger })
    private lineClearScore: number = 10;
    @property({ type: CCInteger })
    private comboMultiplier: number = 1;
    @property({ type: CCBoolean })
    private pureRandomMode: boolean;

    private _fishChance: number = 50;

    private _state: PuzzleGameState;
    private _score: number;
    private _combo: number;
    private _peakCombo: number;
    private _fishCaught: number;
    private _fishAppeared: number;

    private _oldHighScore: number;

    private _round: number;
    private _shouldKeepCombo: boolean;

    private _puzzleGrid: IPuzzleGrid = null;
    private _boosterManager: IBoosterManager = null;
    private _tetrominoQueue: ITetrominoQueue = null;

    private _session: PuzzleSession = null;

    public get puzzleGrid(): IPuzzleGrid
    {
        if (this._puzzleGrid === null)
        {
            this._puzzleGrid = this.puzzleGridNode.getComponent("PuzzleGrid") as IPuzzleGrid;
        }

        return this._puzzleGrid;
    }

    public get boosterManager(): IBoosterManager
    {
        if (this._boosterManager === null)
        {
            this._boosterManager = this.boosterManagerNode.getComponent("BoosterManager") as IBoosterManager;
        }

        return this._boosterManager;
    }
    
    public get tetrominoQueue(): ITetrominoQueue
    {
        if (this._tetrominoQueue === null)
        {
            this._tetrominoQueue = this.tetrominoQueueNode.getComponent("TetrominoQueue") as ITetrominoQueue;
        }

        return this._tetrominoQueue;
    }

    /**
     * This do nothing, don't touch this
     * This is a hack, don't touch this.
     * I swear to God Cocos' serialzing is a pain.
     */
    public set puzzleGrid(value: any)
    {
        // DO NOTHING BY DESIGN.
    }

    public get score(): number
    {
        return this._score;
    }

    protected set score(value: number)
    {
        this._score = value ? value : 0;
        this.gameUI.setScore(this._score);
    }

    public get combo(): number
    {
        return this._combo;
    }

    protected set combo(value: number)
    {
        this._combo = value;
        if (this._combo > this._peakCombo)
        {
            this.peakCombo = this._combo;
        }
        this.gameUI.setCombo(this._combo);
    }

    public get peakCombo(): number
    {
        return this._peakCombo;
    }

    public set peakCombo(value: number)
    {
        this._peakCombo = value;
    }

    public get fishCaught(): number
    {
        return this._fishCaught;
    }

    protected set fishCaught(value: number)
    {
        this._fishCaught = value;
        this.gameUI.setFish(this._fishCaught);
    }

    public get fishAppeared(): number
    {
        return this._fishAppeared;
    }


    protected set fishAppeared(value: number)
    {
        this._fishAppeared = value;
    }

    public get round(): number
    {
        return this._round;
    }

    protected set round(value: number)
    {
        this._round = value;
    }

    public get highScore(): number
    {
        return MainGameManager.instance.playerDataManager.getPuzzleHighScore();
    }

    public set highScore(value: number)
    {
        if (value > this.highScore)
        {
            if (this.highScore !== 0 && this.highScore === this.oldHighScore && this._state === PuzzleGameState.IN_GAME)
            {
                MainGameManager.instance.audioManager.playSfx(GameSound.PUZZLE_BREAKHIGHSCORE);
            }

            MainGameManager.instance.playerDataManager.setPuzzleHighScore(value);
        }
        this.gameUI.setHighScore(this.highScore);
    }

    public get oldHighScore(): number
    {
        return this._oldHighScore;
    }

    public set oldHighScore(value: number)
    {
        this._oldHighScore = value;
    }

    public get shouldKeepCombo(): boolean
    {
        return this._shouldKeepCombo;
    }

    public set shouldKeepCombo(value: boolean)
    {
        this._shouldKeepCombo = value;
    }

    public get playTime(): number
    {
        if (this._session) return this._session.playTime;
        else return 0;
    }

    public set playTime(value: number)
    {
        if (this._session) this._session.playTime = value;
        this.gameUI.setTime(value);
    }

    

    // Life-cycle methods

    protected onLoad(): void
    {
        PuzzleGameManager._instance = this;
        this._state = PuzzleGameState.NONE;
    }

    protected start()
    {
        this.setState(PuzzleGameState.INIT);
    }

    protected update(deltaTime: number)
    {
        this.playTime += deltaTime;
    }

    protected onDestroy(): void
    {
        PuzzleGameManager._instance = null;
    }

    public SetSession(session: PuzzleSession)
    {
        this._session = session;
    }

    public SaveSession()
    {

    }


    // State machine

    public setState(newState: PuzzleGameState, forced: boolean = false, refreshUIIfIngame: boolean = false)
    {
        if (this._state !== newState || forced)
        {
            this._state = newState;

            console.log("Puzzle Game State requested switch to: ", PuzzleGameState[newState]);

            if (newState === PuzzleGameState.INIT)
            {
                // Attach camera
                this.playerControl.camera = MainGameManager.instance.camera;

                this.puzzleGrid.calculateGridToFitScreenSize(this.canvas.getComponent(UITransform).contentSize.width);
                let gridWidth = this.puzzleGrid.gridPixelSize;
                let cellSize = this.puzzleGrid.cellPixelSize;
                let blockSize = this.puzzleGrid.blockPixelSize;
                PieceBlockPool.instance.setSizes(cellSize, blockSize);
                this.tetrominoQueue.setSizes(gridWidth, cellSize);

                this.playerControl.initialize();

                this.setState(PuzzleGameState.START_GAME);
            }
            else if (newState === PuzzleGameState.START_GAME)
            {
                this._fishChance = MainGameManager.instance.resourceManager.getPuzzleFishChance();
                this.tetrominoQueue.generateIndexToWeightMap(MainGameManager.instance.resourceManager.getPuzzleWeights());

                // Load session
                this._session = MainGameManager.instance.playerDataManager.getOnGoingSession();

                console.log("Session :", this._session);
                // Create session if none
                if (this._session == null || this._session == undefined || this._session.sessionCompleted)
                {
                    console.log("Create new session");
                    this._session = new PuzzleSession();
                    this._session.pieceAppearanceCounts = PredefinedTetrominoPieces.map((x) => 
                        new PieceAppearanceCount(x.id, 0));
                    this._session.playTime = 0;

                    // Initialize new game
                    this.round = 1;
                    this.score = 0;
                    this.combo = 0;
                    this.peakCombo = 0;
                    this.fishCaught = 0;
                    this.fishAppeared = 0;
                    this.highScore = this.highScore;        // Don't ask, it's not useless
                    this.oldHighScore = this.highScore;

                    this.puzzleGrid.clear();
                    this.puzzleGrid.activate();
                    this.tetrominoQueue.refreshAllPieces();
                    this.tetrominoQueue.activate();

                    if (!MainGameManager.instance.tutorialManager.isPlayingTutorial)
                    {
                        this.playNewGameAnim();
                    }
                    else
                    {
                        this.setState(PuzzleGameState.IN_GAME);
                    }
                    this.gameUI.onGameStart();
                }
                else
                {
                    // Restore
                    this.round = this._session.round ? this._session.round : 1;
                    this.score = this._session.score ? this._session.score : 0;
                    this.combo = this._session.combo ? this._session.combo : 0;
                    this.peakCombo = this._session.peakCombo ? this._session.peakCombo : 0;
                    this.fishCaught = this._session.fishCaught ? this._session.fishCaught : 0;
                    this.fishAppeared = this._session.fishAppeared ? this._session.fishAppeared : 0;
                    this.highScore = this.highScore;    // Don't ask, it's not useless
                    this.oldHighScore = this._session.oldHighScore;

                    // Restore session
                    this.puzzleGrid.clear();
                    this.puzzleGrid.setOngoingSession(this._session);
                    this.puzzleGrid.activate();
                    this.tetrominoQueue.setSpecificPiecesFromSessions(this._session);
                    this.tetrominoQueue.activate();

                    // Just in case, validate playable
                    if (!this.checkGridCanStillPlay())
                    {
                        this.setState(PuzzleGameState.CONCLUDE_GAME);
                        return;
                    }

                    this.gameUI.onGameStart();
                    this.setState(PuzzleGameState.IN_GAME)
                }

                MainGameManager.instance.audioManager.playMusic(GameMusic.PUZZLE_BACKGROUND);
            }
            else if (newState === PuzzleGameState.IN_GAME)
            {
                if (refreshUIIfIngame)
                {
                    this.gameUI.onGameStart();
                }
                this.boosterManager.activate();
                this.playerControl.setControlMode(ControlMode.NORMAL);
            }
            else if (newState === PuzzleGameState.PAUSE_GAME)
            {
                this.boosterManager.deactivate();
                this.playerControl.setControlMode(ControlMode.DISABLED);
                this.gameUI.onPauseScreen();
            }
            else if (newState === PuzzleGameState.GAME_OVER)
            {
                this.puzzleGrid.deactivate();
                this.tetrominoQueue.deactivate();
                this.boosterManager.deactivate();
                this.playerControl.setControlMode(ControlMode.DISABLED);

                // Set as completed for now
                this._session.sessionCompleted = true;

                this.gameUI.onGameOver();
            }
            else if (newState === PuzzleGameState.CONCLUDE_GAME)
            {
                MainGameManager.instance.audioManager.stopMusic(GameMusic.PUZZLE_BACKGROUND);

                // Complete session:
                this.recordCurrentGameState();
                this._session.sessionCompleted = true;

                this.highScore = this._score;
                this._oldHighScore = this.highScore;
                /// Give prizes
                let coin = this.calculateSoftCurrencyPrize(this.score);
                // let gem = this.calculateHardCurrencyPrize(this.score);
                let fish = Currency.getFishCurrency(this.fishCaught);

                MainGameManager.instance.playerDataManager.addCurrency(coin);
                // MainGameManager.instance.playerDataManager.addCurrency(gem);
                MainGameManager.instance.playerDataManager.addCurrency(fish);

                // Save session to log
                MainGameManager.instance.playerDataManager.addCompletedPuzzleSession(this._session);
                // Clean ongoing
                MainGameManager.instance.playerDataManager.clearOngoingSession();

                // Invoke event
                var arg = MissionManager.getBaseMissionArg();
                arg.score = [MISSION_ARG_TYPE_MAX, this.score ? this.score : 0];
                arg.fish = [MISSION_ARG_TYPE_ADD, fish.amount ? fish.amount : 0];
                MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_PUZZLE_COMPLETE_SESSION, arg, this._session);

                // Show popup puzzle complete
                this.gameUI.onConcludeGame(this.score, this.highScore, this.score === this.highScore, [coin, fish]);

                // Also clear grid
                this._puzzleGrid.clear();
            }
        }
    }

    public startRound()
    {
        this._roundJustEnded = false;

        this.round += 1;
        this.tetrominoQueue.refreshAllPieces();
        this.shouldKeepCombo = false;

        if (!this.checkGridCanStillPlay())
        {
            setTimeout(() => this.setState(PuzzleGameState.GAME_OVER), 500);
        }
        else
        {
            // Roll fish
            let rolled = randomRange(0, 100);

            if (rolled <= this._fishChance)
            {
                console.warn("spawn a fish");
                // Spawn fish
                this._puzzleGrid.spawnRandomFish(1);
                this._fishAppeared += 1;
            }

            this.recordCurrentGameState();
        }
    }

    public endRound()
    {
        if (!this.shouldKeepCombo)
        {
            this.combo = 0;
        }

        this.startRound();
    }
    
    private _roundJustEnded: boolean = false;

    private _isDoingTutorial: boolean = false;
    public onPlayerPlayedAPiece()
    {
        if (this.tetrominoQueue.shouldRefresh())
        {
            if (this._roundJustEnded)
            {
                return;
            }

            this._roundJustEnded = true;
            setTimeout(() => this.endRound(), 200);
        }
        else
        {
            if (this._isDoingTutorial)
            {
                return;
            }

            if (!this.checkGridCanStillPlay())
            {
                setTimeout(() => this.setState(PuzzleGameState.GAME_OVER), 500);
            };

            this.recordCurrentGameState();
        }
    }

    public addScore(score: number)
    {
        if (this._state === PuzzleGameState.IN_GAME)
        {
            this.score = this.score + score;
            this.highScore = this.score;
        }
    }
    
    public addCombo()
    {
        if (this._state === PuzzleGameState.IN_GAME)
        {
            this.combo = this.combo + 1;
        }
    }

    public addFish()
    {
        if (this._state === PuzzleGameState.IN_GAME)
        {
            this.fishCaught = this.fishCaught + 1;
            this.fishDropVFX.playAnimFishDrop(this.fishCaught);
        }
    }

    public onBlockSet(blockCount: number)
    {
        this.addScore(blockCount * this.blockSetScore);
    }

    public onLineClearConfirmed(centerMostPosition: Vec3, lineCount: number)
    {
        if (lineCount > 0)
        {
            this.addCombo();
            this.shouldKeepCombo = true;
            MainGameManager.instance.audioManager.playSfx(getScoreSoundOf(lineCount));
        }

        let score = this.getScoreForLineClear(lineCount);
        MainGameManager.instance.audioManager.playSfx(GameSound.UI_COUNTPOINTSHORT);
        this.gameUI.requestShowScoreFloatup(centerMostPosition, score, lineCount > 0 ? this.combo : 0, lineCount);
        this.addScore(score);
    }

    public onUseBooster(booster: Booster)
    {
        if (booster === Booster.RENEW)
        {
            MainGameManager.instance.audioManager.playSfx(GameSound.BOOSTER_RENEW);
            this.tetrominoQueue.refreshAllPieces();
            this.boosterManager.registerBoosterUse(booster);
            this.boosterManager.cancelCurrentBooster();
        }
        else if (booster === Booster.BREAK)
        {
            this.playerControl.setControlMode(ControlMode.BREAK);
        }
        else if (booster === Booster.ROTATE)
        {
            this.playerControl.setControlMode(ControlMode.ROTATE);
        }
    }

    public onCancelBooster(booster: Booster)
    {
        if (booster === Booster.RENEW)
        {

        }
        else if (booster === Booster.BREAK)
        {
            this.playerControl.setControlMode(ControlMode.NORMAL);
        }
        else if (booster === Booster.ROTATE)
        {
            this.playerControl.setControlMode(ControlMode.NORMAL);
        }
    }

    public signalBoosterFunctionCompleted(booster: Booster)
    {
        this.boosterManager.registerBoosterUse(booster);
        PuzzleGameManager.instance.boosterManager.cancelCurrentBooster();
    }

    public recordPieceAppearance(...args: string[])
    {
        if (this._session)
        {
            for (let arg of args)
            {
                let record = this._session.pieceAppearanceCounts.find(x => x.pieceId === arg);

                if (record)
                {
                    record.count += 1;
                }
                else
                {
                    console.warn("Session object does not contains a PieceAppearanceCount ref to " + arg + ". Please check");
                }
            }

            // For now
            MainGameManager.instance.playerDataManager.saveOngoingSession(this._session);
        }
        else {
            console.warn("There is no _session object to record puzzle, please retry");
        }

    }

    public checkGridCanStillPlay(): boolean
    {
        let slotCount = PuzzleGameManager.instance.tetrominoQueue.getSlotCount();

        let canFit = false;
        for (let i = 0; i < slotCount; ++i)
        {
            let piece = PuzzleGameManager.instance.tetrominoQueue.getActivePiece(i);
            if (piece !== null && piece !== undefined)
            {
                canFit = canFit || PuzzleGameManager.instance.puzzleGrid.checkCanAttachPiece(piece);
            }
        }

        return canFit;
    }

    public getRecommendationCount(): number
    {
        if (this.pureRandomMode) return 0;

        let res = 1;
        let rand1 = randomRange(0, 1);
        let rand2 = randomRange(0, 1);
        let chance1 = (100 - (this.score * 0.6) / 100) / 100;
        let chance2 = (100 - (this.score * 0.8) / 100) / 100;
        res = res + (randomRange(0, 1) < chance1 ? 1 : 0);
        res = res + (randomRange(0, 1) < chance2 ? 1 : 0);
        return res;
    }


    public togglePauseState()
    {
        if (this._state === PuzzleGameState.IN_GAME)
        {
            this.setState(PuzzleGameState.PAUSE_GAME);
        }
        else if (this._state === PuzzleGameState.PAUSE_GAME)
        {
            this.gameUI.onGameUnpause();
            this.setState(PuzzleGameState.IN_GAME);
        }
    }

    public continueWhenGameOver()
    {
        this._session.sessionCompleted = false;
        this.tetrominoQueue.refreshAllPieces(true);
        this.setState(PuzzleGameState.IN_GAME, false, true);
    }

    public confirmEndGame()
    {
        this.playConcludeGameAnim();
    }

    public requestBackToMainScene()
    {
        if (this._session)
        {
            MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_PUZZLE_PAUSE_SESSION, MissionManager.getBaseMissionArg(), this._session);

            this.recordCurrentGameState();
        }

        MainGameManager.instance.requestPlayMainGame();
    }

    public startNewGame()
    {
        this.setState(PuzzleGameState.START_GAME);
    }

    public setPuzzleTutorial0()
    {
        var level = new PuzzleLevelData();
        level.id = "Tutorial_0";
        level.levelNumber = -1;
        level.name = "Tutorial 0";
        level.blockData = [
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            20, 20, 10, 0, 0, 20, 20, 20,
            20, 20, 20, 0, 0, 10, 20, 20,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
        ];

        var pieces: SavedPieceData[] = [
            new SavedPieceData("tetromino_5_5", 0, true),
            new SavedPieceData("tetromino_4_1", 0, true),
            new SavedPieceData("tetromino_5_4", 0, true)
        ];

        this._isDoingTutorial = true;

        this.puzzleGrid.clear();
        this.puzzleGrid.setLevelData(level);
        this.puzzleGrid.setLimit(new LimitConstraint([3 * 8 + 3, 3 * 8 + 4, 4 * 8 + 3, 4 * 8 + 4]));
        this.puzzleGrid.setTutorialPropagator(3 * 8 + 3, 2, 2);
        this.puzzleGrid.activate();
        this.tetrominoQueue.setSpecificPieces(pieces);
        this.tetrominoQueue.activate();
    }

    public setPuzzleTutorial1()
    {
        var level = new PuzzleLevelData();
        level.id = "Tutorial_1";
        level.levelNumber = -1;
        level.name = "Tutorial 1";
        level.blockData = [
            0, 0, 0, 10, 10, 0, 0, 0,
            0, 0, 0, 20, 20, 0, 0, 0,
            0, 0, 0, 20, 20, 0, 0, 0,
            10, 20, 20, 20, 0, 20, 20, 10,
            10, 20, 20, 0, 20, 20, 20, 10,
            0, 0, 0, 20, 20, 0, 0, 0,
            0, 0, 0, 20, 20, 0, 0, 0,
            0, 0, 0, 10, 10, 0, 0, 0,
        ];

        var pieces: SavedPieceData[] = [
            new SavedPieceData("tetromino_5_5", 0, true),
            new SavedPieceData("tetromino_1_1", 0, true),
            new SavedPieceData("tetromino_5_4", 0, true)
        ];

        this._isDoingTutorial = true;

        this.puzzleGrid.clear();
        this.puzzleGrid.setLevelData(level);
        this.puzzleGrid.setLimit(new LimitConstraint([3 * 8 + 3, 3 * 8 + 4, 4 * 8 + 3, 4 * 8 + 4]));
        this.puzzleGrid.setTutorialPropagator(3 * 8 + 3, 2, 2);
        this.puzzleGrid.activate();
        this.tetrominoQueue.setSpecificPieces(pieces);
        this.tetrominoQueue.activate();
    }

    public turnoffTutorial()
    {
        this._isDoingTutorial = false;
        this.puzzleGrid.removeLimit();
    }

    public setBackButtonState(state: boolean)
    {
        this.gameUI.backLock = state;
    }

    private playNewGameAnim()
    {
        this.playerControl.setControlMode(ControlMode.DISABLED);

        this.puzzleGrid.populateRandomOnly();
        let time = this.puzzleGrid.clearWithAnim(0.5, this.gameOverAnimTime / 8);

        setTimeout(() => this.setState(PuzzleGameState.IN_GAME), time * 1000);
    }

    private playConcludeGameAnim()
    {
        this.playerControl.setControlMode(ControlMode.DISABLED);

        MainGameManager.instance.audioManager.playSfx(GameSound.PUZZLE_GAME_OVER);
        let time = this.puzzleGrid.popuplateRandomAnim(0.5, this.gameOverAnimTime / 8);

        setTimeout(() => this.setState(PuzzleGameState.CONCLUDE_GAME), (time + 1) * 1000);
    }

    private getScoreForLineClear(lineCount: number): number
    {
        return (this.comboMultiplier * (this.combo + 1)) * lineCount * this.lineClearScore;
    }

    private calculateSoftCurrencyPrize(score: number): Currency
    {
        return Currency.getSoftCurrency(Math.floor(score / 10));
    }
    
    private calculateHardCurrencyPrize(score: number): Currency
    {
        return Currency.getHardCurrency(50);
    }

    private recordCurrentGameState()
    {
        if (this._session)
        {
            this._session.puzzleGrid = this._puzzleGrid.getBlockData();
            this._session.queuePieces = this._tetrominoQueue.getCurrentStateForSession();
            this._session.score = this.score;
            // this._session.oldHighScore = this.oldHighScore;
            this._session.highScore = this.highScore;
            this._session.combo = this.combo;
            this._session.peakCombo = this.peakCombo;
            this._session.round = this.round;
            this._session.fishCaught = this.fishCaught;
            this._session.fishAppeared = this.fishAppeared;
            // Record appearance count separately

            // For now 
            MainGameManager.instance.playerDataManager.saveOngoingSession(this._session);
        }
        else
        {
            console.warn("There is no _session object to record puzzle, please retry");
        }
    }
}