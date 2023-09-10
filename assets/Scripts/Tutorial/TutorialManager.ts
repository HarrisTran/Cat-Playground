import { _decorator, CCFloat, Component, game, JsonAsset, MissingScript, Node, resources } from 'cc';
import { IManager } from '../MainGame/Managers/IManager';
import { TutorialPropagator } from './TutorialPropagator';
import { DialogueData } from './DialogueData';
import { MainGameManager } from '../MainGame/MainGameManager';
import { TutorialInputter } from './TutorialInputter';
import { GameEvent } from '../MainGame/Managers/GameEventManager';
import { PuzzleGameManager } from '../Puzzle/PuzzleGameManager';
import { GamePopupCode } from '../Common/UI/GamePopupCode';
import { GameMusic } from '../MainGame/Managers/AudioManager';
import { MissionManager } from '../MainGame/Managers/MissionManager';
const { ccclass, property } = _decorator;

@ccclass("TutorialManager")
export class TutorialManager extends Component implements IManager
{
	// DONT REMOVE PLEASE
	private static _instance: TutorialManager;

	public static get Instance(): TutorialManager
	{
		return this._instance;
	}

	@property(Node)
	private inputBlocker: Node;
	@property(TutorialInputter)
	private inputter: TutorialInputter;
	@property({type: CCFloat})
	private stepDelay: number = 0.2;

	private static TUTORIAL_STEP_PATH = "Jsons/Tutorials/tutorial_phases";

	private _tutorialPhases: string[];
	private _tutorialPropagators: Map<string, TutorialPropagator>;
	private _tutorialMap: Map<string, object[]>
	private _initialized: boolean = false;
	private _progress: number = 0;

	private _propagatorToWaitFor: string;
	private _onPropagatorShowUpAction: () => void;

	private _currentPhaseIndex: number;
	private _currentStep: number;
	private _currentAction: object;

	private _customActionMaps: Map<string, () => void>;

	private get currentPhase(): string
	{
		return this._tutorialPhases[this._currentPhaseIndex];
	}

	private get currentPhaseActions(): object[]
	{
		return this._tutorialMap.get(this.currentPhase);
	}

	private get isCompleted(): boolean
	{
		return this._currentPhaseIndex >= this._tutorialPhases.length;
	}

	public get isPlayingTutorial(): boolean
	{
		return this._currentStep > -1;
	}

	protected onLoad(): void
	{
		TutorialManager._instance = this;
		this._tutorialPropagators = new Map<string, TutorialPropagator>();
	}

