import { _decorator, CCFloat, clamp, Component, find, instantiate, Node, Prefab, randomRange, randomRangeInt, UITransform, Vec2, Vec3 } from 'cc';
import { IManager } from './IManager';
import { FacilityComponent } from '../Facilities/FacilityComponent';
import { MainGameManager } from '../MainGameManager';
import { CatBehaviour } from '../Cats/CatBehaviour';
import { CatBooth } from '../Facilities/CatBooth';
import { CurrencyDrop } from '../Facilities/CurrencyDrop';
import { Currency } from '../../PlayerData/Currency';
import { FacilityData } from '../Facilities/FacilityData';
import { SquareGrid, SquareGridCoordinate, SquareGridPathfinder } from '../../Utilities/Pathfinding/Pathfinding';
import { TrashItem } from '../Facilities/TrashItem';
import { getRandom } from '../../Utilities/ArrayExtensions';
import { GameEvent } from './GameEventManager';
import { TipJar } from '../Facilities/TipJar';
import { DogTutorial } from '../Cats/DogTutorial';

const { ccclass, property } = _decorator;

/**
 * Class to manage the park of the main game.
 */
@ccclass('ParkManager')
export class ParkManager extends Component implements IManager
{
    @property({ group: { name: "Hosts", id: "1", displayOrder: 1 }, type: Node })
    private facilityHost: Node;
    @property({ group: { name: "Hosts", id: "1", displayOrder: 1 }, type: Node })
    public moneyDropHost: Node;
    @property({ group: { name: "Hosts", id: "1", displayOrder: 1 }, type: Node })
    public trashDropHost: Node;
    @property({ group: { name: "Hosts", id: "1", displayOrder: 1 }, type: Node })
    public tutorialTrashHost: Node;

