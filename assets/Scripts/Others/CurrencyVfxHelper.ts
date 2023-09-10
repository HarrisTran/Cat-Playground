import { _decorator, CCFloat, Component, lerp, Node, randomRange, Sprite, SpriteFrame, Tween, tween, UIOpacity, Vec3 } from 'cc';
import { Currency, FISH_CURRENCY, formatCurrencyNumber, HARD_CURRENCY, SOFT_CURRENCY } from '../PlayerData/Currency';
import { MainGameManager } from '../MainGame/MainGameManager';
import { LocalizedLabel } from '../Common/LocalizedLabel';
const { ccclass, property } = _decorator;

class EffectTarget
{
    public items: Node[];
    public floater: Node;

    public value: number;
    public startPosition: Vec3;
    public spawnPositions: Vec3[];
    public destination: Vec3;
    public floaterDestination: Vec3;
}

@ccclass('CurrencyVfxHelper')
export class CurrencyVfxHelper extends Component
{
    @property(Node)
    private itemHost: Node;
    @property(Node)
    private floaterHost: Node;
    @property(SpriteFrame)
    private coinSprite: SpriteFrame;
    @property(SpriteFrame)
    private gemSprite: SpriteFrame;
    @property(SpriteFrame)
    private fishSprite: SpriteFrame;
    @property({type: CCFloat})
    private floaterFlyDist: number = 50;
    @property({type: CCFloat})
    private spawnDistX: number = 220;
    @property({type: CCFloat})
    private spawnDistY: number = 30;
    @property({type: CCFloat})
    private spawnTime: number = 0.75;
    @property({type: CCFloat})
    private delay: number = 0.25;
    @property({ type: CCFloat })
    private flyTime: number = 1.25;

    private _allItems: Node[];
    private _freeItems: Node[];
    private _allFloaters: Node[];
    private _freeFloaters: Node[];

    private _effectMap: Map<string, [EffectTarget, Tween<EffectTarget>]>;

    protected start(): void
    {
        this._allItems = [];
        this._freeItems = [];
        for (let child of this.itemHost.children)
        {
            let item = child.getComponent(Sprite);
            if (item)
            {
                child.active = false;
                this._allItems.push(child);
                this._freeItems.push(child);
            }
        }

        this._allFloaters = [];
        this._freeFloaters = [];
        for (let child of this.floaterHost.children)
        {
            let floaterItem1 = child.getComponentInChildren(LocalizedLabel);
            let floaterItem2 = child.getComponentInChildren(Sprite);
            if (floaterItem1 && floaterItem2)
            {
                child.active = false;
                this._allFloaters.push(child);
                this._freeFloaters.push(child);
            }
        }

        this._effectMap = new Map<string, [EffectTarget, Tween<EffectTarget>]>;
    }

    public requestEffectToBar(currency: Currency, startPos: Vec3, completeAction: () => void, vfxCount: number = 1)
    {
        if (currency.nameString === SOFT_CURRENCY || currency.nameString === HARD_CURRENCY || currency.nameString === FISH_CURRENCY)
        {
            let pos = MainGameManager.instance.mainGameUI.getPanelWorldPosition(currency.nameString);
            this.requestEffectToPosition(currency, startPos, pos, completeAction, vfxCount);
        }
    }