	public initialize()
	{
		this._initialized = false;
		this._progress = 0;
		resources.load(TutorialManager.TUTORIAL_STEP_PATH, JsonAsset,
			(finished, total, item) =>
			{
				this._progress = finished / total;
			},
			(err, data) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					let json = data.json;
					let phases = json["phases"] as object[];
					this._tutorialPhases = [];
					this._tutorialMap = new Map<string, object[]>;
					for (let phase of phases)
					{
						let name = phase["name"] as string;
						let actions = phase["actions"] as object[];
						this._tutorialPhases.push(name);
						this._tutorialMap.set(name, actions);
					}
				}

				this._initialized = true;
				this._progress = 1;
			});

		this._currentPhaseIndex = -1;
		this._currentAction = null;
		this._currentStep = -1;

		this._customActionMaps = new Map<string, () => void>();
		this._customActionMaps.set("SET_PUZZLE_TUTORIAL_0", MainGameManager.instance.setPuzzleTutorialLevel0);
		this._customActionMaps.set("SET_PUZZLE_TUTORIAL_1", MainGameManager.instance.setPuzzleTutorialLevel1);
		this._customActionMaps.set("PUZZLE_LOCK_BACK_BUTTON", MainGameManager.instance.setLockPuzzleBackButton);
		this._customActionMaps.set("PUZZLE_UNLOCK_BACK_BUTTON", MainGameManager.instance.setUnlockPuzzleBackButton);
		this._customActionMaps.set("FORCED_INPUT_OFF", () => this.setForcedInputState(false));
		this._customActionMaps.set("FORCED_INPUT_ON", () => this.setForcedInputState(true));
		this._customActionMaps.set("PUZZLE_TURN_OFF_TUTORIAL", MainGameManager.instance.turnOffPuzzleTutorial);
		this._customActionMaps.set("CLOSE_STORE", () => MainGameManager.instance.mainGameUI.getPopupManager().hidePopUp(GamePopupCode.POPUP_STORE));
		this._customActionMaps.set("INVENTORY_CLOSE", () => MainGameManager.instance.mainGameUI.getPopupManager().inventory.hide());
		this._customActionMaps.set("PAUSE_FACILITY_UPDATE", () => MainGameManager.instance.parkManager.facilityPlayPaused = true);
		this._customActionMaps.set("UNPAUSE_FACILITY_UPDATE", () => MainGameManager.instance.parkManager.facilityPlayPaused = false);
		this._customActionMaps.set("DOG_MOVE_IN", () => MainGameManager.instance.parkManager.dogTutorial.moveInside(() =>
		{
			MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_DOG_TUTORIAL_MOVE_DONE, MissionManager.getBaseMissionArg());
		}));
		this._customActionMaps.set("DOG_MOVE_OUT", () => MainGameManager.instance.parkManager.dogTutorial.moveOutside(() =>
		{
			MainGameManager.instance.gameEventManager.emit(GameEvent.EVENT_DOG_TUTORIAL_MOVE_DONE, MissionManager.getBaseMissionArg());
			MainGameManager.instance.parkManager.dogTutorial.node.active = false;
		}));
		this._customActionMaps.set("SHOW_DOG", () => MainGameManager.instance.parkManager.dogTutorial.node.active = true);
		this._customActionMaps.set("HIDE_DOG", () => MainGameManager.instance.parkManager.dogTutorial.node.active = false);

		this._propagatorToWaitFor = null;
		this._onPropagatorShowUpAction = null;

		this.inputter.clean();
		this.node.active = false;
	}

	public progress(): number
	{
		return this._progress;
	}

	public initializationCompleted(): boolean
	{
		return this._initialized;
	}

	public registerPropagator(propagator: TutorialPropagator)
	{
		let iden = propagator.identifier;

		if (this._tutorialPropagators.has(iden))
		{
			console.warn("TutorialManager already has a record for propagator \"", iden, "\". Please check for duplicate keys");
		}
		else
		{
			this._tutorialPropagators.set(iden, propagator);

			if (this._propagatorToWaitFor && this._propagatorToWaitFor === iden)
			{
				this._onPropagatorShowUpAction();
			}
		}
	}

	public removePropagator(propagator: TutorialPropagator)
	{
		if (this._tutorialPropagators.has(propagator.identifier))
		{
			this._tutorialPropagators.delete(propagator.identifier);
		}
	}

	public setForcedInputState(state: boolean)
	{
		this.inputBlocker.active = state;
	}

	public startTutorialFromBegining()
	{
		this._currentPhaseIndex = 0;
		this._currentStep = 0;
		this.node.active = true;
		this.performCurrentStep();
	}

	public startTutorial(phase: string, step: number)
	{
		let index = this._tutorialPhases.indexOf(phase);
		this._currentPhaseIndex = index;
		this._currentStep = step;
		this.node.active = true;
		this.performCurrentStep();
	}

	public resetTutorial()
	{
		MainGameManager.instance.playerDataManager.resetTutorial();
		game.restart();
	}

	public skipTutorial()
	{
		MainGameManager.instance.playerDataManager.setPlayerDoneTutorial();

		MainGameManager.instance.dialogueManager.onSkip();
		this.setEventOffHelper();
		this.node.active = false;
	}

	public advanceStep()
	{
		if (this.isCompleted)
		{
			return;
		}
		
		this._currentStep += 1;

		if (this._currentStep >= this.currentPhaseActions.length)
		{
			++this._currentPhaseIndex;
			this._currentStep = 0;
		}

		if (this.isCompleted)
		{
			// TODO: Invoke event or something
			this.node.active = false;

			console.log("completed");

			MainGameManager.instance.playerDataManager.setPlayerDoneTutorial();

			return;
		}

		console.log("Tutorial: " + this.currentPhase + " - step: " + this._currentStep);
		this.performCurrentStep();
	}

	public performCurrentStep()
	{
		if (this.isCompleted) return;

		this._currentAction = this.currentPhaseActions[this._currentStep];

		let cutScene = this.parseAsCutscene(this._currentAction);
		if (cutScene)
		{
			MainGameManager.instance.dialogueManager.playCutscene(cutScene, () =>
			{
				// MainGameManager.instance.audioManager.playMusic(GameMusic.MAINGAME_BACKGROUND);
				this.advanceStep();
			});

			return;
		}

		let dialogueId = this.parseAsDialogue(this._currentAction);
		if (dialogueId)
		{
			MainGameManager.instance.dialogueManager.playDialogue(dialogueId, () =>
			{
				this.advanceStep();
			})
			return;
		}

		let [clickValid, clickProp, clickIdentifier] = this.parseAsClickAction(this._currentAction);
		if (clickValid)
		{
			if (clickProp)
			{
				this.inputter.setPropagatorAsClick(clickProp, () => {
					this.inputter.clean();
					this.advanceStep();
				});
			}
			else
			{
				this._onPropagatorShowUpAction = () =>
				{
					this.inputter.setPropagatorAsClick(this._tutorialPropagators.get(this._propagatorToWaitFor), () => {
						this.inputter.clean();
						this.advanceStep();
					});

					this._propagatorToWaitFor = null;
				}
				this._propagatorToWaitFor = clickIdentifier;
				console.log("Tutorial Manager now waits for " + clickIdentifier + " to show up...");
			}

			return;
		}

		let [dragValid, dragPropTarget, dragIdTarget, dragPropGoal, dragIdGoal] = this.parseAsDragAction(this._currentAction);
		if (dragValid)
		{
			if (dragPropTarget && dragPropGoal)
			{
				this.inputter.setPropagatorAsDrag(dragPropTarget, dragPropGoal, () => {
					this.inputter.clean();
					this.advanceStep();
				});
			}
			else if (!dragPropTarget)
			{
				this._onPropagatorShowUpAction = () => {
					this.inputter.setPropagatorAsDrag(this._tutorialPropagators.get(this._propagatorToWaitFor),
						this._tutorialPropagators.get(dragIdGoal), () => {
						this.inputter.clean();
						this.advanceStep();
					});

					this._propagatorToWaitFor = null;
				}
				this._propagatorToWaitFor = dragIdTarget;
				console.log("Tutorial Manager now waits for " + dragIdTarget + " to show up...");
			}
			else if (!dragPropGoal)
			{
				this._onPropagatorShowUpAction = () =>
				{
					this.inputter.setPropagatorAsDrag(this._tutorialPropagators.get(dragIdTarget),
						this._tutorialPropagators.get(this._propagatorToWaitFor), () => {
						this.inputter.clean();
						this.advanceStep();
					});

					this._propagatorToWaitFor = null;
				}
				this._propagatorToWaitFor = dragIdGoal;
				console.log("Tutorial Manager now waits for " + dragIdGoal + " to show up...");
			}

			return;
		}

		let waitEvent = this.parseAsWaitAction(this._currentAction)
		if (waitEvent != null)
		{
			this._activeEvent = waitEvent;
			MainGameManager.instance.gameEventManager.on(waitEvent, this.eventWaitHelper, this);

			return;
		}

		let customAction = this.parseAsCustomAction(this._currentAction)
		if (customAction != null)
		{
			let actualCallback = this._customActionMaps.get(customAction);
			actualCallback();
			setTimeout(() => this.advanceStep(), this.stepDelay * 1000);

			return;
		}

		let [delayValid, time] = this.parseAsDelay(this._currentAction)
		if (delayValid)
		{
			setTimeout(() => this.advanceStep(), time * 1000);

			return;
		}

		console.warn("Action of tutorial phase \"", this.currentPhase, "\" is invalid, please check.\n", this._currentAction);
		this.advanceStep();
	}

	private _activeEvent: GameEvent;

	public setEventOffHelper()
	{
		this._activeEvent = null;
		MainGameManager.instance.gameEventManager.off(this._activeEvent, this.eventWaitHelper, this);
	}

	private parseAsDialogue(obj: object): string
	{
		if (obj.hasOwnProperty("dialogue"))
		{
			let dialogueId = obj["dialogue"];
			return dialogueId;
		}
		else return null;
	}

	private parseAsCutscene(obj: object) : string
	{
		if (obj.hasOwnProperty("cutScene"))
		{
			let cutsceneId = obj["cutScene"];
			return cutsceneId;
		}
		else return null;
	}

	private parseAsClickAction(obj: object): [boolean, TutorialPropagator, string]
	{
		if (obj.hasOwnProperty("click"))
		{
			let identifier = obj["click"];

			if (this._tutorialPropagators.has(identifier))
			{
				return [true, this._tutorialPropagators.get(identifier), identifier];
			}
			else
			{
				return [true, null, identifier];
			}
		}

		else return [false, null, null];
	}

	private parseAsDragAction(obj: object): readonly [boolean, TutorialPropagator, string, TutorialPropagator, string]
	{
		if (obj.hasOwnProperty("drag"))
		{
			let data = obj["drag"];

			if (!data.hasOwnProperty("target") || !data.hasOwnProperty("to")) return [false, null, null, null, null];

			let target = data["target"] as string;
			let to = data["to"] as string;
			return [true,
				(target && this._tutorialPropagators.has(target)) ? this._tutorialPropagators.get(target) : null,
				target,
				(to && this._tutorialPropagators.has(to)) ? this._tutorialPropagators.get(to) : null,
				to];
		}
		else return [false, null, null, null, null];
	}

	private parseAsWaitAction(obj: object): GameEvent
	{
		try
		{
			if (obj.hasOwnProperty("waitEvent"))
			{
				let identifier = obj["waitEvent"];
				return GameEvent[identifier];
			}
			else return null;
		}
		catch (e)
		{
			console.warn(e);
			return null;
		}
	}

	private parseAsCustomAction(obj: object): string
	{
		if (obj.hasOwnProperty("customAction"))
		{
			var id = obj["customAction"] as string;
			return id;
		}

		return null;
	}

	private parseAsDelay(obj: object): [boolean, number]
	{
		if (obj.hasOwnProperty("delay"))
		{
			var length = obj["delay"] as number;
			return [true, length];
		}

		return [false, null];
	}

	private eventWaitHelper()
	{
		this.setEventOffHelper();
		setTimeout(() => this.advanceStep(), 1 * 1000);
	}
}