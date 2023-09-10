import { _decorator, BoxCollider2D, Collider2D, Color, Component, Node, Size, Sprite, SpriteFrame } from 'cc';
import { PuzzleGameManager } from '../PuzzleGameManager';
import { IPieceBlock } from './PieceBlock';
import { PlayerInteractable } from '../../Common/PlayerInteractable';
const { ccclass, property } = _decorator;

@ccclass('PuzzleGridCell')
export class PuzzleGridCell extends Component
{
    @property(Sprite)
    private back: Sprite;
    @property(SpriteFrame)
    private oddFrame: SpriteFrame;
    @property(SpriteFrame)
    private evenFrame: SpriteFrame;

    private _gridIndex: number;
    private _attachedBlock: IPieceBlock;

    public get gridIndex(): number { return this._gridIndex; }

    public get spriteComponent(): Sprite {return this.back };

    public get attachedBlock(): IPieceBlock
    {
        return this._attachedBlock;
    }

    public set attachedBlock(value: IPieceBlock)
    {
        this._attachedBlock = value;
    }

    public setGridIndex(value: number, isOdd: boolean)
    {
        this._gridIndex = value;
        // this.back.spriteFrame = isOdd ? this.oddFrame : this.evenFrame;
    }

    public onClick()
    {
        if (this.attachedBlock)
        {
            this.attachedBlock.requestBreak();
        }
    }

    public debugColorize(a: Color)
    {
        this.back.color = a;
    }
}

