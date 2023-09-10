import { __private, _decorator, Camera, CCFloat, CCString, Color, Component, Label, RichText, Vec3 } from 'cc';
const { ccclass, property, type } = _decorator;

// Don't even ask. I'll break.

@ccclass('CameraFixer')
export class CameraFixer extends Component
{
	@property(Camera)
	private camera: Camera;
	@property({ type: CCFloat })
	private width: number = 1080;
	@property({ type: CCFloat })
	private height: number = 1920;

	protected update(dt: number): void
	{
		this.camera.orthoHeight = this.height * 0.5;
		this.node.position = new Vec3(this.width * 0.5, this.height * 0.5, this.node.position.z);
	}
}
