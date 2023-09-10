import { _decorator, CCFloat, Color, Component, Game, JsonAsset, Node, resources, Sprite, SpriteAtlas, SpriteFrame, tween, Tween, UIOpacity, Vec3 } from 'cc';
import { IManager } from './IManager';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { DialogueData } from '../../Tutorial/DialogueData';
import { LocalizationManager } from '../../Common/Localization/LocalizationManager';
import { CutsceneItem } from '../../Tutorial/CutsceneItem';
import { MainGameManager } from '../MainGameManager';
import { GameMusic, GameSound } from './AudioManager';
const { ccclass, property } = _decorator;

@ccclass('DialogueManager')
export class DialogueManager extends Component implements IManager
{
	private static DIALOGUE_DATA_PATH = "Jsons/Dialogues/";
	private static DIALOGUE_SPEAKER_SPRITE_PATH = "Sprites/Speakers/";

	@property({ group: { name: "Cutscenes", id: "1", displayOrder: 1 }, type: Node })
	private cutsceneGroup: Node;
	@property({ group: { name: "Cutscenes", id: "1", displayOrder: 1 }, type: Node })
	private cutsceneItemHost: Node;
	@property({ group: { name: "Cutscenes", id: "1", displayOrder: 1 }, type: Sprite })
	private cutsceneSprite1: Sprite;
	@property({ group: { name: "Cutscenes", id: "1", displayOrder: 1 }, type: Sprite })
	private cutsceneSprite2: Sprite;
	@property({ group: { name: "Cutscenes", id: "1", displayOrder: 1 }, type: LocalizedLabel })
	private cutsceneContentText: LocalizedLabel;
	@property({ group: { name: "Cutscenes", id: "1", displayOrder: 1 }, type: Node })
	private cutsceneNameBoxLeft: Node;
	@property({ group: { name: "Cutscenes", id: "1", displayOrder: 1 }, type: Node })
	private cutsceneNameBoxRight: Node;
	@property({ group: { name: "Cutscenes", id: "1", displayOrder: 1 }, type: LocalizedLabel })
	private cutsceneNameTextLeft: LocalizedLabel;
	@property({ group: { name: "Cutscenes", id: "1", displayOrder: 1 }, type: LocalizedLabel })
	private cutsceneNameTextRight: LocalizedLabel;

	@property({ group: { name: "Components - Normal", id: "1", displayOrder: 1 }, type: Node })
	private background: Node;
	@property({ group: { name: "Components - Normal", id: "1", displayOrder: 1 }, type: Node })
	private dialogueBox: Node;
	@property({ group: { name: "Components - Normal", id: "1", displayOrder: 1 }, type: LocalizedLabel })
	private contentText: LocalizedLabel;

	@property({ group: { name: "Components - Left", id: "2", displayOrder: 1 }, type: Sprite })
	private speakerAvatarLeft: Sprite;
	@property({ group: { name: "Components - Left", id: "2", displayOrder: 1 }, type: LocalizedLabel })
	private speakerTextLeft: LocalizedLabel;
	@property({ group: { name: "Components - Left", id: "2", displayOrder: 1 }, type: Node })
	private speakerNameBoxLeft: Node;
	@property({ group: { name: "Components - Right", id: "2", displayOrder: 2 }, type: Sprite })
	private speakerAvatarRight: Sprite;
	@property({ group: { name: "Components - Right", id: "2", displayOrder: 2 }, type: LocalizedLabel })
	private speakerTextRight: LocalizedLabel;
	@property({ group: { name: "Components - Right", id: "2", displayOrder: 2 }, type: Node })
	private speakerNameBoxRight: Node;

