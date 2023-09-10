import { _decorator, color, Component, Game, Label, Node, Sprite, SpriteFrame, Toggle } from 'cc';
import { MainGameManager } from '../../MainGameManager';
import { LocalizedLabel } from '../../../Common/LocalizedLabel';
import { GameEvent, GameEventManager } from '../../Managers/GameEventManager';
const { ccclass, property } = _decorator;

@ccclass('DayUnitItem')
export class DayUnitItem extends Component {
    @property(Node)
    private lighting : Node;

    @property(Sprite)
    private dayFrame: Sprite ;

    @property([Node])
    private bonusCurrency : Node[] = [];

    @property(Sprite)
    private receivedSprite : Sprite ;

    @property(SpriteFrame)
    private receivedSF: SpriteFrame;

    @property(SpriteFrame)
    private notReceivedSF: SpriteFrame;

    @property(Toggle)
    private checker: Toggle;

    readonly DARK_MODE = color('#999696');
    readonly DEFAULT_MODE = color('#FFFFFF');
    readonly LETTER_DARK_MODE = color('#007D9C');
    readonly LETTER_DEFAULT_MODE = color('#F99F47');

    isCheck = false;
    
    protected onLoad(): void {
    }

    public setDataForItem(bonus: Record<string,any>){
        for(let i=0; i < bonus.length; i++){
            const element = bonus[i.toString()];
            const newSF = this.bonusCurrency[i].getComponent(Sprite).spriteAtlas.getSpriteFrame(element.nameString);
            this.bonusCurrency[i].getComponent(Sprite).spriteFrame = newSF;
            this.bonusCurrency[i].getComponentInChildren(LocalizedLabel).stringRaw = `x${element.amount}`;
        }
    }

    public checked(){
        this.showChecked();
        MainGameManager.instance.playerDataManager.playerGetChecking(false);
        MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_HAS_DAILYCHECKIN,true);
    }

    public showChecked() {
        this.dayFrame.color = this.DARK_MODE;
        this.bonusCurrency.forEach(bonus => {
            bonus.getComponent(Sprite).color = this.DARK_MODE;
            bonus.getComponentInChildren(Label).color = this.LETTER_DARK_MODE;
        })
        if(this.receivedSprite){
            this.receivedSprite.getComponentInChildren(Label).color = this.DARK_MODE;
            this.receivedSprite.spriteFrame = this.receivedSF;
            this.receivedSprite.color = this.DARK_MODE;
        }
        this.checker.isChecked = true;
        this.checker.interactable = false;
        this.lighting.active = false;
    }

    public defaultCheck(){
        this.dayFrame.color = this.DEFAULT_MODE;
        this.bonusCurrency.forEach(bonus => {
            bonus.getComponent(Sprite).color = this.DEFAULT_MODE;
            bonus.getComponentInChildren(Label).color = this.LETTER_DEFAULT_MODE;
        })
        if(this.receivedSprite){
            this.receivedSprite.spriteFrame = this.notReceivedSF;
            this.receivedSprite.color = this.DEFAULT_MODE;
        }
        this.lighting.active = false;
        this.checker.interactable = false;
    }

    public onDayCheckin(){
        this.dayFrame.color = this.DEFAULT_MODE;
        
        this.bonusCurrency.forEach(bonus => {
            bonus.getComponent(Sprite).color = this.DEFAULT_MODE;
            bonus.getComponentInChildren(Label).color = this.LETTER_DEFAULT_MODE;
        })
        if(this.receivedSprite){
            this.receivedSprite.spriteFrame = this.receivedSF;
            this.receivedSprite.color = this.DEFAULT_MODE;
        }
        this.lighting.active = true;
        this.checker.interactable = true;
    }

}

