import { _decorator, BoxCollider2D, CCInteger, clamp, Color, Component, ERigidBody2DType, EventTouch, instantiate, Label, log, Node, Prefab, randomRange, RichText, RigidBody2D, Size, Sprite, SpriteFrame, tween, UITransform, v3, Vec2, Vec3, Vec4 } from 'cc';
import { IPuzzleGrid } from './PuzzleGrid';
import { ITetrominoPiece } from './TetrominoPiece';
import { PieceBlockPool } from '../PieceBlockPool';
import { PuzzleGameManager } from '../PuzzleGameManager';
import { getRandom } from '../../Utilities/ArrayExtensions';
import { MainGameManager } from '../../MainGame/MainGameManager';
import { SceneManager } from '../../MainGame/Managers/SceneManager';
import { GameSound } from '../../MainGame/Managers/AudioManager';
import { Booster } from '../UI/Booster';
const { ccclass, property } = _decorator;

export interface IPieceBlock extends PieceBlock { }

export enum PieceBlockType
{
    NORMAL,
    PERMANENT,
    NUMBERED,
    FISH
}

export const PIECE_BLOCK_PERMANENT_CODE: number = 9;
export const PIECE_BLOCK_FISH_CODE: number = 10;
export const PIECE_BLOCK_NORMAL_CODE_START: number = 20;

export const COLOR_COUNT = 7;

