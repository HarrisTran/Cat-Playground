import { _decorator, Camera, Canvas, Component, Node, find, director, sys, game } from 'cc';
import { AudioManager, GameMusic } from './Managers/AudioManager';
import { ResourceManager } from './Managers/ResourceManager';
import { ParkManager } from './Managers/ParkManager';
import { CatManager } from './Cats/CatManager';
import { IManager } from './Managers/IManager';
import { PlayerDataManager } from './Managers/PlayerDataManager';
import { LoadScreenMode, LoadingScreen } from './UI/LoadingScreen';
import { MAIN_GAME_SCENE_NAME, PUZZLE_SCENE_NAME, SceneManager } from './Managers/SceneManager';
import { MainGameUI } from './UI/MainGameUI';
import { GameEvent, GameEventManager } from './Managers/GameEventManager';
import { CameraController } from './CameraController';
import { FollowCamera } from '../Utilities/FollowCamera';
import { PopUpManager } from './Managers/PopUpManager';
import { NotificationManager } from './Managers/NotificationManager';
import { MissionManager } from './Managers/MissionManager';
import { TutorialManager } from '../Tutorial/TutorialManager';
import { DialogueManager } from './Managers/DialogueManager';
import { GenericPopup, IGenericPopup } from '../Common/UI/GenericPopup';
import { LocalizationManager } from '../Common/Localization/LocalizationManager';
import { TestSocket } from '../Common/Socket';
import { StoreManager } from './Managers/StoreManager';
import { PuzzleGameManager } from '../Puzzle/PuzzleGameManager';
import { AdManager } from './Managers/AdManager';
import { CurrencyVfxHelper } from '../Others/CurrencyVfxHelper';
import { TouchEffectHelper } from '../Others/TouchEffectHelper';
const { ccclass, property } = _decorator;


enum MainGameState
{
	INIT,					// Initialize ESSENTIAL components. This includes resources, park, cat, etc.
	LOGIN,					// Player login
	INIT_SECONDARY,			// Initialize SECONDARY components. This includes everything that relies on components initialized in INIT. E.g. RewardManager relies on ResourceManagers
	START_GAME,				// Game is started, cat and park is simulating
	SWITCH_TO_MAIN_GAME,	// Switch to main game. Start main scene.
	MAIN_GAME,				// Playin main game. Cats and Parks show their appearances.
	SWITCH_TO_PUZZLE,		// Switch to puzzle mode. Start puzzle scene. Cats and Parks hide their appearances.
	PUZZLE_GAME				// Playing puzzle mode.
}

/**
 * Class to control the game flow, game states, and serves as a mediator for all other components/managers.
 *
 * Relies on a state machines, with the states as in MainGameState.
 * 
 */
@ccclass('MainGameManager')
export class MainGameManager extends Component
{
	private static _instance: MainGameManager;

	/**
	 * Get the MainGameManager instance in the main scene.
	 * DO NOT use in any component's onLoad() or start();
	 */
	public static get instance(): MainGameManager
	{
		return this._instance;
	}

	@property({ group: { name: "Persistent Nodes", id: "2", displayOrder: 1 }, type: [Node] })
	public persistentNodes: Node[] = [];
	@property({ group: { name: "Persistent Nodes", id: "2", displayOrder: 1 }, type: Node })
	public genericPopupNode: Node;

	// ESSENTIAL Components
	// These should be on persistent nodes
	@property({ group: { name: "Essential Components", id: "1", displayOrder: 1 }, type: AudioManager })
	public audioManager: AudioManager;
	@property({ group: { name: "Essential Components", id: "1", displayOrder: 1 }, type: ParkManager })
	public parkManager: ParkManager;
	@property({ group: { name: "Essential Components", id: "1", displayOrder: 1 }, type: CatManager })
	public catManager: CatManager;
	@property({ group: { name: "Essential Components", id: "1", displayOrder: 1 }, type: Camera })
	public camera: Camera;
	@property({ group: { name: "Essential Components", id: "1", displayOrder: 1 }, type: LoadingScreen })
	public loadingScreen: LoadingScreen;
	@property({ group: { name: "Essential Components", id: "1", displayOrder: 1 }, type: Canvas })
	public persistentCanvas: Canvas;

	private _resourceManager: ResourceManager;
	private _gameEventManager: GameEventManager;
	private _playerDataManager: PlayerDataManager;

