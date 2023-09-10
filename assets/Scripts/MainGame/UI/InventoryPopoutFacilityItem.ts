import { _decorator, CCFloat, Component, EventTouch, Node, PhysicsSystem2D, Rect, Size, Sprite, SpriteFrame, UIOpacity, UITransform, Vec3 } from 'cc';
import { MainGameManager } from '../MainGameManager';
import { InventoryPopup } from './InventoryPopup';
import { FacilityComponent } from '../Facilities/FacilityComponent';
import { GameSound } from '../Managers/AudioManager';
import { InventoryDragItem } from './InventoryDragItem';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { TutorialPropagator } from '../../Tutorial/TutorialPropagator';
import { InventoryFacilityScreen } from './InventoryFacilityScreen';
import { UIButton } from '../../Common/UI/UIButton';
const { ccclass, property } = _decorator;


@ccclass('InventoryPopoutFacilityItem')
export class InventoryPopoutFacilityItem extends Component
{
	@property(Sprite)
	private background: Sprite;
	@property(Sprite)
	private smallBackground: Sprite;
	@property(Sprite)
	private appearance: Sprite;
	@property(LocalizedLabel)
	private numbering: LocalizedLabel;
	@property({type: CCFloat})
	private appearanceSize: number = 100;
	@property(Node)
	private numberNode: Node;
	@property(Node)
	private tickNode: Node;
	@property(UIButton)
	private button: UIButton;
	@property(UIOpacity)
	private opacity: UIOpacity;

	private _parentScreen: InventoryFacilityScreen = null;
	private _dragItem: InventoryDragItem;
	private _dragItemTargetSize: Size;

	private _facilityId: string;
	private _facilitySpriteFrame: SpriteFrame;

	private _lastFacility: FacilityComponent;

	private _isEmpty: boolean = true;
	private _count: number = 0;
	private _selected: boolean = false;

	public get isEmpty(): boolean
	{
		return this._isEmpty;
	}

	public get facilityId(): string
	{
		return this._facilityId;
	}

	public get count(): number
	{
		return this._count;
	}

	public setFacilityScreen(obj: InventoryFacilityScreen)
	{
		this._parentScreen = obj;
	}

	public setItem(id: string, sprite: SpriteFrame, count: number)
	{
		this._facilityId = id;
		this._isEmpty = false;
		this._count = count;
		this.smallBackground.node.active = false;
		this.background.node.active = true;
		this.appearance.node.active = true;
		this.button.interactable = true;

		this._facilitySpriteFrame = sprite;

		this._selected = false;

		// size mod
		var ratio = this._facilitySpriteFrame.rect.width / this._facilitySpriteFrame.rect.height;
		var width = ratio >= 1 ? this.appearanceSize : ratio * this.appearanceSize;
		var height = ratio < 1 ? this.appearanceSize : (1 / ratio) * this.appearanceSize;
		this.appearance.getComponent(UITransform).setContentSize(new Size(width, height));

		this.appearance.spriteFrame = this._facilitySpriteFrame;

		this.numberNode.active = true;
		this.numbering.stringRaw = count.toString();
		this.tickNode.active = false;

	}

	public markSelected()
	{
		this.tickNode.active = true;
		this._selected = true;
	}

	public setFaded(value: boolean)
	{
		this.opacity.opacity = value ? 100 : 255;
	}

	public setAsEmpty()
	{
		this._facilityId = "";
		this._isEmpty = true;
		this._count = 0;
		this._selected = false;
		this.smallBackground.node.active = true;
		this.background.node.active = false;
		this.appearance.node.active = false;
		this.button.interactable = false;
		this.tickNode.active = false;
	}

	public onClick()
	{
		if (this._selected || this._count > 0)
		{
			this._parentScreen.onItemClick(this._facilityId);
		}
	}

	// public onMoveStart(event: EventTouch)
	// {
	// 	if (this._isEmpty || this._count === 0) return;

	// 	MainGameManager.instance.audioManager.playSfx(GameSound.UI_GRABOBJECT);

	// 	this._dragItem = this._parentPopout.getDragItem();

	// 	let screenPos = event.getLocation();
	// 	let pos = MainGameManager.instance.camera.screenToWorld(new Vec3(screenPos.x, screenPos.y));
	// 	this._dragItem.node.parent = MainGameManager.instance.gameCanvas.node;
	// 	this._dragItem.node.worldPosition = pos;
	// 	this._dragItem.node.active = true;