@ccclass('PieceBlock')
export class PieceBlock extends Component
{
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Sprite })
    private sprite: Sprite;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Label })
    private debugHardnessLabel: Label;

    private _holder: Node = null;
    private _hardness: number = 0;
    private _type: PieceBlockType = PieceBlockType.NORMAL;
    private _degisnatedSpriteIndex = 0;

    private _cellSize: number;
    private _blockSize: number;

    public get cellSize(): number
    {
        return this._cellSize;
    }

    public get blockSize(): number
    {
        return this._blockSize;
    }

    public get holder(): Node
    {
        return this._holder;
    }

    public set holder(value: Node)
    {
        this._holder = value;
    }

    public get canBreakByBooster(): boolean
    {
        return this._type === PieceBlockType.NORMAL || this._type === PieceBlockType.FISH;
    }

    @property({type: CCInteger})
    public get designatedSpriteIndex()
    {
        return this._degisnatedSpriteIndex;
    }
    
    public set designatedSpriteIndex(value)
    {
        this._degisnatedSpriteIndex = value % COLOR_COUNT;
    }

    public get currentSprite(): SpriteFrame
    {
        return MainGameManager.instance.resourceManager.getBlockPreview(this.blockId);
    }

    @property({ type: CCInteger })
    public get type(): PieceBlockType
    {
        return this._type;
    }
    
    public set type(value: PieceBlockType)
    {
        this._type = value;

        if (this._type !== PieceBlockType.PERMANENT)
        {
            this._hardness = 1;
        }

        this.refreshAppearance(this._degisnatedSpriteIndex);
    }

    public get hardness(): number
    {
        if (this._type === PieceBlockType.NUMBERED)
            return this._hardness;
        else if (this._type === PieceBlockType.PERMANENT)
            return 9999;
        else return 1;
    }

    public set hardness(value: number)
    {
        if (this._type === PieceBlockType.NUMBERED)
        {
            this._hardness = value;
            this.refreshAppearance(this._degisnatedSpriteIndex);
        }
    }

    public get blockId(): string
    {
        return (this._type === PieceBlockType.FISH ? "fish_" : "normal_") + this.designatedSpriteIndex;
    }

    public get spriteComponent(): Sprite { return this.sprite; }

    public setSizes(cellSize: number, blockSize: number)
    {
        this._cellSize = cellSize;
        this._blockSize = cellSize;
        this.getComponent(UITransform).contentSize = new Size(cellSize, cellSize);
    }

    public onClickToBreak(event: EventTouch)
    {
        this.requestBreak();
    }

    private static aBlockRequestedBreak: boolean = false; // I'm lazy, forgive me
    public requestBreak()
    {
        if (!this.canBreakByBooster || PieceBlock.aBlockRequestedBreak)
        {
            return;
        }
    
        if ((this.holder.getComponent("PuzzleGrid") as IPuzzleGrid) != null)
        {
            PieceBlock.aBlockRequestedBreak = true;
            PuzzleGameManager.instance.hammerVfx.requestPlayDefaultClip();
            PuzzleGameManager.instance.hammerVfx.node.worldPosition = new Vec3(this.node.worldPosition.x, this.node.worldPosition.y, 0);
            setTimeout(() => MainGameManager.instance.audioManager.playSfx(GameSound.BOOSTER_HAMMER), 1200);
            setTimeout(() =>
            {
                (this.holder.getComponent("PuzzleGrid") as IPuzzleGrid).requestBreak(this);
                PieceBlock.aBlockRequestedBreak = false;
                PuzzleGameManager.instance.signalBoosterFunctionCompleted(Booster.BREAK);
            }, 1500);

        }
        else if ((this.holder.getComponent("TetrominoPiece") as ITetrominoPiece) != null)
        {
            // DEPRECATED
            // this.holder.getComponent(TetrominoPiece).requestBreak(this);
        }
        else
        {
            console.warn("Request break for " + this.node.name + " because parent does not have PuzzleGrid or TetrominoPiece component.");
        }
    }

    public tryClear(): boolean
    {
        if (this.type === PieceBlockType.PERMANENT)
        {
            // Cannot be destroy
            return false;
        }
        else if (this.type === PieceBlockType.NUMBERED)
        {
            this.hardness = this.hardness - 1;
            if (this.hardness <= 0)
            {
                return true;
            }
        }
        else
        {
            if (this.type === PieceBlockType.FISH)
            {
                PuzzleGameManager.instance.addFish();
            }

            return true;
        }
    }

    public cleanBlock()
    {
        this.holder = null;
        this.hardness = 0;
        this.node.scale = Vec3.ONE;
    }

    public appear()
    {
        this.playAppearAnim();
    }

    public remove(useAlternativeAnim: boolean)
    {
        if (!useAlternativeAnim) {
            this.playDestroyAnim(() => this.returnToPool());
        }
        else {
            this.playShrinkDestroyAnim(() => this.returnToPool());
        }    
    }

    public returnToPool()
    {
        this.cleanBlock();
        PieceBlockPool.instance.retrieveBlook(this);
    }

    public playAppearAnim(onAnimDone?: () => void)
    {
        this.node.scale = Vec3.ZERO;
        this.node.active = true;
        tween(this.node).to(PuzzleGameManager.instance.newPieceAnimTime, { scale: Vec3.ONE },
            {
                easing: "backOut",
                onComplete: (target) => {
                    if (onAnimDone) onAnimDone();
                },
            }).start();
    }

    public playDestroyAnim(onAnimDone?: () => void)
    {
        this.node.active = false;
        
        setTimeout(() => {
                if (onAnimDone) onAnimDone();
            }, PuzzleGameManager.instance.lineClearAnimTime * 1000);
    }

    public playShrinkDestroyAnim(onAnimDone?: () => void) {
        tween(this.node).to(PuzzleGameManager.instance.newPieceAnimTime, { scale: Vec3.ZERO },
            {
                easing: "backIn",
                onComplete: (target) => {
                    if (onAnimDone) onAnimDone();
                },
            }).start();
    }

    private refreshAppearance(normalSpriteIndex)
    {
        this.debugHardnessLabel.node.active = false;
        if (this.type === PieceBlockType.NORMAL)
        {
            // Take random sprite
            this.sprite.spriteFrame = this.currentSprite;
            this.sprite.color = Color.WHITE;
        }
        else if (this.type === PieceBlockType.FISH)
        {
            this.sprite.spriteFrame = this.currentSprite;
            this.sprite.color = Color.WHITE;
        }
        else if (this.type === PieceBlockType.PERMANENT)
        {
            let color = Color.fromHEX(new Color(), "#FFC200");
            this.sprite.spriteFrame = this.currentSprite;
            this.sprite.color = color;
        }
        else if (this.type === PieceBlockType.NUMBERED)
        {
            let color = Color.fromHEX(new Color(), "#FFC200");
            this.sprite.spriteFrame = this.currentSprite;
            this.sprite.color = color;
            // this.debugHardnessLabel.node.active = true;
            this.debugHardnessLabel.string = this.hardness.toString();
        }
    }
}

