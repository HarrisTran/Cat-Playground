import { _decorator, Component, Label, Node, Sprite, Vec3, Animation, EventTouch, tween, Game, UIOpacity } from 'cc';
import { MainGameManager } from '../MainGameManager';
import { getCatAnimId } from '../../Utilities/AnimationClipMaker';
import { DogAnimState, DogBehaviour, DogState } from './DogBehaviour';
import { CurrencyDrop } from '../Facilities/CurrencyDrop';
import { VFXCallback } from '../../VFXs/VFXCallback';
import { GamePopupCode } from '../../Common/UI/GamePopupCode';
import { PopUpBoost } from '../UI/PopUp/PopUpBoost';
import { Emote, EmoteType } from './Emote';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
import { formatHoursMinsSeconds } from '../../Utilities/NumberUtilities';
import { PlayerInteractable } from '../../Common/PlayerInteractable';
const { ccclass, property } = _decorator;

/**
 * Class that represents a dog in the scene. Should be attached to top-level dog node.
 *
 * Should be controlled by a DogBehaviour, and not vice-versa.
 */
@ccclass('DogAvatar')
export class DogAvatar extends Component
{
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private appearanceNode: Node;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Sprite })
    private sprite: Sprite;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: UIOpacity })
    private opacity: UIOpacity;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Label })
    private debugText: Label;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Label })
    private debugAnimText: Label;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Label })
    private debugNameText: Label;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Animation })
    private animation: Animation;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: VFXCallback })
    private smokeVfx: VFXCallback;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Emote })
    private emote: Emote;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private interactableNode: Node;

    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
    private timerNode: Node;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Sprite })
    private timerFill: Sprite;
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: LocalizedLabel })
    private timer: LocalizedLabel;

    private _dogBehaviour: DogBehaviour = null;     // Back reference to a cat behaviour, this is important

    public get dogBehaviour(): DogBehaviour
    {
        return this._dogBehaviour;
    }

    protected onLoad(): void
    {
        
    }

    /**
     * Activate the avatar, which makes it visible in the Scene.
     *
     * Needs assigning a DogBehaviour before activating.
     *
     * Will refresh its appearance to fit the assigned DogBehaviour
     */
    public activate()
    {
        if (this._dogBehaviour !== null)
        {
            this.refreshAppearance();

            this.node.active = true;
        }
        else
        {
            throw new Error("DogAvatar requested activation but no DogAvatar is set, please check.");
        }
    }


    /**
     * Deactivate the dog avatar, which makese it invisible.
     *
     * Will not remove its Dogbahaviour reference.
     */
    public deactivate()
    {
        this.node.active = false;
    }

    public popSmoke()
    {
        this.smokeVfx.requestPlayDefaultClip();
    }

    public popEmote(type: EmoteType, time: number)
    {
        this.emote.activate(type, time);
    }



    /**
     * Set a back reference to the DogBehaviour. Please call this when set avatar for the DogBehaviour.
     *
     * Note: This does not update the appearance until activate() is called.
     * @param dog The DogBehaviour to set.
     */
    public setDogBehaviour(dog: DogBehaviour)
    {
        this._dogBehaviour = dog;
    }

    /**
     * Update the world position of the avatar. Should only be called from DogBehaviour.
     * @param pos position to update to.
     */
    public updateWorldPosition(pos: Vec3)
    {
        this.node.worldPosition = pos;
    }

    /**
     * Update the state debug text. Should only be called from DogBehaviour.
     * @param pos position to update to.
     */
    public updateDebugStateText(state: DogState)
    {
        this.debugText.string = DogState[state];
    }

    /**
     * Update the anim state debug text. Should only be called from DogBehaviour.
     * @param pos position to update to.
     */
    public updateDebugAnimStateText(state: DogAnimState)
    {
        this.debugAnimText.string = DogAnimState[state];
    }

    public updateTimer(active: boolean, time: number, totalTime: number)
    {
        if (active)
        {
            this.timerNode.active = true;
            this.timer.stringRaw = Math.floor(time).toString();
            this.timerFill.fillRange = time / totalTime;
        }
        else
        {
            this.timerNode.active = false;
        }
    }

    public playAnim(animState: DogAnimState)
    {
        // TODO: Wait for anim to test

        if (this.dogBehaviour !== null && this.dogBehaviour !== undefined)
        {
            if (animState === DogAnimState.IDLE)
            {
                this.playAnimName("DogIdle");
            }
            else if (animState === DogAnimState.MOVING)
            {
                this.playAnimName("DogWalking");
            }
        }
    }

    public onUserClick(event: EventTouch)
    {
        this.requestDogBoostPopup();
    }

    public setFlip(flip: boolean)
    {
        this.sprite.node.setRotationFromEuler(new Vec3(0, flip ? 180 : 0, 0));
    }

    /**
     * Update the cat avatar appearance to fit the CatBehaviour assigned to.
     */
    private refreshAppearance()
    {
        this.updateDebugStateText(this._dogBehaviour.state);
        this.updateDebugAnimStateText(this._dogBehaviour.animState);
        this.timerNode.active = false;
        this.debugNameText.string = "Dog";
    }

    private playAnimName(animId: string)
    {
        this.animation.play(animId);
    }

    public requestDogBoostPopup()
    {
        if (this.dogBehaviour && !MainGameManager.instance.catManager.dogBoosted)
        {
            this.dogBehaviour.onUserClick();

            tween(this.node)
                .to(0.1, { scale: new Vec3(0.8, 0.8, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();

            MainGameManager.instance.mainGameUI?.getPopupManager().showPopUp(GamePopupCode.POPUP_BOOST);
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
}