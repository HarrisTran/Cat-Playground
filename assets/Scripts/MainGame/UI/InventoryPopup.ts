import { _decorator, Node, PageView, ScrollView, SpriteFrame, Vec3 } from 'cc';
import { UIButton } from '../../Common/UI/UIButton';
import { InventoryFacilityScreen } from './InventoryFacilityScreen';
import { CameraController } from '../CameraController';
import { InventoryDragItem } from './InventoryDragItem';
import { PopupBase } from '../../Common/UI/PopupBase';
import { MainGameManager } from '../MainGameManager';
import { GamePopupCode } from '../../Common/UI/GamePopupCode';
import { IPopupStore } from './PopUp/Store/PopUpStore';
const { ccclass, property } = _decorator;


@ccclass('InventoryPopup')
export class InventoryPopup extends PopupBase
{
    @property(InventoryDragItem)
    private dragItem: InventoryDragItem;
    @property([Node])
    private screens: Node[] = [];
    @property([UIButton])
    private buttons: UIButton[] = [];

    protected onLoad(): void
    {
        super.onLoad();
    }

    protected start(): void
    {
        super.start();
    }

    protected onShowStart(): void
    {
        super.onShowStart();

        this.refreshAllViews();
    }

    protected onShowEnd(): void
    {
        super.onShowEnd();

        this.screens[0].getComponent(InventoryFacilityScreen).onShowEnd();
    }

    protected onHideEnd(): void
    {
        super.onHideEnd();

        this.cleanupAllViews();
    }

    public getDragItem(): InventoryDragItem
    {
        return this.dragItem;
    }

    public setPlaceIndex(placeIndex: number)
    {
        this.screens[0].getComponent(InventoryFacilityScreen).setPlaceIndex(placeIndex);
    }

    public setSelected(selected: string)
    {
        this.screens[0].getComponent(InventoryFacilityScreen).setSelected(selected);
    }

    public showStore()
    {
        let a = MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_STORE).getComponent("PopUpStore") as IPopupStore;
        a.showFromInventory(() => this.refreshAllViews());
    }

    private refreshAllViews()
    {
        this.screens[0].getComponent(InventoryFacilityScreen).setInventoryPopup(this);
        this.screens[0].getComponent(InventoryFacilityScreen).onShowStart();
    }

    private cleanupAllViews()
    {
        this.screens[0].getComponent(InventoryFacilityScreen).setInventoryPopup(null);
        this.screens[0].getComponent(InventoryFacilityScreen).onHideEnd();
    }
}