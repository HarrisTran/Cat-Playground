import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { IPieceBlock } from './PuzzleComponents/PieceBlock';
const { ccclass, property } = _decorator;

@ccclass('PieceBlockPool')
export class PieceBlockPool extends Component
{
    private static _instance: PieceBlockPool;

    public static get instance(): PieceBlockPool
    {
        return this._instance;
    }

    @property(Node)
    private unusedBlockHost: Node;
    @property(Prefab)
    private blockPrefab: Prefab;
    
    private _allBlocks: IPieceBlock[];
    private _usedBlocks: Set<IPieceBlock>;
    private _unusedBlocks: Set<IPieceBlock>;

    private _cellSize: number;
    private _blockSize: number;

    protected onLoad(): void
    {
        PieceBlockPool._instance = this;
        this._allBlocks = [];

        for (let child of this.unusedBlockHost.children)
        {
            let block = child.getComponent("PieceBlock") as IPieceBlock;
            if (block !== null)
            {
                this._allBlocks.push(block);
            }
        }

        this._usedBlocks = new Set<IPieceBlock>;
        this._unusedBlocks = new Set<IPieceBlock>(this._allBlocks);
        this.unusedBlockHost.active = false;
    }

    public setSizes(cellSize: number, blockSize: number)
    {
        this._cellSize = cellSize;
        this._blockSize = blockSize;
        for (let block of this._allBlocks)
        {
            block.setSizes(cellSize, blockSize);
        }
    }

    public getBlock(): IPieceBlock
    {
        if (this._unusedBlocks.size <= 0)
        {
            this.instantiateNewBlock();
        }

        let poppedBlock = this._unusedBlocks.keys().next().value;
        this._unusedBlocks.delete(poppedBlock);
        this._usedBlocks.add(poppedBlock);

        return poppedBlock;
    }

    public retrieveBlook(block: IPieceBlock)
    {
        if (!this._usedBlocks.has(block))
        {
            return;
        }

        block.node.parent = this.unusedBlockHost;
        this._usedBlocks.delete(block);
        this._unusedBlocks.add(block);
    }

    private instantiateNewBlock(): IPieceBlock
    {
        console.warn("Requested instantiation of PieceBlock, please inscrease initial pool size");
        let block = instantiate(this.blockPrefab).getComponent("PieceBlock") as IPieceBlock;
        block.node.parent = this.unusedBlockHost;
        block.setSizes(this._cellSize, this._blockSize);
        this._allBlocks.push(block);
        this._unusedBlocks.add(block);
        return block;
    }
}

