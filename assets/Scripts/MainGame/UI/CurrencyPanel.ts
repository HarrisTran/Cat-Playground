import { _decorator, CCFloat, CCString, Component, log, Node, Tween, tween, Vec3 } from 'cc';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { FISH_CURRENCY, formatCurrencyNumber, HARD_CURRENCY } from '../../PlayerData/Currency';
import { GamePopupCode } from '../../Common/UI/GamePopupCode';
import { MainGameManager } from '../MainGameManager';
import { PopUpStore } from './PopUp/Store/PopUpStore';
const { ccclass, property } = _decorator;

@ccclass('CurrencyPanel')
export class CurrencyPanel extends Component {
    
    @property({ group: { name: "Params", id: "2", displayOrder: 2 }, type: CCString })
    private type: string;
    @property({ group: { name: "Params", id: "2", displayOrder: 2 }, type: Node })
    private iconNode: Node;
    @property({ group: { name: "Params", id: "2", displayOrder: 2 }, type: LocalizedLabel })
    private valueText: LocalizedLabel;
    @property({ group: { name: "Params", id: "2", displayOrder: 2 }, type: CCFloat })
    private updateScoreSpeed: number = 0.15;
    @property({ group: { name: "Params", id: "2", displayOrder: 2 }, type: CCFloat })
    private updateScoreTime: number = 0.75;

    private _actualValue: number = 0;
    private _activeValue: number = 0;
    private _updateRate: number = 0;
    private _updateValue: boolean = false;
    private _updateTimer: number = 0;

    public get currencyType(): string
    {
        return this.type;
    }

    public get iconPosition(): Vec3
    {
        return this.iconNode.worldPosition;
    }

    protected update(deltaTime: number)
    {
        if (this._updateValue)
        {
            this._updateTimer -= deltaTime;

            if (this._updateTimer < 0)
            {
                this._activeValue += this._updateRate;

                this._updateTimer += this.updateScoreSpeed;
            }

            if ((this._updateRate > 0 && this._activeValue >= this._actualValue) ||
                (this._updateRate < 0 && this._activeValue <= this._actualValue))
            {
                this._activeValue = this._actualValue;
                this._updateValue = false;
            }

            this.setValueHelper(this._activeValue);
        }
    }

    public setValue(amount: number)
    {
        if (amount === this._actualValue) return;

        this._actualValue = amount;
        if (this._actualValue > this._activeValue)
        {
            this._updateRate = Math.ceil((this._actualValue - this._activeValue) / (this.updateScoreTime / this.updateScoreSpeed));
        }
        else
        {
            this._updateRate = -Math.ceil((this._activeValue - this._actualValue) / (this.updateScoreTime / this.updateScoreSpeed));
        }
        
        this._updateValue = true;
    }

    public setValueWithoutAnimation(amount: number)
    {
        this._actualValue = amount;
        this._activeValue = amount;
        this.setValueHelper(amount);
    }

    public setValueSubscriber(nameString: string, lastAmount: number, currentAmount: number)
    {
        if (this.type === nameString)
        {
            this.setValue(currentAmount);
        }
    }

    private onRequestAddCurrency()
    {
        if (this.currencyType === HARD_CURRENCY)
        {
            let store = MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_STORE) as PopUpStore;
            store.show();
            store.onClickTab(2);
        }
    }

    private setValueHelper(value: number)
    {
        this.valueText.stringRaw = formatCurrencyNumber(value);
    }
}

