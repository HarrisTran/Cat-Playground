import { _decorator, CCInteger, Component, instantiate, log, Node, Prefab, Vec3 } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { GamePopupCode } from '../../../Common/UI/GamePopupCode';
import { MainGameManager } from '../../MainGameManager';
const { ccclass, property } = _decorator;

@ccclass('PopUpTask')
export class PopUpTask extends PopupBase 
{
    @property({ type: CCInteger })
    Amount: number = 7;
    @property({ type: Prefab })
    PrefabsItem: Prefab;
    @property({ type: Node })
    HandleItem: Node;

    protected onLoad(): void
    {
        super.onLoad();
        this.initializationPrefabs();
    }

    protected initializationPrefabs()
    {
        for (let i = 0; i < this.Amount; i++)
        {
            let a = instantiate(this.PrefabsItem);
            a.position = Vec3.ZERO;
            a.setParent(this.HandleItem);
        }
    }

    protected onShowStart(): void {
        super.onShowStart();
        console.log(MainGameManager.instance.missionManager.getAllActiveMissionIds());
    }


};

