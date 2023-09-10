import { EventTarget, Game } from 'cc';
import { IManager } from "./IManager";
import { CatData } from '../Cats/CatData';
import { PuzzleSession } from '../../PlayerData/PuzzleStatistics';
import { MainGameManager } from '../MainGameManager';
import { Booster } from '../../Puzzle/UI/Booster';

export enum GameEvent
{
	// Player Data events
	EVENT_NEW_PROFILE_CREATED = "EVENT_NEW_PROFILE_CREATED",					// EMITTED // Should emit when the player profile is created.
	EVENT_PROFILE_LOADED = "EVENT_PROFILE_LOADED",								// EMITTED // Should emit when the profile is loaded from "disc".
	EVENT_PROFILE_SAVED = "EVENT_PROFILE_SAVED",								// EMITTED // Should emit when the profile is saved to "disc".

	EVENT_CURRENCY_ADD = "EVENT_CURRENCY_ADD",									// EMITTED // Should emit when the player gains more currency.
	EVENT_CURRENCY_LOSE = "EVENT_CURRENCY_LOSE",								// EMITTED // Should emit when the player loses currency.
	EVENT_CURRENCY_CHANGE = "EVENT_CURRENCY_CHANGE",							// EMITTED // Should emit when the player's balance changes.

	EVENT_FACILITY_INVENTORY_ADD = "EVENT_FACILITY_INVENTORY_ADD",				// EMITTED // Should emit when the user adds a facility to their inventory, regardless of methods
	EVENT_FACILITY_INVENTORY_REMOVE = "EVENT_FACILITY_INVENTORY_REMOVE",		// DEPRECATED // Should emit when the user removes a facility from their inventory
	EVENT_FACILITY_INVENTORY_LEVEL_UP = "EVENT_FACILITY_INVENTORY_LEVEL_UP",	// EMITTED // Should emit when the user levels up a facility
	EVENT_PARK_SET_FACILITY = "EVENT_PARK_SET_FACILITY",						// EMITTED // Should emit when the player puts a facility to the park.
	EVENT_PARK_REMOVE_FACILITY = "EVENT_PARK_REMOVE_FACILITY",					// EMITTED // Should emit when the player removes a facility from the park.

	EVENT_PARK_DOG_UNLOCKED = "EVENT_PARK_DOG_UNLOCKED",						// EMITTED // Should emit when the dog is unlocked for the first time.

	EVENT_WATCH_AD = "EVENT_WATCH_AD",											// Should emit when the player just finishes watching an ad.
	EVENT_CAT_SHOW_UP = "EVENT_CAT_SHOW_UP",									// EMITTED // Should emit when a cat show up in queue.
	EVENT_CAT_START_PLAYING = "EVENT_CAT_START_PLAYING",						// EMITTED // Should emit when a cat is done playing and dropping coin.
	EVENT_CAT_DONE_PLAYING = "EVENT_CAT_DONE_PLAYING",							// EMITTED // Should emit when a cat is done playing and dropping coin.

	EVENT_SWITCH_MAIN_GAME = "EVENT_SWITCH_MAIN_GAME",							// EMITTED // Should emit when the player ENTERS to main game
	EVENT_SWITCH_PUZZLE = "EVENT_SWITCH_PUZZLE",								// EMITTED // Should emit when the player ENTERS to puzzle game

	EVENT_PUZZLE_COMPLETE_SESSION = "EVENT_PUZZLE_COMPLETE_SESSION",			// EMIITED // Should emit when the player completes a puzzle game
	EVENT_PUZZLE_PAUSE_SESSION = "EVENT_PUZZLE_PAUSE_SESSION",					// EMITTED // Should emit when the player goes back to main game -> cause the puzzle session to pause
	EVENT_PUZZLE_USE_BOOSTER = "EVENT_PUZZLE_USE_BOOSTER",						// Should emit when the player uses a booster

	EVENT_STORE_BUY_WITH_CURRENCY = "EVENT_STORE_BUY_WITH_CURRENCY",			// Should emit when the player buys with in game currency
	EVENT_STORE_BUY_REAL_MONEY = "EVENT_STORE_BUY_REAL_MONEY",					// Should emit when the player buys with real money

	EVENT_COMPLETE_MISSION = "EVENT_COMPLETE_MISSION",							// EMIITED // Should emit when the player completes a mission
	EVENT_COLLECTED_ALL_COMPLETE_MISSION = "EVENT_COLLECTED_ALL_COMPLETE_MISSION",			// EMIITED // Should emit when the player collects all rewards of a mission
	EVENT_MISSION_CHANGE = "EVENT_MISSION_CHANGE",								// EMIITED // Should emit when mission has changed
	EVENT_HAS_DAILYCHECKIN = "EVENT_HAS_DAILYCHECKIN",

	EVENT_DOG_TUTORIAL_MOVE_DONE = "EVENT_DOG_TUTORIAL_MOVE_DONE"
}

interface GameEventMap
{
	[GameEvent.EVENT_NEW_PROFILE_CREATED]: () => void;
	[GameEvent.EVENT_PROFILE_LOADED]: () => void;
	[GameEvent.EVENT_PROFILE_SAVED]: () => void;

