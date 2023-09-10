import { _decorator, Button, instantiate, log, Node, PageView, Prefab, tween, v3 } from 'cc';
import { PopupBase } from '../../../../Common/UI/PopupBase';
import { TutorialPropagator } from '../../../../Tutorial/TutorialPropagator';
import { FacilityData } from '../../../Facilities/FacilityData';
import { MainGameManager } from '../../../MainGameManager';
import { GameSound } from '../../../Managers/AudioManager';
import { FacilityItem } from './FacilityItem';
import { PuzzleToolItem } from './PuzzleToolItem';
const { ccclass, property } = _decorator;

export interface IPopupStore extends PopUpStore { }

@ccclass('PopUpStore')
export class PopUpStore extends PopupBase {
    @property([Button])
    tabButtons: Button[] = [];

    @property([Node])
    tabPages: Node[] = [];

    @property(Prefab)
    PrefabFacilityItem: Prefab = null;

    @property(Prefab)
    PrefabPage: Prefab = null;

    private _itemInPage: Map<string, FacilityData>[] = [];

    private _onClickingTab: boolean = false;

    private _isFromInventory: boolean = false;

    public idFromMission: string | null;

    protected onLoad(): void {
        super.onLoad();
        super.resizeScreen();
        this.initializationPrefabs();

        this.tabButtons.forEach((button, idx) => {
            button.node.on('click', () => {
                this.onClickTab(idx);
            })
        })
        this.onClickTab(0);
    }

    protected initializationPrefabs() {
        for (let facility of Array.from(MainGameManager.instance.storeManager.getFacilities())) {
            let last = this._itemInPage[this._itemInPage.length - 1];
            if (last && last.size < 6) {
                last.set(facility[0], facility[1]);
            } else {
                this._itemInPage.push(new Map<string, FacilityData>([facility]));
            }
        };

        // init the facility tab
        this._itemInPage.forEach(item => {
            let pageNode = instantiate(this.PrefabPage);
            for (let [id, _] of item) {
                let ItemPf = instantiate(this.PrefabFacilityItem);
                if (id === "Toy_1" && MainGameManager.instance.tutorialManager.isPlayingTutorial) {
                    let compo = ItemPf.addComponent(TutorialPropagator);
                    compo.identifier = "TOY_1";
                }
                ItemPf.getComponent(FacilityItem).setData(id);
                pageNode.addChild(ItemPf);
            }
            this.tabPages[0].getComponent(PageView).content.addChild(pageNode);
        });
    }

    // if currency updated, facility tab will refresh
    public refreshFacilityTab() {
        this.tabPages[0].getComponent(PageView).content.children.forEach(page => {
            page.children.forEach(node => {
                let item = node.getComponent(FacilityItem);
                item.updatePurchaseStatus();
                item.unMarkNotification();
                if (this.idFromMission && this.idFromMission === item.fid) {
                    item.markNotification();
                }
            })
        })
    }

    private refreshBoosterTab() {
        this.tabPages[1].children.forEach(node => {
            node.getComponent(PuzzleToolItem).updatePurchaseStatus();
        })
    }

    protected onShowStart() {
        super.onShowStart();

        this.refreshFacilityTab();
        this.refreshBoosterTab();
        //this.initializationPrefabs();
        MainGameManager.instance.audioManager.playSfx(GameSound.UI_OPENSTORE);

    }

    private _inventoryCallback: () => void;
    public showFromInventory(callback: () => void) {
        this._inventoryCallback = callback;
        this.show();
        this.isFromInventory = true;
    }

    get isFromInventory() {
        return this._isFromInventory;
    }

    set isFromInventory(fromInventory: boolean) {
        this._isFromInventory = fromInventory;
    }

    protected onShowEnd() {
        super.onShowEnd();
    }

    protected onHideStart() {
        super.onHideStart();

        if (this._isFromInventory && this._inventoryCallback) {
            this._inventoryCallback();
        }
    }

    protected onHideEnd() {
        super.onHideEnd();
    }

    public onClickTab(id: number) {
        if (this._onClickingTab) return;
        this.tabPages.map(node => node.active = false);
        this.tabPages[id].active = true;

        this.tabButtons.forEach((button, index) => {
            button.node.setPosition(v3(button.node.getPosition().x, 370));
            if (index === id) {
                tween(button.node)
                    .call(() => this._onClickingTab = true)
                    .to(0.25, { position: v3(button.node.getPosition().x, 330) }, { easing: "backOut" })
                    .call(() => this._onClickingTab = false)
                    .start();
            }

        })
    }

    protected update(dt: number): void {
        this.refreshFacilityTab();
        this.refreshBoosterTab();
    }

}

