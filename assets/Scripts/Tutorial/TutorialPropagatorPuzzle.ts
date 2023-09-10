import { _decorator } from 'cc';
import { ITutorialPropagatorTarget, TutorialPropagator } from './TutorialPropagator';
import { PuzzlePlayerControl } from '../Puzzle/PuzzlePlayerControl';
const { ccclass, property } = _decorator;

/**
 * Component 
 */
@ccclass("TutorialPropagatorPuzzle")
export class TutorialPropagatorPuzzle extends TutorialPropagator
{
	@property(PuzzlePlayerControl)
	private control: PuzzlePlayerControl;

	protected onLoad(): void
	{
		super.onLoad();

		this.addArbitraryTarget(this.control);
	}
}
