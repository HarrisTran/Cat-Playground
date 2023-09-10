import { _decorator, CCFloat, clamp, Color, Component, Layout, Node, Quat, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { LocalizedLabel } from '../Common/LocalizedLabel';
import { VFXCallback } from './VFXCallback';
import { MainGameManager } from '../MainGame/MainGameManager';
const { ccclass, property } = _decorator;

@ccclass('LineClearVFXSet')
export class LineClearVFXSet extends Component
{
    @property({ group: { name: "VFXs", id: "1", displayOrder: 1 }, type: Node })
    private lineClearVfxHost: Node;
    @property({ group: { name: "VFXs", id: "1", displayOrder: 1 }, type: Node })
    private blockBreakVfxHost: Node;
    @property({ group: { name: "VFXs", id: "1", displayOrder: 1 }, type: Node })
    private fishBreakVfxHost: Node;
    @property({ group: { name: "VFXs", id: "1", displayOrder: 1 }, type: Node })
    private blockBurstVfxHost: Node;

    private _allLineClearVfxs: Set<VFXCallback>;
    private _allBlockBurstVfxs: Set<VFXCallback>;
    private _allBlockBreakVfxs: Set<VFXCallback>;
    private _allFishBlockBreakVfxs: Set<VFXCallback>;

    private _freeLineClearVfxs: Set<VFXCallback>;
    private _freeBlockBurstVfxs: Set<VFXCallback>;
    private _freeBlockBreakVfxs: Set<VFXCallback>;
    private _freeFishBlockBreakVfxs: Set<VFXCallback>;

    protected onLoad(): void
    {
        this._allLineClearVfxs = new Set<VFXCallback>();
        this._allBlockBurstVfxs = new Set<VFXCallback>();
        this._allBlockBreakVfxs = new Set<VFXCallback>();
        this._allFishBlockBreakVfxs = new Set<VFXCallback>();

        this._freeLineClearVfxs = new Set<VFXCallback>();
        this._freeBlockBurstVfxs = new Set<VFXCallback>();
        this._freeBlockBreakVfxs = new Set<VFXCallback>();
        this._freeFishBlockBreakVfxs = new Set<VFXCallback>();

        for (let child of this.lineClearVfxHost.children)
        {
            if (child.getComponent(VFXCallback))
            {
                let vfx = child.getComponent(VFXCallback);
                this._allLineClearVfxs.add(vfx);
                this._freeLineClearVfxs.add(vfx);
                vfx.node.active = false;
            }
        }

        for (let child of this.blockBurstVfxHost.children)
        {
            if (child.getComponent(VFXCallback))
            {
                let vfx = child.getComponent(VFXCallback);
                this._allBlockBurstVfxs.add(vfx);
                this._freeBlockBurstVfxs.add(vfx);
                vfx.node.active = false;
            }
        }

        for (let child of this.blockBreakVfxHost.children)
        {
            if (child.getComponent(VFXCallback)) {
                let vfx = child.getComponent(VFXCallback);
                this._allBlockBreakVfxs.add(vfx);
                this._freeBlockBreakVfxs.add(vfx);
                vfx.node.active = false;
            }
        }

        for (let child of this.fishBreakVfxHost.children)
        {
            if (child.getComponent(VFXCallback))
            {
                let vfx = child.getComponent(VFXCallback);
                this._allFishBlockBreakVfxs.add(vfx);
                this._freeFishBlockBreakVfxs.add(vfx);
                vfx.node.active = false;
            }
        }
    }

    public setGridSizes(gridSizeAfterMargin: number, cellSize: number)
    {
        let baseSize = this.getComponent(UITransform).contentSize.width;

        let ratio = gridSizeAfterMargin / baseSize;

        for (let vfx of this._allLineClearVfxs)
        {
            vfx.node.scale = new Vec3(ratio, ratio, 1);
        }

        for (let vfx of this._allBlockBurstVfxs)
        {
            vfx.node.scale = new Vec3(ratio, ratio, 1);
        }

        for (let vfx of this._allBlockBreakVfxs)
        {
            vfx.node.scale = new Vec3(ratio * 0.4, ratio * 0.4, 1);
        }

        for (let vfx of this._allFishBlockBreakVfxs)
        {
            vfx.node.scale = new Vec3(ratio * 0.7, ratio * 0.7, 1);
        }
    }

    public requestVFXs(centerBreakPositions: Vec3[], lineStartPositions: (readonly [Vec3, boolean])[], breakBlocks: (readonly [Vec3, string])[], fishPositions: Vec3[])
    {
        let allVfxs: VFXCallback[] = [];
        for (let pos of centerBreakPositions)
        {
            if (this._freeBlockBurstVfxs.size === 0) continue;

            let vfx = this._freeBlockBurstVfxs.values().next().value as VFXCallback;
            this._freeBlockBurstVfxs.delete(vfx);
            vfx.node.worldPosition = pos.clone();
            allVfxs.push(vfx);
        }

        for (let [pos, isVertical] of lineStartPositions)
        {
            if (this._freeLineClearVfxs.size === 0) continue;

            let vfx = this._freeLineClearVfxs.values().next().value as VFXCallback;
            this._freeLineClearVfxs.delete(vfx);

            vfx.node.setWorldRotationFromEuler(0, 0, isVertical ? 0 : -90);

            vfx.node.worldPosition = pos.clone();
            allVfxs.push(vfx);
        }

        for (let [pos, blockId] of breakBlocks)
        {
            if (this._freeBlockBreakVfxs.size === 0) continue;

            let vfx = this._freeBlockBreakVfxs.values().next().value as VFXCallback;
            this._freeBlockBreakVfxs.delete(vfx);

            vfx.node.worldPosition = pos.clone();
            let [clip, _] = MainGameManager.instance.resourceManager.getBlockAnimation(blockId, "break");
            clip.wrapMode = 1;
            vfx.setAnimationClip(clip);
            allVfxs.push(vfx);
        }

        for (let pos of fishPositions)
        {
            if (this._freeFishBlockBreakVfxs.size === 0) continue;

            let vfx = this._freeFishBlockBreakVfxs.values().next().value as VFXCallback;
            this._freeFishBlockBreakVfxs.delete(vfx);
            vfx.node.worldPosition = pos.clone();
            allVfxs.push(vfx);
        }

        for (let vfx of allVfxs)
        {
            vfx.requestPlayDefaultClip();
        }

        setTimeout(() => this.onVFXDone(allVfxs), 2000);
    }

    private onVFXDone(vfxs: VFXCallback[])
    {
        for (let vfx of vfxs)
        {
            if (this._allLineClearVfxs.has(vfx))
            {
                vfx.node.worldRotation = Quat.IDENTITY;
                this._freeLineClearVfxs.add(vfx);
            }
            else if (this._allBlockBurstVfxs.has(vfx))
            {
                vfx.node.worldRotation = Quat.IDENTITY;
                this._freeBlockBurstVfxs.add(vfx);
            }
            else if (this._allBlockBreakVfxs.has(vfx))
            {
                vfx.node.worldRotation = Quat.IDENTITY;
                this._freeBlockBreakVfxs.add(vfx);
            }
            else if (this._allFishBlockBreakVfxs.has(vfx))
            {
                vfx.node.worldRotation = Quat.IDENTITY;
                this._freeFishBlockBreakVfxs.add(vfx);
            }

            vfx.node.active = false;
        }
    }
}

