import { _decorator, CCFloat, Color, Component, lerp, Sprite, tween, Tween, UIOpacity } from 'cc';
import { PuzzleGameManager } from './PuzzleGameManager';
const { ccclass, property } = _decorator;

class DarkenTarget
{
	public value: number;
	public targetColor: Color;
	public targetOpacity: number;
}

@ccclass('PuzzleDarkenHelper')
export class PuzzleDarkenHelper extends Component
{
	@property({ group: { name: "Configurations 1", id: "1", displayOrder: 1 }, type: Sprite })
	private c1sprites: Sprite[] = [];
	@property({ group: { name: "Configurations 1", id: "1", displayOrder: 1 }, type: UIOpacity })
	private c1opacities: UIOpacity[] = [];

	@property({ group: { name: "Configurations 2", id: "2", displayOrder: 2 }, type: Sprite })
	private c2sprites: Sprite[] = [];
	@property({ group: { name: "Configurations 2", id: "2", displayOrder: 2 }, type: UIOpacity })
	private c2opacities: UIOpacity[] = [];

	@property({ group: { name: "Configurations 3", id: "3", displayOrder: 3 }, type: Sprite })
	private c3sprites: Sprite[] = [];
	@property({ group: { name: "Configurations 3", id: "3", displayOrder: 3 }, type: UIOpacity })
	private c3opacities: UIOpacity[] = [];

	@property({ group: { name: "Params", id: "4", displayOrder: 4 }, type: Color })
	private darkenColorTarget: Color;
	@property({ group: { name: "Params", id: "4", displayOrder: 4 }, type: CCFloat })
	private darkenOpacityTarget: number;
	@property({ group: { name: "Params", id: "4", displayOrder: 4 }, type: CCFloat })
	private animTime: number = 0.35;

	private _darkenTweens: Tween<DarkenTarget>[];

	protected onLoad(): void
	{
		this._darkenTweens = [null, null, null];
	}

	protected onDestroy(): void
	{
		for (let tween of this._darkenTweens)
		{
			if (tween)
				tween.stop();
		}
	}

	public requestDarken(setNumber: number, doneAction?: () => void)
	{
		if (setNumber < 0 || setNumber >= this._darkenTweens.length) return;

		if (this._darkenTweens[setNumber] !== null)
		{
			this._darkenTweens[setNumber].stop();
			this.onTweenCompleted(setNumber);
		}

		let sprites: Sprite[];
		let opacities: UIOpacity[];

		if (setNumber === 0)
		{
			sprites = [...this.c1sprites, ...PuzzleGameManager.instance.puzzleGrid.getCellSprites(),
				...PuzzleGameManager.instance.puzzleGrid.getBlockSprites(),
				...PuzzleGameManager.instance.boosterManager.getDarkenableSprites(setNumber)];
			opacities = this.c1opacities;
		}
		else if (setNumber === 1)
		{
			sprites = [...this.c2sprites, ...PuzzleGameManager.instance.puzzleGrid.getCellSprites(),
				...PuzzleGameManager.instance.tetrominoQueue.getBlockSprites(),
				...PuzzleGameManager.instance.boosterManager.getDarkenableSprites(setNumber)];
			opacities = this.c2opacities;
		}
		else if (setNumber === 2)
		{
			sprites = this.c3sprites;
			opacities = this.c3opacities;
		}

		let target = new DarkenTarget();
		target.value = 0;
		target.targetColor = this.darkenColorTarget;
		target.targetOpacity = this.darkenOpacityTarget;

		let callback = () =>
		{
			this.onTweenCompleted(setNumber);
			if (doneAction) doneAction();
		}

		let t = tween(target).to(this.animTime, { value: 1 },
			{
				easing: "cubicOut",
				onUpdate: (target: DarkenTarget, ratio) =>
				{
					let color: Color = new Color();
					for (let sprite of sprites)
					{
						color = Color.lerp(color, Color.WHITE, target.targetColor, target.value);
						sprite.color = color;
					}

					for (let opac of opacities)
					{
						let value = lerp(0, target.targetOpacity, target.value);
						opac.opacity = value;
					}
				},
			}).call(callback).start();
		
		this._darkenTweens[setNumber] = t;
	}

	public requestBrighten(setNumber: number, doneAction?: () => void)
	{
		if (setNumber < 0 || setNumber >= this._darkenTweens.length) return;

		if (this._darkenTweens[setNumber] !== null)
		{
			this._darkenTweens[setNumber].stop();
			this.onTweenCompleted(setNumber);
		}

		let sprites: Sprite[];
		let opacities: UIOpacity[];

		if (setNumber === 0)
		{
			sprites = [...this.c1sprites, ...PuzzleGameManager.instance.puzzleGrid.getCellSprites(),
				...PuzzleGameManager.instance.puzzleGrid.getBlockSprites(),
				...PuzzleGameManager.instance.boosterManager.getDarkenableSprites(setNumber)];
			opacities = this.c1opacities;
		}
		else if (setNumber === 1)
		{
			sprites = [...this.c2sprites, ...PuzzleGameManager.instance.puzzleGrid.getCellSprites(),
				...PuzzleGameManager.instance.tetrominoQueue.getBlockSprites(),
				...PuzzleGameManager.instance.boosterManager.getDarkenableSprites(setNumber)];
			opacities = this.c2opacities;
		}
		else if (setNumber === 2)
		{
			sprites = this.c3sprites;
			opacities = this.c3opacities;
		}

		let target = new DarkenTarget();
		target.value = 1;
		target.targetColor = this.darkenColorTarget;
		target.targetOpacity = this.darkenOpacityTarget;

		let callback = () =>
		{
			this.onTweenCompleted(setNumber);
			if (doneAction) doneAction();
		}

		let t = tween(target).to(this.animTime, { value: 0 },
			{
				easing: "cubicOut",
				onUpdate: (target: DarkenTarget, ratio) =>
				{
					let color: Color = new Color();
					for (let sprite of sprites)
					{
						color = Color.lerp(color, Color.WHITE, target.targetColor, target.value);
						sprite.color = color;
					}

					for (let opac of opacities)
					{
						let value = lerp(0, target.targetOpacity, target.value);
						opac.opacity = value;
					}
				},
			}).call(callback).start();
		
		this._darkenTweens[setNumber] = t;
	}

	private onTweenCompleted(setNumber: number)
	{
		if (this._darkenTweens[setNumber] !== null)
		{
			this._darkenTweens[setNumber] = null;
		}
	}
}