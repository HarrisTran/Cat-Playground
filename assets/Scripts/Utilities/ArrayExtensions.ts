import { randomRange, randomRangeInt } from "cc";

export function getRandom<T>(array: Array<T>): T
{
	let rand = randomRangeInt(0, array.length - 1);
	return array[rand];
}

export function shuffleInPlace<T>(array: Array<T>)
{
	array.sort((a, b) => b[1] === a[1] ? randomRange(-0.5, 0.5) : b[1] - a[1]);
}

export function last<T>(array: Array<T>): T
{
	return array[array.length - 1];
}

export function first<T>(array: Array<T>): T
{
	return array[0];
}