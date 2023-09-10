import { _decorator, Button, CCInteger, Component, instantiate, log, Node, Prefab, ScrollBar, ScrollView, Vec3 } from 'cc';
import { PopupBase } from '../../../../Common/UI/PopupBase';
import { MainGameManager } from '../../../MainGameManager';
import { StoryMissionItem } from './StoryMissionItem';
import { DailyMissionItem } from './DailyMissionItem';
import { getPlayerDataManager } from '../../../Managers/ManagerUtilities';
import { AchievemenMissiontItem } from './AchievementMissionItem';
const { ccclass, property } = _decorator;

@ccclass('PopUpMission')
export class PopUpMission extends PopupBase
{
    @property([Button])
    private tabButtons: Button[] = [];

    @property([Node])
    private imageButtons: Node[] = [];

    @property([Node])
    private tabPages: Node[] = [];

    
    @property(Prefab)
    private dailyMissonPrefab: Prefab = null;

    @property(Prefab)
    private achivementMissonPrefab: Prefab = null;

    @property(Node)
    private storyMissionNode: Node = null;

    @property(Node)
    private clearlyStoryMissionNode: Node = null;
    
    private _dailyMissionIdList : string[] = [];
    private _achievementMissionIdList : string[] = [];

    protected onLoad(): void
    {
        super.onLoad();
        this.initializationPrefabs();

        this.tabButtons.forEach((button,idx)=> {
            button.node.on('click',()=>{
                this.onClickTab(idx);
            })
        })
    }

    protected initializationPrefabs()
    {
        // story mission tab
        this.resumeStoryTab();

        // daily tab
        this.resumeDailyTab();

        // achievement tab
        this.resumeAchievementTab();
    }

    public resumeStoryTab(){
        let firstStoryMissionId = MainGameManager.instance.missionManager.getActiveStoryMissionId()[0];
        if(firstStoryMissionId===undefined){
            this.clearlyStoryMissionNode.active = true;
        }else{
            this.clearlyStoryMissionNode.active = false;
            this.storyMissionNode.getChildByName("ItemStoryMission").getComponent(StoryMissionItem).setItem(firstStoryMissionId);
        }
    }

    public resumeDailyTab(){
        this.tabPages[1].getChildByName("content").removeAllChildren();
        this._dailyMissionIdList = MainGameManager.instance.missionManager.getAllDailyMissions();
        for (let i = 0; i < this._dailyMissionIdList.length; i++)
        {
            let a = instantiate(this.dailyMissonPrefab);
            a.position = Vec3.ZERO;
            a.getComponent(DailyMissionItem).setItem(this._dailyMissionIdList[i]);
            a.setParent(this.tabPages[1].getChildByName("content"));
        }
    }

    public resumeAchievementTab(){
        this.tabPages[2].getComponentInChildren(ScrollView).content.removeAllChildren();
        this._achievementMissionIdList = MainGameManager.instance.missionManager.getActiveAchievementIds();
        for (let i = 0; i < this._achievementMissionIdList.length; i++)
        {
            let a = instantiate(this.achivementMissonPrefab);
            a.position = Vec3.ZERO;
            a.getComponent(AchievemenMissiontItem).setItem(this._achievementMissionIdList[i]);
            a.setParent(this.tabPages[2].getComponentInChildren(ScrollView).content);
        }
    }

    protected onShowStart(): void {
        super.onShowStart();
        this.tabButtons[0].node.parent.active = false;
        const tabIdWillBeOpened = MainGameManager.instance.missionManager.getIfTabsHasRewards().findIndex(i => i === true);
        if(tabIdWillBeOpened !== -1){
            this.onClickTab(tabIdWillBeOpened);
        }else{
            this.onClickTab(0);
        }
        this.initializationPrefabs();
    }

    protected onShowEnd()
    {
        super.onShowEnd();
        this.tabButtons[0].node.parent.active = true;
    }

    protected onHideStart(): void {
        super.onHideStart();
        this.tabButtons[0].node.parent.active = false;
    }

    private onClickTab(id: number){
        this.tabPages.map(node => node.active=false);
        this.tabPages[id].active = true;

        this.imageButtons.forEach((buttonImg, index)=> {
            buttonImg.active = false;
            if(index === id){
                buttonImg.active = true;
            }
        });
    }

    private missionAvailable(index: number){
        this.tabButtons[index].node.getChildByName("noti").active = true;
        this.imageButtons[index].getChildByName("noti").active = true;
    }

    private missionNotAvailable(index: number){
        this.tabButtons[index].node.getChildByName("noti").active = false;
        this.imageButtons[index].getChildByName("noti").active = false;
    }

    protected update(dt: number): void {
        let data = MainGameManager.instance.missionManager.getIfTabsHasRewards();
        for (let i = 0; i < data.length; i++) {
            if(data[i] === true){
                this.missionAvailable(i);
            }else{
                this.missionNotAvailable(i);
            }
            
        }
    }

}

