import { _decorator, randomRange, Vec3, Node } from 'cc';
import { CatData } from './CatData';
import { MainGameManager } from '../MainGameManager';
import { FacilityComponent } from '../Facilities/FacilityComponent';
import { CatAvatar } from './CatAvatar';
import { GameEvent } from '../Managers/GameEventManager';
import { MissionManager } from '../Managers/MissionManager';
import { EmoteType } from './Emote';
import { GamePopupCode } from '../../Common/UI/GamePopupCode';
import { PopUpCustomerBook } from '../UI/PopUp/CustomerBook/PopUpCustomerBook';
import { Mission } from '../Missions/Mission';
const { ccclass, property } = _decorator;

export interface IBehaviour
{
    get worldPosition(): Vec3;
    get avatarNode(): Node;
}

/**
 * Enum for the state of the cat's AI
 */
export enum CatState
{
    NONE,                   // Cat isn't activated yet
    WANDERING,
    ENTER_PARK,             // Cat moves to the end of line.
    QUEUEING,               // Cat is waiting for free facility.
    FIRST_IN_QUEUE,         // Cat is waiting at the top of the queue
    GO_TO_FACILITY,         // Cat leaves line and go to a facility.
    USE_FACILITY,           // Cat is using facility
    DONE_USING_FACILITY,    // Cat is done using facility, leaving money behind
    EXITING                 // Cat exits the park
}

/**
 * Enum for the state of the cat's animation
 */
export enum CatAnimState
{
    NONE,
    IDLE,
    MOVING,
    USING_FACILITY
}

/**
 * Class that represents a cat.
 */
export class CatBehaviour implements IBehaviour
{
    // Book-keepings and refs
    private _index: number;
    private _catAvatar: CatAvatar = null;
    private _data: CatData = null;

    // States and important properties
    private _state: CatState;
    private _animState: CatAnimState;
    private _worldPosition: Vec3;
    private _moveTargets: Vec3[];
    private _pathToCurrentTarget: Vec3[];
    private _moveIdleTimer: number;
    private _moveDoneCallback: () => void = null;
    private _moveCallbackInvokeOnCancel: boolean;
    private _assignedFacility: FacilityComponent = null;

    private _queuePosition: number;

    // Getters/Setters
    public get index(): number
    {
        return this._index;
    }

    public set index(value: number)
    {
        this._index = value;
    }
        
    public get avatar(): CatAvatar
    {
        return this._catAvatar;
    }

    public get avatarNode(): Node
    {
        return this._catAvatar ? this._catAvatar.node : null;
    }

    public get worldPosition(): Vec3
    {
        return this._worldPosition;
    }

    public set worldPosition(value: Vec3)
    {
        this._worldPosition = value;
    }

    public get state(): CatState
    {
        return this._state;
    }

    public set state(value: CatState)
    {
        this._state = value;
    }

    public get animState(): CatAnimState
    {
        return this._animState;
    }

    public set animState(value: CatAnimState)
    {
        this._animState = value;
    }

    public get isActive(): boolean
    {
        return this._state !== CatState.NONE;
    }

    public get data(): CatData
    {
        return this._data;
    }

    public get assignedFacility(): FacilityComponent
    {
        return this._assignedFacility;
    }

    public get queuePosition(): number
    {
        return this._queuePosition;
    }

    public get isInPark(): boolean
    {
        return this._state == CatState.QUEUEING ||
            this._state == CatState.FIRST_IN_QUEUE ||
            this._state == CatState.GO_TO_FACILITY ||
            this._state == CatState.USE_FACILITY ||
            this._state == CatState.DONE_USING_FACILITY;
    }


    public get moveDoneCallback(): () => void
    {
        return this._moveDoneCallback;
    }
    public set moveDoneCallback(value: () => void)
    {
        this._moveDoneCallback = value;
    }


    /**
     * Whether that this cat should be assigned a facility.
     */
    public get shouldAssignedFacility(): boolean
    {
        return this._state === CatState.FIRST_IN_QUEUE && this._assignedFacility === null;
    }
    

    private get hasMoveTargets(): boolean
    {
        return this._moveTargets.length > 0;
    }

