import { _decorator, Component, Game } from 'cc';
import { GamePopupCode } from '../../Common/UI/GamePopupCode';
import { PopupBase } from '../../Common/UI/PopupBase';
import { MainGameManager } from '../MainGameManager';


const { ccclass, property } = _decorator;


@ccclass('PopUpManager')
export class PopUpManager extends Component
{
    @property({ type: PopupBase })
    private popupArray: PopupBase[] = [];
    @property({ type: PopupBase })
    public inventory: PopupBase;

    private _popupMap: Map<GamePopupCode, PopupBase>;

    public initialize()
    {
        this._popupMap = new Map<GamePopupCode, PopupBase>();
        for (let popup of this.popupArray)
        {
            this._popupMap.set(popup.getPopupCode(), popup);
            popup.hideImmediately();
        }
    }

    protected start()
    {
        
    }

    protected update(deltaTime: number)
    {

    }

    public showPopUp(code: GamePopupCode)
    {
        if (code == GamePopupCode.POPUP_NOT_MANAGED || 
            code == GamePopupCode.POPUP_SETTING || 
            code == GamePopupCode.POPUP_MISSON || 
            code == GamePopupCode.POPUP_STORE || 
            code == GamePopupCode.POPUP_STORE_CONFIRM || 
            code == GamePopupCode.POPUP_STORE_PURCHASE ||
            code == GamePopupCode.POPUP_BOOST ||
            code == GamePopupCode.POPUP_TIP ||
            code == GamePopupCode.POPUP_STORE_NOTIFICATION || 
            code == GamePopupCode.POPUP_DAILY || 
            code == GamePopupCode.POPUP_ADS ||
            code == GamePopupCode.POPUP_CUSTOMER_BOOK
        )
            this._popupMap.get(code).show();
        else
            this.showComingSoonPopup();
    }

    public getPopupNode(code : GamePopupCode){
        return this._popupMap.get(code);
    }


    public hidePopUp(code: GamePopupCode)
    {
        this._popupMap.get(code).hide();
    }

    public showComingSoonPopup()
    {
        MainGameManager.instance.showComingSoonPopup();
    }
}

