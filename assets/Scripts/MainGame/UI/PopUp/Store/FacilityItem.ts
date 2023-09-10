import { _decorator, Button, color, Component, EventHandler, instantiate, Label, log, Node, Prefab, RichText, Sprite } from 'cc';
import { UIButton } from '../../../../Common/UI/UIButton';
import { MainGamePopupEventRaiser } from '../../../../Common/UI/MainGamePopupEventRaiser';
import { Currency } from '../../../../PlayerData/Currency';
import { FacilityData } from '../../../Facilities/FacilityData';
import { MainGameManager } from '../../../MainGameManager';
import { getPlayerDataManager } from '../../../Managers/ManagerUtilities';
import { PopupStorePurchase } from './PopupStorePurchase';
import { GamePopupCode } from '../../../../Common/UI/GamePopupCode';
import { PopupStoreNotification } from './PopupStoreNotification';
const { ccclass, property } = _decorator;

@ccclass('FacilityItem')
export class FacilityItem extends Component {

    @property(Sprite)
    private spriteItem: Sprite = null;

    @property(UIButton)
    private priceButton: UIButton = null;

    private _fid: string;

    private _data : FacilityData;

    private _priceCurrency : [Currency,Currency] ;

    protected start(): void {
        this.node.getChildByName("noti").active = false;
    }

    public setData(id: string){
        this._fid = id;
        this._data = MainGameManager.instance.storeManager.getStoreItem(id);
        this.spriteItem.spriteFrame = MainGameManager.instance.resourceManager.getFacilityUISprite(id);
        this._priceCurrency = [this._data.prices[0],Currency.getFishCurrency(this._data.blockRequired)];
        this.updatePurchaseStatus();
    }

    public markNotification(){
        this.node.getChildByName("noti").active = true;
    }

    public unMarkNotification(){
        this.node.getChildByName("noti").active = false;
    }

    public get fid(){
        return this._fid;
    }

    public updatePurchaseStatus(){
        const checkBalanceSoft = getPlayerDataManager().checkBalance(this._priceCurrency[0]);
        const checkBalanceFish = getPlayerDataManager().checkBalance(this._priceCurrency[1]);
        this.priceButton.setLabel(this._priceCurrency[0].toString(!checkBalanceSoft)+"+"+this._priceCurrency[1].toString(!checkBalanceFish));

        
        if(checkBalanceFish && checkBalanceSoft){
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
            let findOutMissedCurrency = this._priceCurrency.find(c => !getPlayerDataManager().checkBalance(c));
            let currencyNeeded = findOutMissedCurrency.clone();
            currencyNeeded.amount = currencyNeeded.amount - getPlayerDataManager().getCurrency(currencyNeeded.nameString);
            popupIsComing.setMissedCurrencyType(currencyNeeded);
        }

        if (popupRaiser.getPopupCode() === GamePopupCode.POPUP_STORE_PURCHASE) {
            let popupIsComing = popupRaiser.getPopup() as PopupStorePurchase;
            popupIsComing.setUpData
                (
                    this._data.id,
                    this._data.nameString,
                    this.spriteItem.spriteFrame,
                    [this._priceCurrency[0], this._priceCurrency[1], undefined],
                    1,
                    getPlayerDataManager().getFacilityTotalCount(this._data.id)
                );
            popupIsComing.setFacilityTransaction();
        }
    }

    private setLightingMode(){
        this.spriteItem.color = LIGHTING_MODE;
        this.spriteItem.node.parent.getComponent(Sprite).color = LIGHTING_MODE;
        this.priceButton.getComponent(Sprite).color = LIGHTING_MODE;
    }

    private setDarkMode(){
        this.spriteItem.color = DARK_MODE;
        this.spriteItem.node.parent.getComponent(Sprite).color = DARK_MODE;
        this.priceButton.getComponent(Sprite).color = DARK_MODE;
    }
}

const DARK_MODE = color('#999696');
const LIGHTING_MODE = color('#FFFFFF');


