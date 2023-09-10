import { _decorator, CCInteger, Component, instantiate, Layout, Node, Prefab, SpriteFrame } from 'cc';
import { MainGameManager } from '../MainGameManager';
import { InventoryPopoutFacilityItem } from './InventoryPopoutFacilityItem';
import { InventoryPopup } from './InventoryPopup';
import { UIButton } from '../../Common/UI/UIButton';
const { ccclass, property } = _decorator;

@ccclass('InventoryFacilityScreen')
export class InventoryFacilityScreen extends Component
{
    @property({ type: [Node] })
    private pages: Node[] = [];
    @property({type: CCInteger})
    private pageCapacity: number = 12;

    private _allItems: InventoryPopoutFacilityItem[] = [];

    private _isActive: boolean = false;

    private _placeIndex: number = null;
    private _selected: string = null;

    private _parentPopup: InventoryPopup = null;

    protected onLoad(): void
    {
        this._allItems = [];

        for (let page of this.pages)
        {
            for (let child of page.children)
            {
                if (child.getComponent(InventoryPopoutFacilityItem))
                {
                    let item = child.getComponent(InventoryPopoutFacilityItem);
                    this._allItems.push(item);

                    item.setFacilityScreen(this);
                }
            }
        }
    }

    public onShowStart()
    {
        this._isActive = true;

        // Get facility ids
        let idAndCounts = MainGameManager.instance.playerDataManager.getAllAvailablePlayerFacilities();

        for (let i = 0; i < this._allItems.length; ++i)
        {
            if (idAndCounts[i] === undefined)
            {
                // Set as empty
                this._allItems[i].setAsEmpty();
            }
            else
            {
                let [id, count] = idAndCounts[i];

                let sprite: SpriteFrame = MainGameManager.instance.resourceManager.getFacilityUISprite(id);

                // Set as id
                if (id)
                {
                    this._allItems[i].setItem(id, sprite, count);
                    this._allItems[i].setFaded(id !== this._selected);

                    if (id === this._selected)
                    {
                        this._allItems[i].markSelected();
                    }
                }
            }
        }
    }

    public onShowEnd()
    {
        for (let item of this._allItems)
        {
            if (!item.isEmpty && item.count > 0)
            {
                item.setFaded(false);
            }
        }
    }

    public onHideEnd()
    {
        this._isActive = false;

        this._placeIndex = null;
    }


    public setPlaceIndex(placeIndex: number)
    {
        this._placeIndex = placeIndex;
    }

    public setSelected(selected: string)
    {
        this._selected = selected;
    }

    public setInventoryPopup(obj: InventoryPopup)
    {
        this._parentPopup = obj;
    }

    public onItemClick(id: string)
    {
        if (this._placeIndex !== null)
        {
            MainGameManager.instance.parkManager.getFacility(this._placeIndex).setPreviewFor(id, true);
        }

        for (let item of this._allItems)
        {
            if (!item.isEmpty)
            {
                item.setFaded(item.facilityId !== id);
            }
        }

        this._parentPopup.hide();
    }
}