    @property({ group: { name: "Maps", id: "1", displayOrder: 1 }, type: UITransform })
    private map: UITransform;
    @property({ group: { name: "Maps", id: "1", displayOrder: 1 }, type: Node })
    private boundLeft: Node;
    @property({ group: { name: "Maps", id: "1", displayOrder: 1 }, type: Node })
    private boundRight: Node;
    @property({ group: { name: "Maps", id: "1", displayOrder: 1 }, type: Node })
    private gatePoint: Node;
    @property({ group: { name: "Maps", id: "1", displayOrder: 1 }, type: UITransform })
    private wanderingZone: UITransform;
    @property({ group: { name: "Maps", id: "1", displayOrder: 1 }, type: Node })
    private dogPost: Node;
    
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: UITransform })
    private catExitZone: UITransform;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: UITransform })
    private catSpawnZone: UITransform;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: CatBooth })
    public catBooth: CatBooth;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Prefab })
    public currencyDropPrefab: Prefab;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Prefab })
    public trashDropPrefab: Prefab;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: TipJar })
    public tipJar: TipJar;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: DogTutorial })
    public dogTutorial: DogTutorial;

    @property({ group: { name: "Navigations", id: "1", displayOrder: 1 }, type: Node })
    public navPivot: Node;
    @property({ group: { name: "Navigations", id: "1", displayOrder: 1 }, type: CCFloat })
    public navGridDivision: number = 60;
    @property({ group: { name: "Navigations", id: "1", displayOrder: 1 }, type: Vec2 })
    public navGridSize: Vec2 = new Vec2();
    @property({ group: { name: "Navigations", id: "1", displayOrder: 1 }, type: [UITransform] })
    public otherAvoidances: UITransform[] = [];
    
    @property({ group: { name: "Properties", id: "1", displayOrder: 1 }, type: CCFloat })
    public moneyDropStayTime: number;

    @property({ group: { name: "Layers", id: "2", displayOrder: 1 }, type: Node })
    public backLayer: Node;
    @property({ group: { name: "Layers", id: "2", displayOrder: 1 }, type: Node })
    public middleLayer: Node;
    @property({ group: { name: "Layers", id: "2", displayOrder: 1 }, type: Node })
    public frontLayer: Node;

    private _facilities: FacilityComponent[];
    private _widthBound: number;
    private _heightBound: number;
    private _catHost: Node;

    private _moneyDropsByFacilities: Map<number, Set<string>>;
    private _moneyDrops: Map<string, [Currency, Vec3, number, CurrencyDrop, number]>;
    private _trashDrops: Map<string, [Currency, number, Vec3, TrashItem]>;
    private _tutorialTrashDrops: Set<TrashItem>;
    
    private _initialized: boolean;
    private _simulating: boolean;
    private _showAppearance: boolean;

    private _pauseFacilityPlayProgress: boolean = false;

    // navigation
    private _pathFinder: SquareGridPathfinder;

    public get facilityPlayPaused(): boolean
    {
        return this._pauseFacilityPlayProgress;
    }

    public set facilityPlayPaused(play: boolean)
    {
        this._pauseFacilityPlayProgress = play;
    }

    public initialize()
    {
        this._widthBound = this.backLayer.getComponent(UITransform).contentSize.width - 250;
        this._heightBound = this.backLayer.getComponent(UITransform).contentSize.height - 250;
        this._catHost = null;

        this._moneyDropsByFacilities = new Map<number, Set<string>>();
        this._moneyDrops = new Map<string, [Currency, Vec3, number, CurrencyDrop, number]>();
        this._trashDrops = new Map<string, [Currency, number, Vec3, TrashItem]>();
        this._tutorialTrashDrops = new Set<TrashItem>();

        for (let i = 0; i < this._facilities.length; ++i)
        {
            this._facilities[i].index = i;
            this._moneyDropsByFacilities.set(i, new Set<string>());
        }

        for (let child of this.tutorialTrashHost.children)
        {
            if (child.getComponent(TrashItem))
            {
                var trash = child.getComponent(TrashItem);
                this._tutorialTrashDrops.add(trash);
            }
        }

        this.tutorialTrashHost.active = false;

        this._initialized = true;
        this._simulating = false;
        this._showAppearance = false;

        // Make walkable array, with facility being unwalkable
        this.makePathfindingFinder();
    }

	public progress(): number
	{
		return this._initialized ? 1 : 0;
	}

	public initializationCompleted(): boolean
	{
		return this._initialized;
	}

    protected onLoad(): void
    {
        this._facilities = [];

        for(let child of this.facilityHost.children)
        {
            let facility = child.getComponent(FacilityComponent);

            if (facility !== null && facility !== undefined)
            {
                this._facilities.push(facility);
            }
        }

    }

    protected update(dt: number): void
    {
        this.updateHelper(dt);
        // this.updateHelper(dt);
    }

    protected updateHelper(dt: number): void
    {
        if (this._simulating)
        {
            // Update facilities
            if (!this.facilityPlayPaused)
            {
                for (let f of this._facilities)
                {
                    f.updateFacility(dt);
                }
            }

            if (this._showAppearance)
            {
                // Count down money drops
                let destroyThese: string[] = [];
                for (let [identifier, obj] of this._moneyDrops)
                {
                    if (obj[3].assignedToBeColelctedByDog)
                        continue;

                    obj[2] -= dt;

                    if (obj[2] <= 0)
                    {
                        destroyThese.push(identifier);
                    }
                }

                if (destroyThese.length > 0)
                {
                    this.onMoneyDropTimeout(destroyThese);
                }
            }
        }
    }

    // Getters
    public getBoundLeft(): number
    {
        return this.boundLeft.worldPosition.x;
    }
        
    public getBoundRight(): number
    {
        return this.boundRight.worldPosition.x;
    }

    // Manager section

    /**
     * Ready the manager for showing the park on the game scene.
     */
    public attachPartsOnMainScene(catHost: Node)
    {
        let pos = this.node.worldPosition;
        this.node.parent = find("GameCanvas");
        this.node.setSiblingIndex(1);
        this.node.worldPosition = pos;

        // Set cat host
        this._catHost = catHost;
        this._catHost.setParent(this.middleLayer);
    }

    /**
     * Detach the manager from some references from the main screens.
     * 
     * @returns The node of catHost;
     */
    public detachPartsOnMainScene(): Node
    {
        let pos = this.node.worldPosition;
        this.node.parent = MainGameManager.instance.node;
        this.node.worldPosition = pos;
        
        let catHost = this._catHost;
        this._catHost = null;

        return catHost;
    }

    /**
     * Start the simulation of the park
    */
    public startSimulating()
    {
        // Activate all facilities
        this._facilities.forEach((f) => f.activate());

        this._simulating = true;

        // Attach events
        MainGameManager.instance.gameEventManager.on(GameEvent.EVENT_FACILITY_INVENTORY_LEVEL_UP, this.onFacilityLevelUp, this);
    }

    
    public pauseSimulating()
    {
        this._simulating = false;

        if (this._showAppearance)
        {
            for (let [_, set] of this._moneyDrops)
            {
                let drop = set[3];
                drop.node.active = false;
            }
        }
    }

    public resumeSimulating()
    {
        this._simulating = true;

        if (this._showAppearance)
        {
            for (let [_, set] of this._moneyDrops)
            {
                let drop = set[3];
                drop.node.active = true;
            }
        }

    }

    /**
     * Stop the simulation of the park
     */
    public stopSimulating()
    {
        // Deactivate all facilities
        this._facilities.forEach((f) => f.activate());

        this._simulating = false;

        // Off events
        MainGameManager.instance.gameEventManager.off(GameEvent.EVENT_FACILITY_INVENTORY_LEVEL_UP, this.onFacilityLevelUp, this);
    }

    /**
     * Note: currently placeholder
     */

    public startShowingAppearance()
    {
        this._showAppearance = true;
        this.backLayer.active = true;
        this.middleLayer.active = true;
        this.frontLayer.active = true;

        // Show all money drop
        for (let [identifier, obj] of this._moneyDrops)
        {
            let moneyDrop = instantiate(this.currencyDropPrefab).getComponent(CurrencyDrop);
            moneyDrop.node.setParent(this.moneyDropHost);
            moneyDrop.setMoney(obj[0]);
            moneyDrop.identifier = identifier;
            moneyDrop.dropImmediately(obj[1]);
            obj[3] = moneyDrop;
        }

        // Set trashes
        for (let [identifier, obj] of this._trashDrops)
        {
            let trash = instantiate(this.trashDropPrefab).getComponent(TrashItem);
            trash.node.setParent(this.trashDropHost);
            trash.setSpriteIndex(obj[1]);
            trash.dropImmediately(obj[2]);
            obj[3] = trash;
        }

        // Tip jar
        let [shouldShow, value] = MainGameManager.instance.playerDataManager.getTipJarCurrency();
        if (shouldShow)
        {
            this.tipJar.setTip(value);
        }
        else
        {
            this.tipJar.setAsNoTip();
        }
    }

    public showTutorialTrash()
    {
        this.tutorialTrashHost.active = true;
    }

    public hideTutorialTrash()
    {
        this.tutorialTrashHost.active = false;
    }


    /**
     * Note: currently placeholder
     */
    public stopShowingAppearance()
    {
        this._showAppearance = false;
        this.backLayer.active = false;
        this.middleLayer.active = false;
        this.frontLayer.active = false;

        // Detach all money drop
        for (let [identifier, obj] of this._moneyDrops)
        {
            obj[3].destroySelf();
            obj[3] = null;
        }

        // Detach all trash
        for (let [identifier, obj] of this._trashDrops)
        {
            obj[3].destroySelf();
            obj[3] = null;
        }
    }

    private makePathfindingFinder()
    {
        let widthInCells = Math.ceil(this.navGridSize.x / this.navGridDivision);
        let heightInCells = Math.ceil(this.navGridSize.y / this.navGridDivision);
        let grid = new SquareGrid(widthInCells, heightInCells);

        let avoidances: UITransform[] = [];

        for (let a of this._facilities)
        {
            avoidances.push(...a.avoidances);
        }
        avoidances.push(...this.otherAvoidances);

        for (let transform of avoidances)
        {
            let fw = transform.contentSize.width;
            let fh = transform.contentSize.height;
            let anchorX = transform.anchorX;
            let anchorY = transform.anchorY;
            let pos = transform.node.worldPosition.clone().subtract(this.navPivot.worldPosition);

            let left = pos.x - anchorX * fw;
            let right = pos.x + (1 - anchorX) * fw;
            let bottom = -(pos.y - anchorY * fh);
            let top = -(pos.y + (1 - anchorY) * fh);    // Due to reverted grid

            let cellLeft = Math.floor(left / this.navGridDivision);
            let cellRight = Math.floor(right / this.navGridDivision);
            let cellBottom = Math.floor(bottom / this.navGridDivision);
            let cellTop = Math.floor(top / this.navGridDivision);

            let mid1 = cellLeft + (cellRight - cellLeft) / 2;
            let mid2 = (cellRight - cellLeft) % 2 === 0 ? mid1 - 1 : mid1;

            for (let i = cellTop; i < cellBottom; ++i)
            {
                for (let j = cellLeft; j < cellRight; ++j)
                {
                    if (i === cellBottom - 1 && (j === mid1 || j === mid2))
                    {
                        continue;
                    }
                    grid.addUnwalkable(new SquareGridCoordinate(j, i));
                }
            }
        }

        this._pathFinder = new SquareGridPathfinder();
        this._pathFinder.addGrid(grid);
    }

    public convertToNavGrid(worldPos: Vec3): SquareGridCoordinate
    {
        let pos = worldPos.clone().subtract(this.navPivot.worldPosition);
        let ay = Math.floor(pos.y / this.navGridDivision);
        return new SquareGridCoordinate(Math.floor(pos.x / this.navGridDivision), ay === 0 ? 0 : -ay);
    }

    public convertToWorldPosition(coord: SquareGridCoordinate): Vec3
    {
        let posX = coord.x * this.navGridDivision + this.navGridDivision / 2;
        let posY = -coord.y * this.navGridDivision - this.navGridDivision / 2;

        return this.navPivot.worldPosition.clone().add(new Vec3(posX, posY, 0));
    }

    private _cachedPaths: Map<string, SquareGridCoordinate[]> = new Map<string, SquareGridCoordinate[]>();
    public getPath(worldPosFrom: Vec3, worldPosTo: Vec3, reverse: boolean = false): Vec3[]
    {
        let begin = this.convertToNavGrid(worldPosFrom);
        let end = this.convertToNavGrid(worldPosTo);
        let id = begin.x + "_" + begin.y + "_" + end.x + "_" + end.y;

        if (this._cachedPaths.has(id))
        {
            let cells = this._cachedPaths.get(id);
            let res = cells.map(cell => this.convertToWorldPosition(cell));
            return res;
        }

        let cells = this._pathFinder.getPath(begin, end, reverse);
        if (cells === null)
        {
            return null;
        }

        this._cachedPaths.set(id, cells);

        let res = cells.map(cell => this.convertToWorldPosition(cell));
        return res;
    }


    // Facility section

    public setFacilities(ids: string[])
    {
        for (let i = 0; i < this._facilities.length; ++i)
        {
            let id = ids[i];
            if (!id)
            {
                id = "empty";
            }

            let facility = this._facilities[i];

            let level = clamp(MainGameManager.instance.playerDataManager.getFacilityLevel(id), 1, 4);
            facility.setData(MainGameManager.instance.resourceManager.getFacilityData(id));
            facility.setLevel(level);
        }
    }

    /**
     * Get available facilities for reservation
     * @returns Facilities that are available for reservation.
     */
    public getFreeFacilities(): FacilityComponent[]
    {
        let res: FacilityComponent[] = [];
        if (this._simulating)
        {
            for (let f of this._facilities)
            {
                if (f.isAvailable)
                {
                    res.push(f);
                }
            }
        }

        return res;
    }

    public onFacilityLevelUp(facilityId: string, currentLevel: number)
    {
        let affected = this._facilities.filter(x => x.data.id === facilityId);

        for (let facility of affected)
        {
            facility.setLevel(currentLevel);
        }
    }

    public setEditingOn()
    {
        for (let f of this._facilities)
        {
            f.setEditingOn();
        }
    }

    public setEditingOff()
    {
        for (let f of this._facilities)
        {
            f.setEditingOff();
        }
    }

    public getFacility(index: number)
    {
        return this._facilities[index];
    }

    // Map section
    /**
     * Get a random point on the map which should be in bound.
     */
    public getRandomFreePointOnMap(): Vec3
    {
        return new Vec3(randomRange(-this._widthBound / 2, this._widthBound / 2) + this.node.worldPosition.x,
                                    randomRange(-this._heightBound / 2, this._heightBound / 2) + this.node.worldPosition.y,
                                    this.node.worldPosition.z);
    }

    /**
     * Get the world position of the feeding bow.
     */
    public getCatBoothPosition(): Vec3
    {
        return this.catBooth.node.getWorldPosition();
    }

    /**
     * Get the exit position of the map.
     */
    public getExitPosition(): Vec3
    {
        let x = randomRange(this.catExitZone.node.worldPosition.x - this.catExitZone.contentSize.width / 2,
            this.catExitZone.node.worldPosition.x + this.catExitZone.contentSize.width / 2);
        let y = this.catExitZone.node.worldPosition.y;
        return new Vec3(x, y, 0);
    }

    /**
     * Get the spawn point on the map
     */
    public getCatSpawnPoint(): Vec3
    {
        let x = randomRange(this.catSpawnZone.node.worldPosition.x - this.catSpawnZone.contentSize.width / 2,
            this.catSpawnZone.node.worldPosition.x + this.catSpawnZone.contentSize.width / 2);
        let y = this.catSpawnZone.node.worldPosition.y;
        return new Vec3(x, y, 0);
    }

    public getRandomWanderPoint(): Vec3
    {
        let x = randomRange(this.wanderingZone.node.worldPosition.x - this.wanderingZone.contentSize.width / 2,
                            this.wanderingZone.node.worldPosition.x + this.wanderingZone.contentSize.width / 2);
        let y = randomRange(this.wanderingZone.node.worldPosition.y - this.wanderingZone.contentSize.height / 2,
                            this.wanderingZone.node.worldPosition.y + this.wanderingZone.contentSize.height / 2);
        return new Vec3(x, y, 0);
    }

    public getGatePosition(): Vec3
    {
        return this.gatePoint.worldPosition;
    }

    public getDogPostPosition(): Vec3
    {
        return new Vec3(this.dogPost.worldPosition.x, this.dogPost.worldPosition.y, 0);
    }


    // Money drop section

    public getCurrenyDrops(count: number): CurrencyDrop[]
    {
        if (this._moneyDrops.size <= 0) return [];

        let candidates: number[] = [];
        for (let i = 0; i < this._facilities.length; ++i)
        {
            if (this._moneyDropsByFacilities.get(i).size > 0)
            {
                candidates.push(i);
            }
        }

        if (candidates.length <= 0) return [];

        var target = getRandom(candidates);
        return Array.from(this._moneyDropsByFacilities.get(target)).map(x => this._moneyDrops.get(x)[3]);
    }

    public dropCurrency(from: FacilityComponent, fromWhere: Vec3, toWhere: Vec3, currency: Currency)
    {
        let time = this.moneyDropStayTime;
        let index = this._facilities.indexOf(from);
        let identifier = index + "_" + (new Date()).getTime();
        let moneyDrop: CurrencyDrop = null;
        if (this._showAppearance)
        {
            moneyDrop = instantiate(this.currencyDropPrefab).getComponent(CurrencyDrop);
            moneyDrop.node.setParent(this.moneyDropHost);
            moneyDrop.setMoney(currency);
            moneyDrop.identifier = identifier;
            moneyDrop.node.worldPosition = fromWhere;
            moneyDrop.drop(toWhere);
        }

        this._moneyDropsByFacilities.get(index).add(identifier);
        this._moneyDrops.set(identifier, [currency, toWhere, time, moneyDrop, index]);
    }

    public dropTrash(from: CatBehaviour, fromWhere: Vec3, toWhere: Vec3)
    {
        let index = from.index;
        let identifier = index + "_" + (new Date()).getTime();
        let randSpriteIndex = randomRangeInt(0, 7);

        let currency = randomRange(0, 1) < 0.05 ? Currency.getHardCurrency(1) : Currency.getSoftCurrency(randomRangeInt(50, 300));

        let trash: TrashItem = null;
        if (this._showAppearance)
        {
            trash = instantiate(this.trashDropPrefab).getComponent(TrashItem);
            trash.node.setParent(this.trashDropHost);
            trash.setSpriteIndex(randSpriteIndex);
            trash.identifier = identifier;
            trash.node.worldPosition = fromWhere;
            trash.drop(toWhere);
        }

        this._trashDrops.set(identifier, [currency, randSpriteIndex, toWhere, trash]);
    }

    public collectCurrency(drop: CurrencyDrop)
    {
        if (this._moneyDrops.has(drop.identifier))
        {
            let entry = this._moneyDrops.get(drop.identifier);
            let value = entry[0].clone();
            if (this._showAppearance)
            {
                entry[3].playCollectAnim(() =>
                {
                    MainGameManager.instance.playerDataManager.addCurrency(value);
                });
            }
            else
            {
                MainGameManager.instance.playerDataManager.addCurrency(value);
            }

            this._moneyDropsByFacilities.get(entry[4]).delete(drop.identifier);
            this._moneyDrops.delete(drop.identifier);
        }
        else
        {
            console.warn("MoneyDrop Node " + drop.node.name + " request collection but ParkManager does not manage this node. Please check.");
        }
    }

    public collectTrash(trash: TrashItem)
    {
        if (this._trashDrops.has(trash.identifier))
        {
            let entry = this._trashDrops.get(trash.identifier);
            let value = entry[0].clone();
            if (this._showAppearance)
            {
                entry[3].playCollectAnim(() =>
                {
                    MainGameManager.instance.playerDataManager.addCurrency(value);
                });
            }
            else
            {
                MainGameManager.instance.playerDataManager.addCurrency(value);
            }

            this._trashDrops.delete(trash.identifier);
        }
        else
        {
            console.warn("TrashDrop Node " + trash.node.name + " request collection but ParkManager does not manage this node. Please check.");
        }
    }

    private onMoneyDropTimeout(identifiers: string[])
    {
        for (let identifier of identifiers)
        {
            let entry = this._moneyDrops.get(identifier);
            if (this._showAppearance && entry[3] !== null)
            {
                entry[3].destroySelf();
            }

            this._moneyDropsByFacilities.get(entry[4]).delete(identifier);
            this._moneyDrops.delete(identifier);
        }
    }
 


    // Debug section

    public debugFeedFaclityData()
    {
        let ids = MainGameManager.instance.resourceManager.getAllFacilityIds();
        let i = 0;
        this._facilities.forEach((f) =>
        {
            let randId = ids[i % ids.length];
            f.setData(MainGameManager.instance.resourceManager.getFacilityData(randId));

            // Set level to 1
            f.setLevel(1);
            ++i;
        });
    }
}