	// 	this._dragItem.setFacility(this._facilityId);

	// 	this._dragItemTargetSize = this._dragItem.getComponent(UITransform).contentSize;
	// 	// this._dragItem.getComponent(UITransform).contentSize = this.getComponent(UITransform).contentSize;

	// 	MainGameManager.instance.parkManager.showPlacementFrames();

	// 	this._parentPopout.temporarilyHide();

	// }

	// public onMove(event: EventTouch)
	// {
	// 	if (this._isEmpty || this._count === 0) return;

	// 	let screenPos = event.getLocation();

	// 	let pos = MainGameManager.instance.camera.screenToWorld(new Vec3(screenPos.x, screenPos.y));
	// 	this._dragItem.node.parent = MainGameManager.instance.gameCanvas.node;
	// 	this._dragItem.node.worldPosition = pos;

	// 	// Ray cast to facility
	// 	let facility = this.raycastFacility(this._dragItem.node.worldPosition.clone());

	// 	if (facility !== null)
	// 	{
	// 		facility.showPreviewOf(this._facilityId);
	// 		this._dragItem.setVisible();
	// 		this._lastFacility = facility;
	// 		this._dragItem.node.worldPosition = facility.node.worldPosition;
	// 	}
	// 	else if (this._lastFacility !== null && this._lastFacility !== undefined)
	// 	{
	// 		this._lastFacility.hidePreviewOf(this._facilityId);
	// 		this._dragItem.setDim();
	// 	}
	// }

	// public onMoveEnd(event: EventTouch)
	// {
	// 	if (this._isEmpty || this._count === 0) return;

	// 	let screenPos = event.getLocation();
	// 	let pos = MainGameManager.instance.camera.screenToWorld(new Vec3(screenPos.x, screenPos.y));
	// 	this._dragItem.node.parent = MainGameManager.instance.gameCanvas.node;
	// 	this._dragItem.node.worldPosition = pos;

	// 	let shouldShowImmediately = true;

	// 	// Ray cast to facility
	// 	let facility = this.raycastFacility(pos);
	// 	if (facility !== null)
	// 	{
	// 		if (MainGameManager.instance.tutorialManager.isPlayingTutorial)
	// 		{
	// 			if (facility.getComponent(TutorialPropagator)
	// 				&& facility.getComponent(TutorialPropagator).identifier === "SLOT_0")
	// 			{
	// 				facility.replaceFacility(this._facilityId, () => this._parentPopout.showAfterTemporarilyHide(true));
	// 				shouldShowImmediately = false;
	// 			}
	// 		}
	// 		else
	// 		{
	// 			facility.replaceFacility(this._facilityId, () => this._parentPopout.showAfterTemporarilyHide(true));
	// 			shouldShowImmediately = false;
	// 		}

	// 		MainGameManager.instance.audioManager.playSfx(GameSound.UI_DROPOBJECTONSAND);
	// 	}
	// 	else
	// 	{
	// 		MainGameManager.instance.audioManager.playSfx(GameSound.UI_DROPOBJECT);
	// 	}

	// 	if (this._lastFacility)
	// 	{
	// 		this._lastFacility.hidePreviewOf(this._facilityId);
	// 	}

	// 	// Turn off dragitem
	// 	this._dragItem.node.parent = this._parentPopout.node;
	// 	this._dragItem.getComponent(UITransform).contentSize = this._dragItemTargetSize;
	// 	this._dragItem.node.active = false;

	// 	this._dragItem.setNone();

	// 	// Detach
	// 	this._lastFacility = null;
	// 	this._dragItem = null;

	// 	MainGameManager.instance.parkManager.hidePlacementFrames();

	// 	// Show again
	// 	if (shouldShowImmediately)
	// 	{
	// 		this._parentPopout.showAfterTemporarilyHide(false);
	// 	}
	// }

	private raycastFacility(pos: Vec3): FacilityComponent
	{
		let results = PhysicsSystem2D.instance.testAABB(new Rect(pos.x, pos.y));
		let found: FacilityComponent = null;
		let i = 0;
		while (i < results.length && found === null)
		{
			let collider = results[i];
			if (collider.node.getComponent(FacilityComponent) !== null)
			{
				found = collider.node.getComponent(FacilityComponent);
			}
			++i;
		}

		return found;
	}
}