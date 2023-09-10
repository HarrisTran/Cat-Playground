import { _decorator, CCInteger, Component, Game, log, Node, SpriteFrame, tween, Tween, v3, Vec3 } from 'cc';
import { GameEvent } from '../Managers/GameEventManager';
import { getGameEventManager, getPlayerDataManager } from '../Managers/ManagerUtilities';
import { PopUpManager } from '../Managers/PopUpManager';
import { CurrencyPanel } from './CurrencyPanel';
import { MainGameManager } from '../MainGameManager';
import { InventoryPopup } from './InventoryPopup';
import { UIButton } from '../../Common/UI/UIButton';
import { GameSound } from '../Managers/AudioManager';
import { FacilityData } from '../Facilities/FacilityData';
import { Currency } from '../../PlayerData/Currency';
import { PingIcon } from '../../Others/PingIcon';
import { GamePopupCode } from '../../Common/UI/GamePopupCode';
import { PopUpStore } from './PopUp/Store/PopUpStore';
import { StoreManager } from '../Managers/StoreManager';
const { ccclass, property } = _decorator;

@ccclass('MainGameUI')
export class MainGameUI extends Component
{
    @property([CurrencyPanel])
    private currencyPanels: CurrencyPanel[] = [];
    @property(PopUpManager)
    private popupManager: PopUpManager;
    @property(InventoryPopup)
    private inventoryPopup: InventoryPopup;
    @property(UIButton)
    private inventoryButton: UIButton;
    @property(UIButton)
    private shopButton: UIButton;
    @property(UIButton)
    private missionButton: UIButton;
    @property(UIButton)
    private puzzleButton: UIButton;
    @property(UIButton)
    private dailyCheckinButton: UIButton;
    @property(SpriteFrame)
    private activeInventoryPopupButton: SpriteFrame = null;
    @property(SpriteFrame)
    private deactiveInventoryPopupButton: SpriteFrame = null;

    private _inventoryModeOn: boolean = false;
    private _toyToPlace: string = null;

    public getPopupManager(): PopUpManager
    {
        return this.popupManager;
    }

    public get inventoryModeOn(): boolean
    {
        return this._inventoryModeOn;
    }

    public get inventory(): InventoryPopup
    {
        return this.inventoryPopup;
    }

    public get inventoryModeShouldPlaceImmediately(): boolean
    {
        return this._toyToPlace !== null;
    }

    public get inventoryModeToyToPlace(): string
    {
        return this._toyToPlace;
    }

    protected start(): void
    {
        tween(this.shopButton.node.getChildByName("Ping"))
        .sequence(
            tween().to(0.1,{eulerAngles: v3(0,0,-12)}),
            tween().to(0.1,{eulerAngles: v3(0,0,12)}),
        )
        .repeatForever()
        .start();
    }

    public activate()
    {
        this.inventory.hideImmediately();

        this.subcribeCurrencyPanels();

        this.deactivateInventoryMode();

        if (MainGameManager.instance.missionManager.getIfTabsHasRewards().some(x => x))
        {
            this.pingMissionButton();
        }
        else
        {
            this.unPingMissionButton();
        }

        if(!MainGameManager.instance.playerDataManager.playerGetChecking(true).hasCheckedIn)
        {
            this.pingRewardButton();
        }else{
            this.unPingRewardButton();
        }

        MainGameManager.instance.gameEventManager.on(GameEvent.EVENT_COLLECTED_ALL_COMPLETE_MISSION,this.unPingMissionButton, this);

        MainGameManager.instance.gameEventManager.on(GameEvent.EVENT_COMPLETE_MISSION, this.pingMissionButton, this);

        MainGameManager.instance.gameEventManager.on(GameEvent.EVENT_HAS_DAILYCHECKIN, this.unPingRewardButton,this);
    }

    public deactivate()
    {
        this.unsubscribeCurrencyPanels();

        MainGameManager.instance.gameEventManager.off(GameEvent.EVENT_COLLECTED_ALL_COMPLETE_MISSION, this.unPingMissionButton, this);

        MainGameManager.instance.gameEventManager.off(GameEvent.EVENT_COMPLETE_MISSION, this.pingMissionButton, this);

        MainGameManager.instance.gameEventManager.off(GameEvent.EVENT_HAS_DAILYCHECKIN, this.unPingRewardButton,this);

    }