    private get idenString(): string
    {
        return "(" + this._index + " - " + (this._data !== null ? this._data.id : "null") + ")";
    }




    /**
     * Activate the cat behaviour.
     * 
     * Can only activate if the cat's data has been set with setData().
     */
    public activate(spawnPoint: Vec3)
    {
        this._state = CatState.NONE;
        this._animState = CatAnimState.NONE;

        this.worldPosition = spawnPoint;
        this._moveTargets = [];
        this._pathToCurrentTarget = [];
        this._moveIdleTimer = 0;
        this.moveDoneCallback = null;
        this._assignedFacility = null;
        this._queuePosition = -1;

        this.setAnimationState(CatAnimState.IDLE);
        this.setState(CatState.WANDERING);
    }

    /**
     * Update the cat's behaviour by @param dt second.
     * 
     * Call this inside the manager's update();
     * @param dt Time step to update the cat's behaviours.
     */
    public update(dt: number): void
    {
        // If cat is not activated, do nothing
        if (this._state === CatState.NONE)
        {
            return;
        }

        // If the cat is moving towards a target, update its position
        if (this._animState === CatAnimState.MOVING && this.hasMoveTargets)
        {
            this.updateMovement(dt);

            // Sync to the avatar
            if (this._catAvatar !== null)
            {
                this._catAvatar.updateWorldPosition(this.worldPosition);
            }
        }
        // If the cat is idling and has a target. Tell it to move.
        else if (this._animState === CatAnimState.IDLE && this.hasMoveTargets)
        {
            this._moveIdleTimer -= dt;

            if (this._moveIdleTimer <= 0)
            {
                this.requestMoveOnly();
            }
        }
        else if (this._animState === CatAnimState.USING_FACILITY)
        {
            // Do nothing, or update later
        }
    }

    /**
     * Deactivate and clean up the state machine of the cat.
     *
     * Note that this will keep the avatar and the CatData set. If needed, remove them manually.
     */
    public deactivate()
    {
        this._worldPosition = Vec3.ZERO;
        this._moveTargets = [];
        this._moveIdleTimer = 0;
        this.moveDoneCallback = null;
        this._moveCallbackInvokeOnCancel = false;
        this._assignedFacility = null;
        this._queuePosition = -1;

        this.setAnimationState(CatAnimState.NONE);
        this.setState(CatState.NONE);
    }

    /**
     * Set the cat's avatar.
     * 
     * An avatar is a Cocos Component in the scene. If an avatar is assigned, it will be controlled accordingly.
     * @param avatar the avatar to set
     */
    public setAvatar(avatar: CatAvatar)
    {
        this._catAvatar = avatar;
    }

    /**
     * Remove and returns the cat's avatar.
     * 
     * @returns The avatar the the cat was holding.
     */
    public removeAvatar(): CatAvatar
    {
        let avatar = this._catAvatar;
        this._catAvatar = null;
        return avatar;
    }

    /**
     * Set the cat's data. To remove, call this with (null)
     */
    public setData(newData: CatData)
    {
        this._data = newData;
    }



    // State machine section

    /**
     * Set the state for the cat's behaviour state machine.
     * 
     * @param newState the newState
     * @param forced whether to run update code if the newState is the same as the current state.
     */
    public setState(newState: CatState, forced: boolean = false)
    {
        if (this._state !== newState || forced)
		{
			this._state = newState;

            if (this._catAvatar !== null)
            {
                this._catAvatar.updateDebugStateText(newState);
            }

            if (newState === CatState.NONE)
            {

            }
            else if (newState === CatState.WANDERING)
            {
                this.onWandering();
            }
            else if (newState === CatState.ENTER_PARK)
            {
                this.onEnterPark();
            }
            else if (newState === CatState.QUEUEING)
            {
                this.onQueue();
            }
            else if (newState === CatState.FIRST_IN_QUEUE)
            {
                this.onFirstInQueue();
            }
            else if (newState === CatState.GO_TO_FACILITY)
            {
                this.onGoToFacility();
            }
            else if (newState === CatState.USE_FACILITY)
            {
                this.onUseFacility();
            }
            else if (newState === CatState.DONE_USING_FACILITY)
            {
                this.onDoneUsingFacility();
            }
            else if (newState === CatState.EXITING)
            {
                this.onExiting();
            }
            else
			{
				throw new Error("Trying to set CatState of " + this.idenString + " to " + newState + " which is not a valid value.");
			}
		}
    }