	private _sceneManager: SceneManager;

	private _canonicalNowDate: Date;

	// SECONDARY Managers
	// These somewhat relies on ESSENTIAL components
	@property({ group: { name: "Secondary Components", id: "1", displayOrder: 2 }, type: AdManager })
	public adManager: AdManager;
	@property({ group: { name: "Secondary Components", id: "1", displayOrder: 2 }, type: TutorialManager })
	public tutorialManager: TutorialManager;
	@property({ group: { name: "Secondary Components", id: "1", displayOrder: 2 }, type: DialogueManager })
	public dialogueManager: DialogueManager;
	@property({ group: { name: "Secondary Components", id: "1", displayOrder: 2 }, type: CurrencyVfxHelper })
	public currencyVfxSpawner: CurrencyVfxHelper;
	@property({ group: { name: "Secondary Components", id: "1", displayOrder: 2 }, type: TouchEffectHelper })
	public touchEffectHelper: TouchEffectHelper;

	private _notificationManager: NotificationManager;
	private _missionManager: MissionManager;
	private _storeManager: StoreManager;

	// Others
	@property({ group: { name: "Others", id: "1", displayOrder: 2 }, type: Node })
	public cheatMenu: Node;
	@property({ group: { name: "Others", id: "1", displayOrder: 2 } })
	public alwaysCheat: boolean = false;
	@property({ group: { name: "Others", id: "1", displayOrder: 2 } })
	public loginSkip: boolean = false;
	@property({ group: { name: "Others", id: "1", displayOrder: 2 } })
	public tutorialSkip: boolean = false;


	// These should be searched for when appropriate
	public gameCanvas: Canvas = null;
	public mainGameUI: MainGameUI = null;

	// These are book keeperes
	private _sceneLoadProgress: number;
	private _sceneLoadDone: boolean;
	private _calledJumpScene: boolean = false;
	private _logined: boolean = false;
	private _shouldTryLoginAgain: boolean = false;

	private _allManagers: IManager[];
	private _essentialManagers: IManager[];

	// Manager getters
	public get resourceManager(): ResourceManager
	{
		return this._resourceManager;
	}

	public get playerDataManager(): PlayerDataManager
	{
		return this._playerDataManager;
	}

	public get sceneManager(): SceneManager
	{
		return this._sceneManager;
	}

	public get gameEventManager(): GameEventManager
	{
		return this._gameEventManager;
	}

	public get notificationManager(): NotificationManager
	{
		return this._notificationManager;
	}

	public get missionManager(): MissionManager
	{
		return this._missionManager;
	}

	public get storeManager(): StoreManager
	{
		return this._storeManager;
	}

	public get canCheat(): boolean
	{
		return this.alwaysCheat || sys.platform == "EDITOR_CORE" || sys.platform == "EDITOR_PAGE";
	}


	private _state: MainGameState;

	public get state(): MainGameState
	{
		return this._state;
	}

	protected onLoad(): void
	{
		MainGameManager._instance = this;

		director.addPersistRootNode(this.node);

		for (let node of this.persistentNodes)
		{
			director.addPersistRootNode(node);
		}

		// Initialize localization
		let instance = LocalizationManager.instance;
	}

	protected start(): void
	{
		this.getGenericPopupInstance().hideImmediately();
		this.returnGenericPopupInstance();

		this.cheatMenu.active = this.canCheat;

		this.setState(MainGameState.INIT, true);
	}


