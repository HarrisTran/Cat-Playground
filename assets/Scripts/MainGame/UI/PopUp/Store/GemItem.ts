import { _decorator, CCFloat, CCInteger, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { MainGamePopupEventRaiser } from '../../../../Common/UI/MainGamePopupEventRaiser';
import { UIButton } from '../../../../Common/UI/UIButton';
import { Currency, formatCurrencyNumber } from '../../../../PlayerData/Currency';
import { PopupStoreConfirm } from './PopupStoreConfirm';
import { getPlayerDataManager } from '../../../Managers/ManagerUtilities';

const { ccclass, property } = _decorator;



@ccclass('GemItem')
export class GemItem extends Component {

    @property(SpriteFrame)
    private img: SpriteFrame = null;

    @property(CCInteger)
    private count: number = 0;

    @property(CCFloat)
    private price : number = 0;


    @property(UIButton)
    private priceButton: UIButton = null;

    protected onLoad(): void {
        this.priceButton.setLabel(`${formatCurrencyNumber(this.price)}$`);
    }

    public setDataConfirmPopup(){
        let popupIsComing = this.priceButton.getComponent(MainGamePopupEventRaiser).getPopup() as PopupStoreConfirm;
        popupIsComing.setUpData("Ruby", { img: this.img, quantity: this.count }, undefined, undefined);
    }

    private buyGem(){
        getPlayerDataManager().addCurrency(Currency.getHardCurrency(this.count));
    }

}

