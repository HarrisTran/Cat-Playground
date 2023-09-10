import { _decorator, CCString, Component, EventTouch, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { TutorialPropagator } from './TutorialPropagator';
import { PlayerInteractable } from '../Common/PlayerInteractable';
const { ccclass, property } = _decorator;

@ccclass("CutsceneItem")
export class CutsceneItem extends Component
{
	@property([SpriteFrame])
	public sprites: SpriteFrame[] = [];
}