    public requestEffectToPosition(currency: Currency, startPos: Vec3, endPos: Vec3, completeAction?: () => void, vfxCount: number = 1)
    {
        if (this._freeItems.length < vfxCount || this._freeFloaters.length <= 0)
        {
            if (completeAction)
            {
                completeAction();
            }

            return;
        }

        let type = currency.nameString;
        let frame: SpriteFrame = null;

        if (type === SOFT_CURRENCY)
        {
            frame = this.coinSprite;
        }
        else if (type === HARD_CURRENCY)
        {
            frame = this.gemSprite;
        }
        else if (type === FISH_CURRENCY)
        {
            frame = this.fishSprite;
        }

        let value = currency.amount;

        let allItems: Node[] = [];
        let allStartPos: Vec3[] = [];
        for (let i = 0; i < vfxCount; ++i)
        {
            let item = this.getEffectItem();
            item.getComponent(Sprite).spriteFrame = frame;
            item.active = true;
            allItems.push(item);

            let itemStartPos = new Vec3(startPos.x + randomRange(-this.spawnDistX, this.spawnDistX),
                                        startPos.y + randomRange(-this.spawnDistY, this.spawnDistY),
                                        startPos.z);

            allStartPos.push(itemStartPos);
        }

        let floater = this.getFloater();
        floater.getComponentInChildren(Sprite).spriteFrame = frame;
        floater.getComponentInChildren(LocalizedLabel).stringRaw = "+" + formatCurrencyNumber(currency.amount);
        floater.active = true;

        let effectTarget = new EffectTarget();

        effectTarget.items = allItems;
        effectTarget.floater = floater;

        effectTarget.startPosition = startPos.clone();
        effectTarget.spawnPositions = allStartPos;
        effectTarget.destination = endPos;
        effectTarget.floaterDestination = new Vec3(startPos.x, startPos.y + this.floaterFlyDist, startPos.z);
        effectTarget.value = 0;

        let id = "effect_" + Date.now();
        let thisRef = this;

        let t = tween(effectTarget).to(this.spawnTime, { value: 1 }, {
            easing: "quintOut",
            onUpdate: (target: EffectTarget, ratio) =>
            {
                // Lerp item
                let value = target.value;
                let out = new Vec3();
                for (let i = 0; i < target.items.length; ++i)
                {
                    Vec3.lerp(out, target.startPosition, target.spawnPositions[i], value);
                    target.items[i].worldPosition = out.clone();
                }

                // Lerp floater
                Vec3.lerp(out, target.startPosition, target.floaterDestination, value);
                target.floater.worldPosition = out.clone();
            },
            onComplete: (target: EffectTarget) =>
            {
                for (let i = 0; i < target.items.length; ++i)
                {
                    target.items[i].worldPosition = target.spawnPositions[i].clone();
                }
            }
        })
            .delay(this.delay)
            .to(this.flyTime, { value: 2 }, {
                easing: "cubicOut",
                onUpdate: (target: EffectTarget, ratio) =>
                {
                    // Lerp item
                    let value = target.value - 1;
                    let out = new Vec3();
                    for (let i = 0; i < target.items.length; ++i)
                    {
                        Vec3.lerp(out, target.spawnPositions[i], target.destination, value);
                        target.items[i].worldPosition = out.clone();
                    }
                    
                    if (target.floater.getComponent(UIOpacity))
                    {
                        target.floater.getComponent(UIOpacity).opacity = lerp(255, 0, value);
                    }
                },
                onComplete: (target: EffectTarget) =>
                {
                    for (let i = 0; i < target.items.length; ++i)
                    {
                        target.items[i].worldPosition = target.destination.clone();
                    }
                }
            })
            .call(() =>
            {
                for (let i = 0; i < effectTarget.items.length; ++i)
                {
                    thisRef.onItemEffectCompleted(effectTarget.items[i]);
                }

                thisRef.onFloaterEffectCompleted(effectTarget.floater);
                thisRef._effectMap.delete(id);

                if (completeAction)
                {
                    completeAction();
                }
            }).start();

        this._effectMap.set(id, [effectTarget, t]);
    }

    private onItemEffectCompleted(item: Node)
    {
        item.active = false;
        this._freeItems.push(item);
    }

    private getEffectItem(): Node
    {
        if (this._freeItems.length > 0)
        {
            let item = this._freeItems.shift();
            return item;
        }

        return null;
    }

    private onFloaterEffectCompleted(item: Node)
    {
        item.active = false;
        this._freeFloaters.push(item);
    }

    private getFloater(): Node
    {
        if (this._freeFloaters.length > 0)
        {
            let item = this._freeFloaters.shift();
            return item;
        }

        return null;
    }
}