	@property({ group: { name: "Params", id: "3", displayOrder: 3 }, type: CCFloat })
	private charDelay = 0.02;
	@property({ group: { name: "Params", id: "3", displayOrder: 3 }, type: CCFloat })
	private dialogueStartAnimTime = 0.5;
	@property({ group: { name: "Params", id: "3", displayOrder: 3 }, type: CCFloat })
	private dialogueEndAnimTime = 0.5;
	@property({ group: { name: "Params", id: "3", displayOrder: 3 }, type: CCFloat })
	private transitAnimTime = 0.5;
	@property({ group: { name: "Params", id: "3", displayOrder: 3 }, type: CCFloat })
	private cutsceneTransitAnimTime = 1;

    @property({type:CCFloat})
	ScaleTweenStart:number
	@property({type:CCFloat})
	ScaleTweenEnd:number
    @property({type:CCFloat})
	OppacityTweenStart:number
	@property({type:CCFloat})
	OppacityTweenEnd:number

	private _currentContentText: LocalizedLabel = null;

	private _initializedDialogue: boolean = false;
	private _progressDialogue: number = 0;
	private _initializedSpeakers: boolean = false;
	private _progressSpeakers: number = 0;

	private _dialogues: Map<string, DialogueData>;
	private _speakers: Map<string, SpriteFrame>;
	private _cutscenes: Map<string, CutsceneItem>;

	private _currentDialogueId: string;
	private _currentCutsceneId: string;
	private _dialogueProgress: number;
	private _doneCallback: () => void = null;

	private _currentCutsceneSprite: Sprite;
	private _nextCutsceneSprite: Sprite;

	private _linePlaying: boolean;
	private _shouldPlayNextLine: boolean;
	private _printedText: string;
	private _queuedTexts: string[];
	private _printTimer: number;

	public get playingDialogue(): boolean
	{
		return this._currentDialogueId != null && this._currentDialogueId != undefined;
	}

	public get currentDialogue(): DialogueData
	{
		return this._dialogues.get(this._currentDialogueId);
	}

	public get currentCutscene(): CutsceneItem
	{
		return this._currentCutsceneId ? this._cutscenes.get(this._currentCutsceneId) : null;
	}

	public get textPrinted(): boolean
	{
		return this._printedText.length >= this._queuedTexts[0].length;
	}

	public get shouldConclude(): boolean
	{
		return this._dialogueProgress == this.currentDialogue.count - 1;
	}

