import { _decorator, Component, Enum } from 'cc';
import { GamePopupCode } from './GamePopupCode';
import { MainGameManager } from '../../MainGame/MainGameManager';

const { ccclass, property } = _decorator;

@ccclass("MainGamePopupEventRaiser")
export class MainGamePopupEventRaiser extends Component
{
    @property({ type: Enum(GamePopupCode) })
    private popupToCall: GamePopupCode;

    public showPopup()
    {
        if (MainGameManager.instance.mainGameUI)
        {
            MainGameManager.instance.mainGameUI.getPopupManager().showPopUp(this.popupToCall);
        }
    }

    public getPopup()
    {
        if (MainGameManager.instance.mainGameUI)
        {
            return MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(this.popupToCall);
        }
    }

    public setPopupCode(newCode: GamePopupCode){
        this.popupToCall = newCode;
    }

    public getPopupCode(){
        return this.popupToCall;
    }
}