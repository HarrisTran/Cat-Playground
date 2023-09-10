import { _decorator, CCFloat, Component, EventTouch, Game, Input, input, instantiate, Node, PhysicsSystem2D, PolygonCollider2D, Prefab, random, randomRangeInt, Rect, Size, Sprite, UITransform, Vec2, Vec3, Widget } from 'cc';
import { PieceBlock, PieceBlockType } from './PieceBlock';
import { makeHull } from '../../Utilities/ConvexHull';
import { PuzzleGameManager } from '../PuzzleGameManager';
import { PuzzleGridCell } from './PuzzleGridCell';
import { PieceBlockPool } from '../PieceBlockPool';
import { MainGameManager } from '../../MainGame/MainGameManager';
import { GameSound } from '../../MainGame/Managers/AudioManager';
import { TetrominoPlayerInteractable } from '../TetrominoPlayerInteractable';
import { VFXCallback } from '../../VFXs/VFXCallback';
import { Booster } from '../UI/Booster';
const { ccclass, property } = _decorator;

export interface ITetrominoPiece extends TetrominoPiece { }

export class TetrominoData
{
    id: string;
    grid: {
        size: [number, number];
        data: number[];
    }[];
    selected: number;

    public static getSize(data: TetrominoData): [number, number]
    {
        return data.grid[data.selected].size;
    }

    public static getData(data: TetrominoData): number[]
    {
        return data.grid[data.selected].data;
    }

    public static selectRandom(data: TetrominoData)
    {
        data.selected = randomRangeInt(0, data.grid.length);
    }

    public static clone(data: TetrominoData)
    {
        // Shallow clone only
        return Object.assign({}, data);
    }

    public static rotateClockwise(data: TetrominoData)
    {
        data.selected++;
        if (data.selected >= data.grid.length)
        {
            data.selected = 0;
        }
    }

    public static getAllRotations(data: TetrominoData): TetrominoData[]
    {
        return data.grid.map((v, i, a) =>
        {
            let clone = TetrominoData.clone(data);
            clone.selected = i;
            return clone;
        });
    }
}

@ccclass('TetrominoPiece')
export class TetrominoPiece extends Component 
{
    @property(VFXCallback)
    private spawnVfx: VFXCallback;
    @property(UITransform)
    private appearance: UITransform;
    @property(Node)
    private blockHost: Node;
    @property(Node)
    private gridPivot: Node;
    @property(Node)
    private previewHost: Node;
    @property(TetrominoPlayerInteractable)
    private interactable: TetrominoPlayerInteractable;

    private _cellSize: Vec2 = new Vec2();

    private _data: TetrominoData;
    private _allBlocks: PieceBlock[];
    private _blockMap: Map<number, PieceBlock>;
    private _pieceActive: boolean;
    private _previewBlocks: Node[];

    private _slot: number;
    private _spriteIndex: number;

    public get slot(): number
    {
        return this._slot;
    }

    public set slot(value: number)
    {
        this._slot = value;
    }
        
    public get allBlocks(): PieceBlock[]
    {
        return this._allBlocks;
    }

    public get data(): TetrominoData
    {
        return this._data;
    }

    public get blockMap(): Map<number, PieceBlock>
    {
        return this._blockMap;
    }
    
    // public set blockMap(value: Map<number, PieceBlock>)
    // {
    //     this._blockMap = value;
    // }

    public get pieceActive(): boolean
    {
        return this._pieceActive;
    }

    public set pieceActive(value: boolean)
    {
        if (this._pieceActive !== value)
        {
            this._pieceActive = value;

            if (this.node.active !== this._pieceActive)
            {
                this.node.active = this._pieceActive;
            }
        }
    }

    public get blockSprites(): Sprite[]
    {
        return this._allBlocks.filter(x => x !== null && x.node.active).map(x => x.spriteComponent);
    }

    private _hullData: Map<string, Vec2[]>;

    protected onLoad(): void
    {
        this._allBlocks = [];
        this._blockMap = new Map<number, PieceBlock>;

        this._hullData = new Map<string, Vec2[]>;

        this._previewBlocks = [];
        for (let child of this.previewHost.children)
        {
            this._previewBlocks.push(child);
        }
        this.previewHost.active = false;
    }

    protected start()
    {

    }

    protected update(deltaTime: number)
    {
        
    }

    public setSizes(cellSize: number)
    {
        this._cellSize = new Vec2(cellSize, cellSize);

        for (let previewBlock of this._previewBlocks)
        {
            previewBlock.getComponent(UITransform).contentSize = new Size(cellSize, cellSize);
        }
    }

    public onClickToRotate(event: EventTouch)
    {
        this.rotateClockwise();
        MainGameManager.instance.audioManager.playSfx(GameSound.BOOSTER_ROTATE);
        PuzzleGameManager.instance.signalBoosterFunctionCompleted(Booster.ROTATE);
    }

