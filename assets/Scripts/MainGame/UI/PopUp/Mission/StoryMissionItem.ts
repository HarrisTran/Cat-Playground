import { _decorator, CCInteger, Color, Component, Label, log, Node, Prefab, RichText, Sprite, SpriteFrame } from 'cc';
import { MainGamePopupEventRaiser } from '../../../../Common/UI/MainGamePopupEventRaiser';
import { UIButton } from '../../../../Common/UI/UIButton';
import { MainGameManager } from '../../../MainGameManager';
import { Mission } from '../../../Missions/Mission';
import { getPlayerDataManager } from '../../../Managers/ManagerUtilities';
import { formatCurrencyNumber, SOFT_CURRENCY } from '../../../../PlayerData/Currency';
import { PopUpMission } from './PopUpMission';
import { LocalizedLabel } from '../../../../Common/LocalizedLabel';
import { GamePopupCode } from '../../../../Common/UI/GamePopupCode';
const { ccclass, property } = _decorator;

@ccclass('StoryMissionItem')
export class StoryMissionItem extends Component {

     @property(Sprite)
     private missionImg: Sprite = null;

     @property(LocalizedLabel)
     private itemMissionName: LocalizedLabel = null;

     @property(Sprite)
     private currentBarProcess: Sprite = null;

     @property(Label)
     private currentBarProcessLb: Label = null;

     @property(UIButton)
     private controlButton: UIButton = null;

     @property(Label)
     private rewardLb: Label = null;

     @property(SpriteFrame)
     private GoSF: SpriteFrame = null;

     @property(SpriteFrame)
     private HireSF: SpriteFrame = null;

     @property(SpriteFrame)
     private CollectSF: SpriteFrame = null;

     private _mission: Mission;


     setItem(id: string) {
          this._mission = MainGameManager.instance.missionManager.getMission(id);
          this.missionImg.spriteFrame = MainGameManager.instance.missionManager.getMissionSprite(this._mission.imageId);
          //this.itemMissionName.setParams(["missionName",this._mission.nameString])
          this.itemMissionName.stringKey = this._mission.nameString;
          this.currentBarProcess.fillRange = MainGameManager.instance.missionManager.getProgress(id).progress / this._mission.totalProgress;
          this.currentBarProcessLb.string = `${MainGameManager.instance.missionManager.getProgress(id).progress}/${this._mission.totalProgress}`;
          
          this.rewardLb.string = formatCurrencyNumber(this._mission.payout[0].amount);
          let spriteReward = this.rewardLb.node.parent.getComponent(Sprite);
          spriteReward.spriteFrame = spriteReward.spriteAtlas.getSpriteFrame(this._mission.payout[0].nameString);
          this.setControlButtonState(id);
     }

     private setControlButtonUI(state: string){
          this.controlButton.getComponent(Sprite).grayscale = false;
          this.controlButton.interactable = true;
          switch (state) {
               case "Go":
                    this.controlButton.getComponent(Sprite).spriteFrame = this.GoSF;
                    this.controlButton.setLabel("STR_MISSION_GO");
                    break;
               case "Hire":
                    this.controlButton.getComponent(Sprite).spriteFrame = this.HireSF;
                    if(getPlayerDataManager().getCurrency(SOFT_CURRENCY) <= 3000){
                         this.controlButton.getComponent(Sprite).grayscale = true;
                         this.controlButton.interactable = false;
                    }
                    this.controlButton.setLabel("STR_MISSION_HIRE");
                    break;
               case "Collect":
                    this.controlButton.getComponent(Sprite).spriteFrame = this.CollectSF;
                    this.controlButton.setLabel("STR_MISSION_COLLECT");
                    break;
               default:
                    break;
          }
     }

     private setControlButtonState(id: string){
          this.controlButton.clearAllCallbacks();
          
          if(this.currentBarProcess.fillRange < 1){
               if(id === "Mission_hire_staff1"){
                    this.setControlButtonUI("Hire");
                    this.controlButton.setOnClickCallback(()=>{
                         getPlayerDataManager().addDog();
                         getPlayerDataManager().addCurrency(this._mission.payout[0]);
                    });
                    this.controlButton.setOnClickCallback(()=>{
                         let missionPopup = this.controlButton.getComponent(MainGamePopupEventRaiser).getPopup() as PopUpMission;
                         missionPopup.hide();
                         missionPopup.resumeStoryTab();
                    });
               }else{
                    this.setControlButtonUI("Go");
                    this.controlButton.setOnClickCallback(() => this.controlButton.getComponent(MainGamePopupEventRaiser).getPopup().hide());
                    this.controlButton.setOnClickCallback(MainGameManager.instance.missionManager.getMissionGoAction(this._mission.id));
               }
               
          }else{
               this.setControlButtonUI("Collect");
               this.controlButton.setOnClickCallback(() => {
                    this.acceptStoryMission();
               });
          }
     }

     private acceptStoryMission(){
          MainGameManager.instance.missionManager.collectRewardOf(this._mission.id);
          getPlayerDataManager().addCurrency(this._mission.payout[0]);
          let popup = MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_MISSON) as PopUpMission;
          popup.resumeStoryTab();
     }
}