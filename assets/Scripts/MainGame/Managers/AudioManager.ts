import { _decorator, AudioClip, Component, Game, MainFlow, Node, resources } from 'cc';
import { IManager } from './IManager';
import { AudioChannel } from '../AudioChannel';
import { MainGameManager } from '../MainGameManager';
const { ccclass, property } = _decorator;

export enum GameSound
{
	DEBUG = "debug",
	MAINGAME_CLICKCALLGUEST = "maingame_click call guest",
	MAINGAME_GUESTCOME1 = "maingame_guest come 1",
	MAINGAME_GUESTCOME2 = "maingame_guest come 2",
	PUZZLE_DROPPUZZLE = "puzzle_drop puzzle",
	PUZZLE_FAILPUZZLE = "puzzle_fail puzzle",
	PUZZLE_GRABPUZZLE = "puzzle_grab puzzle",
	UI_CLICKSOUND = "ui_click sound",
	UI_COUNTPOINTSHORT = "ui_count point 1",
	UI_COUNTPOINTLONG = "ui_count point 2",
	UI_DROPOBJECT = "ui_drop object",
	UI_DROPOBJECTONSAND = "ui_drop object on sand",
	UI_GRABOBJECT = "ui_grab object",
	UI_OPENSTORE = "ui_open store",
	UI_SANDSOUND = "ui_sand sound",
	PUZZLE_BREAKHIGHSCORE = "puzzle_break high score",
	UI_POP_UPBUTTONPUZZLE = "ui_pop_up button puzzle",

	SCORE_1 = "score_1",
	SCORE_2 = "score_2",
	SCORE_3 = "score_3",
	SCORE_4 = "score_4",
	SCORE_5 = "score_5",
	SCORE_6 = "score_6",

	PUZZLE_GAME_OVER = "puzzle_game_over",
	PUZZLE_GAME_CONCLUDE = "puzzle_conclude_game",
	BOOSTER_ROTATE = "booster_rotate",
	BOOSTER_HAMMER = "booster_hammer",
	BOOSTER_RENEW = "booster_renew",

	SMOKE_SOUND = "smoke_sound",
	COIN_COLLECT = "coin_collect",
	COIN_DROP = "coin_drop",
	OPEN_INVENTORY = "open_inventory",

	FISH_COLLECT = "fish_collect",
	COUNT_DOWN = "count_down",

	WATER_DROP_1 = "water_drop_1",
	WATER_DROP_2 = "water_drop_2"
}

export enum GameMusic
{
	DEBUG = "debug",
	MAINGAME_BACKGROUND = "maingame_background",
	PUZZLE_BACKGROUND = "puzzle_background",
	CUTSCENE = "cutscene"
}

export const MUSIC_CHANNEL_NAME: string = "music";
export const SFX_CHANNEL_NAME: string = "sfx";

@ccclass('AudioManager')
export class AudioManager extends Component implements IManager
{
	private static readonly MUSIC_PATH = "Audios/Music";
	private static readonly SFX_PATH = "Audios/Sfx";

	@property([AudioChannel])
	private channelArray: AudioChannel[] = [];
	
	private _audioBank: Map<string, [string, AudioClip]>;
	private _channels: Map<string, AudioChannel>;

	private _isSoundInitialized = false;
	private _isMusicInitialized = false;
	private _soundInitializeProgress = 0;
	private _musicInitializeProgress = 0;

