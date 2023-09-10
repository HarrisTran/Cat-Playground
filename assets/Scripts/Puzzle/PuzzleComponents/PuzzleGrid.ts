import { _decorator, BoxCollider2D, CCFloat, CCInteger, Color, Component, Game, instantiate, Layout, Node, Prefab, randomRangeInt, Size, Sprite, UI, UITransform, Vec3 } from 'cc';
import { TetrominoData, TetrominoPiece } from './TetrominoPiece';
import { PuzzleGridCell } from './PuzzleGridCell';
import { IPieceBlock, PIECE_BLOCK_FISH_CODE, PIECE_BLOCK_NORMAL_CODE_START, PIECE_BLOCK_PERMANENT_CODE, PieceBlockType } from './PieceBlock';
import { PuzzleGameManager } from '../PuzzleGameManager';
import { PuzzleGridRecommendEngine } from './PuzzleGridRecommendEngine';
import { PuzzleLevelData } from '../PuzzleLevelData';
import { PieceBlockPool } from '../PieceBlockPool';
import { last, shuffleInPlace } from '../../Utilities/ArrayExtensions';
import { isBetween } from '../../Utilities/NumberUtilities';
import { getWorldBounds as getWorldBound, mergeBounds } from '../../Utilities/OtherUtilities';
import { PuzzleSession } from '../../PlayerData/PuzzleStatistics';
import { LineClearVFXSet } from '../../VFXs/LineClearVFXSet';
import { TutorialPropagator } from '../../Tutorial/TutorialPropagator';
import { LimitConstraint } from './LimitConstraint';
const { ccclass, property } = _decorator;

export interface IPuzzleGrid extends PuzzleGrid { }

