import { _decorator, CCFloat, Component, Game, Layout, Node, randomRange, randomRangeInt, Size, Sprite, UITransform, Vec3 } from 'cc';
import { TetrominoData, ITetrominoPiece } from './TetrominoPiece';
import { PredefinedTetrominoPieces } from './TetrominoDefinedData';
import { PuzzleGameManager } from '../PuzzleGameManager';
import { PuzzleSession, SavedPieceData } from '../../PlayerData/PuzzleStatistics';
import { TetrominoPlayerInteractable } from '../TetrominoPlayerInteractable';
const { ccclass, property } = _decorator;

export interface ITetrominoQueue extends TetrominoQueue { }

@ccclass('TetrominoQueue')
export class TetrominoQueue extends Component
{
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: [Node] })
    private slots: Node[] = [];
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: [Node] })
    private pieceNodes: Node[] = [];

    @property({ group: { name: "Params", id: "1", displayOrder: 2 }, type: CCFloat })
    private desiredBoxWidth: number = 828;
    @property({ group: { name: "Params", id: "1", displayOrder: 2 }, type: CCFloat })
    private desiredBoxHeight: number = 308;
    @property({ group: { name: "Params", id: "1", displayOrder: 2 }, type: CCFloat })
    private desiredSlotHeight: number = 240;
    @property({ group: { name: "Params", id: "1", displayOrder: 2 }, type: CCFloat })
    private baseSpacing: number = 240;

    private _pieces: ITetrominoPiece[];

    private _slotScale: Vec3 = Vec3.ONE;

    protected onLoad(): void
    {
        this._pieces = this.pieceNodes.map(v => {
            return v.getComponent("TetrominoPiece") as ITetrominoPiece;
        });

        this._pieces.forEach((p, i, a) =>
        {
            p.slot = i;
        })
    }

    protected start()
    {
        for (let piece of this._pieces)
        {
            piece.getInteractable().addToControlHelper();
        }
    }

    protected update(deltaTime: number)
    {

    }

    public setSizes(gridWidth: number, cellSize: number)
    {
        let ratio = this.desiredBoxHeight / this.desiredBoxWidth;
        let slotToBoxHeightRatio = this.desiredSlotHeight / this.desiredBoxHeight;
        let boxWidth = Math.min(gridWidth, this.desiredBoxWidth);
        let boxHeight = ratio * boxWidth;

        this.node.getComponent(UITransform).contentSize = new Size(boxWidth, boxHeight);

        let slotScaledSize = Math.min(this.desiredSlotHeight, slotToBoxHeightRatio * boxHeight);
        let slotActualSize = cellSize * 5;
        let scale = Math.min(slotScaledSize / slotActualSize, 1);
        this._slotScale = new Vec3(scale, scale, 1);

        for (let slot of this.slots)
        {
            slot.getComponent(UITransform).contentSize = new Size(slotActualSize, slotActualSize);
            slot.scale = this._slotScale;
        }

        for (let piece of this._pieces)
        {
            piece.setSizes(cellSize);
        }

        console.log(this.baseSpacing);
        console.log(boxWidth / this.desiredBoxWidth);
        let spacing = this.baseSpacing * (boxWidth / this.desiredBoxWidth);
        console.log(spacing);

        this.slots[0].position = new Vec3(-spacing, this.slots[0].position.y, this.slots[0].position.z);
        this.slots[2].position = new Vec3(spacing, this.slots[2].position.y, this.slots[2].position.z);
    }

    public activate()
    {
        // Uhm, do nothing?
    }

    public deactivate()
    {
        this._pieces.forEach((v) => v.pieceActive = false);
    }

    public setSpecificPiecesFromSessions(session: PuzzleSession)
    {
        let data: SavedPieceData[] = session.queuePieces;

        if (data === undefined || data === null)
        {
            this.refreshAllPieces();
            return;
        }
        this.setSpecificPieces(data);
    }

    public setSpecificPieces(data: SavedPieceData[])
    {
        for (let i = 0; i < this.getSlotCount(); ++i)
        {
            let pieceData = PredefinedTetrominoPieces.find((x) =>
            {
                if (!data[i]) return false;
                return x.id === data[i].id;
            });

            if (pieceData)
            {
                let actualData = TetrominoData.clone(pieceData);
                actualData.selected = data[i].selected;
                this.refreshPiece(i, actualData);
                this._pieces[i].pieceActive = data[i].active;
            }
            else
            {
                this.refreshPiece(i, this.getRandomData());
                this._pieces[i].pieceActive = false;
            }
        }
    }

    public clear()
    {
        for (let p of this._pieces)
        {
            p.pieceActive = false;
        }
    }

    public getSlotCount(): number
    {
        return this.slots.length;
    }

    public getSlot(i: number): Node
    {
        return this.slots[i];
    }

    public getActivePiece(i: number): ITetrominoPiece
    {
        return this._pieces[i].pieceActive ? this._pieces[i] : null;
    }

    public shouldRefresh(): boolean
    {
        return this._pieces.every((v) => !v.pieceActive);
    }

    public getCurrentStateForSession(): SavedPieceData[]
    {
        return this._pieces.map((piece) =>
        {
            return new SavedPieceData(piece.data.id, piece.data.selected, piece.pieceActive);
        });
    }

    public refreshAllPieces(forcedGoodPieces: boolean = false, doNotRecord: boolean = false)
    {
        let count = forcedGoodPieces ? this.slots.length : PuzzleGameManager.instance.getRecommendationCount();
        let piecesToSet = PuzzleGameManager.instance.puzzleGrid.recommendPieces(count);
        for (let i = 0; i < this.slots.length; ++i)
        {
            if (piecesToSet[i] === null || piecesToSet[i] === undefined)
            {
                piecesToSet[i] = this.getRandomData();
            }
        }

        piecesToSet.sort((a, b) => randomRange(-0.5, 0.5));

        for (let i = 0; i < this.slots.length; ++i)
        {
            this.refreshPiece(i, piecesToSet[i]);
        }

        if (!doNotRecord)
        {
            PuzzleGameManager.instance.recordPieceAppearance(...piecesToSet.map(x => x.id));
        }
    }

    public refreshPiece(i: number, data: TetrominoData)
    {
        let piece = this._pieces[i];
        piece.resetPosition();
        piece.randomizeSpriteIndex();
        piece.setData(data);

        if (!this._pieces[i].pieceActive)
        {
            this._pieces[i].pieceActive = true;
        }
    }

    public getBlockSprites(): Sprite[]
    {
        let all = [...this._pieces[0].blockSprites, ...this._pieces[1].blockSprites, ...this._pieces[2].blockSprites];
        return all;
    }

    private _indexToWeight: number[] = null;
    private _totalWeight: number;
    private getRandomData(): TetrominoData
    {
        // Weighted random
        let rand = randomRangeInt(0, this._totalWeight);

        let randI = -1;
        for (let i = 0; i < PredefinedTetrominoPieces.length; ++i)
        {
            rand -= this._indexToWeight[i];
            if (rand < 0)
            {
                randI = i;
                break;
            }
        }

        // Dont have to deep clone
        let realData = TetrominoData.clone(PredefinedTetrominoPieces[randI]);
        TetrominoData.selectRandom(realData);

        return realData;
    }

    public generateIndexToWeightMap(weightArray: Array<readonly [string, number]>)
    {
        let arr = Array<number>(PredefinedTetrominoPieces.length);
        PredefinedTetrominoPieces.forEach((piece, i, _) =>
        {
            let weightI = weightArray.findIndex((v) => v[0] === piece.id);

            if (weightI < 0)
            {
                throw new Error("Tetromino id \"" + piece.id + "\" does not exist in the weight array, please check.");
            }
            arr[i] = weightArray[weightI][1];
        });

        this._indexToWeight = arr;

        // Total weight
        let weight = 0;
        for (let w of this._indexToWeight)
        {
            weight += w;
        }
        this._totalWeight = weight;
    }
}