    private onWandering()
    {
        let target = MainGameManager.instance.parkManager.getRandomWanderPoint();

        this.setMoveTarget(target);
        this.requestMove(() => setTimeout(() =>
        {
            if (this._state == CatState.WANDERING)
            {
                this.setState(CatState.WANDERING, true);
            }
        }, randomRange(this.data.moveDelayTime * 2500, this.data.moveDelayTime * 5000)), false, false);
    }

    private onEnterPark()
    {
        let target = MainGameManager.instance.parkManager.getGatePosition();

        this.setMoveTarget(target);
        this.requestMove(() =>
        {
            this.setState(CatState.QUEUEING);
        }, false, false);

        MainGameManager.instance.playerDataManager.setCatShowUp(this.data.id);
    }

    private onQueue()
    {
        if (this._queuePosition != -1)  // Already has a queue position assigned
        {
            this.moveToAssignedQueuePosition();
        }
    }

    private onFirstInQueue()
    {
        // Just do nothing, too
    }

    private onGoToFacility()
    {
        if (this._assignedFacility !== null)
        {
            MainGameManager.instance.catManager.luredCatCount -= 1;
            this.setMoveTarget(this._assignedFacility.getFacilityPositionToMoveTo());
            this.requestMove(() => setTimeout(() =>
            {
                if (this._catAvatar) this._catAvatar.popSmoke();
                setTimeout(() => this.setState(CatState.USE_FACILITY), 300);
            }, this.data.moveDelayTime * 500), false, true);
            MainGameManager.instance.catManager.onCatExitQueueFromTop(this);
        }
    }

    private onUseFacility()
    {
        if (this._assignedFacility !== null)
        {
            this._assignedFacility.useFacility(this);

            var missionArg = MissionManager.getBaseMissionArg();
            MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_CAT_START_PLAYING, missionArg, this._data, this._assignedFacility.index);
        }

