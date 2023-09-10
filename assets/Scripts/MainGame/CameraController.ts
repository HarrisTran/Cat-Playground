import { _decorator, Camera, CCFloat, clamp, Component, EventTouch, input, Node, UITransform, Vec3 } from 'cc';
import { MainGameManager } from './MainGameManager';
const { ccclass, property } = _decorator;

@ccclass('CameraController')
export class CameraController extends Component
{
    @property(Camera)
    public camera: Camera;
    @property({ type: CCFloat })
    private sensitivity: number = 1;


    protected start(): void
    {
        this.node.on(Node.EventType.TOUCH_START, this.down, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.move, this);
    }

    protected onDestroy()
    {
        this.node.off(Node.EventType.TOUCH_START, this.down, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.move, this);
    }

    private get width(): number
    {
        return this.getComponent(UITransform).contentSize.width;
    }

    public down(event: EventTouch)
    { 
        MainGameManager.instance.touchEffectHelper.requestVfxByEvent(event);

        event.preventSwallow = true;
        event.propagationStopped = false;
    }

    public move(event: EventTouch)
    {
        console.log("move");
        let min = MainGameManager.instance.parkManager.getBoundLeft() + this.width / 2;
        let max = MainGameManager.instance.parkManager.getBoundRight() - this.width / 2;
        let newX = clamp(this.camera.node.worldPosition.x - event.getDeltaX() * this.sensitivity, min, max);
        let newPos = new Vec3(newX, this.camera.node.worldPosition.y, this.camera.node.worldPosition.z);
        this.camera.node.worldPosition = newPos;

        event.preventSwallow = true;
        event.propagationStopped = false;
    }
}

