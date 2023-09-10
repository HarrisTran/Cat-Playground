import { _decorator, Button, CCFloat, Component, Enum, EventHandler, log, Node, Size, tween, Tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { GamePopupCode } from './GamePopupCode';
import { PlayerInteractable } from '../PlayerInteractable';

const { ccclass, property } = _decorator;

/**
 * Component for a popup, used as base.
 * 
 * - Supports animation hide() and show();
 */
@ccclass('PopupBase')
export class PopupBase extends Component
{
    @property({ group: { name: "Base Popup Components", id: "1", displayOrder: 1 }, type: Node })
    protected background: Node;
    @property({ group: { name: "Base Popup Components", id: "1", displayOrder: 1 }, type: Node })
    protected panel: Node;
    @property({ group: { name: "Base Popup Components", id: "1", displayOrder: 1 }, type: Node })
    protected canvas: Node;

    @property({ group: { name: "Animation Params", id: "1", displayOrder: 2 }, type: CCFloat })
    protected animTime: number = 0.5;

    @property({ group: { name: "Functional params", id: "2", displayOrder: 1 }, type: Enum(GamePopupCode) })
    protected popupCode: GamePopupCode;

    protected _isShown: boolean;
    protected _isTransiting: boolean;

    public getPopupCode(): GamePopupCode
    {
        return this.popupCode;
    }

    protected onLoad(): void
    {
        this._isShown = false;
        this.resizeScreen();
    }

    protected start(): void
    {
        
    }

    protected resizeScreen() {

        if (this.canvas) {
            const width = this.canvas.getComponent(UITransform).contentSize.width;
            const height = this.canvas.getComponent(UITransform).contentSize.height;
            const widthOfPanel = this.panel.getComponent(UITransform).contentSize.width;
            const scale = (width/height)*1920/widthOfPanel;
            if(widthOfPanel > width){
                this.node.setScale(scale,scale,1);
            }
        }
    }


    // Animation

    protected animateShow()
    {
        this.node.active = true;
        this.panel.scale = Vec3.ZERO;
        this.background.getComponent(UIOpacity).opacity = 0;
        this.onShowStart();

        // TODO: Animate
        this.TweenShowScalePopUp(this.panel, this.animTime, 1).start();
        this.TweenShowALphaBG(this.background, this.animTime).start();


        this._isTransiting = true;
        // TEMP: Timing with schedule for now, i'm tired
        this.scheduleOnce(() => 
        {
            this.onShowEnd();
            this._isShown = true;
            this._isTransiting = false;
        }, this.animTime);
    }

    protected animateHide()
    {
        this.onHideStart();

        // TODO: Animate
        this.TweenHideScalePopUp(this.panel, this.animTime, 0).start();
        this.TweenHideALphaBG(this.background, this.animTime).start();

        this._isTransiting = true;
        // TEMP: Timing with schedule for now, i'm tired
        this.scheduleOnce(() => 
        {
            this.onHideEnd();
            this._isShown = false;
            this._isTransiting = false;
            this.node.active = false;
        }, this.animTime);
    }

    protected onShowStart()
    {
        // console.log(this.node.name + " show start");
    }
    
    protected onShowEnd()
    {
        // console.log(this.node.name + " show end");
    }

    protected onHideStart()
    {
        // console.log(this.node.name + " hide start");
    }

    protected onHideEnd()
    {
        // console.log(this.node.name + " hide end");
    }

    /**
     * Show popup
     */
    public show()
    {
        if (this._isShown || this._isTransiting)
            return;
        
        // console.log(this.node.name + " should show");
        this.animateShow();
    }

    /**
     * Hide popup
     */
    public hide()
    {
        if (!this._isShown || this._isTransiting)
            return;
        
        // console.log(this.node.name + " should hide");

        this.animateHide();
    }

    /**
     * Toggle popup
     */
    public toggle()
    {
        if (!this._isShown)
        {
            this.show();
        }
        else
        {
            this.hide();
        }
    }

    public showImmediately()
    {
        this._isShown = true;
        this.node.active = true;
    }

    public hideImmediately()
    {
        this._isShown = false;
        this.node.active = false;
    }


    protected TweenShowScalePopUp(target: Node, time: number, scale: number): Tween<Node>
    {
        let a = tween(target).to(time, { scale: new Vec3(scale, scale, scale) }, { easing: 'backOut' });
        return a;
    }

    protected TweenHideScalePopUp(target: Node, time: number, scale: number): Tween<Node>
    {
        let b = tween(target).to(time, { scale: new Vec3(0, 0, 0) }, { easing: 'backIn' });
        return b;
    }

    protected TweenShowALphaBG(target: Node, time: number): Tween<UIOpacity>
    {
        let b = tween(target.getComponent(UIOpacity)).to(time, { opacity: 255 }, { easing: 'quadOut' });
        return b;
    }

    protected TweenHideALphaBG(target: Node, time: number): Tween<UIOpacity>
    {
        let b = tween(target.getComponent(UIOpacity)).to(time, { opacity: 0 }, { easing: 'quadOut' });
        return b;
    }

    public setUpData(...args: any[]){

    }
}