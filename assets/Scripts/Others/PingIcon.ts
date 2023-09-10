import { _decorator, Component, Node, tween, Tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PingIcon')
export class PingIcon extends Component {
    private _tweenNode : Tween<Node> = null;

    protected onLoad(): void {
        this._tweenNode = tween(this.node)
        .sequence(
            tween(this.node).to(0.1,{eulerAngles: v3(0,0,-12)}),
            tween(this.node).to(0.1,{eulerAngles: v3(0,0,12)}),
        )
        .repeatForever();
    }

    public playRingRing(){
        this.node.active = true;
        this._tweenNode.start();
    }

    public stopRingRing(){
        this.node.active = false;
        this._tweenNode.stop();
    }
}

