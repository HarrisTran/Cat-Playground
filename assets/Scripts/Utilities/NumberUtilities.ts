import { GameSound } from "../MainGame/Managers/AudioManager";
import { MersenneTwister } from "./MersenneTwister";

export function isBetween(value: number, bound1: number, bound2: number): boolean
{
	return Math.min(bound1, bound2) <= value && value <= Math.max(bound1, bound2);
}

export function isExclusivelyBetween(value: number, bound1: number, bound2: number): boolean
{
	return Math.min(bound1, bound2) < value && value < Math.max(bound1, bound2);
}

export const formatMiliseconds = (milliseconds) =>
{
	const hours = Math.floor(milliseconds / 3600000).toString();
	const minutes = Math.floor((milliseconds % 3600000) / 60000);
	const seconds = Math.floor(((milliseconds % 360000) % 60000) / 1000);
	return `${hours}:${minutes}:${seconds}`;
};

export const formatHoursMinsSeconds = (time) => {
	const hours = Math.floor(time / 3600).toString();
	const minutes = Math.floor((time % 3600) / 60);
	const seconds = Math.floor(((time % 3600) % 60));
	return `${hours}:${minutes}:${seconds}`;
};

export const formatMinsSeconds = (time) => {
	const minutes = Math.floor((time % 3600) / 60);
	const seconds = Math.floor(((time % 3600) % 60));
	return `${minutes}:${seconds}`;
}

export function getRandomElementInArray<T>(z : T[]){
	var base = new MersenneTwister(100);
	return z[~~base.random()*z.length];
}