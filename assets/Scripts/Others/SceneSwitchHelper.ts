import { _decorator, Component, Node } from 'cc';
import { MainGameManager } from '../MainGame/MainGameManager';
import { PuzzleGameManager } from '../Puzzle/PuzzleGameManager';
const { ccclass, property } = _decorator;

@ccclass("SceneSwitchHelper")
export class SceneSwitchHelper extends Component
{
	public switchToPuzzle()
	{
		MainGameManager.instance.requestPlayPuzzle();
	}

	public switchToMainGame()
	{
		PuzzleGameManager.instance.requestBackToMainScene();
		MainGameManager.instance.requestPlayMainGame();
	}
}

