import { _decorator, CCFloat, CCInteger, clamp, Component, convertUtils, find, Game, instantiate, Node, Prefab, random, randomRange, randomRangeInt, Scene, Vec3 } from 'cc';
import { IManager } from '../Managers/IManager';
import { CatBehaviour, IBehaviour } from './CatBehaviour';
import { CatData } from './CatData';
import { MainGameManager } from '../MainGameManager';
import { CatAvatar } from './CatAvatar';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { GameSound } from '../Managers/AudioManager';
import { DogBehaviour } from './DogBehaviour';
import { DogAvatar } from './DogAvatar';
import { GameEvent } from '../Managers/GameEventManager';
const { ccclass, property } = _decorator;

/**
 * Class as a manager that manages all things related to cats.
 *
 * Mostly, this serves 3 purposes:
 * 
 * 1. Manages CatBehaviours, which runs even in puzzle mode.
 * 
 * 2. Manager CatAvatars (though each is controlled by a CatBehaviour), which are component instances
 * and only shows in Main Game.
 * 
 * 3. Spawn and despawn cats, and assign facilities for its cats to use.
 */
@ccclass('CatManager')
export class CatManager extends Component implements IManager
{
    @property(Prefab)
    private catAvatarPrefab: Prefab;
    @property({ group: { name: "Properties", id: "2", displayOrder: 1 }, type: CCFloat })
    private closeThreshold: number;     /// How far to a target to consider "done" moving?
    @property({ group: { name: "Properties", id: "2", displayOrder: 1 }, type: CCFloat })
    private catPoolSize: number;

    @property({ group: { name: "Components", id: "2", displayOrder: 1 }, type: LocalizedLabel })
    private luredCatText: LocalizedLabel;

    @property({ group: { name: "Spawn Properties", id: "2", displayOrder: 1 }, type: CCInteger })
    private maxQueueCount: number = 4;
    @property({ group: { name: "Spawn Properties", id: "2", displayOrder: 1 }, type: CCInteger })
    private maxWanderCount: number = 3;
    @property({ group: { name: "Spawn Properties", id: "2", displayOrder: 1 }, type: CCInteger })
    private maxLuredCount: number = 20;
    @property({ group: { name: "Spawn Properties", id: "2", displayOrder: 1 }, type: CCFloat })
    private wanderCatSpawnTick: number = 0.5;
    @property({ group: { name: "Spawn Properties", id: "2", displayOrder: 1 }, type: CCFloat })
    private lureCatCheckTick: number = 0.5;

    private _catHost: Node;

    // Book-keepings
    private _allCats: CatBehaviour[] = null;
    private _allAvatars: CatAvatar[] = null;
    private _activeCatMap: Map<number, CatBehaviour>;

    private _disableCatSpawn: boolean;
    private _hasDog: boolean;
    private _dog: DogBehaviour;
    private _dogAvatar: DogAvatar;
    
    // State book-keepings
    private _initialized: boolean;
    private _simulating: boolean;
    private _showAppearance: boolean;
    private _pollTimer = 0;

    private _catQueue: CatBehaviour[];
    private _catWandering: CatBehaviour[];
    private _luredCatCount: number;

    private _luredCatCheckTimer: number = 0;

    public get luredCatCount(): number
    {
        return this._luredCatCount;
    }

    public set luredCatCount(value: number)
    {
        this._luredCatCount = clamp(value, 0, this.maxLuredCount);

        this.luredCatText.stringRaw = this._luredCatCount.toString();
    }

    public get hasDog(): boolean
    {
        return this._hasDog;
    }

    public set hasDog(value: boolean)
    {
        this._hasDog = value;
        
        if (this._hasDog)
        {
            this._dog = new DogBehaviour();

            if (this._simulating)
            {
                this._dog.activate(MainGameManager.instance.parkManager.getDogPostPosition());
            }
        }
        else
        {
            if (this._dog) this._dog.deactivate();
            this._dog = null;
        }
    }

    public get dogBoosted(): boolean
    {
        return this.hasDog && this._dog.isBoosted;
    }

