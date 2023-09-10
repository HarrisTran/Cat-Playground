import { _decorator, AudioClip, Component, Game, Node, resources } from 'cc';
import { IManager } from './IManager';
const { ccclass, property } = _decorator;

export class NotificationManager implements IManager
{
	private _initialized: boolean = false;

	public initialize()
	{
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
}