	protected update(dt: number): void
	{
		// Loading
		if (this._state === MainGameState.INIT || this._state === MainGameState.INIT_SECONDARY)
		{
			// Check managers
			let total = this._allManagers.reduce((total, curr) =>
			{
				return total + curr.progress();
			}, 0);

			// Also check the scene
			let progress = (total) / (this._allManagers.length);
			this.loadingScreen.setProcessBar(progress);

			if (this._essentialManagers.every((manager) => manager.initializationCompleted()) && this._state === MainGameState.INIT)
			{
				this.setState(MainGameState.LOGIN);
			}
			else if (this._allManagers.every((manager) => manager.initializationCompleted()) && this._state === MainGameState.INIT_SECONDARY)
			{
				this.setState(MainGameState.START_GAME)
			}
		}
		else if (this._state === MainGameState.LOGIN)
		{
			this.loadingScreen.setCustomMessageKey(this._logined ? "STR_LOGGED_IN" : "STR_LOGGING_IN");

			if (this._logined)
			{
				this.setState(MainGameState.INIT_SECONDARY);
			}
			else
			{
				if (this._shouldTryLoginAgain && !this._leasedGenericPopup)
				{
					this.tryLogin();
				}
			}
		}
		else if (this._state === MainGameState.SWITCH_TO_MAIN_GAME)
		{
			this.loadingScreen.setCustomMessageKey("STR_LOADING_SCENE");
			if (this._sceneLoadDone && !this._calledJumpScene)
			{
				this._calledJumpScene = true;
				this._sceneManager.jumpToScene(MAIN_GAME_SCENE_NAME, () =>
				{
					this.setState(MainGameState.MAIN_GAME);
				})
			}
		}
		else if (this._state === MainGameState.SWITCH_TO_PUZZLE)
		{
			this.loadingScreen.setCustomMessageKey("STR_LOADING_SCENE");
			if (this._sceneLoadDone && !this._calledJumpScene)
			{
				this._calledJumpScene = true;
				this._sceneManager.jumpToScene(PUZZLE_SCENE_NAME, () =>
				{
					this.setState(MainGameState.PUZZLE_GAME);
				});
			}
		}
	}

	private tutorialSwitch: boolean = false;