    /**
     * Initialize the manager. Create cats (in deactiaved states), ready for simulation.
     */
    public initialize()
    {
        // Other initialization, maybe pooling cats?
        this._catHost = null;

        this._allCats = [];
        this._allAvatars = [];
        this._activeCatMap = new Map<number, CatBehaviour>;
        this._dog = null;
        this._dogAvatar = null;

        this._initialized = true;
        this._simulating = false;
        this._showAppearance = false;

        this._catQueue = [];
        this._catWandering = [];
        this.luredCatCount = 0;
        this._luredCatCheckTimer = this.lureCatCheckTick;

        this._pollTimer = 0;

        // Create cat for pool
        for (let i = 0; i < this.catPoolSize; ++i)
        {
            let cat = new CatBehaviour();
            cat.index = i;
            cat.deactivate();
            this._allCats.push(cat);
        }
    }
    
	public progress(): number
	{
		return this._initialized ? 1 : 0;
	}

	public initializationCompleted(): boolean
	{
		return this._initialized;
	}

    protected updateHelper(dt: number): void
    {
        if (this._simulating)
        {
            // Facility polling
            this._pollTimer -= dt;

            if (this._pollTimer <= 0)
            {
                this.pollForFreeFacilities();
                this._pollTimer = 2;
            }

            // Update already spawn cats
            for (let [index, cat] of this._activeCatMap)
            {
                cat.update(dt);
            }

            if (this.hasDog)
            {
                this._dog.update(dt);
            }

            // TEMP
            // Resolve sprite orders
            if (this._showAppearance)
            {
                let behaviours: IBehaviour[];
                if (this._dog)
                    behaviours = [...this._allCats, this._dog];
                else
                    behaviours = this._allCats;

                let indexes: number[];
                if (this._dog)
                    indexes = [...this._allCats.map((c: CatBehaviour) => c.index), behaviours.length - 1];
                else
                    indexes = this._allCats.map((c: CatBehaviour) => c.index)

                indexes.sort((a, b) => behaviours[a].worldPosition.y - behaviours[b].worldPosition.y);

                for (let i = 0; i < indexes.length; ++i)
                {
                    behaviours[indexes[i]].avatarNode.setSiblingIndex(0);
                }
            }

            // Cat luring
            this._luredCatCheckTimer -= dt;
            if (this._luredCatCheckTimer <= 0)
            {
                this._luredCatCheckTimer = this.lureCatCheckTick;

                // If cat queue has space and has some wandering cat, regardless, put them to queue
                if (this._catQueue.length < this.maxQueueCount && this._catWandering.length > 0)
                {
                    // Get one of the cat wandering
                    let index = randomRangeInt(0, this._catWandering.length);
                    let cat = this._catWandering[index];
                    this._catWandering.splice(index, 1);

                    cat.notifyEnterPark();
                    let queuePos = this._catQueue.length;
                    this._catQueue.push(cat);
                    cat.assignQueuePosition(queuePos);
                }

                if (this.luredCatCount > this._catWandering.length + this._catQueue.length)
                {
                    if (this._catWandering.length < this.maxWanderCount) // Wandering is not full, spawn
                    {
                        let cat: CatBehaviour = null;
                        cat = this.spawnCat();

                        if (cat)
                        {
                            cat.activate(MainGameManager.instance.parkManager.getCatSpawnPoint());
                            this._catWandering.push(cat);
                        }
                    }
                }
            }
        }
    }

    protected update(dt: number): void
    {
        this.updateHelper(dt);
        // this.updateHelper(dt);
    }

    // Manager section

    /**
     * Ready the manager for showing cats on the game scene.
     */
    public attachPartsOnMainScene(catHost: Node)
    {
        this._catHost = catHost;

        // Get all the available cat avatars already in the scene.
        this._allAvatars = [];
        for (let child of this._catHost.children)
        {
            let avatar = child.getComponent(CatAvatar);
            if (avatar !== null && avatar !== undefined)
            {
                this._allAvatars.push(avatar);
                continue;
            }

            let dogAvatar = child.getComponent(DogAvatar);
            if (dogAvatar !== null && dogAvatar !== undefined)
            {
                this._dogAvatar = dogAvatar;
                continue;
            }
        }
    }

    /**
     * Detach the manager from some references from the main screens.
     */
    public detachPartsOnMainScene()
    {
        this._catHost = null;

        this._allAvatars = null;
        this._dogAvatar = null;
    }

    /**
     * Start the cat spawn/manage/despawn loop
     */
    public startSimulating()
    {
        this._simulating = true;

        // Subscribes
        MainGameManager.instance.gameEventManager.on(GameEvent.EVENT_PARK_DOG_UNLOCKED, this.onDogPurchased, this);
    }

