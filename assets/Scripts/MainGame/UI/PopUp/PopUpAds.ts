import { _decorator, CCInteger, Component, instantiate, Label, Node, Prefab, Vec3 } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { GamePopupCode } from '../../../Common/UI/GamePopupCode';
import { getPlayerDataManager } from '../../Managers/ManagerUtilities';
import { Currency } from '../../../PlayerData/Currency';
const { ccclass, property } = _decorator;

const currencyValue = {
    hardCurrency: 100,
    softCurrency: 1000,
    fishCurrency: 400
}
@ccclass('PopUpAds')
export class PopUpAds extends PopupBase
{
    @property(Label)
    private hardCurrencyLb: Label;

    @property(Label)
    private softCurrencyLb: Label;

    @property(Label)
    private fishCurrencyLb: Label;

    protected onLoad(): void
    {
        
    }

    protected initializationPrefabs()
    {
       
    }

    protected onShowStart(): void {
        this.hardCurrencyLb.string = currencyValue.hardCurrency.toString();
        this.softCurrencyLb.string = currencyValue.softCurrency.toString();
        this.fishCurrencyLb.string = currencyValue.fishCurrency.toString();
    }

    private onClickAds(){
        getPlayerDataManager().setAdFree();
    }

    private paymentSucceedEvent(){
        getPlayerDataManager().addCurrency(Currency.getHardCurrency(currencyValue.hardCurrency));
        getPlayerDataManager().addCurrency(Currency.getSoftCurrency(currencyValue.softCurrency));
        getPlayerDataManager().addCurrency(Currency.getFishCurrency(currencyValue.fishCurrency));
    }
}

