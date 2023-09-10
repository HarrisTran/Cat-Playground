import { MissingScript, _decorator } from "cc";
import { PopupBase } from "../../../Common/UI/PopupBase";
import { MainGameManager } from "../../MainGameManager";
import { UIButtonCurrency } from "../../../Common/UI/UIButtonCurrency";
import { Currency } from "../../../PlayerData/Currency";
import { GameEvent } from "../../Managers/GameEventManager";
import { MISSION_ARG_TYPE_ADD, MissionManager } from "../../Managers/MissionManager";

const { ccclass, property } = _decorator;

@ccclass('PopUpBoost')
export class PopUpBoost extends PopupBase
{
    @property(UIButtonCurrency)
    private button: UIButtonCurrency;

    private _boostPrice: Currency;

    protected onLoad(): void
    {
        super.onLoad();

        this._boostPrice = Currency.getHardCurrency(5);
    }

    protected onShowStart(): void
    {
        super.onShowStart();
        this.button.setValue(this._boostPrice);
    }

    public onBoostByAd()
    {
        MainGameManager.instance.adManager.requestAd(false, () =>
        {
            this.boostHelper();
            this.hide();
            let a = MissionManager.getBaseMissionArg();
            a.dog = [MISSION_ARG_TYPE_ADD, 1];
            MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_WATCH_AD, a);
        }, null);
    }

    public onBoostByGem()
    {
        if (MainGameManager.instance.playerDataManager.subtractCurrency(this._boostPrice))
        {
            this.boostHelper();
            this.hide();
        }
    }

    private boostHelper()
    {
        MainGameManager.instance.catManager.requestBoostDog();
    }
}