    public pauseSimulating()
    {
        this._simulating = false;

        if (this._showAppearance)
        {
            for (let avatar of this._allAvatars)
            {
                if (avatar.catBehaviour !== null)
                {
                    avatar.makeInvisible();
                }
            }

            if (this.hasDog && this._dogAvatar !== null)
            {
                this._dogAvatar.makeInvisible();
            }
        }
    }

    public resumeSimulating()
    {
        this._simulating = true;

        if (this._showAppearance)
        {
            for (let avatar of this._allAvatars)
            {
                if (avatar.catBehaviour !== null)
                {
                    avatar.makeVisible();
                }
            }

            if (this.hasDog && this._dogAvatar !== null)
            {
                this._dogAvatar.makeVisible();
            }
        }
    }

    /**
     * Stops the cat spawn/manage/despawn loop.
     *
     * This does not destroys the cats. Only stops them from updating.
     */
    public stopSimulating()
    {
        this._simulating = false;

        // Unsubscribes
        MainGameManager.instance.gameEventManager.off(GameEvent.EVENT_PARK_DOG_UNLOCKED, this.onDogPurchased, this);
    }

    /**
     * Start showing cat avatars to the scene.
     */
    public startShowingAppearance()
    {
        // Create, if missing avatars
        for (let i = this._allAvatars.length; i < this._allCats.length; ++i)
        {
            let avatar = this.getNewAvatar();
            this._allAvatars.push(avatar);
        }

        // Assign avatars to each cats, and vice versa
        for (let i = 0; i < this._allCats.length; ++i)
        {
            this._allCats[i].setAvatar(this._allAvatars[i]);
            this._allAvatars[i].setCatBehaviour(this._allCats[i]);
            if (this._allCats[i].isActive)
            {
                this._allAvatars[i].activate();
                this._allCats[i].refreshCatAvatar();
            }
            else
            {
                this._allAvatars[i].deactivate();
            }
        }

        if (this.hasDog)
        {
            this._dog.activate(MainGameManager.instance.parkManager.getDogPostPosition());
            this._dog.setAvatar(this._dogAvatar);
            this._dogAvatar.setDogBehaviour(this._dog);
            this._dogAvatar.activate();
            this._dog.refreshDogAvatar();
        }

        this._showAppearance = true;

        // TEMP: add dog
        this.spawnDog();
    }

    /**
     * Stop showing cat avatars to the scene.
     */
    public stopShowingAppearance()
    {
        // Remove avatars to each cats, and vice versa
        for (let i = 0; i < this._allCats.length; ++i)
        {
            this._allCats[i].removeAvatar();
            this._allAvatars[i].setCatBehaviour(null);  // TODO: Write a separate method
            this._allAvatars[i].deactivate();
        }
        this._allAvatars = [];

        if (this.hasDog)
        {
            this._dog.removeAvatar();
            this._dogAvatar.setDogBehaviour(null);
            this._dogAvatar.deactivate();

            this._dog.deactivate();
        }
        this._showAppearance = false;
    }



    // Cat spawning section
    
    public spawnDog()
    {
        if (this.hasDog)
        {
            this._dog.setAvatar(this._dogAvatar);
            this._dogAvatar.setDogBehaviour(this._dog);
            this._dogAvatar.activate();
            this._dogAvatar.popSmoke();
            this._dog.refreshDogAvatar();
        }
    }

    /**
     * Spawn a cat. The cat itself is not activated and cat.activate() has to be called manually
     */
    public spawnCat(): CatBehaviour
    {
        // Get new cat
        let cat = this.getDespawnedCat();

        // Don't spawn if full
        if (cat === null)
        {
            return null;
        }

        // Set data
        let data = this.getNewCatData();
        cat.setData(data);

        // Add to cat map
        this._activeCatMap.set(cat.index, cat);

        // Activate
        if (this._showAppearance)
        {
            this._allAvatars[cat.index].node.worldPosition = MainGameManager.instance.parkManager.getCatSpawnPoint();

            this._allAvatars[cat.index].activate();
        }

        return cat;
    }

    public spawnCustomCat(id: string)
    {
        // TODO, Wait for ResourceManager
    }

