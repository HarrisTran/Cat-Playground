import { _decorator, Component, Animation, instantiate, Label, Node, Prefab, random, randomRange, Sprite, UITransform, Vec3, Game, SpriteFrame, UIOpacity } from 'cc';
import { FacilityData } from './FacilityData';
import { CatBehaviour } from '../Cats/CatBehaviour';
import { MainGameManager } from '../MainGameManager';
import { GameSound } from '../Managers/AudioManager';
import { VFXCallback } from '../../VFXs/VFXCallback';
import { ITutorialPropagator } from '../../Tutorial/TutorialPropagator';
import { Currency } from '../../PlayerData/Currency';
const { ccclass, property } = _decorator;

/**
 * Enum for the state of the facility
 */
export enum FacilityState
{
    NONE,               // Facility is not activated;
    EMPTY,              // Yet to have a facility built.
    AVAILABLE,          // Can be used by a cat.
    RESERVED,           // Already reserved for a cat to come and use.
    IN_USE,             // Is being used by a cat.
}

/**
 * Class that represents a facility that a {@link Cat} can use in the scene. Should be attached to top-level facility node.
 */
@ccclass('FacilityComponent')
export class FacilityComponent extends Component
{
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: [UITransform] })
    private allAvoidances: UITransform[] = [];
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private appearanceNode: Node;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: UIOpacity })
    private appearanceOpacity: UIOpacity;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private moneyTrayNode: Node;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Sprite })
    private facilitySprite: Sprite;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Animation })
    private animation: Animation;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Sprite })
    private previewPad: Sprite;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private previewNode: Node;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Animation })
    private previewAnimation: Animation;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private optionBox: Node;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private catTargetNode: Node;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: VFXCallback })
    private smoke: VFXCallback;


    @property({ group: { name: "Debug", id: "1", displayOrder: 1 }, type: Label })
    private debugText: Label;
    @property({ group: { name: "Debug", id: "1", displayOrder: 1 }, type: Label })
    private debugNameText: Label;
    @property({ group: { name: "Debug", id: "1", displayOrder: 1 }, type: Sprite })
    private debugProgress: Sprite;
    @property({ group: { name: "Debug", id: "1", displayOrder: 1 }, type: Node })
    private debugZone: Node;

    @property({ group: { name: "Debug", id: "2", displayOrder: 2 }, type: SpriteFrame })
    private greenPreviewSprite: SpriteFrame;
    @property({ group: { name: "Debug", id: "2", displayOrder: 2 }, type: SpriteFrame })
    private normalPreviewSprite: SpriteFrame;

    private _state: FacilityState;
    private _data: FacilityData = null;
    private _index: number;

    private _level: number;

    private _reservee: CatBehaviour = null;

    private _useTimer: number;

    public get index(): number
    {
        return this._index;
    }

    public set index(value: number)
    {
        this._index = value;
    }

    /**
     * Whether this facility is reserved for a cat.
     */
    public get isReserved(): boolean
    {
        return this._reservee !== null;
    }

    /**
     * Whether this facility is available for reservation;
     */
    public get isAvailable(): boolean
    {
        return this._state === FacilityState.AVAILABLE;
    }

    public get data(): FacilityData
    {
        return this._data;
    }

    public get avoidances(): UITransform[]
    {
        return this.allAvoidances;
    }


    private get idenString(): string
    {
        return "(" + this.node.name + " - " + (this._data !== null ? this._data.id : "null") + ")";
    }

    protected onLoad(): void
    {
        // this.debugZone.active = false;
        
        this._state = null;
        this._data = null;
        this._level = 0;
        this._reservee = null;

        this._useTimer = 0;
        this._state = FacilityState.NONE;

        this.previewNode.active = false;

        this.smoke.node.active = false;
    }

    public updateFacility(dt: number): void
    {
        if (this._state === FacilityState.IN_USE && this._useTimer > 0)
        {
            this._useTimer -= dt;
            this.debugProgress.fillRange = 1 - this._useTimer / this._data.playTime;

            if (this._useTimer < 0)
            {
                this.onFacilityUseTimerDone();
            }
        }
    }

    /**
     * Activate the state machine of the facility.
     * 
     * If the data is set to the "empty" data. The level is set to 0,
     * and the state machine will be stuck at the EMPTY state (until the data is changed to appropriate data).
     * 
     * Otherwise it will enter AVAILABLE.
     * 
     * If a cat is using the facility, it will cancel the use and no money is dropped.
     */
    public activate()
    {
        if (this._data !== null)
        {
            if (this._reservee !== null)
            {
                this._reservee.cancelFacilityUse();
                this._reservee = null;
            }

            this.setState(this._data.id === "empty" ? FacilityState.EMPTY : FacilityState.AVAILABLE, true);
        }
    }

    /**
     * Deactivate the facility, meaning its state is set to NONE
     */
    public deactivate()
    {
        this.setState(FacilityState.NONE);
    }

    /**
     * Set state for the facility. See the states in FacilityState.
     * 
     * @param newState new state to set.
     * @param forced Whether to run state change code if @param newState is the same as the current state.
     */
    public setState(newState: FacilityState, forced: boolean = false)
    {
        if (this._state !== newState || forced)
		{
			this._state = newState;

            this.debugText.string = FacilityState[newState];

            if (newState === FacilityState.NONE)
            {
                // 
            }
			else if (newState === FacilityState.EMPTY)
            {
                this.onFacilityEmpty();
            }
            else if (newState === FacilityState.AVAILABLE)
            {
                this.onFacilityAvailable();
            }
            else if (newState === FacilityState.RESERVED)
            {
                this.onFacilityReserved();
            }
            else if (newState === FacilityState.IN_USE)
            {
                this.onFacilityInUse();
            }
            else
			{
				throw new Error("Trying to set FacilityState of " + this.idenString + " to " + newState + " which is not a valid value.");
			}
		}
    }

    public popSmoke()
    {
        this.smoke.requestPlayDefaultClip();
    }


    private onFacilityEmpty()
    {
        // Change appearance
        this.refreshAppearanceBaseOnState();

        this.debugProgress.node.parent.active = false;
    }

    private onFacilityAvailable()
    {
        // Change appearance
        this.refreshAppearanceBaseOnState();

        this._reservee = null;

        this.debugProgress.node.parent.active = false;
    }

    private onFacilityReserved()
    {
        // Probably do nothing

        this.debugProgress.node.parent.active = false;
    }

    private onFacilityInUse()
    {
        // Change appearance
        this.refreshAppearanceBaseOnState();

        this.debugProgress.node.parent.active = true;

        // Set timer
        this._useTimer = this._data.playTime;
    }



    // Action with cats
    
    /**
     * Reserve this facility for a cat. Returns whether the reservation is successful.
     * 
     * If failed, it could be due to...
     * 
     * 1. The facility is already reserved.
     * 
     * 2. The facility is EMPTY.
     * 
     * 3. The facility's state machine is not on yet. (Please call activate()).
     * 
     * @param cat Cat that reserves this facility
     * @returns Whether the reservation is successful.
     */
    public reserve(cat: CatBehaviour): boolean
    {
        if (!this.isReserved && this._state !== FacilityState.EMPTY && this._state !== FacilityState.NONE)
        {
            this._reservee = cat;
            this.setState(FacilityState.RESERVED);
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Let the cat use the facility. But if only the cat is the same as the reservee.
     * 
     * @param cat Cat that wants to use the facility.
     */
    public useFacility(cat: CatBehaviour)
    {
        if (this._reservee === cat)
        {
            this.setState(FacilityState.IN_USE);
        }
    }

    public getFacilityPositionToMoveTo(): Vec3
    {
        return this.catTargetNode.worldPosition.clone();
    }

    private onFacilityUseTimerDone()
    {
        this._reservee.signalFacilityUseDone();
        this.setState(FacilityState.AVAILABLE);
    }

    public dropCurrency(fromWhere: Vec3)
    {
        let payout = this._data.payout[this._level - 1];
        console.log(this._level);

        let width = this.moneyTrayNode.getComponent(UITransform).contentSize.width / 2;
        let height = this.moneyTrayNode.getComponent(UITransform).contentSize.height / 2;
        let toWhere = new Vec3(this.moneyTrayNode.worldPosition.x + randomRange(-width, width), 
                                            this.moneyTrayNode.worldPosition.y + randomRange(-height, height),
                                            this.moneyTrayNode.worldPosition.z);
        MainGameManager.instance.parkManager.dropCurrency(this, fromWhere, toWhere, payout);
    }

    // Appearance section

    /**
     * Set the data for the facility.
     *
     * Note that this will NOT reset the state machine. You have to call activate manually
     *
     * The facility level is left unchanged. You have to call setLevel. Or if set to "empty", it will be reverted to 0 when activate() is called.
     *
     * @param newData data to set for this facility.
     */
    public setData(newData: FacilityData)
    {
        this._data = newData;
        this.refreshAppearance();

        // Reset the state machine by calling activate() again?
        
        // NOTE: Will allow facility changing during gameplay, so be aware when coding that.
    }

    /**
     * Set the level of the facility.
     *
     * If the level is changed when the state is IN_USE, the timer will not be reset.
     * @param level The level to set.
     */
    public setLevel(level: number)
    {
        this._level = level;
        this.refreshAppearance();

        // NOTE: Will allow facility changing during gameplay, so be aware when coding that.
    }



    // Preview methods
    private _previewId: string = null;

    private showPreviewOf(idToPreview: string, changePreviewSprite: boolean)
    {
        if (idToPreview === "empty")
        {
            if (changePreviewSprite)
            {
                this.previewPad.spriteFrame = this.normalPreviewSprite;
            }

            this.previewNode.active = false;
            this.previewAnimation.stop();
            this.previewAnimation.removeClip(this.previewAnimation.defaultClip, true);
            this.previewAnimation.defaultClip = null;
        }
        else
        {
            if (changePreviewSprite)
            {
                this.previewPad.spriteFrame = this.greenPreviewSprite;
            }
            this.previewNode.active = true;
            let anim = MainGameManager.instance.resourceManager.getFacilityAnimation(idToPreview);
            this.previewAnimation.removeClip(this.previewAnimation.defaultClip, true);
            this.previewAnimation.defaultClip = anim;
            this.previewAnimation.play(anim.name);
        }
    }

    public setPreviewFor(id: string, changePreviewPad: boolean)
    {
        if (id === this._previewId)
        {
            this._previewId = "empty";
            this.showPreviewOf(this._previewId, changePreviewPad);
            this.onOptionBoxYes();
        }
        else
        {
            this._previewId = id;
            this.showPreviewOf(this._previewId, changePreviewPad);
            
            this.optionBox.active = true;
            if (this._previewId === "Toy_4" || this._previewId === "Toy_5" || this._previewId === "Toy_10" || this._previewId === "Toy_11")
            {
                this.optionBox.position = new Vec3(0, 320, 0);
            }
            else
            {
                this.optionBox.position = new Vec3(0, 220, 0);
            }

            MainGameManager.instance.mainGameUI.hideInventoryButton();
        }
    }

    public resetPreview()
    {
        this._previewId = this.data.id;
        this.showPreviewOf(this._previewId, false);
    }

    public setEditingOn()
    {
        this.previewPad.node.active = true;
        this.previewPad.spriteFrame = this.normalPreviewSprite;
        this.previewNode.active = false;

        this.appearanceOpacity.opacity = 0;

        this.debugProgress.node.parent.getComponent(UIOpacity).opacity = 0;
        this.resetPreview();
    }

    public setEditingOff()
    {
        this.previewPad.node.active = false;
        this.previewNode.active = false;

        this.optionBox.active = false;

        this.debugProgress.node.parent.getComponent(UIOpacity).opacity = 255;

        this.appearanceOpacity.opacity = 255;

        MainGameManager.instance.mainGameUI.showInventoryButton();
    }

    private _replacing: boolean = false;
    public replaceFacility(id: string, replaceDoneCallback?: () => void)
    {
        if (id !== "empty")
        {
            this.popSmoke();
        }

        // Tutorial check
        if (this.getComponent("TutorialPropagator"))
        {
            let endPropagator = this.getComponent("TutorialPropagator") as ITutorialPropagator;
            endPropagator.confirmDragSuccess();
        }

        if (this.previewPad.node.active)
        {
            this.previewPad.spriteFrame = this.normalPreviewSprite;
        }

        this._replacing = true;
        // Pop smoke
        setTimeout(() =>
        {
            // Get data
            let data = MainGameManager.instance.resourceManager.getFacilityData(id);
            let level = MainGameManager.instance.playerDataManager.getFacilityLevel(id);

            MainGameManager.instance.audioManager.playSfx(GameSound.UI_SANDSOUND);

            // TODO
            // Things like: what happens if a cat is using? etc.

            // Set data
            this.setData(data);
            this.setLevel(level);
            this.activate();

            MainGameManager.instance.playerDataManager.setParkFacility(this.index, this.data.id);

            // TEST
            MainGameManager.instance.resourceManager.convertToCoinUsingRate(Currency.getHardCurrency(1));
            MainGameManager.instance.resourceManager.convertToFishUsingRate(Currency.getHardCurrency(1));

            this._replacing = false;

            if (replaceDoneCallback)
                replaceDoneCallback();
        }, 300);

        if (this._reservee !== null)
        {
            this._reservee.cancelFacilityUse();
            this._reservee = null;
        }
    }


    private refreshAppearance()
    {
        this.debugNameText.string = this._data.id;

        this.addAnimOfCurrentFacility();
        this.playAnimOfCurrentFacility();
    }

    private refreshAppearanceBaseOnState()
    {
        if (this._state === FacilityState.IN_USE)
        {
            // Hide appearance
            this.appearanceNode.active = false;
        }
        else if (this._state === FacilityState.EMPTY)
        {
            this.appearanceNode.active = false;
        }
        else
        {
            this.appearanceNode.active = true;

            // // Set static frame
            // this.facilitySprite.spriteFrame = MainGameManager.instance.resourceManager.getFacilitySprite(this.data.id);
        }
    }
    
    private addAnimOfCurrentFacility()
    {
        let anim = MainGameManager.instance.resourceManager.getFacilityAnimation(this.data.id);
        this.animation.defaultClip = anim;
    }

    private playAnimOfCurrentFacility()
    {
        this.animation.play();
    }

    private stopAnimOfCurrentFacility()
    {
        this.animation.stop();
    }



    // User interaction
    
    public onUserClick()
    {
        if (MainGameManager.instance.mainGameUI != null && MainGameManager.instance.mainGameUI.inventoryModeOn)
        {
            if (MainGameManager.instance.mainGameUI.inventoryModeShouldPlaceImmediately)
            {
                let toy = MainGameManager.instance.mainGameUI.inventoryModeToyToPlace;
                this.setPreviewFor(toy, true);
            }
            else
            {
                MainGameManager.instance.mainGameUI.inventory.setPlaceIndex(this._index);
                MainGameManager.instance.mainGameUI.inventory.setSelected(this._previewId);
                MainGameManager.instance.mainGameUI.inventory.show();
            }
        }
    }

    public onOptionBoxYes()
    {
        if (MainGameManager.instance.mainGameUI)
        {
            let id = this._previewId;
            this.optionBox.active = false;
            this.replaceFacility(id, () =>
            {
                this.resetPreview();
                MainGameManager.instance.mainGameUI.showInventoryButton();
            });
        }
    }

    public onOptionBoxNo()
    {
        if (MainGameManager.instance.mainGameUI)
        {
            this.optionBox.active = false;
            this.resetPreview();
            this.previewPad.spriteFrame = this.normalPreviewSprite;
                MainGameManager.instance.mainGameUI.showInventoryButton();
        }
    }
}

