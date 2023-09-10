import { _decorator, CCBoolean, CCFloat, Component, EventHandler, EventTouch, Node, NodeEventType } from 'cc';
import { MainGameManager } from '../MainGame/MainGameManager';
const { ccclass, property } = _decorator;

/**
 * Class to register player interaction in the game scene
 *  (click and drag, hold is not supported)
 */
@ccclass('PlayerInteractable')
export class PlayerInteractable extends Component
{
    @property({ group: { name: "Clicks", id: "1", displayOrder: 1 }})
    protected registerClick: boolean = false;
    @property({ group: { name: "Clicks", id: "1", displayOrder: 1 }, type: CCFloat })
    private clickTimeThreshold: number = 0.3;
    @property({ group: { name: "Clicks", id: "1", displayOrder: 1 }, type: [EventHandler] })
    private onClickEvents: EventHandler[] = [];

    @property({ group: { name: "Drags/Moves", id: "1", displayOrder: 1 }})
    protected registerMove: boolean = false;
    @property({ group: { name: "Drags/Moves", id: "1", displayOrder: 1 }, type: CCFloat })
    private holdThreshold: number = 0.3;
    @property({ group: { name: "Drags/Moves", id: "1", displayOrder: 1 }, type: CCFloat })
    private dragDistanceThreshold: number = 5;
    @property({ group: { name: "Drags/Moves", id: "1", displayOrder: 1 }, type: [EventHandler] })
    private onMoveStartEvents: EventHandler[] = [];
    @property({ group: { name: "Drags/Moves", id: "1", displayOrder: 1 }, type: [EventHandler] })
    private onMoveEvents: EventHandler[] = [];
    @property({ group: { name: "Drags/Moves", id: "1", displayOrder: 1 }, type: [EventHandler] })
    private onMoveEndEvents: EventHandler[] = [];

    @property({ group: { name: "Long Clicks", id: "1", displayOrder: 1 }})
    protected registerLongClick: boolean = false;
    @property({ group: { name: "Long Clicks", id: "1", displayOrder: 1 }})
    private invokeWhenRelease: boolean = false;
    @property({ group: { name: "Long Clicks", id: "1", displayOrder: 1 }, type: CCFloat })
    private longClickTimeThreshold: number = 0.5;
    @property({ group: { name: "Long Clicks", id: "1", displayOrder: 1 }, type: [EventHandler] })
    private onLongClickEvents: EventHandler[] = [];

    private _isDown: boolean;
    private _shouldClick: boolean;
    private _shouldDrag: boolean;
    private _downTime: number;

    private _shouldLongClick: boolean;

    private _downEvent: EventTouch = null;

    protected onLoad(): void
    {
        this.activate();
    }

    public activate()
    {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    public deactivate()
    {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    public getClickEvents(): EventHandler[]
    {
        return this.onClickEvents;
    }

    public getMoveStartEvents(): EventHandler[]
    {
        return this.onMoveStartEvents;
    }

    public getMoveEvents(): EventHandler[]
    {
        return this.onMoveEvents;
    }

    public getMoveEndEvents(): EventHandler[]
    {
        return this.onMoveEndEvents;
    }

    protected update(dt: number): void
    {
        if (this._isDown)
        {
            this._downTime += dt;

            if (this.registerLongClick && !this._shouldLongClick && this._downTime >= this.longClickTimeThreshold)
            {
                if (!this.invokeWhenRelease)
                {
                    this.evokeLongClick(this._downEvent);
                }

                this._shouldLongClick = true;
            }

            if (this.registerClick && this._shouldClick && this._downTime >= this.clickTimeThreshold)
            {
                this._shouldClick = false;
            }

            if (this.registerMove && !this._shouldDrag && this._downTime >= this.holdThreshold)
            {
                this.evokeMoveStart(this._downEvent);
                this._shouldDrag = true;
            }
        }
    }

    private onTouchStart(event: EventTouch)
    {
        this._isDown = true;
        this._shouldDrag = false;
        this._shouldClick = true;
        this._shouldLongClick = false;

        this._downEvent = event;
        this._downTime = 0;

        if (MainGameManager.instance)
        {
            MainGameManager.instance.touchEffectHelper.requestVfxByEvent(event);
        }

        // if (this.registerClick || this.registerLongClick)
        // {
        //     event.preventSwallow = false;
        // }

        event.preventSwallow = true;
    }

    private onTouchMove(event: EventTouch)
    {
        if (this._isDown)
        {
            if (this.registerMove)
            {
                // Check if should drag
                if (!this._shouldDrag)
                {
                    if (Math.abs(event.getDeltaX()) > this.dragDistanceThreshold || Math.abs(event.getDeltaY()) > this.dragDistanceThreshold)
                    {
                        this._shouldDrag = true;
                        this.evokeMoveStart(event);
                    }
                }

                // Evoke drag event
                if (this._shouldDrag)
                {
                    this.evokeMove(event);
                }
            }
        }

        event.preventSwallow = true;
    }

    private onTouchCancel(event: EventTouch)
    {
        if (this._isDown)
        {
            this._isDown = false;
            if (this.registerMove && this._shouldDrag)
            {
                this.evokeMoveEnd(event);
            }

            this._shouldDrag = false;
            this._shouldClick = false;
            this._shouldLongClick = false;

            this._downEvent = null;
        }

        event.preventSwallow = true;
    }

    private onTouchEnd(event: EventTouch)
    {
        if (this._isDown)
        {
            if (this.registerClick && this._shouldClick)
            {
                this.evokeClick(event);
            }

            if (this.registerMove && this._shouldDrag)
            {
                this.evokeMoveEnd(event);
            }

            if (this.registerLongClick && this.invokeWhenRelease && this._shouldLongClick)
            {
                this.evokeLongClick(event);
            }

            this._shouldDrag = false;
            this._shouldClick = false;
            this._shouldLongClick = false;
            this._isDown = false;

            this._downEvent = null;
        }

        event.preventSwallow = true;
    }

    public evokeClick(event: EventTouch)
    {
        if (this.registerClick)
        {
            console.log("Clicked " + this.node.name);
            EventHandler.emitEvents(this.onClickEvents, event);
        }
    }

    public evokeMoveStart(event: EventTouch)
    {
        if (this.registerMove)
        {
            console.log("Move started " + this.node.name);
            EventHandler.emitEvents(this.onMoveStartEvents, event);
        }
    }

    public evokeMove(event: EventTouch)
    {
        if (this.registerMove)
        {
            console.log("Moving " + this.node.name);
            EventHandler.emitEvents(this.onMoveEvents, event);
        }
    }

    public evokeMoveEnd(event: EventTouch)
    {
        if (this.registerMove)
        {
            console.log("Move Ended " + this.node.name);
            EventHandler.emitEvents(this.onMoveEndEvents, event);
        }
    }

    public evokeLongClick(event: EventTouch)
    {
        if (this.registerLongClick)
        {
            console.log("Long Clicked " + this.node.name);
            EventHandler.emitEvents(this.onLongClickEvents, event);
        }
    }
}