        this.requestPlayFacilityAnim();
    }

    private onDoneUsingFacility()
    {
        var missionArg = MissionManager.getBaseMissionArg();
        MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_CAT_DONE_PLAYING, missionArg, this._data, this._assignedFacility.index);

        // Move on
        if (this._catAvatar) this._catAvatar.popSmoke();
        setTimeout(() => this.setState(CatState.EXITING), 300);
    }

    private onExiting()
    {
        // Leave money here
        if (this._assignedFacility)
        {
            this._assignedFacility.dropCurrency(this.worldPosition);
        }

        this.requestStopFacilityAnim();

        // Remove facility assignment
        this._assignedFacility = null;

        // Go to exit
        setTimeout(() =>
        {
            this.setMoveTarget(MainGameManager.instance.parkManager.getExitPosition());
            this.requestMove(() => setTimeout(() => this.despawn(), 1000), false, true);
        }, 1000 + this._data.moveDelayTime);
    }




    // Animation + Movement section

    /**
     * Set the state for the animation state machine.
     *
     * If set, the cat's avatar will perform animation accordingly.
     *
     * NOTE: This is unrelated to CatBehaviour.setState(), as this one is more for animation and moving.
     * TODO: Have not set the cat's animation yet.
     *
     * @param newState the newState
     * @param forced whether to run update code if the newState is the same as the current state.
     */
    public setAnimationState(newState: CatAnimState, forced: boolean = false)
    {
        if (this._animState !== newState || forced)
        {
            this._animState = newState;

            if (this._catAvatar !== null)
            {
                this._catAvatar.updateDebugAnimStateText(newState);
            }

            if (newState === CatAnimState.NONE)
            {
                
            }
            else if (newState === CatAnimState.IDLE)
            {
                
            }
            else if (newState === CatAnimState.MOVING)
            {
                
            }
            else if (newState === CatAnimState.USING_FACILITY)
            {
                
            }

            this.updateAnimation(newState);
        }
    }

    /**
     * Request the cat to move.
     *
     * The cat will move, and have its animation state set to MOVING if there is a target to move to. (Can be set with setMoveTarget)
     */
    public requestMoveOnly()
    {
        if (this.hasMoveTargets)
        {
            this.setAnimationState(CatAnimState.MOVING);
        }
    }

    /**
     * Request the cat to move, and after ALL movements are done, invoke a callback
     *
     * The cat will move, and have its animation state set to MOVING if there is a target to move to. (Can be set with setMoveTarget)
     * 
     * @param callback Callback to invoke on movement completed.
     * @param invokeOnCancel Whether to invoke @param callback if the movement is cancelled instead of finishing.
     */
    public requestMove(callback: () => void, invokeOnCancel: boolean = false, useNavigationPath: boolean = false)
    {
        if (this.hasMoveTargets)
        {
            this.moveDoneCallback = callback;
            this._moveCallbackInvokeOnCancel = invokeOnCancel;
            this.setAnimationState(CatAnimState.MOVING);

            // Get path
            if (useNavigationPath)
            {
                this._pathToCurrentTarget = this.getPathToMoveTarget(this._moveTargets[0]);
            }
        }
    }

    /**
     * Request cancel the movement of the cat. This will also remove all targets.
     * 
     * @param afterCancelCallback Callback to invoke after the movement is canceled. 
     * Which should be called after a set callback of requestMove(callback) (if allowed to invoke on cancel).
     * The call is on the same frame. (This could be changed in the future)
     * 
     */
    public cancelMove(afterCancelCallback: () => void)
    {
        this.cancelMoveOnly();
        afterCancelCallback();
    }
    
    /**
     * Request cancel the movement of the cat. This will also remove all targets.
     * 
     */
    public cancelMoveOnly()
    {
        let invoke = this._moveCallbackInvokeOnCancel;
        let callback = this.moveDoneCallback;

        this._moveTargets = [];
        this._moveIdleTimer = 0;
        this.moveDoneCallback = null;
        this._moveCallbackInvokeOnCancel = false;

        if (invoke && callback !== null)
        {
            callback();
        }

        this.setAnimationState(CatAnimState.IDLE);
    }

    /**
     * Request play the animation of playing at a facility
     * 
     * This method is currently a placeholder
     */
    public requestPlayFacilityAnim()
    {
        // Dummy function for now
        if (this._animState === CatAnimState.IDLE)
        {
            this.setAnimationState(CatAnimState.USING_FACILITY);
        }
    }

    /**
     * Request stop the animation of playing at a facility
     * 
     * This method is currently a placeholder
     */
    public requestStopFacilityAnim()
    {
        if (this._animState === CatAnimState.USING_FACILITY)
        {
            this.setAnimationState(CatAnimState.IDLE);
        }
    }

    public assignQueuePosition(index: number)
    {
        if (this._state === CatState.QUEUEING)
        {
            this._queuePosition = index;
            this.moveToAssignedQueuePosition();
        }
        else if (this._state === CatState.ENTER_PARK)
        {
            this._queuePosition = index;
        }
    }

    public notifyEnterPark()
    {
        this.cancelMove(() => this.setState(CatState.ENTER_PARK));
    }

    public refreshCatAvatar()
    {
        this._catAvatar.updateWorldPosition(this.worldPosition);
        this.updateAnimation(this._animState);
    }

    /**
     * Set a target for the cat. Call requestMove() or requestMove(callback) to actuall make it move.
     * @param value where the cat should move to.
     */
    protected setMoveTarget(value: Vec3)
    {
        this._moveTargets.push(value);
    }

    private onMoveDone()
    {
        let target = this._moveTargets.shift();
        // All targets reached
        if (this._moveTargets.length === 0)
        {
            this.setAnimationState(CatAnimState.IDLE);

            if (this.moveDoneCallback !== null)
            {
                let callback = this.moveDoneCallback;
                this._moveCallbackInvokeOnCancel = false;
                this.moveDoneCallback = null;

                callback();
            }
        }
        else
        {
            this._moveIdleTimer = this._data.moveDelayTime;
            this.setAnimationState(CatAnimState.IDLE);
        }
    }

    private updateMovement(dt: number)
    {
        let moveTo: Vec3 = null;
        let immediateTarget: boolean;
        if (this._pathToCurrentTarget && this._pathToCurrentTarget.length > 0)
        {
            moveTo = this._pathToCurrentTarget[this._pathToCurrentTarget.length - 1];
            immediateTarget = true;
        }
        else
        {
            moveTo = this._moveTargets[0];
            immediateTarget = false;
        }

        let dir = Vec3.subtract(new Vec3(), moveTo, this.worldPosition).normalize().multiplyScalar(this._data.moveSpeed * dt);
        this.worldPosition = this.worldPosition.add(dir);

        if (immediateTarget && this.isCloseEnoughTo(moveTo))
        {
            this._pathToCurrentTarget.pop();
        }

        if (this.isCloseEnoughTo(this._moveTargets[0]))
        {
            this.onMoveDone();
        }
    }

    private getPathToMoveTarget(target: Vec3)
    {
        let path = MainGameManager.instance.parkManager.getPath(this.worldPosition, target, true);
        return path;
    }

    private isCloseEnoughTo(dest: Vec3)
    {
        return Vec3.distance(dest, this.worldPosition) <= MainGameManager.instance.catManager.getCloseThreshold();
    }

    private despawn()
    {
        MainGameManager.instance.catManager.despawnCat(this);
    }

    private updateAnimation(state: CatAnimState)
    {
        if (state === CatAnimState.IDLE)
        {
            if (this._catAvatar !== null)
            {
                this._catAvatar.playAnim(state, "");
            }
        }
        else if (state === CatAnimState.MOVING)
        {
            if (this._catAvatar !== null)
            {
                this._catAvatar.playAnim(state, "");
            }
        }
        else if (state === CatAnimState.USING_FACILITY)
        {
            if (this._catAvatar !== null)
            {
                this._catAvatar.playAnim(state, this._assignedFacility.data.id);
            }
        }
    }

    private moveToAssignedQueuePosition()
    {
        if (this.state === CatState.QUEUEING)
        {
            this.setMoveTarget(MainGameManager.instance.parkManager.catBooth.getQueuePosition(this._queuePosition));
            if (this._queuePosition === 0)
            {
                this.requestMove(() => this.setState(CatState.FIRST_IN_QUEUE), false, false);
            }
            else
            {
                this.requestMoveOnly();
            }
        }
    }

    // Facility handling methods

    /**
     * Cancel the facility use, and go back to WAITING.
     * Also remove the facility assignment.
     * 
     * Do not use this haphazardly, as the removed facility will not have its
     * reservee removed.
     */
    public cancelFacilityUse()
    {
        if (this._state === CatState.GO_TO_FACILITY || this._state === CatState.USE_FACILITY)
        {
            this._assignedFacility = null;

            if (this._catAvatar)
            {
                this._catAvatar.popEmote(EmoteType.ANGRY, 4);
            }

            this.setState(CatState.EXITING);
        }
    }

    /**
     * Signal that the facility is done being used. The cat will switch state.
     */
    public signalFacilityUseDone()
    {
        this.setState(CatState.DONE_USING_FACILITY);
    }
    
    // Other handling methods
    
    /**
     * Assign for the cat a facility. It should move to the facility as soon as posible.
     * 
     * Do not use this haphazardly, as the assigned facility will not have its
     * reservee assigned too.
     * @param facility The facility to assign
     */
    public assignFacility(facility: FacilityComponent)
    {
        if (this._state === CatState.FIRST_IN_QUEUE)
        {
            this._assignedFacility = facility;
            this.cancelMove(() => this.setState(CatState.GO_TO_FACILITY));
        }
    }



    // User input handling
    
    public onUserClick()
    {
        if (this.state < CatState.QUEUEING) return;

        let popup = MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_CUSTOMER_BOOK) as PopUpCustomerBook;
        popup.getDetailCatPage(this.data.id);
        popup.show();
    }
}