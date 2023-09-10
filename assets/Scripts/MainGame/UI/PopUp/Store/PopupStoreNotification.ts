import { _decorator, Component, Label, log, Node, RichText, Sprite, SpriteFrame } from 'cc';
import { LocalizedLabel } from '../../../../Common/LocalizedLabel';
import { UIButton } from '../../../../Common/UI/UIButton';
import { PopupBase } from '../../../../Common/UI/PopupBase';
import { Currency, FISH_CURRENCY, formatCurrencyNumber, HARD_CURRENCY, SOFT_CURRENCY } from '../../../../PlayerData/Currency';
import { PopUpStore } from './PopUpStore';
import { MainGamePopupEventRaiser } from '../../../../Common/UI/MainGamePopupEventRaiser';
import { getPlayerDataManager } from '../../../Managers/ManagerUtilities';
import { MainGameManager } from '../../../MainGameManager';
import { GamePopupCode } from '../../../../Common/UI/GamePopupCode';
const { ccclass, property } = _decorator;

@ccclass('PopupStoreNotification')
export class PopupStoreNotification extends PopupBase {
    @property(LocalizedLabel)
    private titleText : LocalizedLabel = null;

    @property(RichText)
    private gemNeeded : RichText = null;

    @property(LocalizedLabel)
    private notEnoughLLb : LocalizedLabel = null;

    @property(Sprite)
    private currencyBlock : Sprite = null;

    @property(LocalizedLabel)
    private getMoreLlb : LocalizedLabel = null;


    @property(SpriteFrame)
    private coin: SpriteFrame = null;

    @property(SpriteFrame)
    private fish : SpriteFrame = null;

    @property(SpriteFrame)
    private gem: SpriteFrame = null;

    private _currencyMissed : Currency = null;
    private _hardCurrencyNeeded : Currency = null;

    public setMissedCurrencyType(type : Currency){
        this._currencyMissed = type;
        this.titleText.stringKey = `STR_INSUFFICIENT_TITLE`;
        this.titleText.setParams(["type",type.nameString]);
        this.notEnoughLLb.stringKey = `STR_INSUFFICIENT_DESCRIBE`;
        this.notEnoughLLb.setParams(["type",type.nameString]);
        if(type.nameString === FISH_CURRENCY){
            this.currencyBlock.spriteFrame = this.fish;
        }
        else if(type.nameString === SOFT_CURRENCY){
            this.currencyBlock.spriteFrame = this.coin;
        }
        else if(type.nameString === HARD_CURRENCY){
            this.currencyBlock.spriteFrame = this.gem;
        }
    }

    protected onShowStart(): void {
        this._hardCurrencyNeeded = MainGameManager.instance.resourceManager.convertToGemUsingRate(this._currencyMissed);
        this.gemNeeded.string = `<color=#dd3131><img src="gem"/> ${formatCurrencyNumber(this._hardCurrencyNeeded.amount)}</color>`;
        this.getMoreLlb.stringRaw = `<color=#23758d><img src="${this._currencyMissed.nameString}"/> + ${formatCurrencyNumber(this._currencyMissed.amount)}</color>`;
    }

    public gotoConvertTab(){
        (MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_STORE) as PopUpStore).onClickTab(3);
    }

    public gotoGemTab(){
        if(getPlayerDataManager().checkBalance(this._hardCurrencyNeeded)){
            getPlayerDataManager().addCurrency(this._currencyMissed);
            getPlayerDataManager().subtractCurrency(this._hardCurrencyNeeded);
        }else{
            (MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_STORE) as PopUpStore).onClickTab(2);
        }
        
    }


}

