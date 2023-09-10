import { _decorator, Label, log, Node, Sprite, SpriteFrame } from 'cc';
import { LocalizedLabel } from '../../../../Common/LocalizedLabel';
import { MainGamePopupEventRaiser } from '../../../../Common/UI/MainGamePopupEventRaiser';
import { PopupBase } from '../../../../Common/UI/PopupBase';
import { UIButton } from '../../../../Common/UI/UIButton';
import { Currency } from '../../../../PlayerData/Currency';
import { Booster } from '../../../../Puzzle/UI/Booster';
import { getPlayerDataManager } from '../../../Managers/ManagerUtilities';
import { PopupStoreConfirm } from './PopupStoreConfirm';
import { MainGameManager } from '../../../MainGameManager';
import { GamePopupCode } from '../../../../Common/UI/GamePopupCode';
const { ccclass, property } = _decorator;
export const TypeOfTransaction = {
    FACILITY_TRANSACTION : "Facility Transaction",
    BOOSTER_TRANSACTION : "Booster Transaction",
    EXCHANGE_TRANSACTION : "Exchange Transaction"
}
@ccclass('PopupStorePurchase')
export class PopupStorePurchase extends PopupBase {

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
    private nameLlb: LocalizedLabel;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Sprite })
    private itemImage: Sprite;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
    private ownedLb: LocalizedLabel ;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Label })
    private multiplierLb: Label ;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Label })
    private counterLb: Label ;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: UIButton })
    private buyButton: UIButton ;

    private _fid: string ;

    private _numberOfItem: number = 1;

    private _multiplier: number;

    private _price : [Currency,Currency,Currency];

    private _typeTransaction: string;

    protected onLoad(): void 
    {
        super.onLoad();
    }

    public setUpData(fid: string, name: string, toy : SpriteFrame, price: [Currency,Currency,Currency], multiplier: number, owned?: number)
    {
        this._fid = fid;
        this._multiplier = multiplier;
        this._price = price;

        this.nameLlb.stringKey = name;
        this.itemImage.spriteFrame = toy;
        this.buyButton.setLabel(price.filter(arg => arg instanceof Currency).join('+'));
        this.multiplierLb.string = multiplier===1 ? `` : `x ${multiplier}`;
        this.ownedLb.node.active = owned !== undefined;
        if(owned !== undefined){
            this.ownedLb.stringKey = `STR_OWNED_ITEM_STORE`;
            this.ownedLb.setParams(["owned",owned.toString()]);
        }
        
    }

    public checkBuyableAfterQuantity(){
        this.buyButton.setLabel(this._price.filter(i => i instanceof Currency).map(i => i.multiply(this._numberOfItem)).join('+'));
        if (this._price.filter(i => i instanceof Currency).every(i => getPlayerDataManager().checkBalance(i.multiply(this._numberOfItem)))){
            this.buyButton.interactable = true;
        }else{
            this.buyButton.interactable = false;
        }
    }


    public setDataConfirmPopup(){
        let popupIsComing = this.buyButton.getComponent(MainGamePopupEventRaiser).getPopup() as PopupStoreConfirm;
        popupIsComing.setFacilityIdOnly(this._fid);
        popupIsComing.setUpData(
            this.nameLlb.stringKey,
            undefined,
            { 
                img: this.itemImage.spriteFrame, 
                quantity: this._numberOfItem * this._multiplier 
            },
            this.getDescribe(this._fid)
        );

        switch (this._typeTransaction) {
            case TypeOfTransaction.FACILITY_TRANSACTION:
                this.confirmFacilitiesTransaction();
                break;
            case TypeOfTransaction.BOOSTER_TRANSACTION:
                this.confirmBoosterTransaction();
                break;
            case TypeOfTransaction.EXCHANGE_TRANSACTION:
                this.confirmExchangeTransaction();
                break;
            default:
                log("Cannot find TypeTransaction");
                break;
        }
    
    }

    public getDescribe(id: string): string {
        // Facilities
        if(id.startsWith("Toy")){
            return MainGameManager.instance.resourceManager.getFacilityData(id).description;
        }
        // Booster
        else{
            if(id === "Hammer"){
                return "STR_HAMMER_DESCRIPTION";
            }
            else if(id === "Rotate"){
                return "STR_ROTATE_DESCRIPTION";
            }
            else if(id === "Renew"){
                return "STR_RENEW_DESCRIPTION";
            }
            else{
                return "";
            }
        }
    }

    public confirmFacilitiesTransaction(){
        const quantity = this._numberOfItem;
        if(this._price.filter(i => i instanceof Currency).every(i => getPlayerDataManager().checkBalance(i.multiply(quantity)))){
            getPlayerDataManager().subtractCurrency(this._price[0].multiply(quantity));
            getPlayerDataManager().subtractCurrency(this._price[1].multiply(quantity));
            getPlayerDataManager().addFacilityToInventory(this._fid as string, quantity);
        }
    }

    public confirmBoosterTransaction() {
        if (this._price.filter(i => i instanceof Currency).every(i => getPlayerDataManager().checkBalance(i.multiply(this._numberOfItem)))) {
            getPlayerDataManager().subtractCurrency(this._price[2].multiply(this._numberOfItem));
            if (this._fid === "Hammer") {
                getPlayerDataManager().addPuzzleBooster(Booster.BREAK, this._numberOfItem * this._multiplier);
            }
            if (this._fid === "Rotate") {
                getPlayerDataManager().addPuzzleBooster(Booster.ROTATE, this._numberOfItem * this._multiplier);
            }
            if (this._fid === "Renew") {
                getPlayerDataManager().addPuzzleBooster(Booster.RENEW, this._numberOfItem * this._multiplier);
            }
        }
    }

    public confirmExchangeTransaction(){
        const quantity = this._numberOfItem ;
        if(this._price.filter(i => i instanceof Currency).every(i => getPlayerDataManager().checkBalance(i.multiply(quantity)))){
            getPlayerDataManager().subtractCurrency(this._price[2].multiply(quantity));
            if(this._fid === "Coin"){
                getPlayerDataManager().addCurrency(Currency.getSoftCurrency(quantity));
            }
            if(this._fid === "Fish"){
                getPlayerDataManager().addCurrency(Currency.getFishCurrency(quantity));
            }
        }
    }

    private increaseNumber(){
        this._numberOfItem ++;
        this.counterLb.string = this._numberOfItem.toString();
    }

    private decreaseNumber(){
        this._numberOfItem --;
        this.counterLb.string = this._numberOfItem.toString();
    }

    public  setFacilityTransaction(){
        this._typeTransaction = TypeOfTransaction.FACILITY_TRANSACTION;
    }

    public  setBoosterTransaction(){
        this._typeTransaction = TypeOfTransaction.BOOSTER_TRANSACTION;
    }

    public  setExchangeTransaction(){
        this._typeTransaction = TypeOfTransaction.EXCHANGE_TRANSACTION;
    }

    protected onShowStart(): void {
        this._numberOfItem = 1;
        this.counterLb.string = this._numberOfItem.toString();
    }

    protected update(dt: number): void {
        
        this.checkBuyableAfterQuantity();
    }

    
}

