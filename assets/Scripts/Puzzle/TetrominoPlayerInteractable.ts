import { _decorator, CCBoolean, CCFloat, Component, EventHandler, EventTouch, Node, NodeEventType } from 'cc';
import { PlayerInteractable } from '../Common/PlayerInteractable';
import { ControlMode, IPuzzlePlayerInteractable } from './PuzzlePlayerControl';
import { PuzzleGameManager } from './PuzzleGameManager';
const { ccclass, property } = _decorator;

@ccclass('TetrominoPlayerInteractable')
export class TetrominoPlayerInteractable extends PlayerInteractable implements IPuzzlePlayerInteractable
{
    public addToControlHelper()
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
            if (mode === ControlMode.NORMAL)
            {
                this.registerClick = false;
                this.registerMove = true;
                this.activate();
            }
            else if (mode == ControlMode.ROTATE)
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

