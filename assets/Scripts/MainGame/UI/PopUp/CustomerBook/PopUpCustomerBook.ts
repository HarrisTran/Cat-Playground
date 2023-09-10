import { _decorator, log, Node, PageView, Prefab, Sprite, Vec3 } from 'cc';
import { PopupBase } from '../../../../Common/UI/PopupBase';
import { LocalizedLabel } from '../../../../Common/LocalizedLabel';
import { CatData } from '../../../Cats/CatData';
import { ItemCustomerBook } from './ItemCustomerBook';
import { MainGameManager } from '../../../MainGameManager';
import { getRandomElementInArray } from '../../../../Utilities/NumberUtilities';
import { getPlayerDataManager } from '../../../Managers/ManagerUtilities';

const { ccclass, property } = _decorator;

@ccclass('PopUpCustomerBook')
export class PopUpCustomerBook extends PopupBase
{
    @property(PageView)
    private pageView : PageView = null;

    @property(Node)
    private catDetail : Node = null;

    @property({ group: { name: "Cat Detail Components", id: "1", displayOrder: 1 }, type: Sprite })
    private catSprite: Sprite;
    @property({ group: { name: "Cat Detail Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
    private nameLlb: LocalizedLabel;
    @property({ group: { name: "Cat Detail Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
    private favorToyLlb: LocalizedLabel;
    @property({ group: { name: "Cat Detail Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
    private describeLlb: LocalizedLabel;

    private _catIdAvailable: string[] = ["Cat_1","Cat_2","Cat_3","Cat_4","Cat_5","Cat_6"];
   
    protected onLoad(): void
    {
        super.onLoad();
        super.resizeScreen();
        this.returnCatListPage();
    }

    returnCatListPage()
    {
        this.pageView.node.active = true;
        this.catDetail.active = false;
    }

    private refreshCatList(){
        let allCatInPark = getPlayerDataManager().getCatTypesServed();
        this.pageView.content.getChildByName("page").children.forEach((node,i)=> {
            const catInPark : boolean = allCatInPark.findIndex(cat => cat === this._catIdAvailable[i]) !== -1;
            node.getComponent(ItemCustomerBook).setCat(this._catIdAvailable[i],catInPark);
        });
    }


    public getDetailCat(data: CatData)
    {
        this.pageView.node.active = false;
        this.catDetail.active = true;

        const randomF = getRandomElementInArray(MainGameManager.instance.resourceManager.getAllFacilityIds());
        this.favorToyLlb.stringKey =  MainGameManager.instance.resourceManager.getFacilityData(randomF).nameString;

        this.catSprite.spriteFrame = MainGameManager.instance.resourceManager.getCatUISprite(data.id);
        this.nameLlb.stringKey = data.nameString;
        this.describeLlb.stringKey = data.description;
    }


    public getDetailCatPage(id : string){
        this.getDetailCat(MainGameManager.instance.resourceManager.getCatData(id));
    }

    protected update(dt: number): void {
        this.refreshCatList();
    }

    

    
}
