import { _decorator, CCInteger, Component, instantiate, log, Node, Prefab, Vec3 } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { GamePopupCode } from '../../../Common/UI/GamePopupCode';
import { PlayerDataManager } from '../../Managers/PlayerDataManager';
import { DayUnitItem } from './DayUnitItem';
import { MainGameManager } from '../../MainGameManager';
import { getPlayerDataManager } from '../../Managers/ManagerUtilities';
const { ccclass, property } = _decorator;

const pseudoData: Record<string, Record<string, any>[]> = {
    "0": [{ "nameString": "fish", "amount": 3 }],
    "1": [{ "nameString": "fish", "amount": 3 }],
    "2": [{ "nameString": "coin", "amount": 25 }],
    "3": [{ "nameString": "coin", "amount": 50 }],
    "4": [{ "nameString": "coin", "amount": 100 }],
    "5": [{ "nameString": "gem", "amount": 100 }],
    "6": [{ "nameString": "gem", "amount": 100 }, { "nameString": "coin", "amount": 100 }, { "nameString": "fish", "amount": 100 }]
}
@ccclass('PopUpDaily')
export class PopUpDaily extends PopupBase 
{
    @property([Node])
    protected item:Node[] = [];

    protected onLoad(): void
    {
       super.onLoad();
        this.initUI();
       //this.initializationPrefabs(7);
       const data = MainGameManager.instance.playerDataManager.playerGetChecking(true);
        for (let i = 0; i < this.item.length; i++) {
            const comp = this.item[i];
            const dayUnit: DayUnitItem = comp.getComponent(DayUnitItem);
            if (data.checkinIndex === i )
            {
                data.hasCheckedIn ?  dayUnit.showChecked() : dayUnit.onDayCheckin() ;
            }
            if (i < data.checkinIndex)
            {
                dayUnit.showChecked();
            }
            if (i > data.checkinIndex)
            {
                dayUnit.defaultCheck();
            }
        }
    }

    private initUI(){
        for (let i = 0; i < this.item.length; ++i) {
            this.item[i].getComponent(DayUnitItem).setDataForItem(pseudoData[i.toString()]);
        }
    }

}

