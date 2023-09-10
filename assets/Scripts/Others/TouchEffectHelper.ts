import { _decorator, Camera, Component, EventTouch, input, Input, Node, Vec3 } from 'cc';
import { VFXCallback } from '../VFXs/VFXCallback';
const { ccclass, property } = _decorator;

@ccclass("TouchEffectHelper")
export class TouchEffectHelper extends Component
{
	@property(Camera)
	private camera: Camera;
	@property(Node)
	private vfxHost: Node;

	private _allVfxs: Set<VFXCallback>;
	private _freeVfxs: Set<VFXCallback>;

	protected onLoad(): void
	{
		this._allVfxs = new Set<VFXCallback>();

		let allVfxs = this.vfxHost.getComponentsInChildren(VFXCallback);

		this._allVfxs = new Set<VFXCallback>();
		this._freeVfxs = new Set<VFXCallback>();

		for (let vfx of allVfxs)
		{
			this._allVfxs.add(vfx);
			this._freeVfxs.add(vfx);
		}
	}

	public requestVfxByEvent(event: EventTouch)
	{
		let screenPos = event.getLocation();
		let position = this.camera.screenToWorld(new Vec3(screenPos.x, screenPos.y));
		this.requestVfxByPosition(position);
	}

	public requestVfxByPosition(pos: Vec3)
	{
		let vfx = this.getVfx();
		if (vfx)
		{
			vfx.node.worldPosition = pos.clone();

			vfx.requestPlayDefaultClip();
			setTimeout(() => this.retrieveVfx(vfx), 1000);
		}
	}

	private retrieveVfx(vfx: VFXCallback)
	{
		if (this._allVfxs.has(vfx))
		{
			this._freeVfxs.add(vfx);
			vfx.node.active = false;
		}
	}

	private getVfx(): VFXCallback
	{
		if (this._freeVfxs.size > 0)
		{
			let callback = this._freeVfxs.values().next().value as VFXCallback;
			this._freeVfxs.delete(callback);
			return callback;
		}
		else
		{
			return null;
		}
	}
}

