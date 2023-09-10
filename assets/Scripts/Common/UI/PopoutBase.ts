import { _decorator, Node } from 'cc';
import { PopupBase } from './PopupBase';
const { ccclass, property } = _decorator;

/**
 * Component for a popout (which is like a popup, but without the background
 * and has a different type of animation, in which it seems they "pop"
 * from a point)
 *
 * - Supports animation hide() and show();
 */
@ccclass('PopOutBase')
export class PopOutBase extends PopupBase
{
    @property({ group: { name: "Popout Animation Params", id: "2", displayOrder: 2 }, type: Node })
    protected popPoint: Node;
    @property({ group: { name: "Popout Animation Params", id: "2", displayOrder: 2 }, type: Node })
    protected panelToAnimate: Node;
    @property({ group: { name: "Popout Animation Params", id: "2", displayOrder: 2 }, type: Node })
    protected contentToShow: Node;


    protected onLoad(): void
    {
        super.onLoad();
    }

    protected start(): void
    {
        this.hideImmediately();
    }


    // Animation

    // protected animateShow()
    // {
    //     // TODO: Animate, overide that of PopupBase
    //     this.onShowStart();

    //     // TODO: Animate
    //     this.node.active = true;

    //     // TEMP: Move to timing end
    //     this.onShowEnd();

    //     this._isShown = true;
    // }

    // protected animateHide()
    // {
    //     // TODO: Animate, overide that of PopupBase
    //     this.onHideStart();

    //     // TODO: Animate
    //     this.node.active = false;

    //     // TEMP: Move to timing end
    //     this.onHideEnd();

    //     this._isShown = false;
    // }
}