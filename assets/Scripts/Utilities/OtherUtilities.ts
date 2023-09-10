
import { _decorator, Node, UITransform, Vec2, Vec3 } from 'cc';
import { isBetween } from './NumberUtilities';
import { GameSound } from '../MainGame/Managers/AudioManager';
export class Bound
{
	xMin: number;
	xMax: number;
	yMin: number;
	yMax: number;

	public constructor(xMin: number, xMax: number, yMin: number, yMax: number)
	{
		this.xMin = xMin;
		this.xMax = xMax;
		this.yMin = yMin;
		this.yMax = yMax;
	}
}

export function getWorldBounds(node: Node): Bound
{
	let uiTransform = node.getComponent(UITransform);

	if (uiTransform)
	{
		let bound = new Bound(
			node.worldPosition.x - uiTransform.contentSize.width / 2,
			node.worldPosition.x + uiTransform.contentSize.width / 2,
			node.worldPosition.y - uiTransform.contentSize.height / 2,
			node.worldPosition.y + uiTransform.contentSize.height / 2);
		return bound;
	}
	else
	{
		return new Bound(node.worldPosition.x, node.worldPosition.x, node.worldPosition.y, node.worldPosition.y);
	}
}

export function mergeBounds(...args: Bound[]): Bound
{
	if (!args || args.length === 0)
	{
		return null;
	}

	let result = new Bound(args[0].xMin, args[0].xMax, args[0].yMin, args[0].yMax);
	for (let bound of args)
	{
		result.xMin = Math.min(result.xMin, bound.xMin);
		result.xMax = Math.max(result.xMax, bound.xMax);
		result.yMin = Math.min(result.yMin, bound.yMin);
		result.yMax = Math.max(result.yMax, bound.yMax);
	}

	return result;
}

export function isVec2InBounds(position: Vec2, bound: Bound)
{
	return isBetween(position.x, bound.xMin, bound.xMax) && isBetween(position.y, bound.yMin, bound.xMax);
}

export function isVec3InBounds(position: Vec3, bound: Bound)
{
	return isBetween(position.x, bound.xMin, bound.xMax) && isBetween(position.y, bound.yMin, bound.xMax);
}

export function getScoreSoundOf(lineCount: number): GameSound
{
	if (lineCount == 1) return GameSound.SCORE_1;
	if (lineCount == 2) return GameSound.SCORE_2;
	if (lineCount == 3) return GameSound.SCORE_3;
	if (lineCount == 4) return GameSound.SCORE_4;
	if (lineCount == 5) return GameSound.SCORE_5;
	if (lineCount >= 6) return GameSound.SCORE_6;
}

export function addTagsForMissionName(input: string): string {
	const regex = /\"([^\"]*)\"/g;
	const matches = input.match(regex);
	
	if (!matches) {
	  return `<color=#621824>${input}</color>`;
	}
	
	const substrings = matches.map(match => match.slice(1,-1));
	const replacedString = input.replace(regex, "<color=#df3651>\"$1\"</color>");
	
	return `<color=#621824>${replacedString}</color>`;
}