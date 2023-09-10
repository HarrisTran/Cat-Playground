import { _decorator, Component, Node } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { GamePopupCode } from '../../../Common/UI/GamePopupCode';
const { ccclass, property } = _decorator;

@ccclass('PopUpNewCat')
export class PopUpNewCat extends PopupBase
{
    protected onLoad(): void
    {
       super.onLoad();
    }
}

