import { _decorator, CCString, Component, EventHandler, EventTouch, Node, Size, UITransform, Vec2, Vec3 } from 'cc';
import { PlayerInteractable } from '../Common/PlayerInteractable';
import { UIButton } from '../Common/UI/UIButton';
import { MainGameManager } from '../MainGame/MainGameManager';
import { TutorialManager } from './TutorialManager';
import { TetrominoPlayerInteractable } from '../Puzzle/TetrominoPlayerInteractable';
const { ccclass, property } = _decorator;

export interface ITutorialPropagator extends TutorialPropagator { }

/**
 * Component 
 */
@ccclass("TutorialPropagator")
export class TutorialPropagator extends Component
{
	@property(CCString)
	private tutorialItemIdentifier = "";

	@property({ group: { name: "Components", id: "2", displayOrder: 1 }, type: PlayerInteractable })
	public interactable: PlayerInteractable;
	@property({ group: { name: "Components", id: "2", displayOrder: 1 }, type: TetrominoPlayerInteractable })
	public tetrominoInteractable: TetrominoPlayerInteractable;
	@property({ group: { name: "Components", id: "2", displayOrder: 1 }, type: UIButton })
	public uiButton: UIButton;

	private _clickEndCallback: () => void;
	private _dragEndCallback: () => void;

	public DraggingPropagator: TutorialPropagator;


	public get identifier(): string { return this.tutorialItemIdentifier; }
	public set identifier(value: string)
	{
		this.tutorialItemIdentifier = value;
	}

	public get ClickEndCallback(): () => void { return this._clickEndCallback };
	public get DragEndCallback(): () => void { return this._dragEndCallback };
	public set ClickEndCallback(value: () => void) { this._clickEndCallback = value };
	public set DragEndCallback(value: () => void) { this._dragEndCallback = value };

	public get worldPosition(): Vec3
	{
		return this.node.worldPosition.clone();
	}

	public get ContentSize(): Size
	{
		return this.getComponent(UITransform).contentSize.clone();
	}

	public get AnchorPoint(): Vec2
	{
		return this.getComponent(UITransform).anchorPoint.clone();
	}

	protected start(): void
	{
		if (this.identifier === "")
		{
			console.warn("Tutorial propagator of " + this.node.name + " does not have a valid identifier, please check.");
			return;
		}
		TutorialManager.Instance.registerPropagator(this);
	}

	protected onDestroy(): void
	{
		TutorialManager.Instance.removePropagator(this);
	}

	public clearCallbacks()
	{
		this._clickEndCallback = null;
		this._dragEndCallback = null;
	}

	public onPropagateClick(event: EventTouch)
	{
		if (this.interactable)
		{
			this.interactable.evokeClick(event);
		}

		if (this.tetrominoInteractable)
		{
			this.tetrominoInteractable.evokeClick(event);
		}

		if (this.uiButton)
		{
			this.uiButton.onClick();
		}

		if (this._clickEndCallback)
		{
			this._clickEndCallback();
		}
	}

	public onPropagateDragStart(event: EventTouch)
	{
		if (this.interactable)
		{
			this.interactable.evokeMoveStart(event);
		}

		if (this.tetrominoInteractable)
		{
			this.tetrominoInteractable.evokeMoveStart(event);
		}
	}

	public onPropagateDragging(event: EventTouch)
	{
		if (this.interactable)
		{
			this.interactable.evokeMove(event);
		}

		if (this.tetrominoInteractable)
		{
			this.tetrominoInteractable.evokeMove(event);
		}
	}

	public onPropagateDragEnd(event: EventTouch)
	{
		if (this.interactable)
		{
			this.interactable.evokeMoveEnd(event);
		}

		if (this.tetrominoInteractable)
		{
			this.tetrominoInteractable.evokeMoveEnd(event);
		}
	}

	public confirmDragSuccess()
	{
		if (this.DraggingPropagator)
		{
			this.DraggingPropagator.DragEndCallback();
		}
	}
}
