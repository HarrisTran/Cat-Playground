import { _decorator, Camera, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Component that follows the camera.
 */
@ccclass('FollowCamera')
export class FollowCamera extends Component
{
    @property(Camera)
    public camera: Camera;

    protected lateUpdate(dt: number): void
    {
        if (this.camera !== null && this.camera !== undefined)
        {
            this.node.worldPosition = new Vec3(this.camera.node.worldPosition.x, this.camera.node.worldPosition.y, this.node.worldPosition.z);
        }
    }
}

