import { _decorator, Component, Animation, Sprite, UIOpacity } from 'cc';
import { MainGameManager } from '../MainGameManager';
const { ccclass, property } = _decorator;


@ccclass('InventoryDragItem')
export class InventoryDragItem extends Component
{
	@property(Animation)
	private animation: Animation;
	@property(UIOpacity)
	private opacity: UIOpacity;

	public setFacility(id: string)
	{
		this.opacity.opacity = 255;
		let anim = MainGameManager.instance.resourceManager.getFacilityAnimation(id);
		this.animation.addClip(anim, id);
		this.animation.play(id);
	}

	public setInvisible()
	{
		this.opacity.opacity = 0;
	}

	public setDim()
	{
		this.opacity.opacity = 120;
	}

	public setVisible()
	{
		this.opacity.opacity = 255;
	}

	public setNone()
	{
		this.opacity.opacity = 0;
		this.animation.stop();
	}
}