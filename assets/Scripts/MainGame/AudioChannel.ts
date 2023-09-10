import { _decorator, AudioClip, AudioSource, CCFloat, CCString, clamp, Component, Node} from 'cc';
import { MainGameManager } from './MainGameManager';
const { ccclass, property } = _decorator;

@ccclass('AudioChannel')
export class AudioChannel extends Component
{
	@property(Node)
	private audioSourceHost: Node;
	@property({ type: CCString })
	private channelName: string;
	@property({ type: CCFloat })
	private pollFreeTime: number;

	private _audioSources: AudioSource[];
	private _freeAudioSources: Set<AudioSource>;
	private _audioMap: Map<string, readonly [AudioClip, AudioSource]>;

	private _volume: number;
	private _mute: boolean;

	private _pollTimer: number;


	protected onLoad()
	{
		this._audioSources = [];
		for (let child of this.audioSourceHost.children)
		{
			if (child.getComponent(AudioSource))
			{
				this._audioSources.push(child.getComponent(AudioSource));
			}
		}

		this._audioMap = new Map<string, readonly [AudioClip, AudioSource]>();
		this._freeAudioSources = new Set<AudioSource>(this._audioSources);
		this._pollTimer = 0;
	}

	protected start(): void
	{
		this._pollTimer = this.pollFreeTime;
	}

	protected lateUpdate(dt: number): void
	{
		this._pollTimer -= dt;

		if (this._pollTimer <= 0)
		{
			for (let [identifier, pair] of this._audioMap)
			{
				if (!pair[1].playing)
				{
					this.requestStop(identifier);
				}
			}

			this._pollTimer = this.pollFreeTime;
		}
	}

	public getVolume(): number
	{
		return this._mute ? 0 : this._volume;
	}

	public setVolume(volume: number)
	{
		if (this._mute)
		{
			this.unMute();
		}

		this._volume = clamp(volume, 0, 1);

		if (this._volume === 0)
		{
			this._mute = true;
		}

		this.setVolumeHelper(this._volume);
	}

	public getChannelName(): string
	{
		return this.channelName;
	}

	public changeChannelName(newName: string)
	{
		this.channelName = newName;
	}

	public requestPlayOnce(clip: AudioClip, identifier: string, allowRepeat: boolean)
	{
		if (this._audioMap.has(identifier))
		{
			if (allowRepeat)
			{
				let [clip, source] = this._audioMap.get(identifier);
				source.volume = this._volume;
				source.playOneShot(clip);
			}
		}
		else if (this._freeAudioSources.size > 0)
		{
			let source = this._freeAudioSources.keys().next().value as AudioSource;
			this._freeAudioSources.delete(source);
			this._audioMap.set(identifier, [clip, source]);

			source.volume = this._volume;
			source.loop = false;
			source.playOneShot(clip);
		}
		else
		{
			console.warn("Cannot play audio ", clip.name, " on channel ", this.channelName, " because the channel is full. Please increase channel audio source count.");
		}
	}

	public requestPlayContinuously(clip: AudioClip, identifier: string, playAlone: boolean = true)
	{
		if (playAlone)
		{
			let all = Array.from(this._audioMap.keys());
			for (let i of all)
			{
				this.requestStop(i);
			}
		}
		if (this._freeAudioSources.size > 0)
		{
			let source = this._freeAudioSources.keys().next().value as AudioSource;
			this._freeAudioSources.delete(source);
			this._audioMap.set(identifier, [clip, source]);

			source.clip = clip;
			source.volume = this._volume;
			source.loop = true;
			source.play();
		}
		else
		{
			console.warn("Cannot play audio ", clip.name, " on channel ", this.channelName, " because the channel is full. Please increase channel audio source count.");
		}
	}

	public requestStop(identifier: string)
	{
		if (this._audioMap.has(identifier))
		{
			let source = this._audioMap.get(identifier)[1];
			source.stop();
			source.volume = 0;
			source.loop = false;
			source.clip = null;
			this._freeAudioSources.add(source);
			this._audioMap.delete(identifier);
		}
	}

	public mute()
	{
		this._mute = true;

		this.setVolumeHelper(0);
	}

	public unMute()
	{
		this._mute = false;

		this.setVolumeHelper(this._volume);
	}

	private setVolumeHelper(volume: number)
	{
		for (let source of this._audioSources)
		{
			source.volume = volume;
		}
	}
}