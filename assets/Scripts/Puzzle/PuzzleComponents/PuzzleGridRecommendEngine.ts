import { random, randomRange, randomRangeInt } from "cc";
import { PredefinedTetrominoPieces } from "./TetrominoDefinedData";
import { TetrominoData } from "./TetrominoPiece";

// Do plan to optimize this thing, will i.

export class PuzzleGridRecommendEngine
{
    private _gridSize: number;
    private _freeCells: Set<number>;
    private _grid: boolean[];
    private _colCellCount: number[];
    private _rowCellCount: number[];

    public initialize(gridSize: number)
    {
        this._gridSize = gridSize;
        this._grid = [];
        this._freeCells = new Set<number>();
        for (let i = 0; i < gridSize * gridSize; ++i)
        {
            this._grid.push(false);
            this._freeCells.add(i);
        }

        this._colCellCount = new Array<number>(this._gridSize);
        this._rowCellCount = new Array<number>(this._gridSize);
        for (let i = 0; i < this._gridSize; ++i)
        {
            this._colCellCount[i] = this._rowCellCount[i] = 0;  // Just to be safe
        }
    }

    public addBlock(x: number, y: number)
    {
        this._grid[this.toIndex(x, y)] = true;
        this._freeCells.delete(this.toIndex(x, y));
        this._colCellCount[x] += 1;
        this._rowCellCount[y] += 1;
    }

    public removeBlock(x: number, y: number)
    {
        this._grid[this.toIndex(x, y)] = false;
        this._freeCells.add(this.toIndex(x, y));
        this._colCellCount[x] -= 1;
        this._rowCellCount[y] -= 1;
    }

    public getSuitablePieces(recommendCount: number): TetrominoData[]
    {
        let result = this.getAllSuitablePieces();
        return result.slice(0, recommendCount);
    }

    public getAllSuitablePieces(): TetrominoData[]
    {
        let beginTime = performance.now();
        let result: (readonly [TetrominoData, number])[] = [];

        let tempGrid = this._grid.map(v => v);
        let tempColCount = this._colCellCount.map(v => v);
        let tempRowCount = this._rowCellCount.map(v => v);
        let setXs: number[] = [];
        let setYs: number[] = [];

        let recordedPieces = new Map<string, [TetrominoData, number]>();

        // This should work but god 5 fors?
        for (let basePiece of PredefinedTetrominoPieces)
        {
            for (let piece of TetrominoData.getAllRotations(basePiece))
            {
                for (let gx = 0; gx <= this._gridSize - TetrominoData.getSize(piece)[0]; ++gx)
                {
                    for (let gy = 0; gy <= this._gridSize - TetrominoData.getSize(piece)[1]; ++gy)
                    {
                        let score = 0;
                        let isValidPiece = true;
                        for (let x = 0; isValidPiece && x < TetrominoData.getSize(piece)[0]; ++x)
                        {
                            for (let y = 0; isValidPiece && y < TetrominoData.getSize(piece)[1]; ++y)
                            {
                                let i = y * TetrominoData.getSize(piece)[0] + x;
                                let mx = x + gx;
                                let my = y + gy;

                                if (TetrominoData.getData(piece)[i] === 1 && tempGrid[this.toIndex(mx, my)])    // Piece overlaps with grid block
                                {
                                    // Means piece is not valid, skip
                                    isValidPiece = false;
                                    continue;
                                }
                                else if (TetrominoData.getData(piece)[i] === 1)   // Piece doesn't overlap with grid block
                                {
                                    setXs.push(mx);
                                    setYs.push(my);
                                    tempColCount[mx] += 1;
                                    tempRowCount[my] += 1;
                                    tempGrid[this.toIndex(mx, my)] = true;
                                }
                            }
                        }

                        if (!isValidPiece)
                        {
                            // Revert the tempCounts
                            for (let k = 0; k < setXs.length; ++k)
                            {
                                tempColCount[setXs[k]] -= 1;
                                tempRowCount[setYs[k]] -= 1;
                                tempGrid[this.toIndex(setXs[k], setYs[k])] = false;
                            }
                            setXs = [];
                            setYs = [];
                            continue;
                        }

                        // Score calculate
                        for (let k = 0; k < this._gridSize; ++k)
                        {
                            if (tempColCount[k] === this._gridSize)
                            {
                                score += 1;
                            }
                            if (tempRowCount[k] === this._gridSize)
                            {
                                score += 1;
                            }
                        }

                        let mapKey = piece.id + "_" + piece.selected;
                        if (!recordedPieces.has(mapKey) || score > recordedPieces.get(mapKey)[1])
                        {
                            recordedPieces.set(mapKey, [piece, score]);
                        }

                        // Revert the tempCounts
                        for (let k = 0; k < setXs.length; ++k)
                        {
                            tempColCount[setXs[k]] -= 1;
                            tempRowCount[setYs[k]] -= 1;
                            tempGrid[this.toIndex(setXs[k], setYs[k])] = false;
                        }
                        setXs = [];
                        setYs = [];
                    }
                }

            }
        }

        // Get best
        result = [...recordedPieces.values()];

        result.sort((a, b) => b[1] === a[1] ? randomRange(-0.5, 0.5) : b[1] - a[1]);

        let endTime = performance.now();
        // console.log("Found: " + result.length + " pieces. Time: " + (endTime - beginTime) + "ms");
        return result.map((v) => v[0]);
    }

    private toIndex(x: number, y: number)
    {
        return x + this._gridSize * y;
    }

    private toCoord(index: number): readonly [number, number]
    {
        return [index % this._gridSize, Math.floor(index / this._gridSize)];
    }
}