    /**
     * Despawn an exising cat
     * @param cat Cat to despawn.
     */
    public despawnCat(cat: CatBehaviour)
    {
        let i = cat.index;

        if (this._allCats[i] !== cat)
        {
            throw new Error("There exists a cat whose index does not correspond to its index in CatManager, please check code");
        }

        // Remove the cat's data, not necessary, but well
        cat.setData(null);

        // Remove from activeCatMap
        this._activeCatMap.delete(i);

        // Deactivate
        cat.deactivate();
        if (this._showAppearance)
        {
             this._allAvatars[cat.index].deactivate();
        }
    }

    public onCatExitQueueFromTop(cat: CatBehaviour)
    {
        if (this._catQueue.findIndex(c => c === cat) === 0)
        {
            // Shift queue
            this._catQueue.shift();

            this._catQueue.forEach((cat, i, _) =>
            {
                cat.assignQueuePosition(i);
            });
        }
        else
        {
            throw new Error("Cat exit is called but cat is not at the beginning of queue. Please check your code.");
        }
    }

    public requestBoostDog()
    {
        if (this._showAppearance && this.hasDog)
        {
            this._dog.boost();
        }
    }

    public increaseLuredCat()
    {
        this.luredCatCount = Math.min(this.luredCatCount + 1, this.maxLuredCount);
        this.playCatEnterSound();
    }

    private _oddSound: boolean = true;
    public playCatEnterSound()
    {
        setTimeout(() => MainGameManager.instance.audioManager.playSfx(this._oddSound ? GameSound.MAINGAME_GUESTCOME1 : GameSound.MAINGAME_GUESTCOME2, true), 900);
        setTimeout(() => MainGameManager.instance.audioManager.playSfx(this._oddSound ? GameSound.MAINGAME_GUESTCOME1 : GameSound.MAINGAME_GUESTCOME2, true), 1200);
        this._oddSound = !this._oddSound;
    }


    // Cat vs Facility section

    private pollForFreeFacilities()
    {
        // Get free facilities
        let freeFacilities = MainGameManager.instance.parkManager.getFreeFacilities();
        freeFacilities.sort((a, b) => randomRange(-0.5, 0.5));  // Shuffle. TODO: Write better shuffling.

        // Check for cat in the first position only

        for (let [index, cat] of this._activeCatMap)
        {
            if (freeFacilities.length === 0)
            {
                return;
            }

            if (cat.shouldAssignedFacility)
            {
                // TODO: Allow the cat to choose based on preference.

                let choice = 0;
                let facility = freeFacilities.splice(choice, 1)[0];
                cat.assignFacility(facility);
                facility.reserve(cat);
            }
        }
    }

    // Helper section

    public getCloseThreshold(): number
    {
        return this.closeThreshold;
    }

    private getDespawnedCat(): CatBehaviour
    {
        let res = -1;
        for (let i = 0; i < this._allCats.length; ++i)
        {
            if (!this._activeCatMap.has(i))
            {
                res = i;
                break;
            }
        }

        // if (res === -1)
        // {
        //     // Extend allCats array
        //     let cat = new CatBehaviour();
        //     this._allCats.push(cat);
        //     res = this._allCats.length - 1;
        //     cat.index = res;
        //     cat.deactivate();

        //     // Extend allAvatars array
        //     if (this._showAppearance)
        //     {
        //         let avatar = this.getNewAvatar();
        //         this._allAvatars.push(avatar);

        //         // attach
        //         cat.setAvatar(avatar);
        //         avatar.setCatBehaviour(cat);
        //     }

        //     console.warn("CatManager had to create a new cat, please check poolsize. Current cat count: " + this._allCats.length);
        // }

        if (res === -1)
        {
            return null;
        }

        return this._allCats[res];
    }

    private getNewAvatar(): CatAvatar
    {
        let node = instantiate(this.catAvatarPrefab);
        node.parent = this._catHost;
        node.worldPosition = MainGameManager.instance.parkManager.getCatSpawnPoint();
        let avatar = node.getComponent(CatAvatar);

        return avatar;
    }

    private getNewCatData(): CatData
    {
        let ids = MainGameManager.instance.resourceManager.getAllCatIds();
        let randId = ids[randomRangeInt(0, ids.length)];
        return MainGameManager.instance.resourceManager.getCatData(randId);
    }

    private onDogPurchased()
    {
        this.hasDog = true;
        
        if (this._showAppearance)
        {
            this.spawnDog();
        }
    }
}

