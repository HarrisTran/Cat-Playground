import { _decorator, CCFloat, clamp, Color, Component, Layout, Node, Sprite, SpriteFrame, tween, Tween, Vec2, Vec3 } from 'cc';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { PuzzleGameUI } from '../UI/PuzzleGameUI';
import { VFXCallback } from '../../VFXs/VFXCallback';
const { ccclass, property } = _decorator;

@ccclass('ScoreFloatup')
export class ScoreFloatup extends Component
{
    @property({ group: { name: "Score - Components", id: "1", displayOrder: 1 }, type: Node })
    private scoreGroup: Node;
    @property({ group: { name: "Score - Components", id: "1", displayOrder: 1 }, type: Sprite })
    private complimentSprite: Sprite;
    @property({ group: { name: "Score - Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
    private scoreText: LocalizedLabel;
    @property({ group: { name: "Score - Params", id: "1", displayOrder: 2 }, type: CCFloat })
    private scoreInAnimTime: number;
    @property({ group: { name: "Score - Params", id: "1", displayOrder: 2 }, type: CCFloat })
    private scoreStayTime: number;
    @property({ group: { name: "Score - Params", id: "1", displayOrder: 2 }, type: CCFloat })
    private scoreOutAnimTime: number;

    @property({ group: { name: "Combo - Components", id: "2", displayOrder: 1 }, type: Node })
    private comboGroup: Node;
    @property({ group: { name: "Combo - Components", id: "2", displayOrder: 1 }, type: Layout })
    private comboGroupLayout: Layout;
    @property({ group: { name: "Combo - Components", id: "2", displayOrder: 1 }, type: LocalizedLabel })
    private comboNumberText: LocalizedLabel;
    @property({ group: { name: "Combo - Params", id: "2", displayOrder: 2 }, type: CCFloat })
    private comboInAnimTime: number;
    @property({ group: { name: "Combo - Params", id: "2", displayOrder: 2 }, type: CCFloat })
    private comboStayTime: number;
    @property({ group: { name: "Combo - Params", id: "2", displayOrder: 2 }, type: CCFloat })
    private comboOutAnimTime: number;
    @property({ group: { name: "Combo - VFX", id: "2", displayOrder: 3 }, type: VFXCallback})
    private starComboVFX: VFXCallback;

    @property({ group: { name: "Sprites", id: "3", displayOrder: 1 }, type: [SpriteFrame] })
    private complimentSpriteFrames: SpriteFrame[] = [];
    @property({ group: { name: "Sprites", id: "3", displayOrder: 1 }, type: [Color] })
    private comboColors: Color[] = [];

    private _score: number;
    private _combo: number;
    private _lineBroke: number;

    public manager: PuzzleGameUI;

    protected onLoad(): void
    {
        this.deactivate();
    }

    public deactivate()
    {
        this.comboGroup.scale = new Vec3(0, 0, 1);
        this.scoreGroup.scale = new Vec3(0, 0, 1);

        this.starComboVFX.node.active = false;
    }

    public show(where: Vec3, score: number, combo: number, lineBroke: number)
    {
        this.node.active = true;

        // setters
        this._score = score;
        this._combo = combo;
        this._lineBroke = lineBroke;

        this.comboGroup.scale = new Vec3(0, 0, 1);
        this.scoreGroup.scale = new Vec3(0, 0, 1);

        this.comboNumberText.stringRaw = this._combo.toString();
        this.comboNumberText.color = this._combo <= 1 ? Color.TRANSPARENT : this.comboColors[(this._combo - 2) % this.comboColors.length];

        this.comboNumberText.node.active = this._combo > 1;
        this.comboGroupLayout.updateLayout();

        this.scoreText.stringRaw = "+" + this._score;
        this.complimentSprite.spriteFrame = this.complimentSpriteFrames[clamp(this._lineBroke, 0, this.complimentSpriteFrames.length - 1)]
            ? this.complimentSpriteFrames[clamp(this._lineBroke, 0, this.complimentSpriteFrames.length - 1)] : null;

        this.node.worldPosition = where.clone();

        this.animateComboShow();
    }

    public completeShowing()
    {
        // TODO: Clean animation

        // TODO: put elsewhere
       // this.scoreGroup.active = false;

        if (this.manager)
        {
            this.manager.returnScoreFloatup(this);
        }
    }

    private animateComboShow()
    {   
        var a =  this.TweenComboStart(this.comboGroup);
        a.start();
        // TODO: Anim for COMBO show
        setTimeout(() => this.animateComboStay(), this.comboInAnimTime * 1000);
    }

    private animateComboStay()
    {
        // TODO: put elsewhere
      //  this.comboGroup.active = true;
        this.starComboVFX.requestPlayDefaultClip();
        
        // TODO: Anim for COMBO staying on screen
        setTimeout(() => this.animateComboHide(), this.comboStayTime * 1000);
    }

    private animateComboHide()
    {
       var a= this.TweenComboEnd(this.comboGroup);
       a.start();
        // TODO: Anim for COMBO hide
        setTimeout(() => this.animateScoreShow(), this.comboOutAnimTime * 1000);
    }

    private animateScoreShow()
    {
        // TODO: put elsewhere
      //  this.comboGroup.active = false;
        var a=  this.TweenComboStart(this.scoreGroup);
        a.start();

        // TODO: Anim for SCORE show
        setTimeout(() => this.animateScoreStay(), this.scoreInAnimTime * 1000);
    }

    private animateScoreStay()
    {
        // TODO: put elsewhere
      //  this.scoreGroup.active = true;

        // TODO: Anim for SCORE staying on screen
        setTimeout(() => this.animateScoreHide(), this.comboStayTime * 1000);
    }

    private animateScoreHide()
    {
        var a=  this.TweenComboEnd(this.scoreGroup);
        a.start();
        // TODO: Anim for SCORE hiding on screen
        setTimeout(() => this.completeShowing(), this.comboStayTime * 1000);
    }
   

    private TweenComboStart(target:Node):Tween<Node>
    {
        var a= tween(target).to(this.comboInAnimTime,{scale:new Vec3(1,1,1)},{easing:"backOut"});
        return a;
     
    }
    private TweenComboEnd(target:Node):Tween<Node>
    {
        var a= tween(target).to(this.comboOutAnimTime,{scale:new Vec3(0,0,1)},{easing:'backIn'});
        return a;
     
    }
}

