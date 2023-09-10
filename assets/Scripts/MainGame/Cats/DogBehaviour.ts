import { _decorator, randomRange, Vec3, Node } from 'cc';
import { MainGameManager } from '../MainGameManager';
import { DogAvatar } from './DogAvatar';
import { IBehaviour } from './CatBehaviour';
import { CurrencyDrop } from '../Facilities/CurrencyDrop';
import { EmoteType } from './Emote';
const { ccclass, property } = _decorator;

/**
 * Enum for the state of the dog's AI
 */
export enum DogState
{
    NONE,
    WATCH_POST,
    PICKING_COIN,
    RETURN_TO_POST
}

/**
 * Enum for the state of the cat's animation
 */
export enum DogAnimState
{
    NONE,
    IDLE,
    MOVING,
}

const DOG_STAT =
{
    speed: 180 as number,
    maxCurrencySetPerTrip: 1 as number,
    tripDelay: 4 as number,
};

const DOG_STAT_BOOSTED =
{
    speed: 360 as number,
    maxCurrencySetPerTrip: 4 as number,
    tripDelay: 1.5 as number,
}

const DOG_BOOST_TIME_IN_SECOND: number = 60;

/**
 * Class that represents a cat.
 */
export class DogBehaviour implements IBehaviour
{
    // Book-keepings and refs
    private _dogAvatar: DogAvatar = null;

    // States and important properties
    private _state: DogState;
    private _animState: DogAnimState;
    private _worldPosition: Vec3;
    private _moveTargets: Vec3[];
    private _pathToCurrentTarget: Vec3[];
    private _moveIdleTimer: number;
    private _moveDoneCallback: () => void = null;
    private _moveCallbackInvokeOnCancel: boolean;

    private _isBoosted: boolean;
    private _boostable: boolean;
    private _boostTimer: number;
    private _idleTimer: number;
    private _setToCollectDrops: CurrencyDrop[];

    // Getters/Setters
    public get avatar(): DogAvatar
    {
        return this._dogAvatar;
    }

    public get avatarNode(): Node
    {
        return this._dogAvatar ? this._dogAvatar.node : null;
    }

    public get worldPosition(): Vec3
    {
        return this._worldPosition;
    }

    public set worldPosition(value: Vec3)
    {
        this._worldPosition = value;
    }

    public get state(): DogState
    {
        return this._state;
    }

    public set state(value: DogState)
    {
        this._state = value;
    }

    public get animState(): DogAnimState
    {
        return this._animState;
    }

    public set animState(value: DogAnimState)
    {
        this._animState = value;
    }

    public get isActive(): boolean
    {
        return this._state !== DogState.NONE;
    }

    public get moveDoneCallback(): () => void
    {
        return this._moveDoneCallback;
    }

    public set moveDoneCallback(value: () => void)
    {
        this._moveDoneCallback = value;
    }

    public get isBoosted(): boolean
    {
        return this._isBoosted;
    }

    public get boostable(): boolean
    {
        return this._boostable;
    }

    public set boostable(value: boolean)
    {
        this._boostable = value;
    }

    private get hasMoveTargets(): boolean
    {
        return this._moveTargets.length > 0;
    }

    private get idenString(): string
    {
        return "(Dog)";
    }

    private get moveSpeed(): number
    {
        return this._isBoosted ? DOG_STAT_BOOSTED.speed : DOG_STAT.speed;
    }

    private get tripDelay(): number
    {
        return this._isBoosted ? DOG_STAT_BOOSTED.tripDelay : DOG_STAT.tripDelay;
    }

    private get currencySetPerTrip(): number
    {
        return this._isBoosted ? DOG_STAT_BOOSTED.maxCurrencySetPerTrip : DOG_STAT.maxCurrencySetPerTrip;
    }

    /**
     * Activate the dog behaviour.
     *
     */
    public activate(spawnPoint: Vec3)
    {
        this._state = DogState.NONE;
        this._animState = DogAnimState.NONE;

        this.worldPosition = spawnPoint;
        this._moveTargets = [];
        this._pathToCurrentTarget = [];
        this._moveIdleTimer = 0;
        this.moveDoneCallback = null;

        this.setAnimationState(DogAnimState.IDLE);
        this.setState(DogState.WATCH_POST);
    }

    private _isRight: boolean = true;