    private pingMissionButton()
    {
        let pingNode = this.missionButton.node.getComponentInChildren(PingIcon);
        pingNode.playRingRing();
        
    }

    private unPingMissionButton()
    {
        let pingNode = this.missionButton.node.getComponentInChildren(PingIcon);
        pingNode.stopRingRing();
    }

    private pingRewardButton()
    {
        let pingNode = this.dailyCheckinButton.getComponentInChildren(PingIcon);
        pingNode.playRingRing();
    }

    private unPingRewardButton()
    {
        let pingNode = this.dailyCheckinButton.getComponentInChildren(PingIcon);
        pingNode.stopRingRing();
    }

    public getPanelWorldPosition(nameString: string): Vec3
    {
        let panel = this.currencyPanels.find(x => x.currencyType === nameString)
        if (panel)
        {
            return panel.iconPosition;
        }
    }

    public activateInventoryMode()
    {
        this._inventoryModeOn = true;

        this.puzzleButton.node.active = false;
        this.shopButton.node.active = false;

        MainGameManager.instance.parkManager.setEditingOn();

        this.inventoryButton.setBackgroundSprite(this.activeInventoryPopupButton);

        // MainGameManager.instance.catManager.stopShowingAppearance();
        MainGameManager.instance.catManager.pauseSimulating();
        MainGameManager.instance.parkManager.pauseSimulating();
    }

    public activateInventoryModeWithToyPlacement(toy: string)
    {
        this.activateInventoryMode();
        this._toyToPlace = toy;
    }

    public deactivateInventoryMode()
    {
        this._inventoryModeOn = false;

        this.puzzleButton.node.active = true;
        this.shopButton.node.active = true;

        MainGameManager.instance.parkManager.setEditingOff();

        this.inventoryButton.setBackgroundSprite(this.deactiveInventoryPopupButton);

        // MainGameManager.instance.catManager.startShowingAppearance();
        MainGameManager.instance.catManager.resumeSimulating();
        MainGameManager.instance.parkManager.resumeSimulating();

        this._toyToPlace = null;
    }

    public showInventoryButton()
    {
        this.inventoryButton.node.active = true;
    }

    public hideInventoryButton()
    {
        this.inventoryButton.node.active = false;
    }

    public playInventoryOpenSound()
    {
        MainGameManager.instance.audioManager.playSfx(GameSound.OPEN_INVENTORY);
    }

    public toggleInventoryMode()
    {
        if (this._inventoryModeOn)
        {
            this.deactivateInventoryMode();
        }
        else
        {
            this.activateInventoryMode();
        }
    }

    private subcribeCurrencyPanels()
    {
        this.currencyPanels.forEach(item =>
        {
            getGameEventManager().on(GameEvent.EVENT_CURRENCY_CHANGE, item.setValueSubscriber, item);
            item.setValueWithoutAnimation(getPlayerDataManager().getCurrency(item.currencyType));
        });
    }

    private unsubscribeCurrencyPanels()
    {
        this.currencyPanels.forEach(item =>
        {
            getGameEventManager().off(GameEvent.EVENT_CURRENCY_CHANGE, item.setValueSubscriber, item);
        });
    }

    public onCaptureScreen()
    {
        //MainGameManager.instance.captureScreen();
    }


    private pingShopButtonWhileEnoughCurrency()
    {
        let popup = this.getPopupManager().getPopupNode(GamePopupCode.POPUP_STORE) as PopUpStore;
        let facilityId = MainGameManager.instance.missionManager.getNeededFacilityInStoryMission();
        if(facilityId && MainGameManager.instance.storeManager.enoughCurrencyToBuy(facilityId))
        {
            this.shopButton.node.getChildByName("Ping").active = true;
            popup.idFromMission = facilityId;
        }
        else
        {
            this.shopButton.node.getChildByName("Ping").active = false;
            popup.idFromMission = null;
        }

    }

    protected update(dt: number): void {
        this.pingShopButtonWhileEnoughCurrency();
    }
}

