import { _decorator, AnimationClip, SpriteFrame, animation } from "cc";
const { ccclass, property } = _decorator;
const { ObjectTrack, TrackPath } = animation;

export function makeCatAnimationClip(frames: SpriteFrame[], wrapMode: number = 2, samples: number = 30)
{
	const clip = new AnimationClip();
	clip.sample = samples || clip.sample;
	clip.duration = frames.length / clip.sample;
	const step = 1 / clip.sample;
	const track = new ObjectTrack<SpriteFrame>();
	track.path =  new TrackPath().toHierarchy("CatSprite").toComponent('cc.Sprite').toProperty('spriteFrame');
	const curve = track.channels()[0].curve;
	curve.assignSorted(frames.map((spriteFrame, index) => [step * index, spriteFrame]));
	clip.addTrack(track);
	clip.wrapMode = wrapMode; 					// Don't ask. Don't want to know why Cocos doesn't expose this...
	return clip;
}

export function makeFacilityAnimationClip(frames: SpriteFrame[], wrapMode: number = 2, samples: number = 30)
{
	const clip = new AnimationClip();
	clip.sample = samples || clip.sample;
	clip.duration = frames.length / clip.sample;
	const step = 1 / clip.sample;
	const track = new ObjectTrack<SpriteFrame>();
	track.path =  new TrackPath().toHierarchy("FacilitySprite").toComponent('cc.Sprite').toProperty('spriteFrame');
	const curve = track.channels()[0].curve;
	curve.assignSorted(frames.map((spriteFrame, index) => [step * index, spriteFrame]));
	clip.addTrack(track);
	clip.wrapMode = wrapMode; 					// Don't ask. Don't want to know why Cocos doesn't expose this...
	return clip;
}


export function makeBlockAnimationClip(frames: SpriteFrame[], wrapMode: number = 2, samples: number = 16)
{
	const clip = new AnimationClip();
	clip.sample = samples || clip.sample;
	clip.duration = frames.length / clip.sample;
	const step = 1 / clip.sample;
	const track = new ObjectTrack<SpriteFrame>();
	track.path = new TrackPath().toComponent('cc.Sprite').toProperty('spriteFrame');
	const curve = track.channels()[0].curve;
	curve.assignSorted(frames.map((spriteFrame, index) => [step * index, spriteFrame]));
	clip.addTrack(track);
	clip.wrapMode = wrapMode; 					// Don't ask. Don't want to know why Cocos doesn't expose this...
	return clip;
}

export function getCatAnimId(catId: string, animId: string)
{
	return catId + "_anim_" + animId;
}

export function getBlockAnimId(blockId: string, animId: string)
{
	return blockId + "_anim_" + animId;
}