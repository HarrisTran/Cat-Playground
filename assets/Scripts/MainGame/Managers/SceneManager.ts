import { AnimationClip, AssetManager, JsonAsset, Sprite, SpriteAtlas, SpriteFrame, TextAsset, assetManager, director, profiler, resources } from "cc";
import { IManager } from "./IManager";
import { LoadingScreen } from "../UI/LoadingScreen";

export const MAIN_GAME_SCENE_NAME: string = "GameScene";
export const PUZZLE_SCENE_NAME: string = "PuzzleScene";

export class SceneManager
{
	private _isLoadingAScene: boolean;

	public preloadScene(sceneName: string, progressCallback: (ratio: number) => void, loadDoneCallback: () => void)
	{
		if (this._isLoadingAScene)
		{
			throw new Error("A scene is already being loaded, loading failed");
		}

		director.preloadScene(sceneName, (progress, total, item) =>
		{
			progressCallback(progress / total);
		}, (err, sceneAsset) =>
		{
			if (err)
			{
				console.error(err);
				return;
			}
			else
			{
				this._isLoadingAScene = false;

				// Invoke callback
				loadDoneCallback();
			}
		});

		this._isLoadingAScene = true;
	}

	public jumpToScene(sceneName: string, jumpDoneCallback: () => void)
	{
		director.loadScene(sceneName, (err, scene) =>
		{
			if (err)
			{
				console.error(err);
				return;
			}
			else
			{
				// Invoke callback
				jumpDoneCallback();
			}
		});
	}
}