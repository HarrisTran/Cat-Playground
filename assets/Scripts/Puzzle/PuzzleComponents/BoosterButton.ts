import { _decorator, Button, Component, Node, Sprite } from 'cc';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
const { ccclass, property } = _decorator;

@ccclass('BoosterButton')
export class BoosterButton extends Component
{
    @property(Button)
    private button: Button;
    @property(Sprite)
    public buttonSprite: Sprite;
    @property(Sprite)
    public numbering: Sprite;
    @property(LocalizedLabel)
    private numberingText: LocalizedLabel;

    private _value: number;

    public get interactable(): boolean
    {
        return this.button.interactable;
    }

    public set interactable(value: boolean)
    {
        this.button.interactable = value;
    }

    public setNumbering(value: number)
    {
        this._value = value;

        if (this._value <= 0)
        {
            this.numbering.node.active = false;
        }
        else
        {
            this.numbering.node.active = true;
        }

        this.numberingText.stringRaw = this._value.toString();
    }
}

