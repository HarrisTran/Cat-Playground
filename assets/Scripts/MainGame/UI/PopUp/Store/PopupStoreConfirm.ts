import { _decorator, Component, Game, Label, log, Node, Sprite, SpriteFrame } from 'cc';
import { LocalizedLabel } from '../../../../Common/LocalizedLabel';
import { PopupBase } from '../../../../Common/UI/PopupBase';
import { MainGameManager } from '../../../MainGameManager';
import { GamePopupCode } from '../../../../Common/UI/GamePopupCode';
import { PopUpStore } from './PopUpStore';
const { ccclass, property } = _decorator;

@ccclass('PopupStoreConfirm')
export class PopupStoreConfirm extends PopupBase {
    
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
    private nameLlb: LocalizedLabel;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private panelPattern1: Node;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private panelPattern2: Node;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
    private describeLb: LocalizedLabel;

    private _facilityIdOnly: string;

    protected onLoad(): void {
        super.onLoad();
    }

    public setFacilityIdOnly(id: string){
        this._facilityIdOnly = id;
    }

    public setUpData(
        nameItem: string,
        panelPattern1? : {img: SpriteFrame, quantity: number},
        panelPattern2? : {img: SpriteFrame, quantity: number},
        describe?: string)
    {
        this.nameLlb.stringKey = nameItem;
        this.panelPattern1.active = false;
        this.panelPattern2.active = false;
        this.describeLb.node.active = false;

        if(panelPattern1){
            this.panelPattern1.active = true;
            this.panelPattern1.getComponentInChildren(Sprite).spriteFrame = panelPattern1.img;
            this.panelPattern1.getComponentInChildren(Label).string = "+"+panelPattern1.quantity.toString();
        }

        if(panelPattern2){
            this.panelPattern2.active = true;
            this.panelPattern2.getComponentInChildren(Sprite).spriteFrame = panelPattern2.img;
            this.panelPattern2.getComponentInChildren(Label).string = "x"+panelPattern2.quantity.toString();
        }

        if(describe){
            this.describeLb.node.active = true;
            this.describeLb.stringKey = describe;
        }
    }

    protected onShowStart()
    {
        
    }
    
    protected onShowEnd()
    {
       
    }

    protected onHideStart()
    {
        super.onHideStart();
        MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_STORE_PURCHASE).hideImmediately();
        let storePopup = MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_STORE) as PopUpStore;
        if(storePopup.isFromInventory === true){
            storePopup.hide();
            storePopup.isFromInventory = false;
        }
    }

    protected onHideEnd()
    {
        if(this._facilityIdOnly.startsWith("Toy_")){
            MainGameManager.instance.mainGameUI.activateInventoryModeWithToyPlacement(this._facilityIdOnly);
            MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_STORE).hide();
        }
    }
}

