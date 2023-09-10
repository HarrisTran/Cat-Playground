import { _decorator, Component, Node, tween, Animation } from 'cc';
import { VFXCallback } from '../../VFXs/VFXCallback';
const { ccclass, property } = _decorator;

@ccclass('DogTutorial')
export class DogTutorial extends Component
{
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private appearance: Node;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Animation })
    private animation: Animation;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: VFXCallback })
    private smoke: VFXCallback;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private inNode: Node;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private outNode: Node;

    protected start(): void
    {
        this.animation.play("DogIdle");
    }

    public moveInside(onDoneAction: () => void)
    {
        this.appearance.setRotationFromEuler(0, 0, 0);
        this.setOutside();
        this.animation.play("DogWalking");
        tween(this.appearance).to(3, { worldPosition: this.inNode.worldPosition.clone() })
            .call(() =>
            {
                if (onDoneAction) onDoneAction();
                this.animation.play("DogIdle");
            }).start();
    }

    public moveOutside(onDoneAction: () => void)
    {
        this.appearance.setRotationFromEuler(0, 180, 0);
        this.setInside();
        this.animation.play("DogWalking");
        tween(this.appearance).to(3, { worldPosition: this.outNode.worldPosition.clone() })
            .call(() =>
            {
                if (onDoneAction) onDoneAction();
                this.animation.play("DogIdle");

            }).start();
    }

    public setInside()
    {
        this.appearance.worldPosition = this.inNode.worldPosition.clone();
    }

    public setOutside()
    {
        this.appearance.worldPosition = this.outNode.worldPosition.clone();
    }
}