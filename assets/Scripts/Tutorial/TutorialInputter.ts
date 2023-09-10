import { _decorator, Component, EventTouch, Node, UITransform, Vec3, Animation, Tween, tween, Size } from 'cc';
import { TutorialPropagator } from './TutorialPropagator';
const { ccclass, property } = _decorator;

/**
 * Component 
 */
@ccclass("TutorialInputter")
export class TutorialInputter extends Component
{
	@property(Animation)
	private animation: Animation;
	@property(Node)
	private appearance: Node;
	@property(UITransform)
	private mask: UITransform;

	private _pawnOriginalPosition: Vec3;

	private _currentPropagator: TutorialPropagator = null;
	private _dragEndPropagator: TutorialPropagator = null;
	private _dragTween: Tween<Node>;

	protected onLoad(): void
	{
		this._pawnOriginalPosition = this.appearance.position.clone();
	}

	protected update(dt: number)
	{

	}

	public setPropagatorAsClick(propagator: TutorialPropagator, onClickCallback?: () => void)
	{
		if (this._currentPropagator != null)
		{
			throw new Error("Please clean up first before calling another propagator. Check your code.");
		}

		this._currentPropagator = propagator;

		if (this._currentPropagator != null)
		{
			this._currentPropagator.ClickEndCallback = onClickCallback;
			this._currentPropagator.DragEndCallback = null;

			var uitransform = this.getComponent(UITransform);
			uitransform.setContentSize(this._currentPropagator.ContentSize);
			uitransform.setAnchorPoint(this._currentPropagator.AnchorPoint);

			let size = Math.min(uitransform.contentSize.width, uitransform.contentSize.height);

			this.mask.setContentSize(new Size(size + 100, size + 100));
			this.node.worldPosition = new Vec3(this._currentPropagator.worldPosition.x, this._currentPropagator.worldPosition.y, this.node.worldPosition.z);
			this.appearance.position = this._pawnOriginalPosition.clone();
		}

		this.animation.play("MouseTapAnim");
		this.node.active = true;
	}

	public setPropagatorAsDrag(propagator: TutorialPropagator, endPropagator: TutorialPropagator, onDragEndCallback: () => void)
	{
		if (this._currentPropagator != null)
		{
			throw new Error("Please clean up first before calling another propagator. Check your code.");
		}

		this._currentPropagator = propagator;
		this._dragEndPropagator = endPropagator;

		if (this._currentPropagator != null)
		{
			this._currentPropagator.ClickEndCallback = null;
			this._currentPropagator.DragEndCallback = onDragEndCallback;

			this._dragEndPropagator.DraggingPropagator = this._currentPropagator;

			var uitransform = this.getComponent(UITransform);
			uitransform.setContentSize(this._currentPropagator.ContentSize);
			uitransform.setAnchorPoint(this._currentPropagator.AnchorPoint);
			this.mask.setContentSize(new Size(uitransform.contentSize.width + 100, uitransform.contentSize.height + 100));
		}

		let startPos = new Vec3(this._currentPropagator.worldPosition.x, this._currentPropagator.worldPosition.y, this.node.worldPosition.z);
		let endPos = new Vec3(this._dragEndPropagator.worldPosition.x, this._dragEndPropagator.worldPosition.y, this.node.worldPosition.z);
		this.node.worldPosition = startPos;
		this._dragTween = tween(this.appearance).to(1, { worldPosition: endPos },
		{
			easing: "linear",
			onComplete: (target) =>
			{
				this.appearance.position = this._pawnOriginalPosition.clone();
			}
		}).repeatForever().start();

		this.animation.play("MouseDragAnim");
		this.node.active = true;
	}

	public clean()
	{
		if (this._currentPropagator)
		{
			this._currentPropagator.clearCallbacks();
			this._currentPropagator = null;
		}

		if (this._dragEndPropagator)
		{
			this._dragEndPropagator.DraggingPropagator = null;
		}

		this.animation.stop();

		if (this._dragTween)
		{
			this._dragTween.stop();
			this._dragTween = null;
		}

		this.node.active = false;
	}

	public onClick(event: EventTouch)
	{
		if (this._currentPropagator)
		{
			this._currentPropagator.onPropagateClick(event);
		}
	}

	public onDragStart(event: EventTouch)
	{
		if (this._currentPropagator)
		{
			this._currentPropagator.onPropagateDragStart(event);
		}
	}

	public onDragMove(event: EventTouch)
	{
		if (this._currentPropagator)
		{
			this._currentPropagator.onPropagateDragging(event);
		}
	}

	public onDragEnd(event: EventTouch)
	{
		if (this._currentPropagator)
		{
			this._currentPropagator.onPropagateDragEnd(event);
		}
	}
}