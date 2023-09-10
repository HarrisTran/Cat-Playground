import { _decorator, CCInteger, CCString, color, Component, Enum, Light, log, Node, RichText, Sprite, SpriteFrame } from 'cc';
import { MainGamePopupEventRaiser } from '../../../../Common/UI/MainGamePopupEventRaiser';
import { UIButton } from '../../../../Common/UI/UIButton';
import { Currency } from '../../../../PlayerData/Currency';
import { getPlayerDataManager } from '../../../Managers/ManagerUtilities';
import { PopupStorePurchase } from './PopupStorePurchase';
import { GamePopupCode } from '../../../../Common/UI/GamePopupCode';
import { PopupStoreNotification } from './PopupStoreNotification';
const { ccclass, property } = _decorator;

@ccclass('PuzzleToolItem')
export class PuzzleToolItem extends Component {

    @property(Sprite)
    private spriteBg : Sprite = null;

    @property(SpriteFrame)
    private imgItem: SpriteFrame = null;

    @property(CCString)
    private nameItem : string = "";

    @property(CCInteger)
    private multiple: number = 0;

    @property(CCInteger)
    private price: number = 0;

    @property(UIButton)
    private priceButton: UIButton = null;

    private _currency : Currency;

    public updatePurchaseStatus(){
        this._currency = Currency.getHardCurrency(this.price);
        const checkBalanceHard = getPlayerDataManager().checkBalance(this._currency);
        this.priceButton.setLabel(this._currency.toString(!checkBalanceHard));

        if(checkBalanceHard){
            this.priceButton.getComponent(MainGamePopupEventRaiser).setPopupCode(GamePopupCode.POPUP_STORE_PURCHASE);
            this.setLightingMode();
        }else{
            this.priceButton.getComponent(MainGamePopupEventRaiser).setPopupCode(GamePopupCode.POPUP_STORE_NOTIFICATION);
            this.setDarkMode();
        }
    }


    private setDataForPopup(){
        let popupRaiser = this.priceButton.getComponent(MainGamePopupEventRaiser);

        if(popupRaiser.getPopupCode() === GamePopupCode.POPUP_STORE_NOTIFICATION){
            let popupIsComing = popupRaiser.getPopup() as PopupStoreNotification;
            popupIsComing.setMissedCurrencyType(this._currency);
        }

        if (popupRaiser.getPopupCode() === GamePopupCode.POPUP_STORE_PURCHASE) {
            let popupIsComing = popupRaiser.getPopup() as PopupStorePurchase;
            popupIsComing.setUpData
                (
                    this.nameItem,
                    this.nameItem,
                    this.imgItem,
                    [undefined, undefined, this._currency],
                    this.multiple,
                    2 // TODO
                );
            popupIsComing.setBoosterTransaction();
        }
        
    }
    private setLightingMode(){
        this.priceButton.getComponent(Sprite).color = LIGHTING_MODE;
        this.spriteBg.color = LIGHTING_MODE;
        this.spriteBg.getComponentInChildren(Sprite).color = LIGHTING_MODE;
    }

    private setDarkMode(){
        this.priceButton.getComponent(Sprite).color = DARK_MODE;
        this.spriteBg.color = DARK_MODE;
        this.spriteBg.getComponentInChildren(Sprite).color = DARK_MODE;
    }
}

const DARK_MODE = color('#999696');
const LIGHTING_MODE = color('#FFFFFF');