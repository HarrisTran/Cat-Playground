import { _decorator, Component, Node, Animation, EventHandler, AnimationState, resources, AnimationClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('VFXCallback')
export class VFXCallback extends Component
{
	@property(Animation)
	private animationComponent: Animation;
	@property([EventHandler])
	private defaultClipFinishEvents: EventHandler[] = [];

	private defaultClipFinishCallbacks: Set<((vfx: VFXCallback) => void)> = new Set<((vfx: VFXCallback) => void)>();

	private _shouldInvokeCallback: boolean = false;

	protected onLoad(): void
	{
		this.animationComponent.playOnLoad = false;
		this.animationComponent.stop();
		this.animationComponent.on(Animation.EventType.STOP, this.onAnimationFinishEvent, this);
		this.animationComponent.on(Animation.EventType.FINISHED, this.onAnimationFinishEvent, this);
	}

	protected update(dt: number): void
	{
		if (this._shouldInvokeCallback)
		{ 
			this._shouldInvokeCallback = false;
			this.invokeCallbacks();
		}
	}

	private onAnimationFinishEvent(type: Animation.EventType, state: AnimationState)
	{
		if (this.animationComponent.getState(this.animationComponent.defaultClip.name) === state)
		{
			EventHandler.emitEvents(this.defaultClipFinishEvents);

			this._shouldInvokeCallback = true;

			this.animationComponent.stop();

			this.animationComponent.node.active = false;
		}
	}

	public requestPlayDefaultClip()
	{
		// if (!this.animationComponent.node.active)
		// {
		// 	this.animationComponent.node.active = true;
		// }
		// // else
		// // {
		// // 	this.animationComponent.stop();
		// // }

		

		this.animationComponent.node.active = true;
		this.animationComponent.play();
		//}
	}

	public setAnimationClip(clip: AnimationClip)
	{
		this.animationComponent.stop();
		this.animationComponent.defaultClip = clip;
	}

	public addDefaultClipFinishedCallback(callback: (vfx: VFXCallback) => void)
	{
		this.defaultClipFinishCallbacks.add(callback);
	}

	public removeDefaultClipFinishedCallback(callback: (vfx: VFXCallback) => void)
	{
		this.defaultClipFinishCallbacks.delete(callback);
	}

	private invokeCallbacks()
	{
		for (let callback of this.defaultClipFinishCallbacks)
		{
			callback(this);
		}
	}
}