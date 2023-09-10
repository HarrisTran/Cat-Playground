import { _decorator, Camera, Component, EventMouse, EventTouch, Input, input, instantiate, Node, PhysicsSystem2D, PolygonCollider2D, Prefab, Rect, Size, sys, UITransform, Vec2, Vec3, Widget } from 'cc';
import { PieceBlock } from './PuzzleComponents/PieceBlock';
import { TetrominoPiece } from './PuzzleComponents/TetrominoPiece';
import { PlayerInteractable } from '../Common/PlayerInteractable';
import { TetrominoPlayerInteractable } from './TetrominoPlayerInteractable';
const { ccclass, property } = _decorator;

export class HoldEventData
{
	mouseWorldPosition: Vec3;
}

export enum ControlMode
{
	DISABLED,
	NORMAL,
	BREAK,
	ROTATE
}

export interface IPuzzlePlayerInteractable
{
	onControlModeChange(mode: ControlMode);
	}

@ccclass('PuzzlePlayerControl')
export class PuzzlePlayerControl extends Component
{
	@property(Camera)
	public camera: Camera;

	private _controlMode: ControlMode;

	private _allInteractables: Set<IPuzzlePlayerInteractable> = new Set<IPuzzlePlayerInteractable>();

	public initialize(): void
	{
		this.setControlMode(ControlMode.DISABLED);
	}

	public addInteractable(interactable: IPuzzlePlayerInteractable)
	{
		this._allInteractables.add(interactable);
	}

	public removeInteractable(interactable: IPuzzlePlayerInteractable)
	{
		this._allInteractables.delete(interactable);
	}

	public setControlMode(mode: ControlMode)
	{
		this._controlMode = mode;

		for (let interactable of this._allInteractables)
		{
			interactable.onControlModeChange(this._controlMode);
		}
	}

	private raycastTetromino(pos: Vec3): TetrominoPiece
	{
		let results = PhysicsSystem2D.instance.testAABB(new Rect(pos.x, pos.y));

		let found: TetrominoPiece = null;
		let i = 0;
		while (i < results.length && found === null)
		{
			let collider = results[i];
			if (collider.node.getComponent(TetrominoPiece) !== null)
			{
				found = collider.node.getComponent(TetrominoPiece);
			}
			++i;
		}

		return found;
	}

	private raycastPieceBlock(pos: Vec3): PieceBlock
	{
		let results = PhysicsSystem2D.instance.testAABB(new Rect(pos.x, pos.y));
		let found: PieceBlock = null;
		let i = 0;
		while (i < results.length && found === null)
		{
			let collider = results[i];
			if (collider.node.getComponent(PieceBlock) !== null)
			{
				found = collider.node.getComponent(PieceBlock);
			}
			++i;
		}

		return found;
	}
}