    public popSpawnVfx()
    {
        this.spawnVfx.requestPlayDefaultClip();
    }

    // Handle controls
    private _offset: Vec3;

    public onMoveStart(event: EventTouch): void
    {
        this._offset = new Vec3(0, this._cellSize.y * 2, 0);
        this.node.worldScale = Vec3.ONE;
        MainGameManager.instance.audioManager.playSfx(GameSound.PUZZLE_GRABPUZZLE);

        let screenPos = event.getLocation();
        let pos = PuzzleGameManager.instance.playerControl.camera.screenToWorld(new Vec3(screenPos.x, screenPos.y));
        this.appearance.node.position = this._offset;
        this.node.worldPosition = pos;
    }

    public onMove(event: EventTouch): void
    {
        let screenPos = event.getLocation();
        let pos = PuzzleGameManager.instance.playerControl.camera.screenToWorld(new Vec3(screenPos.x, screenPos.y));
        this.node.worldPosition = pos;

        // Show preview
        let cell = this.raycastToGridCell();
        if (cell !== null && PuzzleGameManager.instance.puzzleGrid.checkCanAttachPieceAtCell(this, cell))
        {
            this.previewHost.active = true;
            this.previewHost.worldPosition = new Vec3(cell.node.worldPosition.x, cell.node.worldPosition.y, this.previewHost.worldPosition.z);
        }
        else
        {
            this.previewHost.active = false;
            this.previewHost.position = this.gridPivot.position;
        }
}

    public onMoveEnd(event: EventTouch): void
    {
        let cell = this.raycastToGridCell();
        if (cell !== null)
        {
            let [attached, clearedLine] = PuzzleGameManager.instance.puzzleGrid.attachBlocksFromPiece(this, cell);
            if (attached)
            {
                this.pieceActive = false;
                if (clearedLine)
                {
                    console.warn("called with timeout");
                    setTimeout(() => PuzzleGameManager.instance.onPlayerPlayedAPiece(), PuzzleGameManager.instance.lineClearAnimTime * 1000);
                }
                else
                {
                    console.warn("called");
                    PuzzleGameManager.instance.onPlayerPlayedAPiece();
                }

                PuzzleGameManager.instance.puzzleGrid.tutorialPropagator.confirmDragSuccess();
            }
        }
        else
        {

        }

        this.node.position = Vec3.ZERO;
        this.appearance.node.position = Vec3.ZERO;
        this.node.scale = Vec3.ONE;

        MainGameManager.instance.audioManager.playSfx(GameSound.PUZZLE_DROPPUZZLE);
    }

    public getInteractable(): TetrominoPlayerInteractable
    {
        return this.interactable;
    }

    public setData(data: TetrominoData)
    {
        this._data = data;
        this.refreshAppearance();
    }

    public randomizeSpriteIndex()
    {
        this._spriteIndex = randomRangeInt(0, 100);
    }

    public cleanDataAndBlocks()
    {
        this._allBlocks = [];
        this._blockMap.clear();
    }
        
    public toIndex(x: number, y: number)
    {
        return x + TetrominoData.getSize(this._data)[0] * y;
    }

    public toCoord(index: number): readonly [number, number]
    {
        return [index % TetrominoData.getSize(this._data)[0], Math.floor(index / TetrominoData.getSize(this._data)[0])];
    }

    // DEPRECATED, DO NOT TOUCH, OR USE
    public requestBreak(block: PieceBlock)
    {
        let foundKey: number = -1;
        for (let [key, val] of this.blockMap)
        {
            if (val === block)
            {
                foundKey = key;
                break;
            }
        }

        if (foundKey > -1)
        {
            this.breakBlock(...this.toCoord(foundKey));
        }
    }

    // DEPRECATED, DO NOT TOUCH, OR USE
    public breakBlock(x: number, y: number)
    {
        let block = this.blockMap.get(this.toIndex(x, y));
        if (block !== null && block !== undefined)
        {
            let i = this._allBlocks.indexOf(block);
            if (i > 0)
            {
                // Remove from all blocks
                this._allBlocks.splice(i, 1);

                // Remove from map
                this._blockMap.delete(this.toIndex(x, y));

                block.returnToPool();

                // Calculate collider
                this.calculateCollider();
            }
        }
    }

    public rotateClockwise()
    {
        let newData = TetrominoData.clone(this._data);
        TetrominoData.rotateClockwise(newData);
        this.setData(newData);
    }

    private refreshAppearance()
    {
        this.resize();
        this.refreshPieceBlocks();
        this.refreshPreviews();
        this.popSpawnVfx();
        this.calculateCollider();
    }