	public setState(newState: MainGameState, forced: boolean = false)
	{
		if (this._state !== newState || forced)
		{
			let oldState = this._state;
			this._state = newState;

			console.log("Main Game State requested switch to: ", MainGameState[newState]);

			if (newState === MainGameState.INIT)
			{
				this._allManagers = [];
				this._essentialManagers = [];

				// Create instances
				this._resourceManager = new ResourceManager();
				this._gameEventManager = new GameEventManager();
				this._playerDataManager = new PlayerDataManager();

				this._notificationManager = new NotificationManager();
				this._missionManager = new MissionManager();
				this._storeManager = new StoreManager();

				// Add essential managers to managers
				this._allManagers.push(this.audioManager);
				this._allManagers.push(this.parkManager);
				this._allManagers.push(this.catManager);

				this._allManagers.push(this.dialogueManager);
				this._allManagers.push(this.tutorialManager);

				this._allManagers.push(this.resourceManager);
				this._allManagers.push(this.gameEventManager);

				this._allManagers.push(this.playerDataManager);
				this._allManagers.push(this.missionManager);
				this._allManagers.push(this.adManager);

				this._allManagers.push(this.storeManager);

				this._essentialManagers.push(this.audioManager);
				this._essentialManagers.push(this.parkManager);
				this._essentialManagers.push(this.catManager);

				this._essentialManagers.push(this.resourceManager);
				this._essentialManagers.push(this.gameEventManager);
				this._essentialManagers.push(this.playerDataManager);

				// Initialize essential managers
				this.audioManager.initialize();
				this.parkManager.initialize();
				this.catManager.initialize();

				this.resourceManager.initialize();
				this.gameEventManager.initialize();
				this.playerDataManager.initialize();

				LocalizationManager.instance.initialize();

				this._sceneManager = new SceneManager();	// "NOT really a manager"
				this.loadingScreen.mode = LoadScreenMode.SPLASH;
				this.loadingScreen.show();
			}
			else if (newState === MainGameState.LOGIN)
			{
				this._logined = true;
				this._shouldTryLoginAgain = false;

				// Assign date in case login is skipped
				this._canonicalNowDate = new Date();
				this._canonicalNowDate.setHours(0, 0, 0, 0);

				if (!this.loginSkip)
				{
					this._logined = false;
					this._shouldTryLoginAgain = true;

					let test = new TestSocket();
					test.Initialize();
				}
				else
				{
					// Fake login
					this.playerDataManager.fakeLogin();
				}
			}
			else if (newState === MainGameState.INIT_SECONDARY)
			{
				this.dialogueManager.initialize();
				this.tutorialManager.initialize();
				this.missionManager.initialize();
				this.adManager.initialize();

				this.storeManager.initialize();
			}
			else if (newState === MainGameState.START_GAME)
			{
				if (this.tutorialSkip)
				{
					this.playerDataManager.setPlayerDoneTutorial();
				}

				if (!this.playerDataManager.getPlayerDoneTutorial())
				{
					this.playerDataManager.clearParkFacility();
				}

				this.parkManager.setFacilities(this._playerDataManager.getParkFacilities());
				// this.parkManager.debugFeedFaclityData();

				this.parkManager.startSimulating();
				this.catManager.startSimulating();

				if (!this.playerDataManager.getPlayerDoneTutorial())
				{
					this.parkManager.showTutorialTrash();
					this.tutorialSwitch = true;
				}

				if (this.playerDataManager.getPlayerHasDog())
				{
					this.catManager.hasDog = true;
				}

				this.setState(MainGameState.SWITCH_TO_MAIN_GAME);
			}
			else if (newState === MainGameState.SWITCH_TO_MAIN_GAME)
			{
				this.gameCanvas = null;
				this.mainGameUI = null;
				this.requestLoadScene(MAIN_GAME_SCENE_NAME);
				if (oldState !== MainGameState.START_GAME)
					this.loadingScreen.mode = LoadScreenMode.NORMAL;
				this.loadingScreen.show();

				if (this.tutorialSwitch)
				{
					this.tutorialSwitch = false;
					this.tutorialManager.startTutorialFromBegining();
				}

				if (this.tutorialManager.isPlayingTutorial)
				{
					this.audioManager.playMusic(GameMusic.CUTSCENE);
				}
				else
				{
					this.audioManager.playMusic(GameMusic.MAINGAME_BACKGROUND);
				}

			}
			else if (newState === MainGameState.MAIN_GAME)
			{
				// Attach other parts
				this.gameCanvas = find("GameCanvas").getComponent(Canvas);
				this.mainGameUI = find("GameCanvas/MainGameUI").getComponent(MainGameUI);

				find("GameCanvas/CameraController").getComponent(CameraController).camera = this.camera;
				find("GameCanvas/CameraController").getComponent(FollowCamera).camera = this.camera;
				this.mainGameUI.getComponent(FollowCamera).camera = this.camera;

				find("GameCanvas/MainGameUI/MainGamePopupManager").getComponent(PopUpManager).initialize();

				// Ensure order
				this.camera.node.setSiblingIndex(0);
				this.catManager.node.setSiblingIndex(1);
				this.parkManager.node.setSiblingIndex(2);

				this.gameCanvas.cameraComponent = this.camera;

				// Find cat host
				let catHost = find("GameCanvas/CatHost");

				this.parkManager.attachPartsOnMainScene(catHost);
				this.catManager.attachPartsOnMainScene(catHost);

				// Attach MainGameUI events
				this.mainGameUI.activate();

				this.parkManager.startShowingAppearance();
				this.catManager.startShowingAppearance();

				this.loadingScreen.hideLoading();

				this.gameEventManager.emit(GameEvent.EVENT_SWITCH_MAIN_GAME, MissionManager.getBaseMissionArg());
			}
			else if (newState === MainGameState.SWITCH_TO_PUZZLE)
			{
				if (this.mainGameUI === null)
				{
					this.mainGameUI.deactivate();
				}

				this.catManager.stopShowingAppearance();
				this.parkManager.stopShowingAppearance();

				this.catManager.detachPartsOnMainScene();
				let catHost = this.parkManager.detachPartsOnMainScene();
				catHost.setParent(null);

				// Detach parts
				this.gameCanvas = null;
				this.mainGameUI = null;

				// Ensure order
				this.camera.node.setSiblingIndex(0);
				this.catManager.node.setSiblingIndex(1);
				this.parkManager.node.setSiblingIndex(2);

				this.requestLoadScene(PUZZLE_SCENE_NAME);
				this.loadingScreen.mode = LoadScreenMode.NORMAL;
				this.loadingScreen.show();

				// this.audioManager.stopMusic(GameMusic.MAINGAME_BACKGROUND);
				// this.audioManager.playMusic(GameMusic.PUZZLE_BACKGROUND);
			}
			else if (newState === MainGameState.PUZZLE_GAME)
			{
				// Attach parts
				this.gameCanvas = find("GameCanvas").getComponent(Canvas);
				this.mainGameUI = null;

				this.gameCanvas.cameraComponent = this.camera;

				this.loadingScreen.hideLoading();

				this.gameEventManager.emit(GameEvent.EVENT_SWITCH_PUZZLE, MissionManager.getBaseMissionArg());
			}
			else
			{
				throw new Error("Trying to set MainGameState to " + newState + " which is not a valid value.");
			}
		}
	}

