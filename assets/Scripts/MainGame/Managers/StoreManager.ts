import { _decorator, Component, Node } from 'cc';
import { IManager } from './IManager';
import { FacilityData } from '../Facilities/FacilityData';
import { ResourceManager } from './ResourceManager';
import { MainGameManager } from '../MainGameManager';
import { Currency } from '../../PlayerData/Currency';
import { getPlayerDataManager } from './ManagerUtilities';
const { ccclass, property } = _decorator;

@ccclass('StoreManager')
export class StoreManager implements IManager{

    private _facilities: Map<string, FacilityData>;

    initialize() {
        const resourceMgr = MainGameManager.instance.resourceManager;

        this._facilities = new Map<string, FacilityData>();
		for (let id of resourceMgr.getAllFacilityIdsSortedByBR(true))
		{
			this._facilities.set(id, resourceMgr.getFacilityData(id));
		}
    }

    progress(): number {
        return 0;
    }

    initializationCompleted(): boolean {
        return true;
    }

    getFacilities(){
        return this._facilities;
    }

    getStoreItem(id: string) : FacilityData{
        return this._facilities.get(id);
    }

    public enoughCurrencyToBuy(facilityId : string) : boolean
    {
        let data = this._facilities.get(facilityId);
        const softCurrency = data.prices[0];
        const fishCurrency = Currency.getFishCurrency(data.blockRequired);
        
        return getPlayerDataManager().checkBalance(softCurrency) && getPlayerDataManager().checkBalance(fishCurrency);
    }
}

