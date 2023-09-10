import { _decorator, Component, Label, Node, Sprite, Vec3, Animation, EventTouch, UIOpacity } from 'cc';
import { MainGameManager } from '../MainGameManager';
import { CatAnimState, CatBehaviour, CatState } from './CatBehaviour';
import { getCatAnimId } from '../../Utilities/AnimationClipMaker';
import { VFXCallback } from '../../VFXs/VFXCallback';
import { Emote, EmoteType } from './Emote';
import { PlayerInteractable } from '../../Common/PlayerInteractable';
import { GameSound } from '../Managers/AudioManager';
const { ccclass, property } = _decorator;

/**
 * Class that represents a cat in the scene. Should be attached to top-level cat node.
 *
 * Should be controlled by a CatBehaviour, and not vice-versa.
 */
@ccclass('CatAvatar')
export class CatAvatar extends Component
{
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private appearanceNode: Node;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Sprite })
    private sprite: Sprite;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: UIOpacity })
    private opacity: UIOpacity;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: VFXCallback })
    private vfx: VFXCallback;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Label })
    private debugText: Label;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Label })
    private debugAnimText: Label;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Label })
    private debugNameText: Label;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Animation })
    private animation: Animation;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Emote })
    private emote: Emote;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private interactableNode: Node;

    private _catBehaviour: CatBehaviour = null;     // Back reference to a cat behaviour, this is important

    public get catBehaviour(): CatBehaviour
    {
        return this._catBehaviour;
    }

    protected onLoad(): void
    {
        this.vfx.node.active = false;
    }

    /**
     * Activate the cat avatar, which makes it visible in the Scene.
     *
     * Needs assigning a CatBehaviour before activating.
     *
     * Will refresh its appearance to fit the assigned CatBehaviour
     */
    public activate()
    {
        if (this._catBehaviour !== null)
        {
            this.refreshAppearance();

            this.node.active = true;
            this.addAnimOfCurrentCat("Idle");
            this.addAnimOfCurrentCat("Walking");
        }
        else
        {
            throw new Error("CatAvatar requested activation but no CatBehaviour is set, please check.");
        }
    }


    /**
     * Deactivate the cat avatar, which makese it invisible.
     *
     * Will not remove its CatBehaviour reference.
     */
    public deactivate()
    {
        this.node.active = false;
    }

    /**
     * Set a back reference to the CatBehaviour. Please call this when set avatar for the CatBehaviour.
     *
     * Note: This does not update the appearance until activate() is called.
     * @param cat The CatBehaviour to set.
     */
    public setCatBehaviour(cat: CatBehaviour)
    {
        this._catBehaviour = cat;
    }

    /**
     * Update the world position of the avatar. Should only be called from CatBehaviour.
     * @param pos position to update to.
     */
    public updateWorldPosition(pos: Vec3)
    {
        this.node.worldPosition = pos;
    }

    /**
     * Update the state debug text. Should only be called from CatBehaviour.
     * @param pos position to update to.
     */
    public updateDebugStateText(state: CatState)
    {
        // this.debugText.string = CatState[state];
    }

    /**
     * Update the anim state debug text. Should only be called from CatBehaviour.
     * @param pos position to update to.
     */
    public updateDebugAnimStateText(state: CatAnimState)
    {
        // this.debugAnimText.string = CatAnimState[state];
    }

    public playAnim(animState: CatAnimState, extraId: string)
    {
        // TODO: Wait for anim to test

        if (this.catBehaviour !== null && this.catBehaviour !== undefined)
        {
            if (animState === CatAnimState.IDLE)
            {
                this.playAnimOfCurrentCat("Idle");
            }
            else if (animState === CatAnimState.MOVING)
            {
                this.playAnimOfCurrentCat("Walking");
            }
            else if (animState === CatAnimState.USING_FACILITY)
            {
                this.addAnimOfCurrentCat(extraId);
                this.playAnimOfCurrentCat(extraId);
            }
        }
    }

    public popSmoke()
    {
        MainGameManager.instance.audioManager.playSfx(GameSound.SMOKE_SOUND);
        this.vfx.requestPlayDefaultClip();
    }

    public popEmote(type: EmoteType, time: number)
    {
        this.emote.activate(type, time);
    }

    public onUserClick(event: EventTouch)
    {
        if (this.catBehaviour)
        {
            this.catBehaviour.onUserClick();
        }
    }

    public makeInvisible()
    {
        this.opacity.opacity = 0;

        if (this.getComponent(PlayerInteractable) !== null)
        {
            this.getComponent(PlayerInteractable).enabled = false;
        }

        this.interactableNode.active = false;
    }

    public makeVisible()
    {
        this.opacity.opacity = 255;

        if (this.getComponent(PlayerInteractable) !== null)
        {
            this.getComponent(PlayerInteractable).enabled = true;
        }

        this.interactableNode.active = true;
    }


    /**
     * Update the cat avatar appearance to fit the CatBehaviour assigned to.
     */
    private refreshAppearance()
    {
        this.updateDebugStateText(this._catBehaviour.state);
        this.updateDebugAnimStateText(this._catBehaviour.animState);
        this.debugNameText.string = this.catBehaviour.data.id;
    }

    private addAnimOfCurrentCat(animId: string)
    {
        let [anim, name] = MainGameManager.instance.resourceManager.getCatAnimation(this.catBehaviour.data.id, animId);
        if (anim && this.animation.clips.indexOf(anim) < 0)
        {
            this.animation.addClip(anim, name);
        }
    }

    private playAnimOfCurrentCat(animId: string)
    {
        this.animation.play(getCatAnimId(this.catBehaviour.data.id, animId));
    }
}