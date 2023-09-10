import { _decorator, CCBoolean, CCFloat, Component, EventHandler, EventTouch, Node, NodeEventType } from 'cc';
import { PlayerInteractable } from '../Common/PlayerInteractable';
import { ControlMode, IPuzzlePlayerInteractable } from './PuzzlePlayerControl';
import { PuzzleGameManager } from './PuzzleGameManager';
const { ccclass, property } = _decorator;

@ccclass('PieceBlockPlayerInteractable')
export class PieceBlockPlayerInteractable extends PlayerInteractable implements IPuzzlePlayerInteractable
{
    protected start(): void
    {
        PuzzleGameManager.instance.playerControl.addInteractable(this);
    }

    public onControlModeChange(mode: ControlMode)
    {
        if (mode === ControlMode.DISABLED)
        {
            this.deactivate();
        }
        else
        {
            if (mode === ControlMode.BREAK)
            {
                this.registerClick = true;
                this.registerMove = false;
                this.activate();
            }
            else
            {
                this.deactivate();
            }
        }
    }
}