    private refreshPieceBlocks()
    {
        let count = 0;
        this._blockMap = new Map<number, PieceBlock>();
        for (let y = 0; y < TetrominoData.getSize(this._data)[1]; ++y)
        {
            for (let x = 0; x < TetrominoData.getSize(this._data)[0]; ++x)
            {
                let i = this.toIndex(x, y);
                if (TetrominoData.getData(this._data)[i] === 0)
                {
                    continue;
                }

                if (count === this._allBlocks.length)
                {
                    this._allBlocks.push(this.getNewPieceBlock());
                }

                let block = this._allBlocks[count];
                block.node.getComponent(PieceBlock).holder = this.node;
                block.node.parent = this.blockHost;
                block.node.position = this.getPositionOfCoord(x, y);
                block.designatedSpriteIndex = this._spriteIndex;
                block.type = PieceBlockType.NORMAL;
                block.hardness = 1;
                this._blockMap.set(i, block);
                block.node.active = true;
                block.appear();

                ++count;
            }
        }

        for (let i = count; i < this._allBlocks.length; ++i)
        {
            this._allBlocks[i].node.active = false;
        }
    }

    private refreshPreviews()
    {
        this.previewHost.position = this.gridPivot.position;
        for (let i = 0; i < this._previewBlocks.length; ++i)
        {
            let previewBlock = this._previewBlocks[i];
            if (i < this._allBlocks.length)
            {
                previewBlock.active = this._allBlocks[i] && this._allBlocks[i].node.active;
                previewBlock.worldPosition = this._allBlocks[i].node.worldPosition;
                previewBlock.getComponent(Sprite).spriteFrame = this._allBlocks[i].currentSprite;
            }
            else
            {
                previewBlock.active = false;
            }
        }

        this.previewHost.active = false;
    }

    private calculateCollider()
    {
        // if (!this._hullData.has(this._data.id))
        // {
        //     let points = new Array<Vec2>();
        //     this._allBlocks.forEach((block) =>
        //     {
        //         if (block.node.active === false)
        //         {
        //             return;
        //         }
                
        //         points.push(new Vec2(block.node.position.x, block.node.position.y).add(new Vec2(-this._cellSize.x / 2 - 40, -this._cellSize.y / 2 - 40)));
        //         points.push(new Vec2(block.node.position.x, block.node.position.y).add(new Vec2(-this._cellSize.x / 2 - 40, this._cellSize.y / 2 + 40)));
        //         points.push(new Vec2(block.node.position.x, block.node.position.y).add(new Vec2(this._cellSize.x / 2 + 40, -this._cellSize.y / 2 - 40)));
        //         points.push(new Vec2(block.node.position.x, block.node.position.y).add(new Vec2(this._cellSize.x / 2 + 40, this._cellSize.y / 2 + 40)));
        //     });

        //     let outline = makeHull(points);
        //     this._hullData[this._data.id] = outline;
        // }

        // let outline = this._hullData[this._data.id];
        // this.polygonCollider.points = outline;
    }

    private resize()
    {
        let transform = this.getComponent(UITransform);
        let tx = TetrominoData.getSize(this._data)[0] - 1;
        let ty = TetrominoData.getSize(this._data)[1] - 1;
        transform.contentSize = new Size(this._cellSize.x * 5, this._cellSize.y * 5);
        this.appearance.contentSize = new Size(this._cellSize.x * 5, this._cellSize.y * 5);

        this.gridPivot.position = new Vec3(-this._cellSize.x * tx / 2, this._cellSize.y * ty / 2);
        this.previewHost.position = this.gridPivot.position;
    }

    private getPositionOfCoord(x: number, y: number): Vec3
    {
        return new Vec3(this._cellSize.x * x + this.gridPivot.position.x, this.gridPivot.position.y - this._cellSize.y * y, this.gridPivot.position.z);
    }

    private getNewPieceBlock(): PieceBlock
    { 
        return PieceBlockPool.instance.getBlock();
    }

    private raycastToGridCell(): PuzzleGridCell
    {
        // let results = PhysicsSystem2D.instance.testAABB(new Rect(this.gridPivot.worldPosition.x, this.gridPivot.worldPosition.y, 1, 1));

        // let found: PuzzleGridCell = null;
        // let i = 0;
        // while (i < results.length && found === null)
        // {
        //     let collider = results[i];
        //     if (collider.node.getComponent(PuzzleGridCell))
        //     {
        //         found = collider.node.getComponent(PuzzleGridCell);
        //     }
        //     ++i;
        // }
        
        // return found;

        return PuzzleGameManager.instance.puzzleGrid.getCellThatContains(this.gridPivot.worldPosition.clone());
    }

    public resetPosition()
    {
        this.node.position = Vec3.ZERO;
        this.node.scale = Vec3.ONE;
    }
}

