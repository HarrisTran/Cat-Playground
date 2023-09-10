import { _decorator, Component, log, Node, RenderTexture } from 'cc';
import { MainGameManager } from '../../../MainGameManager';
import { GamePopupCode } from '../../../../Common/UI/GamePopupCode';
import { PopUpCustomerBook } from './PopUpCustomerBook';
const { ccclass, property } = _decorator;

@ccclass('ItemCustomerBook')
export class ItemCustomerBook extends Component {
    @property(Node)
    private anomonyusCat : Node = null;

    private _catId : string;
    private _isHide : boolean;

    setCat(id: string, show : boolean){
        this._catId = id;
        this._isHide = !show;
        this.anomonyusCat.active = this._isHide;
    }

    getCatData(){
        return MainGameManager.instance.resourceManager.getCatData(this._catId);
    }

    public onClickItem(){
        if(this._isHide) return;
        let popup = MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_CUSTOMER_BOOK) as PopUpCustomerBook;
        popup.getDetailCat(this.getCatData());
    }

    

    
}