	public initialize()
	{
		this._initializedDialogue = false;
		this._progressDialogue = 0;
		resources.loadDir(DialogueManager.DIALOGUE_DATA_PATH, JsonAsset,
			(finished, total, item) =>
			{
				this._progressDialogue = finished / total;
			},
			(err, datas) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					this._dialogues = new Map<string, DialogueData>();

					for (let data of datas)
					{
						let json = data.json;
						let name = data.name;
						let dialogue = new DialogueData();
						dialogue.from(json);
						this._dialogues.set(name, dialogue);
					}
				}
				this._initializedDialogue = true;
				this._progressDialogue = 1;
			});

		this._initializedSpeakers = false;
		this._progressSpeakers = 0;
		resources.loadDir(DialogueManager.DIALOGUE_SPEAKER_SPRITE_PATH, SpriteAtlas,
			(finished, total, item) => {
				this._progressSpeakers = finished / total;
			},
			(err, datas) => {
				if (err) {
					console.error(err);
				}
				else
				{
					this._speakers = new Map<string, SpriteFrame>();
					for (let data of datas)
					{
						for (let frame of data.getSpriteFrames())
						{
							this._speakers.set(frame.name, frame);
						}
					}
				}
				this._initializedSpeakers = true;
				this._progressSpeakers = 1;
			});

		this._currentDialogueId = null;
		this._currentCutsceneId = null;
		this._dialogueProgress = -1;
		this._doneCallback = null;

		this._linePlaying = false;
		this._shouldPlayNextLine = true;
		this._printedText = null;
		this._queuedTexts = null;
		this._printTimer = 0;

		this._cutscenes = new Map<string, CutsceneItem>();
		for (let item of this.cutsceneItemHost.getComponentsInChildren(CutsceneItem))
		{
			this._cutscenes.set(item.node.name, item);
		}

		this.cutsceneGroup.active = false;

		this.node.active = false;
	}

	public progress(): number
	{
		let arr = [this._progressDialogue, this._progressSpeakers];
		return arr.reduce((t, curr) => t + curr, 0) / arr.length;
	}

	public initializationCompleted(): boolean
	{
		let arr = [this._initializedDialogue, this._initializedSpeakers];
		return arr.every(x => x);
	}


	protected update(dt: number): void
	{
		if (this.playingDialogue && this._linePlaying)
		{
			if (!this.textPrinted)
			{
				this._printTimer -= dt;
				if (this._printTimer <= 0)
				{
					// Print next char
					this._printedText += this._queuedTexts[0][this._printedText.length];
					this.updateContentText();

					this._printTimer = this.charDelay;
				}
			}
		}
	}

	public playCutscene(name: string, onCutsceneDone: () => void = null)
	{
		if (this._cutscenes.has(name) && this._dialogues.has(name))
		{
			this._currentDialogueId = name;
			this._currentCutsceneId = name;
			this._dialogueProgress = -1;
			this._doneCallback = onCutsceneDone;

			this._currentContentText = this.cutsceneContentText;

			this.node.active = true;
			this.cutsceneGroup.active = true;

			this._currentCutsceneSprite = this.cutsceneSprite1;
			this._nextCutsceneSprite = this.cutsceneSprite2;

			this.animateStart();
		}
		else if (!this._cutscenes.has(name))
		{
			throw new Error("Cannot find cutscene \"" + name + "\".");
		}
		else if (!this._dialogues.has(name))
		{
			throw new Error("Cannot find dialogue for cutscene\"" + name + "\".");
		}
	}

	public playDialogue(name: string, onDialogueDone: () => void = null)
	{
		this.cutsceneGroup.active = false;

		if (this._dialogues.has(name))
		{
			this._currentDialogueId = name;
			this._currentCutsceneId = null;
			this._dialogueProgress = -1;
			this._doneCallback = onDialogueDone;

			this._currentContentText = this.contentText;

			this.node.active = true;
			this.animateStart();
		}
		else
		{
			throw new Error("Cannot play dialogue \"" + name + "\" because DialogueManager does not contains it.");
		}
	}

	public onContinue()
	{
		if (!this.playingDialogue || !this._linePlaying) return;

		if (!this.textPrinted)
		{
			this._printedText = this._queuedTexts[0];
			this.updateContentText();
		}
		else
		{
			this._queuedTexts.shift();
			if (this._queuedTexts.length > 0)
			{
				this._printedText = "";
				this.updateContentText();
				this._printTimer = this.charDelay;
			}
			else
			{
				this.animateShowNextLine();
			}
		}
	}

	public onSkip()
	{
		this.animateEnd();
	}

	private animateStart()
	{
		this.speakerAvatarLeft.node.active = false;
		this.speakerNameBoxLeft.active = false;
		this.speakerAvatarRight.node.active = false;
		this.speakerNameBoxRight.active = false;
		this.contentText.node.active = false;

		if (this._currentCutsceneId != null && this._currentCutsceneId != undefined)
		{
			this.animateShowNextLine();
		}
		else if (this._currentDialogueId != null && this._currentDialogueId != undefined)
		{
			this.dialogueBox.scale = new Vec3(0, 0, 1);
			tween(this.dialogueBox).to(this.dialogueStartAnimTime, { scale: new Vec3(this.ScaleTweenStart, this.ScaleTweenStart, 1) },
				{
					easing: 'backOut',
					onComplete: (target?: object) => {
						this.contentText.node.active = true;
						this.animateShowNextLine();
					},
				}).start();
		}
	}

	private animateShowNextLine()
	{
		// Check if concludable
		if (this.shouldConclude)
		{
			this.animateEnd();
		}
		else
		{
			MainGameManager.instance.audioManager.playSfx(GameSound.UI_GRABOBJECT);

			// Set up
			this._linePlaying = false;
			this._shouldPlayNextLine = false;

			this._dialogueProgress += 1;
			var [_, rawString] = LocalizationManager.instance.getString(this.currentDialogue.strings[this._dialogueProgress]);
			this._queuedTexts = rawString.split('\n').filter(x => x !== "");
			this._printedText = "";
			this.updateContentText();

			let speaker = this.currentDialogue.speakers[this._dialogueProgress];
			let isLeft = speaker !== "Miruku";
			
			if (isLeft)
			{
				this.speakerAvatarLeft.spriteFrame = this.getSpeakerSprite(speaker);
				this.speakerTextLeft.stringRaw = this.getSpeakerName(speaker);
				this.speakerAvatarLeft.node.active = true;
				this.speakerNameBoxLeft.active = true;
				this.speakerAvatarRight.node.active = false;
				this.speakerNameBoxRight.active = false;
			}
			else
			{
				this.speakerAvatarRight.spriteFrame = this.getSpeakerSprite(speaker);
				this.speakerTextRight.stringRaw = this.getSpeakerName(speaker);
				this.speakerAvatarRight.node.active = true;
				this.speakerNameBoxRight.active = true;
				this.speakerAvatarLeft.node.active = false;
				this.speakerNameBoxLeft.active = false;
			}

			this.cutsceneNameBoxLeft.active = isLeft;
			this.cutsceneNameBoxRight.active = !isLeft;
			this.cutsceneNameTextLeft.stringRaw = this.cutsceneNameTextRight.stringRaw = this.getSpeakerName(speaker);

			if (this._currentCutsceneId != null && this._currentCutsceneId != undefined)
			{
				this._nextCutsceneSprite.spriteFrame = this.currentCutscene.sprites[this._dialogueProgress];
				this._currentCutsceneSprite.getComponent(UIOpacity).opacity = 255;
				this._nextCutsceneSprite.getComponent(UIOpacity).opacity = 0;
				this._currentCutsceneSprite.node.setSiblingIndex(0);

				let a = tween(this._currentContentText.getComponent(UIOpacity)).to(this.cutsceneTransitAnimTime, { opacity: 0 },
					{
						easing: "linear"
					}).start();
				let b = tween(this._nextCutsceneSprite.getComponent(UIOpacity)).to(this.cutsceneTransitAnimTime, { opacity: 255 },
					{
						easing: "linear",
						onComplete: (target) =>
						{
							let temp = this._currentCutsceneSprite;
							this._currentCutsceneSprite = this._nextCutsceneSprite;
							this._nextCutsceneSprite = temp;

							this.actuallyStartShowingNextLine();
						}
					}).start();
			}
			else
			{
				setTimeout(() => this.actuallyStartShowingNextLine(), this.transitAnimTime * 1000);
			}
		}
	}

	private actuallyStartShowingNextLine()
	{
		this._linePlaying = true;
	}

	private animateEnd()
	{
		this._currentDialogueId = null;

		let callback = this._doneCallback;
		this._doneCallback = null;
		this._linePlaying = false;
		this._shouldPlayNextLine = true;
		this._printedText = null;
		this._queuedTexts = null;

		if (this._currentCutsceneId != null && this._currentCutsceneId != undefined)
		{
			this.node.active = false;
			if (callback)
				callback();
		}
		else
		{
			tween(this.dialogueBox).to(this.dialogueEndAnimTime, { scale: new Vec3(this.ScaleTweenEnd, this.ScaleTweenEnd, 1) }, {
				easing: 'backIn',
				onComplete: (target?: object) =>
				{
					this.node.active = false;
					if (callback)
						callback();
				},
			}).start();
		}
	};


	private updateContentText()
	{
		this._currentContentText.stringRaw = this._printedText;
	}

	private getSpeakerName(speaker: string) : string
	{
		// TODO: Localize
		return speaker;
	}

	private getSpeakerSprite(speaker: string): SpriteFrame
	{
		return this._speakers.has(speaker) ? this._speakers.get(speaker) : null;
	}
}