    /**
     * Update the dog's behaviour by @param dt second.
     * 
     * Call this inside the manager's update();
     * @param dt Time step to update the cat's behaviours.
     */
    public update(dt: number): void
    {
        // TEMP
        if (MainGameManager.instance.tutorialManager.isPlayingTutorial) return;

        // Boosted check here
        if (this._isBoosted)
        {
            this._boostTimer -= dt;

            if (this._dogAvatar)
            {
                this._dogAvatar.updateTimer(true, this._boostTimer, DOG_BOOST_TIME_IN_SECOND);
            }

            if (this._boostTimer <= 0)
            {
                this._isBoosted = false;

                if (this._dogAvatar)
                {
                    this._dogAvatar.updateTimer(false, this._boostTimer, DOG_BOOST_TIME_IN_SECOND);
                }

            }
        }

        // If dog is not activated, do nothing
        if (this._state === DogState.NONE)
        {
            return;
        }
        else if (this._state === DogState.WATCH_POST)
        {
            this._idleTimer -= dt;

            if (this._idleTimer <= 0)
            {
                // Get targets to pick
                let drops = MainGameManager.instance.parkManager.getCurrenyDrops(this.currencySetPerTrip);

                if (drops != null && drops.length > 0)
                {
                    this._setToCollectDrops = drops;
                    for (var drop of this._setToCollectDrops) drop.assignedToBeColelctedByDog = true;
                    this.setState(DogState.PICKING_COIN);
                }
                else
                {
                    this._idleTimer = this.tripDelay * 0.33;
                }
            }
        }
        else if (this._state === DogState.PICKING_COIN)
        {
            if (this._setToCollectDrops[0] === null || this._setToCollectDrops[0] === undefined || this._setToCollectDrops[0].isCollected)
            {
                this.cancelMove(null);
            }
        }
        else if (this._state === DogState.RETURN_TO_POST)
        {

        }

        // If the dog is moving towards a target, update its position
        if (this._animState === DogAnimState.MOVING && this.hasMoveTargets)
        {
            var oldX = this.worldPosition.x;
            this.updateMovement(dt);

            // Sync to the avatar
            if (this._dogAvatar !== null)
            {
                var deltaX = this.worldPosition.x - oldX;

                this._dogAvatar.updateWorldPosition(this.worldPosition);
                if (deltaX > 2 || deltaX < -2)
                {
                    // Update this._isRIght
                    this._isRight = deltaX > 2;
                }

                this._dogAvatar.setFlip(this._isRight);
            }
        }
        // If the dog is idling and has a target. Tell it to move.
        else if (this._animState === DogAnimState.IDLE && this.hasMoveTargets)
        {
            this._moveIdleTimer -= dt;

            if (this._moveIdleTimer <= 0)
            {
                this.requestMoveOnly();
            }
        }
        else
        {
            if (this._dogAvatar != null)
            {
                this._isRight = false;
                this._dogAvatar.setFlip(false);
            }
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

        this.setAnimationState(DogAnimState.NONE);
        this.setState(DogState.NONE);
    }

    /**
     * Set the dog's avatar.
     * 
     * An avatar is a Cocos Component in the scene. If an avatar is assigned, it will be controlled accordingly.
     * @param avatar the avatar to set
     */
    public setAvatar(avatar: DogAvatar)
    {
        this._dogAvatar = avatar;

        if (this._state === DogState.WATCH_POST)
        {
            if (!this.isBoosted)
            {
                this._dogAvatar.popEmote(EmoteType.COIN, 99999999);
            }
            else
            {
                this._dogAvatar.popEmote(EmoteType.NONE, 1);
            }
        }
    }

    /**
     * Remove and returns the dog's avatar.
     * 
     * @returns The avatar the the cat was holding.
     */
    public removeAvatar(): DogAvatar
    {
        let avatar = this._dogAvatar;
        this._dogAvatar = null;
        return avatar;
    }


    // State machine section

    /**
     * Set the state for the dog's behaviour state machine.
     * 
     * @param newState the newState
     * @param forced whether to run update code if the newState is the same as the current state.
     */
    public setState(newState: DogState, forced: boolean = false)
    {
        if (this._state !== newState || forced)
		{
			this._state = newState;

            if (this._dogAvatar !== null)
            {
                this._dogAvatar.updateDebugStateText(newState);
            }

            if (newState === DogState.NONE)
            {

            }
            else if (newState == DogState.WATCH_POST)
            {
                this.onWatchPost();

                if (this._dogAvatar)
                {
                    if (!this.isBoosted)
                    {
                        this._dogAvatar.popEmote(EmoteType.COIN, 99999999);
                    }
                    else
                    {
                        this._dogAvatar.popEmote(EmoteType.NONE, 1);
                    }
                }

            }
            else if (newState == DogState.PICKING_COIN)
            {
                this.onPickingCoinState();
            }
            else if (newState == DogState.RETURN_TO_POST)
            {
                this.onReturnToPost();
            }
            else
			{
				throw new Error("Trying to set DogState of " + this.idenString + " to " + newState + " which is not a valid value.");
			}
		}
    }

    private onWatchPost()
    {
        this._idleTimer = this.tripDelay;
    }

    private onPickingCoinState()
    {
        this.goCollectDrop();
    }

    private onReturnToPost()
    {
        this.setMoveTarget(MainGameManager.instance.parkManager.getDogPostPosition());
        this.requestMove(() =>
        {
            this.setState(DogState.WATCH_POST);
        }, false, true);
    }

    private goCollectDrop()
    {
        if (this._setToCollectDrops && this._setToCollectDrops.length > 0)
        {
            var drop = this._setToCollectDrops[0];
            var pos = new Vec3(drop.node.worldPosition.x, drop.node.worldPosition.y - 60, 0);
            this.setMoveTarget(pos);
            this.requestMove(() =>
            {
                if (drop)
                {
                    drop.onClick();
                    this._dogAvatar.popEmote(EmoteType.EYE_GLARE, 3);
                }
                this._setToCollectDrops.shift();
                this.goCollectDrop();
            }, true, true);
        }
        else
        {
            this.setState(DogState.RETURN_TO_POST);
        }
    }



    // Animation + Movement section

    /**
     * Set the state for the animation state machine.
     *
     * If set, the dog's avatar will perform animation accordingly.
     *
     * NOTE: This is unrelated to CatBehaviour.setState(), as this one is more for animation and moving.
     * TODO: Have not set the cat's animation yet.
     *
     * @param newState the newState
     * @param forced whether to run update code if the newState is the same as the current state.
     */
    public setAnimationState(newState: DogAnimState, forced: boolean = false)
    {
        if (this._animState !== newState || forced)
        {
            this._animState = newState;

            if (this._dogAvatar !== null)
            {
                this._dogAvatar.updateDebugAnimStateText(newState);
            }

            if (newState === DogAnimState.NONE)
            {
                
            }
            else if (newState === DogAnimState.IDLE)
            {
                
            }
            else if (newState === DogAnimState.MOVING)
            {
                
            }

            this.updateAnimation(newState);
        }
    }

    /**
     * Request the dog to move.
     *
     * The dog will move, and have its animation state set to MOVING if there is a target to move to. (Can be set with setMoveTarget)
     */
    public requestMoveOnly()
    {
        if (this.hasMoveTargets)
        {
            this.setAnimationState(DogAnimState.MOVING);
        }
    }



    /**
     * Request the dog to move, and after ALL movements are done, invoke a callback
     *
     * The dog will move, and have its animation state set to MOVING if there is a target to move to. (Can be set with setMoveTarget)
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
            this.setAnimationState(DogAnimState.MOVING);

            // Get path
            if (useNavigationPath)
            {
                this._pathToCurrentTarget = this.getPathToMoveTarget(this._moveTargets[0]);
            }
        }
    }

    /**
     * Request cancel the movement of the dog. This will also remove all targets.
     * 
     * @param afterCancelCallback Callback to invoke after the movement is canceled. 
     * Which should be called after a set callback of requestMove(callback) (if allowed to invoke on cancel).
     * The call is on the same frame. (This could be changed in the future)
     * 
     */
    public cancelMove(afterCancelCallback: () => void)
    {
        this.cancelMoveOnly();
        
        if (afterCancelCallback)
            afterCancelCallback();
    }
    
    /**
     * Request cancel the movement of the dog. This will also remove all targets.
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

        this.setAnimationState(DogAnimState.IDLE);
    }

    public refreshDogAvatar()
    {
        this._dogAvatar.updateWorldPosition(this.worldPosition);
        this.updateAnimation(this._animState);
    }

    public boost()
    {
        this._isBoosted = true;
        this._boostTimer = DOG_BOOST_TIME_IN_SECOND;
    }

    /**
     * Set a target for the dog. Call requestMove() or requestMove(callback) to actuall make it move.
     * @param value where the dog should move to.
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
            this.setAnimationState(DogAnimState.IDLE);

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
            this._moveIdleTimer = 0.75;
            this.setAnimationState(DogAnimState.IDLE);
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

        let dir = Vec3.subtract(new Vec3(), moveTo, this.worldPosition).normalize().multiplyScalar(this.moveSpeed * dt);
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
        console.log(path);
        return path;
    }

    private isCloseEnoughTo(dest: Vec3)
    {
        return Vec3.distance(dest, this.worldPosition) <= MainGameManager.instance.catManager.getCloseThreshold();
    }

    private updateAnimation(state: DogAnimState)
    {
        if (state === DogAnimState.IDLE)
        {
            if (this._dogAvatar !== null)
            {
                this._dogAvatar.playAnim(state);
            }
        }
        else if (state === DogAnimState.MOVING)
        {
            if (this._dogAvatar !== null)
            {
                this._dogAvatar.playAnim(state);
            }
        }
    }

    // User input handling
    public onUserClick()
    {
        
    }
}