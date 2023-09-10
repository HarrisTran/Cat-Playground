import { _decorator, Component, sys, native } from 'cc';
import { LocalizationManager } from '../Common/Localization/LocalizationManager';
import { MainGameManager } from '../MainGame/MainGameManager';
import { Currency } from '../PlayerData/Currency';
const { ccclass, property } = _decorator;
const { fileUtils } = native;

@ccclass('CheatMenu')
export class CheatMenu extends Component
{
    private _autoLureCat: boolean = false;

    protected update()
    {
        if (this._autoLureCat)
        {
            MainGameManager.instance.parkManager.catBooth.onClick();
        }
    }

    public toggle()
    {
        this.node.active = !this.node.active;
    }

    public clearStorage(): void
    {
        sys.localStorage.clear();
        console.log("localStorage clear");
    }

    public dumpLocalizationKeys(): void
    {
        console.log(LocalizationManager.instance.allMissingKeys);
    }

    public logPuzzle()
    {
        let toWrite = MainGameManager.instance.playerDataManager.getPuzzleStaticticsCSV();
        console.log(toWrite);

        if (sys.isNative)
        {
            fileUtils.writeStringToFile(toWrite, "./puzzle_log.csv");
        }
    }

    public autoLureCat()
    {
        this._autoLureCat = !this._autoLureCat;
    }

    public cheatMoney()
    {
        MainGameManager.instance.playerDataManager.addCurrency(Currency.getSoftCurrency(999999));
        MainGameManager.instance.playerDataManager.addCurrency(Currency.getHardCurrency(999999));
        MainGameManager.instance.playerDataManager.addCurrency(Currency.getFishCurrency(999999));
    }

    public byeByeMoney()
    {
        MainGameManager.instance.playerDataManager.setCurrency(Currency.getSoftCurrency(0));
        MainGameManager.instance.playerDataManager.setCurrency(Currency.getHardCurrency(0));
        MainGameManager.instance.playerDataManager.setCurrency(Currency.getFishCurrency(0));
    }

    public skipTutorial()
    {
        MainGameManager.instance.tutorialManager.skipTutorial();
    }

    public resetTutorial()
    {
        if (sys.platform == "EDITOR_PAGE" || sys.platform == "EDITOR_CORE")
        {
            return;
        }

        MainGameManager.instance.tutorialManager.resetTutorial();
    }
}

