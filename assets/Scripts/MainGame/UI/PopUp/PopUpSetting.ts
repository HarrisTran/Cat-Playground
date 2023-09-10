import { _decorator, Component, Node, Slider, Toggle } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { GamePopupCode } from '../../../Common/UI/GamePopupCode';
import { MainGameManager } from '../../MainGameManager';
import { AudioManager, MUSIC_CHANNEL_NAME, SFX_CHANNEL_NAME } from '../../Managers/AudioManager';
import { LocalizedLabel } from '../../../Common/LocalizedLabel';
import { LocalizationManager } from '../../../Common/Localization/LocalizationManager';


const { ccclass, property } = _decorator;

@ccclass('PopUpSetting')
export class PopUpSetting extends PopupBase
{
    @property(Toggle)
    private musicToggle: Toggle
    @property(Toggle)
    private sfxToggle: Toggle
    @property(LocalizedLabel)
    private languageText: LocalizedLabel


    protected onShowStart(): void
    {
        super.onShowStart();

        this.musicToggle.isChecked = MainGameManager.instance.audioManager.getVolume(MUSIC_CHANNEL_NAME) > 0 ? true : false;
        this.sfxToggle.isChecked = MainGameManager.instance.audioManager.getVolume(SFX_CHANNEL_NAME) > 0 ? true : false;
        this.languageText.stringKey = "STR_CURRENT_LANGUAGE";
    }


    public setMusic()
    {
        MainGameManager.instance.audioManager.setVolumeState(MUSIC_CHANNEL_NAME, this.musicToggle.isChecked);
    }


    public setSFX()
    {
        MainGameManager.instance.audioManager.setVolumeState(SFX_CHANNEL_NAME, this.musicToggle.isChecked);
    }

    public switchLanguage()
    {
        LocalizationManager.instance.toggleLanguage();
    }
}

