import { MainGameManager } from "../MainGameManager";
import { GameEventManager } from "./GameEventManager";
import { PlayerDataManager } from "./PlayerDataManager";

export function getPlayerDataManager(): PlayerDataManager
{
	return MainGameManager.instance.playerDataManager;
}

export function getGameEventManager(): GameEventManager
{
	return MainGameManager.instance.gameEventManager;
}