	[GameEvent.EVENT_CURRENCY_ADD]: (nameString: string, amountAdd: number, finalAmount: number) => void;
	[GameEvent.EVENT_CURRENCY_LOSE]: (nameString: string, amountLost: number, finalAmount: number) => void;
	[GameEvent.EVENT_CURRENCY_CHANGE]: (nameString: string, lastAmount: number, finalAmount: number) => void;

	[GameEvent.EVENT_FACILITY_INVENTORY_ADD]: (facilityId: string, count: number) => void;
	[GameEvent.EVENT_FACILITY_INVENTORY_REMOVE]: (facilityId: string) => void;
	[GameEvent.EVENT_FACILITY_INVENTORY_LEVEL_UP]: (facilityId: string, currentLevel: number) => void;
	[GameEvent.EVENT_PARK_SET_FACILITY]: (facilityId: string, locationIndex: number) => void;
	[GameEvent.EVENT_PARK_REMOVE_FACILITY]: (facilityId: string, locationIndex: number) => void;

	[GameEvent.EVENT_PARK_DOG_UNLOCKED]: () => void;

	[GameEvent.EVENT_WATCH_AD]: () => void;
	[GameEvent.EVENT_CAT_START_PLAYING]: (catData: CatData, locationIndex: number) => void;
	[GameEvent.EVENT_CAT_DONE_PLAYING]: (catData: CatData, locationIndex: number) => void;
	[GameEvent.EVENT_CAT_SHOW_UP]: (id: string) => void;

	[GameEvent.EVENT_SWITCH_MAIN_GAME]: () => void;
	[GameEvent.EVENT_SWITCH_PUZZLE]: () => void;

	[GameEvent.EVENT_PUZZLE_COMPLETE_SESSION]: (completedSession: PuzzleSession) => void;
	[GameEvent.EVENT_PUZZLE_PAUSE_SESSION]: (session: PuzzleSession) => void;
	[GameEvent.EVENT_PUZZLE_USE_BOOSTER]: (type: Booster) => void;

	[GameEvent.EVENT_STORE_BUY_WITH_CURRENCY]: () => void;
	[GameEvent.EVENT_STORE_BUY_REAL_MONEY]: () => void;

	[GameEvent.EVENT_COMPLETE_MISSION]: (missionId: string) => void;
	[GameEvent.EVENT_COLLECTED_ALL_COMPLETE_MISSION]: () => void;
	[GameEvent.EVENT_MISSION_CHANGE]: () => void;
	[GameEvent.EVENT_DOG_TUTORIAL_MOVE_DONE]: () => void;
	[GameEvent.EVENT_HAS_DAILYCHECKIN]: () => void;
}

/**
 * Class to manage game events throughout the whole game
 */
export class GameEventManager implements IManager
{
	private _target: EventTarget;
	private _initialized: boolean = false;

	public initialize()
	{
		// Make targets
		this._target = new EventTarget();

		this._initialized = true;
	}

	public progress(): number
	{
		return this._initialized ? 1 : 0;
	}

	public initializationCompleted(): boolean
	{
		return this._initialized;
	}

	/**
	 * Subcribe to event.
	 * 
	 * @param eventType Type of event
	 * @param callback Callback to invoke.
	 * @param thisArg this argument to use inside of the event.
	 */
	public on<K extends keyof GameEventMap>(eventType: K, callback: GameEventMap[K], thisArg?: any)
	{
		if (!this._initialized)
		{
			throw new Error("Please do not call on/once/off/emit before the component is initialized");
		}

		this._target.on(eventType, callback, thisArg);
	}

	/**
	 * Subscibe to event, but unsubscribe itself on one invocation.
	 * 
	 * @param eventType Type of event
	 * @param callback Callback to invoke.
	 * @param thisArg this argument to use inside of the event.
	 */
	public once<K extends keyof GameEventMap>(eventType: K, callback: GameEventMap[K], thisArg?: any)
	{
		if (!this._initialized)
		{
			throw new Error("Please do not call on/once/off/emit before the component is initialized");
		}

		this._target.once(eventType, callback, thisArg);
	}

	/**
	 * Unsubscibe to event.
	 * 
	 * @param eventType Type of event
	 * @param callback Callback to invoke.
	 * @param thisArg this argument to use inside of the event.
	 */
	public off<K extends keyof GameEventMap>(eventType: K, callback: GameEventMap[K], thisArg?: any)
	{
		if (!this._initialized)
		{
			throw new Error("Please do not call on/once/off/emit before the component is initialized");
		}

		this._target.off(eventType, callback, thisArg);
	}

	/**
	 * Emit an event.
	 * 
	 * WARNING: Be careful and match to arguments to the event's delegate type, or things will go very wrong.
	 * 
	 * DO NOT call this directly unless you're coding a manager class.
	 *
	 * @param eventType Type to emit
	 * @param args Arguments to emit
	 */
	public emit<K extends keyof GameEventMap>(eventType: K, missionArg: any, ...args: any[])
	{
		if (!this._initialized)
		{
			throw new Error("Please do not call on/once/off/emit before the component is initialized");
		}

		console.log("Event emitted: ", eventType.toString());
		console.log("Args: ", missionArg, args);
		this._target.emit(eventType, args[0], args[1], args[2], args[3], args[4]);

		// Special for mission
		MainGameManager.instance.missionManager.onGameEvent(GameEvent[eventType], missionArg);
	}
}