	public initialize()
	{
		this._channels = new Map<string, AudioChannel>();
		for (let channel of this.channelArray)
		{
			this._channels.set(channel.getChannelName(), channel);
		}

		this._audioBank = new Map<string, [string, AudioClip]>();

		// Load music
		this._isMusicInitialized = false;
		this._musicInitializeProgress = 0;
		resources.loadDir(AudioManager.MUSIC_PATH, AudioClip,
			(finished, total, item) =>
			{
				this._musicInitializeProgress = finished / total;
			},
			(err, assets) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					for (let asset of assets)
					{
						this._audioBank.set(asset.name, [MUSIC_CHANNEL_NAME, asset]);
					}
				}
				this._isMusicInitialized = true;
				this._musicInitializeProgress = 1;
			});

		// Load sfx
		this._isSoundInitialized = false;
		this._soundInitializeProgress = 0;
		resources.loadDir(AudioManager.SFX_PATH, AudioClip,
			(finished, total, item) =>
			{
				this._soundInitializeProgress = finished / total;
			},
			(err, assets) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					for (let asset of assets)
					{
						this._audioBank.set(asset.name, [SFX_CHANNEL_NAME, asset]);
					}
				}

				this._isSoundInitialized = true;
				this._soundInitializeProgress = 1;
			});
			
		let musicOn = MainGameManager.instance.playerDataManager.getMusicOn();
		let sfxOn = MainGameManager.instance.playerDataManager.getSfxOn();
		this.setVolumeState(MUSIC_CHANNEL_NAME, musicOn, false);
		this.setVolumeState(SFX_CHANNEL_NAME, sfxOn, false);
	}

	public progress(): number
	{
		let arr: number[] = [
			this._musicInitializeProgress,
			this._soundInitializeProgress
		];
		return arr.reduce((t, curr) => t + curr, 0) / arr.length;
	}

	public initializationCompleted(): boolean
	{
		let arr: boolean[] = [
			this._isMusicInitialized,
			this._isSoundInitialized
		];
		return arr.every(x => x);
	}

	public setVolumeState(channelName: string, isOn: boolean, savePref: boolean = true)
	{
		let vol = 0;

		if (channelName === MUSIC_CHANNEL_NAME)
		{
			vol = isOn ? 0.3 : 0;

			if (savePref)
				MainGameManager.instance.playerDataManager.setMusic(isOn);
		}
		else if (channelName === SFX_CHANNEL_NAME)
		{
			vol = isOn ? 0.8 : 0;

			if (savePref)
				MainGameManager.instance.playerDataManager.setSfx(isOn);
		}
		
		this.setVolume(channelName, vol);
	}

	private setVolume(channelName: string, volume: number)
	{
		if (this._channels.has(channelName))
		{
			this._channels.get(channelName).setVolume(volume);
		}
	}

	public getVolume(channelName: string): number
	{
		if (this._channels.has(channelName))
		{
			return this._channels.get(channelName).getVolume();
		}

		return 0;
	}

	public playSfx(sound: GameSound, allowRepeat: boolean = false)
	{
		if (this._audioBank.has(sound))
		{
			let [channelName, clip] = this._audioBank.get(sound);
			this._channels.get(channelName).requestPlayOnce(clip, sound, allowRepeat);
		}
		else
		{
			console.warn("Sound ", sound, " does not exist in game sound bank. Please check.");
		}
	}

	public playMusic(music: GameMusic)
	{
		if (this._audioBank.has(music))
		{
			let [channelName, clip] = this._audioBank.get(music);
			this._channels.get(channelName).requestPlayContinuously(clip, music);
		}
		else
		{
			console.warn("Music ", music, " does not exist in game sound bank. Please check.");
		}
	}

	public stopSfx(sound: GameSound)
	{
		if (this._audioBank.has(sound))
		{
			let [channelName, clip] = this._audioBank.get(sound);
			this._channels.get(channelName).requestStop(sound);
		}
		else
		{
			console.warn("Sound ", sound, " does not exist in game sound bank. Please check.");
		}
	}

	public stopMusic(music: GameMusic)
	{
		if (this._audioBank.has(music))
		{
			let [channelName, clip] = this._audioBank.get(music);
			this._channels.get(channelName).requestStop(music);
		}
		else
		{
			console.warn("Music ", music, " does not exist in game sound bank. Please check.");
		}
	}
}