	/**
	 * Request to play jump the scene to main game.
	 */
	public requestPlayMainGame()
	{
		this.setState(MainGameState.SWITCH_TO_MAIN_GAME);
	}

	/**
	 * Request to play jump the scene to the puzzle game.
	 */
	public requestPlayPuzzle()
	{
		this.setState(MainGameState.SWITCH_TO_PUZZLE);
	}

	private _leasedGenericPopup: boolean = false;
	public getGenericPopupInstance(): IGenericPopup
	{
		if (this._leasedGenericPopup)
		{
			throw new Error("Generic popup is in use. Cannot retrieve. Please check your code");
		}

		this._leasedGenericPopup = true;
		let popup = this.genericPopupNode.getComponent("GenericPopup") as IGenericPopup;
		popup.hideEndCallback = () => this.returnGenericPopupInstance();
		return popup;
	}

	public returnGenericPopupInstance()
	{
		if (!this._leasedGenericPopup)
		{
			return;
		}

		this._leasedGenericPopup = false;
	}

	public showComingSoonPopup()
	{
		this.getGenericPopupInstance().setTitle("Notifications")
			.setContentText("Coming soon!")
			.addButton("OK", null, true)
			.show();
	}

	public setPuzzleTutorialLevel0()
	{
		PuzzleGameManager.instance.setPuzzleTutorial0();
	}

	public setPuzzleTutorialLevel1()
	{
		PuzzleGameManager.instance.setPuzzleTutorial1();
	}

	public setLockPuzzleBackButton()
	{
		if (PuzzleGameManager.instance)
			PuzzleGameManager.instance.setBackButtonState(true);
	}

	public setUnlockPuzzleBackButton()
	{
		if (PuzzleGameManager.instance)
			PuzzleGameManager.instance.setBackButtonState(false);
	}

	public turnOffPuzzleTutorial()
	{
		PuzzleGameManager.instance.turnoffTutorial();
	}

	private requestLoadScene(sceneName: string)
	{
		// Load scene
		this._sceneLoadDone = false;
		this._sceneLoadProgress = 0;
		this._sceneManager.preloadScene(sceneName,
			(progress) =>
			{
				this._sceneLoadProgress = progress;
			},
			() =>
			{
				this._sceneLoadProgress = 1;
				this._sceneLoadDone = true;
				this._calledJumpScene = false;
			});
	}

	private tryLogin()
	{
		this._shouldTryLoginAgain = false;
		if (this.playerDataManager.isNewPlayer)
		{
			this.playerDataManager.register((successful, errMessage, data) =>
			{
				this._logined = successful;
				if (!successful)
				{
					let popup = this.getGenericPopupInstance();
					this.makeErrorPopup(popup, errMessage);
					popup.show();
				}
				else
				{
					// this._canonicalNowDate = data.
				}
			});
		}
		else
		{
			this.playerDataManager.login((successful, errMessage, data) =>
			{
				this._logined = successful;
				if (!successful)
				{
					let popup = this.getGenericPopupInstance();
					this.makeErrorPopup(popup, errMessage);
					popup.show();
				}
			});
		}
	}

	private makeErrorPopup(popup: GenericPopup, errMessage: string)
	{
		popup.setTitle("Cannot login!")
			.setContentText(errMessage)
			.addButton("Retry", () =>
			{
				this._shouldTryLoginAgain = true;
			}, true)
			.addButton("Quit", () =>
			{
				game.end();
			});

		if (this.canCheat || !this.canCheat)	// TEMP: please remove
		{
			popup.addButton("DEV Cheat", () =>
			{
				this._logined = true;
				this.playerDataManager.fakeLogin();
			}, true);
		}
	}

	// public captureScreen() {
    //     let renderTexture = new RenderTexture();
        
    //     renderTexture.reset({
	// 		width: 256,
	// 		height: 256,
	// 	});

	// 	log(renderTexture);

	// 	let newNode = new Node();
	// 	newNode.addComponent(Sprite);
	
    //     this.camera.targetTexture = renderTexture;
		

	// 	setTimeout(() => {
			
	// 		let sf = new SpriteFrame();
	// 		sf.texture = renderTexture;

	// 		newNode.getComponent(Sprite).spriteFrame = sf;
	// 		newNode.parent = director.getScene();
	// 		this.camera.targetTexture = null;
	// 	}, 3000);



		
    // }

	
}
