import { _decorator, Button, Component, Node, Sprite } from 'cc';
import { UIButton } from './UIButton';
import { PopupBase } from './PopupBase';
import { LocalizedLabel } from '../LocalizedLabel';
const { ccclass, property } = _decorator;

export interface IGenericPopup extends GenericPopup { }

/**
 * Component for a GenericPopup that supports:
 *
 * - Setting title (default: required).
 *
 * - Turning on and off X button (default: off).
 *
 * - Setting content text (default: None.)
 *
 * - Up to 3 buttons (default: None.);
 */
@ccclass('GenericPopup')
export class GenericPopup extends PopupBase
{
    @property({ group: { name: "Groups", id: "2", displayOrder: 1 }, type: Node })
    private titleGroup: Node;
    @property({ group: { name: "Groups", id: "2", displayOrder: 1 }, type: Node })
    private contentGroup: Node;
    @property({ group: { name: "Groups", id: "2", displayOrder: 1 }, type: Node })
    private buttonGroup: Node;

    @property({ group: { name: "Components", id: "2", displayOrder: 2 }, type: LocalizedLabel })
    private titleLabel: LocalizedLabel;
    @property({ group: { name: "Components", id: "2", displayOrder: 2 }, type: LocalizedLabel })
    private contentText: LocalizedLabel;

    @property({ group: { name: "Buttons", id: "2", displayOrder: 3 }, type: [UIButton] })
    private buttons: UIButton[] = [];
    @property({ group: { name: "Buttons", id: "2", displayOrder: 3 }, type: UIButton })
    private xButton: UIButton;

    private _buttonCount: number;

    public showCallback: () => void;
    public hideEndCallback: () => void;

    protected onLoad(): void
    {
        this._buttonCount = 0;
        super.onLoad();
    }

    protected onShowEnd(): void
    {
        super.onShowEnd();
        if (this.showCallback)
        {
            this.showCallback();
        }
    }

    protected onHideEnd(): void
    {
        super.onHideEnd();
        if (this.hideEndCallback)
        {
            this.hideEndCallback();
        }

        this.clean();
    }

    /**
     * Set title for the popup.
     * 
     * @param text Text to set as title
     * @returns the current generic popup.
     */
    public setTitle(text: string): GenericPopup
    {
        this.titleLabel.stringKey = text;

        return this;
    }

    /**
     * Set whether to show the X button
     * 
     * @param state whether to show the X button
     * @returns the current generic popup.
     */
    public setXButton(state: boolean): GenericPopup
    {
        this.xButton.node.active = state;

        return this;
    }

    /**
     * Set content text of popup
     * 
     * @param text Text to set
     * @returns the current generic popup.
     */
    public setContentText(text: string): GenericPopup
    {
        this.contentText.stringKey = text;

        this.contentGroup.active = true;
        this.contentText.node.active = true;

        return this;
    }

    /**
     * Add a button to the popup, currenly max is 3.
     * 
     * @param label The label of the button
     * @param onClickCallback The callback to invoke on clicking.
     * @returns the current generic popup.
     */
    public addButton(label: string, onClickCallback: () => void, closePopup: boolean = false, invokeOnCloseOnly = false): GenericPopup
    {
        if (this._buttonCount >= this.buttons.length)
        {
            throw new Error("Cannot add button to popup " + this.node.name + " because the button count exhausted.");
        }

        this.buttons[this._buttonCount].setLabel(label);
        this.buttons[this._buttonCount].setOnClickCallback(() =>
        {
            if (onClickCallback)
            {
                onClickCallback();
            }

            if (closePopup)
            {
                this.hide();
            }
        });

        if (this._buttonCount === 0)
        {
            this.buttonGroup.active = true;
        }

        this.buttons[this._buttonCount].node.active = true;
        this._buttonCount += 1;

        return this;
    }

    private clean()
    {
        this.setTitle("Title")
            .setXButton(false)
            .setContentText("Content");
        
        this.contentGroup.active = false;
        this.contentText.node.active = false;
        for (let button of this.buttons)
        {
            button.clearAllCallbacks();
            button.node.active = false;
        }
        this.buttonGroup.active = false;
        this._buttonCount = 0;
    }


    // Handle popup buttons

    public onClickXButton()
    {
        this.animateHide();
    }
}