@ccclass('PuzzleGrid')
export class PuzzleGrid extends Component
{
    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: Node})
    private cellHost: Node;
    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: Layout})
    private cellLayout: Layout;
    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: LineClearVFXSet})
    private lineClearVFXSet: LineClearVFXSet;
    @property({group: {name: "Components", id: "1", displayOrder: 1}, type: TutorialPropagator})
    public tutorialPropagator: TutorialPropagator;

    @property({ group: {name: "Params"}, type: CCInteger })
    private gridSize: number;
    @property({ group: {name: "Params"}, type: CCFloat })
    private desiredPixelSize: number = 900;
    @property({ group: { name: "Params" }, type: CCFloat })
    private minimumPixelMargin: number = 50;
    @property({ group: { name: "Params" }, type: CCFloat })
    private minimumPixelPadding: number = 10;
    @property({ group: { name: "Params" }, type: CCFloat })
    private minimumCellPadding: number = 5;

    private _level: PuzzleLevelData;

    private _allCells: PuzzleGridCell[];
    private _allBlocks: IPieceBlock[];
    private _cellCountPerRow: number[];
    private _cellCountPerCol: number[];

    private _limitConstraint: LimitConstraint = null;

    // Cell sizes
    private _gridPixelSize: number;
    private _cellPixelSize: number;
    private _blockPixelSize: number;

    public get gridPixelSize(): number
    {
        return this._gridPixelSize;
    }

    public get cellPixelSize(): number
    {
        return this._cellPixelSize;
    }

    public get blockPixelSize(): number
    {
        return this._blockPixelSize;
    }

    private _onGoingSession: PuzzleSession;
    private _recommendEngine: PuzzleGridRecommendEngine;

    public get totalCellCount(): number
    {
        return this.gridSize * this.gridSize;
    }

    protected onLoad(): void
    {
        this._recommendEngine = new PuzzleGridRecommendEngine();
        this._level = null;
    }

    protected start()
    {
        
    }

    protected update(deltaTime: number)
    {
        // if (this._allCells != null && this._allCells != undefined)
        // {
        //     for (var i = 0; i < this._allCells.length; ++i)
        //     {
        //         let cell = this._allCells[i];
        //         let block = this._allBlocks[i];
        //         cell.debugColorize((block !== null && block !== undefined) ? Color.RED : Color.BLUE);
        //     }
        // }
    }

    public calculateGridToFitScreenSize(screenSize: number)
    {
        let minimumGridSize = screenSize - (this.minimumPixelMargin * 2);
        if (minimumGridSize >= this.desiredPixelSize)
        {
            minimumGridSize = this.desiredPixelSize;
        }

        let totalCellSize = minimumGridSize - (this.minimumPixelPadding * 2);
        this._cellPixelSize = Math.floor(totalCellSize / this.gridSize);
        totalCellSize = this._cellPixelSize * this.gridSize;
        this._gridPixelSize = totalCellSize + (this.minimumPixelPadding * 2);
        this._blockPixelSize = this._cellPixelSize - (this.minimumCellPadding * 2);

        // Change grid pixel size
        this.node.getComponent(UITransform).contentSize = new Size(this._gridPixelSize, this._gridPixelSize);

        this.cellHost.getComponent(UITransform).contentSize = new Size(totalCellSize, totalCellSize);

        // Change cell size
        for (let cellNode of this.cellHost.children)
        {
            cellNode.getComponent(UITransform).contentSize = new Size(this._cellPixelSize, this._cellPixelSize);
            cellNode.getChildByName("CellBack").getComponent(UITransform).contentSize = new Size(this._blockPixelSize, this._blockPixelSize);
        }

        // VFX sizes
        this.lineClearVFXSet.setGridSizes(totalCellSize, this._cellPixelSize)
    }

    // Set before calling activate
    public setLevelData(level: PuzzleLevelData)
    {
        this._level = level;
    }

    public setOngoingSession(session: PuzzleSession)
    {
        this._onGoingSession = session;
    }

    public activate()
    {
        this._allCells = new Array<PuzzleGridCell>(this.totalCellCount);
        this.cellHost.children.forEach((child, i, arr) =>
        {
            let cell = child.getComponent(PuzzleGridCell);
            if (cell == null)
            {
                throw new Error("Cell \"" + child.name + "\" in cellHost does not have PuzzleGridCell component.");
            }

            this._allCells[i] = cell;
            let isEven = (Math.floor(i / this.gridSize) + (i % this.gridSize)) % 2 === 0;
            this._allCells[i].setGridIndex(i, isEven);
        });

        this._allBlocks = new Array<IPieceBlock>(this.totalCellCount);
        for (let i = 0; i < this._allBlocks.length; ++i)
        {
            this._allBlocks[i] = null;  // Just to be safe
        }

        this._cellCountPerRow = new Array<number>(this.gridSize);
        this._cellCountPerCol = new Array<number>(this.gridSize);
        for (let i = 0; i < this.gridSize; ++i)
        {
            this._cellCountPerRow[i] = this._cellCountPerCol[i] = 0;  // Just to be safe
        }

        this._recommendEngine.initialize(this.gridSize);
        this.populateMapFromData();
        this.restoreSession();
    }

    public deactivate()
    {
        // Add something if needed
    }

    public clear()
    {
        if (this._allBlocks !== null && this._allBlocks !== undefined)
        {
            for (let i = 0; i < this._allBlocks.length; ++i)
            {
                if (this._allBlocks[i] !== null)
                {
                    this._allBlocks[i].returnToPool();
                }
            }
        }

        // Clear reference
        this._level = null;
        this._onGoingSession = null;
        this._limitConstraint = null;
        this.clearTutorialPropagator();
    }

    public checkCanAttachPiece(piece: TetrominoPiece): boolean
    {
        for (let oX = 0; oX <= this.gridSize - TetrominoData.getSize(piece.data)[0]; ++oX)
        {
            for (let oY = 0; oY <= this.gridSize - TetrominoData.getSize(piece.data)[1]; ++oY)
            {
                if (this.checkCanAttachPieceAt(piece, oX, oY))
                {
                    return true;
                }
            }
        }

        return false;
    }

    public checkCanAttachPieceAt(piece: TetrominoPiece, oX: number, oY: number): boolean
    {
        for (let [key, block] of piece.blockMap)
        {
            let [iX, iY] = piece.toCoord(key);
            let index = this.toIndex(oX + iX, oY + iY);
            if (oX + iX >= this.gridSize ||
                oY + iY >= this.gridSize ||
                this._allBlocks[index] !== null ||
                (this._limitConstraint && !this._limitConstraint.indexes.has(index)))
            {
                return false;
            }
        }

        return true;
    }

    public checkCanAttachPieceAtCell(piece: TetrominoPiece, cell: PuzzleGridCell): boolean
    {
        let index = this.findIndex(cell);
        if (index < 0) return false;
        let [oX, oY] = this.toCoord(index);
        return this.checkCanAttachPieceAt(piece, oX, oY);
    }

    public attachBlocksFromPiece(piece: TetrominoPiece, cell: PuzzleGridCell): readonly [boolean, boolean]
    {
        let index = this.findIndex(cell);
        if (index < 0) return [false, false];
        let [oX, oY] = this.toCoord(index);

        if (!this.checkCanAttachPieceAt(piece, oX, oY))
        {
            return [false, false];
        }

        let setIndexes = [];
        let count = 0;
        for (let [key, block] of piece.blockMap)
        {
            let [iX, iY] = piece.toCoord(key);

            let pX = oX + iX;
            let pY = oY + iY;
            this.attachBlock(block, pX, pY);

            setIndexes.push(this.toIndex(pX, pY));

            ++count;
        }

        piece.cleanDataAndBlocks();

        PuzzleGameManager.instance.onBlockSet(count);
        let clear = this.examineGridForClear(setIndexes);


        return [true, clear];
    }

    public toIndex(x: number, y: number)
    {
        return x + this.gridSize * y;
    }

    public toCoord(index: number): readonly [number, number]
    {
        return [index % this.gridSize, Math.floor(index / this.gridSize)];
    }
    
    public recommendPieces(count: number): TetrominoData[]
    {
        return this._recommendEngine.getSuitablePieces(count);
    }

    public requestBreak(block: IPieceBlock)
    {
        let i = this._allBlocks.findIndex(v => v === block);
        if (i > -1 && block.canBreakByBooster)
        {
            this.removeBlock(...this.toCoord(i));
        }
    }

    public spawnRandomFish(count: number)
    {
        // Get free cells
        let shufflable = [];
        for (let cellIndex = 0; cellIndex < this._allBlocks.length; ++cellIndex)
        {
            if (this._allBlocks[cellIndex] === null)
            {
                shufflable.push(cellIndex);
            }
        }

        shuffleInPlace(shufflable);

        let cells = shufflable.slice(0, Math.min(shufflable.length, count));

        for (let i of cells)
        {
            // Make blocks
            let block = PieceBlockPool.instance.getBlock();
            block.designatedSpriteIndex = randomRangeInt(0, 100);
            block.type = PieceBlockType.FISH;
            this.attachBlock(block, ...this.toCoord(i));
            block.appear();
            setTimeout(() => this.examineGridForClear([i]), PuzzleGameManager.instance.newPieceAnimTime);
        }
    }

    public getCellThatContains(worldPosition: Vec3): PuzzleGridCell
    {
        let firstCell = this._allCells[0];
        let lastCell = last(this._allCells);

        let bound = mergeBounds(getWorldBound(firstCell.node), getWorldBound(lastCell.node));

        if (isBetween(worldPosition.x, bound.xMin, bound.xMax) &&
            isBetween(worldPosition.y, bound.yMin, bound.yMax))
        {
            let deltaX = worldPosition.x - bound.xMin;
            let deltaY = bound.yMax - worldPosition.y;

            let px = Math.floor(deltaX / this._cellPixelSize);
            let py = Math.floor(deltaY / this._cellPixelSize);

            return this._allCells[this.toIndex(px, py)];
        }

        return null;
    }

    public popuplateRandomAnim(initDelay: number, delayTime: number): number
    {
        let actions: (() => void)[] = [];

        for (let i = this.gridSize - 1; i >= 0 ; --i)
        {
            actions.push(() =>
            {
                for (let j = 0; j < this.gridSize; ++j)
                {
                    let block = this.getBlockByType(PieceBlockType.NORMAL, randomRangeInt(0, 100));
                    if (this._allBlocks[this.toIndex(j, i)] === null)
                    {
                        this.attachBlock(block, j, i);
                        block.appear();
                    }
                };
            });
        }

        let delay = initDelay;
        for (let action of actions)
        {
            delay += delayTime;
            setTimeout(action, delay * 1000);
        }

        return Math.min(delay + delayTime, delay - delayTime + PuzzleGameManager.instance.newPieceAnimTime);
    }

    public clearWithAnim(initDelay: number, delayTime: number): number
    {
        let actions: (() => void)[] = [];

        for (let i = 0; i < this.gridSize; ++i)
        {
            actions.push(() =>
            {
                for (let j = 0; j < this.gridSize; ++j)
                {
                    if (this._allBlocks[this.toIndex(j, i)] !== null)
                    {
                        let block = this._allBlocks[this.toIndex(j, i)];
                        this.removeBlock(j, i, true);
                    }
                };
            });
        }

        let delay = initDelay;
        for (let action of actions)
        {
            delay += delayTime;
            setTimeout(action, delay * 1000);
        }

        return Math.min(delay + delayTime, delay - delayTime + PuzzleGameManager.instance.newPieceAnimTime);
    }

    public populateRandomOnly()
    {
        for (let i = 0; i < this.gridSize; ++i)
        {
            for (let j = 0; j < this.gridSize; ++j)
            {
                let block = this.getBlockByType(PieceBlockType.NORMAL, randomRangeInt(0, 100));
                if (this._allBlocks[this.toIndex(i, j)] === null || this._allBlocks[this.toIndex(i, j)] === undefined)
                {
                    this.attachBlock(block, i, j);
                }
            }
        }
    }

    public clearTutorialPropagator()
    {
        this.tutorialPropagator.node.worldPosition = new Vec3(99999, 99999, 0);
    }

    public setTutorialPropagator(index: number, sx: number, sy: number)
    {
        let w = this._cellPixelSize * sx;
        let h = this._cellPixelSize * sy;
        let cellPos = this._allCells[index].node.worldPosition.clone();
        let offset = new Vec3(cellPos.x + ((sx - 1) * this._cellPixelSize) / 2, cellPos.y - ((sy - 1) * this._cellPixelSize / 2), cellPos.z);
        this.tutorialPropagator.getComponent(UITransform).setContentSize(new Size(w, h));
        this.tutorialPropagator.node.worldPosition = offset;
    }

    private examineGridForClear(setIndexes: number[]): boolean
    {
        let count = 0;
        let blocksBroke = new Set<number>();
        let colsBroke: number[] = [];
        let rowsBroke: number[] = [];
        let blocksBrokeOfSetIndexes = new Set<number>();

        // TODO: Localize search
        for (let i = 0; i < this.gridSize; ++i) {
            if (this._cellCountPerRow[i] === this.gridSize) {
                rowsBroke.push(i);
                for (let j = 0; j < this.gridSize; ++j) {
                    let index = this.toIndex(0, i) + j;
                    blocksBroke.add(index);
                    if (setIndexes.indexOf(index) >= 0) {
                        blocksBrokeOfSetIndexes.add(index);
                    }
                }
                ++count;
            }
        }

        for (let i = 0; i < this.gridSize; ++i) {
            if (this._cellCountPerCol[i] === this.gridSize) {
                colsBroke.push(i);
                for (let j = 0; j < this.gridSize; ++j) {
                    let index = this.toIndex(i, 0) + j * this.gridSize;
                    blocksBroke.add(index);
                    if (setIndexes.indexOf(index) >= 0) {
                        blocksBrokeOfSetIndexes.add(index);
                    }
                }
                ++count;
            }
        }

        if (blocksBroke.size === 0) return false;

        // Line clear VFXs
        let blockBrokePositions: Vec3[] = [];
        let linePositions: (readonly [Vec3, boolean])[] = [];
        let breakBlockPositions: (readonly [Vec3, string])[] = [];
        let fishPositions: Vec3[] = [];

        // Center block breaks
        for (let index of blocksBrokeOfSetIndexes)
        {
            let cell = this._allCells[index];
            let pos = new Vec3(cell.node.worldPosition.x, cell.node.worldPosition.y, 0);
            blockBrokePositions.push(pos);
        }

        // Line breaks

        for (let col of colsBroke)
        {
            let posY = this.lineClearVFXSet.node.worldPosition.y;
            let posX = this._allCells[this.toIndex(col, 0)].node.worldPosition.x;
            linePositions.push([new Vec3(posX, posY, 0), true]);
        }

        for (let row of rowsBroke)
        {
            let posX = this.lineClearVFXSet.node.worldPosition.x;
            let posY = this._allCells[this.toIndex(0, row)].node.worldPosition.y;
            linePositions.push([new Vec3(posX, posY, 0), false]);
        }

        // Block breaks
        for (let cellIndex of blocksBroke)
        {
            var block = this._allBlocks[cellIndex];
            let cell = this._allCells[cellIndex];
            let pos = new Vec3(cell.node.worldPosition.x, cell.node.worldPosition.y, 0);

            breakBlockPositions.push([pos, block.blockId]);
        }

        // Fish 
        for (let cellIndex of blocksBroke)
        {
            let block = this._allBlocks[cellIndex];

            if (block && block.type === PieceBlockType.FISH)
            {
                let cell = this._allCells[cellIndex];
                let pos = new Vec3(cell.node.worldPosition.x, cell.node.worldPosition.y, 0);
                fishPositions.push(pos);
            }
        }

        this.lineClearVFXSet.requestVFXs(blockBrokePositions, linePositions, breakBlockPositions, fishPositions);

        // console.log(Array.from(blocksBroke).map(x =>
        // {
        //     let block = this._allBlocks[x];
        //     return [this.toCoord(x), block.type];
        // }));

        for (let i of blocksBroke)
        {
            let [x, y] = this.toCoord(i);
            this.removeBlock(x, y);
        }

        // Get centermost
        let minX = 99999;
        let minY = 99999;
        let maxX = -1;
        let maxY = -1;

        for (let index of setIndexes)
        {
            let [x, y] = this.toCoord(index);
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }

        // Pop score floater
        let minVec = this._allCells[this.toIndex(minX, minY)].node.worldPosition.clone();
        let maxVec = this._allCells[this.toIndex(maxX, maxY)].node.worldPosition.clone();
        let whereToPopScoreFloater = new Vec3((minVec.x + maxVec.x) / 2, (minVec.y + maxVec.y) / 2, minVec.z);
        PuzzleGameManager.instance.onLineClearConfirmed(whereToPopScoreFloater, count);

        return true;
    }

    public getCellSprites(): Sprite[]
    {
        return this._allCells.map(x => x.spriteComponent);
    }

    public getBlockSprites(): Sprite[]
    {
        return this._allBlocks.filter(x => x !== null).map(x => x.spriteComponent);
    }

    private attachBlock(block: IPieceBlock, x: number, y: number)
    {
        let index = this.toIndex(x, y);
        let cell = this._allCells[index];
        (block.node.getComponent("PieceBlock") as IPieceBlock).holder = this.node;
        block.node.parent = cell.node;
        block.node.position = Vec3.ZERO;
        this._allBlocks[index] = block;

        this._allCells[index].attachedBlock = block;

        this._cellCountPerRow[y] += 1;
        this._cellCountPerCol[x] += 1;
        this._recommendEngine.addBlock(x, y);
    }

    private removeBlock(x: number, y: number, useAlternativeAnim: boolean = false)
    {
        let index = this.toIndex(x, y);
        let block = this._allBlocks[index];

        let shouldRemove = block.tryClear();
        if (shouldRemove)
        {
            block.holder = null;
            block.remove(useAlternativeAnim);

            this._allBlocks[index] = null;
            this._allCells[index].attachedBlock = null;
            this._cellCountPerRow[y] -= 1;
            this._cellCountPerCol[x] -= 1;
            this._recommendEngine.removeBlock(x, y);
        }
    }

    private findIndex(cell: PuzzleGridCell): number
    {
        return this._allCells.findIndex((c) => c === cell);
    }

    private populateMapFromData()
    {
        if (this._level !== null)
        {
            this.populateGrid(this._level.blockData);
        }
    }

    public forcePopulateMap()
    {
        this.populateMapFromData();
    }

    public setLimit(constraint: LimitConstraint)
    {
        this._limitConstraint = constraint;
    }

    public removeLimit()
    {
        this._limitConstraint = null;
    }

    public getBlockData(): number[]
    {
        let res = Array<number>(this._allBlocks.length);
        for (let i = 0; i < this._allBlocks.length; ++i)
        {
            let block = this._allBlocks[i];
            if (block)
            {
                if (block.type == PieceBlockType.NORMAL)
                {
                    res[i] = block.designatedSpriteIndex + PIECE_BLOCK_NORMAL_CODE_START;
                }
                else if (block.type == PieceBlockType.NUMBERED)
                {
                    res[i] = block.hardness;
                }
                else if (block.type == PieceBlockType.FISH)
                {
                    res[i] = PIECE_BLOCK_FISH_CODE + block.designatedSpriteIndex;
                }
                else if (block.type == PieceBlockType.PERMANENT)
                {
                    res[i] = PIECE_BLOCK_PERMANENT_CODE;
                }
            }
            else
            {
                res[i] = 0;
            }
        }

        return res;
    }

    private restoreSession()
    {
        // Just use block data
        if (this._onGoingSession && this._onGoingSession.puzzleGrid)
        {
            this.populateGrid(this._onGoingSession.puzzleGrid);
        }
    }

    private populateGrid(blockData: number[], playAppearAnim: boolean = false)
    {
        for (let i = 0; i < blockData.length; ++i)
        {
            if (blockData[i] > 0)
            {
                let block = this.getBlock(blockData[i]);

                this.attachBlock(block, ...this.toCoord(i));

                if (playAppearAnim)
                {
                    block.appear();
                }
            }
        }
    }

    private getBlock(blockData: number): IPieceBlock
    {
        let block = PieceBlockPool.instance.getBlock();

        if (blockData === PIECE_BLOCK_PERMANENT_CODE)
        {
            block.designatedSpriteIndex = 0;
            block.type = PieceBlockType.PERMANENT;
        }
        else if (blockData >= PIECE_BLOCK_FISH_CODE && blockData < PIECE_BLOCK_NORMAL_CODE_START)
        {
            block.designatedSpriteIndex = blockData - PIECE_BLOCK_FISH_CODE;
            block.type = PieceBlockType.FISH;
        }
        else if (blockData >= PIECE_BLOCK_NORMAL_CODE_START)
        {
            let spriteIndex = blockData - PIECE_BLOCK_NORMAL_CODE_START;
            block.designatedSpriteIndex = spriteIndex;
            block.type = PieceBlockType.NORMAL;
            block.hardness = 1;
        }
        else if (blockData >= 0)
        {
            block.designatedSpriteIndex = 0;
            block.type = PieceBlockType.NUMBERED;
            block.hardness = blockData;
        }
        else
        {
            return null;
        }

        return block;
    }

    private getBlockByType(type: PieceBlockType, spriteIndex: number, hardness?: number): IPieceBlock
    {
        let block = PieceBlockPool.instance.getBlock();

        block.designatedSpriteIndex = spriteIndex;
        block.type = type;
        if (hardness) block.hardness = hardness;

        return block;
    }
}

