import { _decorator, CCString, Component, Enum, log, Node, SpriteFrame } from 'cc';
import { MainGamePopupEventRaiser } from '../../../../Common/UI/MainGamePopupEventRaiser';
import { UIButton } from '../../../../Common/UI/UIButton';
import { Currency } from '../../../../PlayerData/Currency';
import { PopupStorePurchase } from './PopupStorePurchase';
const { ccclass, property } = _decorator;
@ccclass('ExchangeItem')
export class ExchangeItem extends Component {
    @property(CCString)
    private nameItem : string = "";

    @property(SpriteFrame)
    private exchangeSF: SpriteFrame = null;

    @property(UIButton)
    private priceButton: UIButton = null;

    private _currency : Currency;

    private _exchangeId: string;

    protected onLoad(): void {
        this._exchangeId = this.nameItem;
        this._currency = Currency.getHardCurrency(1);
        this.priceButton.setLabel("EXCHANGE");
    }

    public setDataPurchasePopup(){
        let popupIsComing = this.priceButton.getComponent(MainGamePopupEventRaiser).getPopup() as PopupStorePurchase;
        popupIsComing.setUpData(this._exchangeId,this.nameItem,this.exchangeSF,[undefined,undefined,this._currency],1,undefined);
        popupIsComing.setExchangeTransaction();
    }
}

