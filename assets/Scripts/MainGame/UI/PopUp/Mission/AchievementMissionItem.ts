import { _decorator, CCInteger, Component, Label, log, Node, Prefab, RichText, Sprite } from 'cc';
import { MainGamePopupEventRaiser } from '../../../../Common/UI/MainGamePopupEventRaiser';
import { UIButton } from '../../../../Common/UI/UIButton';
import { addTagsForMissionName } from '../../../../Utilities/OtherUtilities';
import { MainGameManager } from '../../../MainGameManager';
import { Mission } from '../../../Missions/Mission';
import { getPlayerDataManager } from '../../../Managers/ManagerUtilities';
import { PopUpMission } from './PopUpMission';
import { LocalizedLabel } from '../../../../Common/LocalizedLabel';
import { formatCurrencyNumber } from '../../../../PlayerData/Currency';
import { GamePopupCode } from '../../../../Common/UI/GamePopupCode';
const { ccclass, property } = _decorator;

@ccclass('AchivementMissionItem')
export class AchievemenMissiontItem extends Component {

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

     private _mission: Mission;

     setItem(id: string) {
          this._mission = MainGameManager.instance.missionManager.getMission(id);
          this.missionImg.spriteFrame = MainGameManager.instance.missionManager.getMissionSprite(this._mission.imageId);
          this.itemMissionName.stringKey = this._mission.nameString;
          this.currentBarProcess.fillRange = MainGameManager.instance.missionManager.getProgress(id).progress / this._mission.totalProgress;
          this.currentBarProcessLb.string = `${MainGameManager.instance.missionManager.getProgress(id).progress}/${this._mission.totalProgress}`;

          this.rewardLb.string = formatCurrencyNumber(this._mission.payout[0].amount);
          let spriteReward = this.rewardLb.node.parent.getComponent(Sprite);
          spriteReward.spriteFrame = spriteReward.spriteAtlas.getSpriteFrame(this._mission.payout[0].nameString);
          this.setControlButtonState();
     }

     private setControlButtonState(){
          if(this.currentBarProcess.fillRange < 1){
               this.controlButton.setLabel("STR_MISSION_INPROGRESS");
               this.controlButton.getComponent(Sprite).grayscale = true;
               this.controlButton.interactable = false;
          }else{
               this.controlButton.setLabel("STR_MISSION_ENCHASE");
               this.controlButton.getComponent(Sprite).grayscale = false;
               this.controlButton.interactable = true;

               this.controlButton.setOnClickCallback(() => {
                    this.acceptAchievementMission();
               })
          }
     }

     private acceptAchievementMission(){
          MainGameManager.instance.missionManager.collectRewardOf(this._mission.id);
          let popup = MainGameManager.instance.mainGameUI.getPopupManager().getPopupNode(GamePopupCode.POPUP_MISSON) as PopUpMission;
          popup.resumeAchievementTab();
     }

}

