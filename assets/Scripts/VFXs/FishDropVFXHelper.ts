import { _decorator, Component, Label, Node, tween, Tween, v3, Vec3 } from 'cc';
import { VFXCallback } from './VFXCallback';
import { MainGameManager } from '../MainGame/MainGameManager';
import { GameSound } from '../MainGame/Managers/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('FishDropVFXHelper')
export class FishDropVFXHelper extends Component {
    @property(Node)
    private fishNode : Node = null;

    @property(VFXCallback)
    private splashingWater : VFXCallback = null;

    private _originalPos : Vec3;
    private _isPlaying: boolean = false;

    protected onLoad(): void {
        this._originalPos = this.fishNode.getPosition();
    }

    protected start(): void {
        this.splashingWater.node.active = false;
    }

    public playAnimFishDrop(fishCount: number){
        if(this._isPlaying) return;
        this.fishNode.active = true;

        setTimeout(() => {
            MainGameManager.instance.audioManager.playSfx(GameSound.WATER_DROP_1);
            MainGameManager.instance.audioManager.playSfx(GameSound.WATER_DROP_2);
        }, 350);

        tween(this.fishNode)
        .by(0.4,{position : v3(0,-120,0)},
        {
            easing: "sineIn", 
            onStart: () => this._isPlaying = true,
            onComplete: ()=>{
                MainGameManager.instance.audioManager.playSfx(GameSound.FISH_COLLECT);
                this.onPlayDone();
            }
        })
        .start();

    }

    private onPlayDone(){
        this.splashingWater.requestPlayDefaultClip();
        this.fishNode.active = false;
        this._isPlaying = false;
        this.fishNode.setPosition(this._originalPos);
    }

    
}

