import { AnimationClip, AssetManager, ImageAsset, JsonAsset, Sprite, SpriteAtlas, SpriteFrame, TextAsset, Texture2D, assetManager, log, resources } from "cc";
import { CatData } from "../Cats/CatData";
import { FacilityData } from "../Facilities/FacilityData";
import { IManager } from "./IManager";
import { FacilityComponent } from "../Facilities/FacilityComponent";
import { Currency, FISH_CURRENCY, HARD_CURRENCY, SOFT_CURRENCY } from "../../PlayerData/Currency";
import { PlayerData } from "../../PlayerData/PlayerData";
import { getBlockAnimId, getCatAnimId, makeBlockAnimationClip, makeCatAnimationClip, makeFacilityAnimationClip } from "../../Utilities/AnimationClipMaker";
import { CatFoodData } from "../Facilities/CatFoodData";
import { PuzzleLevelData } from "../../Puzzle/PuzzleLevelData";
import { MainGameManager } from "../MainGameManager";

export class PuzzleProperties
{
	fishChance: number;
	weights: Array<readonly [string, number]>;
}

export class ResourceManager implements IManager
{
	private static readonly CAT_JSON_FOLDER_PATH: string = "Jsons/Cats";
	private static readonly FACILITY_JSON_FOLDER_PATH: string = "Jsons/Facilities";
	private static readonly CAT_FOOD_JSON_FOLDER_PATH: string = "Jsons/CatFoods";
	private static readonly CAT_SPRITE_1_FOLDER_PATH: string = "Sprites/Cats1";
	private static readonly CAT_SPRITE_2_FOLDER_PATH: string = "Sprites/Cats2";
	private static readonly FACILITY_ANIM_SPRITE_FOLDER_PATH: string = "Sprites/Facilities";
	private static readonly FACILITY_SPRITE_FOLDER_PATH: string = "Sprites/FacilitySprites";
	private static readonly PUZZLE_LEVEL_DATA_PATH: string = "Jsons/puzzle_levels";
	private static readonly PUZZLE_PROPERTIES_PATH: string = "Jsons/puzzle_properties";
	private static readonly PUZZLE_BLOCK_PATH: string = "Sprites/PuzzleBlocks";

	private _cats: Map<string, CatData>;
	private _facilities: Map<string, FacilityData>;
	private _catFoods: Map<string, CatFoodData>;
	private _emptyFacility: FacilityData;
	private _catSprites: Map<string, Map<string, (readonly [SpriteFrame, number])[]>>;
	private _catUISprites: Map<string, SpriteFrame>;
	private _catAnimations: Map<string, AnimationClip>;
	private _facilityAnimSprites: Map<string,(readonly [SpriteFrame, number])[]>;
	private _facilitySprites: Map<string, SpriteFrame>;
	private _facilityAnimations: Map<string, AnimationClip>;
	private _puzzleProperties: PuzzleProperties;
	private _puzzleLevelData: Array<PuzzleLevelData>;
	private _puzzleBlockSprites: Map<string, Map<string, (readonly [SpriteFrame, number])[]>>;
	private _puzzleBlockAnims: Map<string, AnimationClip>;

	private _catSpriteAnimRegex: RegExp;
	private _facilitySpriteAnimRegex: RegExp;
	private _puzzleBlockAnimRegex: RegExp;

	private _jsonCatProgress: number;
	private _jsonCatDone: boolean;
	private _jsonCatFoodProgress: number;
	private _jsonCatFoodDone: boolean;
	private _jsonFacilityProgress: number;
	private _jsonFacilityDone: boolean;
	private _catSprite1Progress: number;
	private _catSprite2Progress: number;
	private _catSprite1Done: boolean;
	private _catSprite2Done: boolean;
	private _facilitySpriteProgress: number;
	private _facilitySpriteDone: boolean;

	private _puzzleDataProgress: number;
	private _puzzleDataDone: boolean;

	private _currentPuzzleBlockSet: string;

	// Initialization and Loading

	public initialize()
	{
		this._cats = new Map<string,CatData>();
		this._facilities = new Map<string, FacilityData>();

		this._catSpriteAnimRegex = new RegExp("(\\w+)_anim_(\\w+)_(\\d+)(?:x(\\d+))?", "g");
		this._facilitySpriteAnimRegex = new RegExp("(\\w+)_(\\d+)(?:x(\\d+))?", "g");
		this._puzzleBlockAnimRegex = new RegExp("(\\w+)_anim_(\\w+)_(\\d+)(?:x(\\d+))?", "g");

		this.startLoadJsons();
		this.startLoadSpriteAtlases();
	}

	public progress(): number
	{
		let arr: number[] = [
			this._jsonCatProgress,
			this._jsonFacilityProgress,
			this._catSprite1Progress,
			this._catSprite2Progress,
			this._jsonCatFoodProgress,
			this._facilitySpriteProgress,
			];
		return arr.reduce((t, curr) => t + curr, 0) / arr.length;
	}

	public initializationCompleted(): boolean
	{
		let arr: boolean[] = [
			this._jsonCatDone,
			this._jsonFacilityDone,
			this._catSprite1Done,
			this._catSprite2Done,
			this._jsonCatFoodDone,
			this._facilitySpriteDone
		];
		return arr.every(x => x);
	}

	private startLoadJsons()
	{
		this._jsonFacilityDone = false;
		this._jsonFacilityProgress = 0;

		// Load facilities
		resources.loadDir(ResourceManager.FACILITY_JSON_FOLDER_PATH, JsonAsset,
			(finish, total, item) =>
			{
				this._jsonFacilityProgress = finish / total;
			},
			(err, assets) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					this._facilities = new Map<string, FacilityData>

					for (let asset of assets)
					{
						let data = new FacilityData();
						data.from(asset.json);
						if (data.id === "empty")
						{
							this._emptyFacility = data;

							continue;
						}

						this._facilities.set(data.id, data);
					}
				}

				this._jsonFacilityProgress = 1;
				this._jsonFacilityDone = true;
			});

		this._jsonCatDone = false;
		this._jsonCatProgress = 0;

		// Load cats
		resources.loadDir(ResourceManager.CAT_JSON_FOLDER_PATH, JsonAsset,
			(finish, total, item) =>
			{
				this._jsonCatProgress = finish / total;
			},
			(err, assets) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					this._cats = new Map<string, CatData>

					for (let asset of assets)
					{
						let data = new CatData();
						data.from(asset.json);
						this._cats.set(data.id, data);
					}
				}

				this._jsonCatProgress = 1;
				this._jsonCatDone = true;
			});

		
		this._jsonCatFoodDone = false;
		this._jsonCatFoodProgress = 0;

		// Load cat food
		resources.loadDir(ResourceManager.CAT_FOOD_JSON_FOLDER_PATH, JsonAsset,
			(finish, total, item) =>
			{
				this._jsonCatFoodProgress = finish / total;
			},
			(err, assets) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					this._catFoods = new Map<string, CatFoodData>

					for (let asset of assets)
					{
						let data = new CatFoodData();
						data.from(asset.json);
						this._catFoods.set(data.id, data);
					}
				}

				this._jsonCatFoodProgress = 1;
				this._jsonCatFoodDone = true;
			});

		// Load puzzle datas
		resources.load(ResourceManager.PUZZLE_LEVEL_DATA_PATH, JsonAsset, (err, asset) =>
		{
			if (err)
			{
				console.error(err);
			}
			else
			{
				this._puzzleLevelData = [];
				for (let i = 0; i < asset.json.length; ++i)
				{
					let level = asset.json[i];
					this._puzzleLevelData.push(level);
				}
			}

			this._puzzleDataProgress = 1;
			this._puzzleDataDone = true;
		});

		
		// Load puzzle datas
		resources.load(ResourceManager.PUZZLE_PROPERTIES_PATH, JsonAsset, (err, asset) =>
		{
			if (err)
			{
				console.error(err);
			}
			else
			{
				this._puzzleProperties = new PuzzleProperties();
				this._puzzleProperties.fishChance = asset.json["fishChance"];
				this._puzzleProperties.weights = asset.json["weights"];
			}

			this._puzzleDataProgress = 1;
			this._puzzleDataDone = true;
		});
	}

	private startLoadSpriteAtlases()
	{
		this._catSprite1Done = false;
		this._catSprite1Progress = 0;

		this._catUISprites = new Map<string, SpriteFrame>();

		// Load cat
		resources.loadDir(ResourceManager.CAT_SPRITE_1_FOLDER_PATH, SpriteAtlas,
			(finish, total, item) =>
			{
				this._catSprite1Progress = finish / total;
			},
			(err, assets) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					// Organize all frames
					if (!this._catSprites)
						this._catSprites = new Map<string, Map<string, (readonly [SpriteFrame, number])[]>>();
					for (let asset of assets)
					{
						for (let frame of asset.getSpriteFrames())
						{
							let frameName = frame.name;
							let tokens = frameName.split('/');
							frameName = tokens[tokens.length - 1];
							let result = this._catSpriteAnimRegex.exec(frameName);
							this._catSpriteAnimRegex.lastIndex = 0;		// reset regex

							if (result === null)
							{
								console.warn("SpriteFrame " + frameName + " in " + asset.name + " does not fit naming scheme. Please check");
								continue;
							}

							let catId = result[1];
							if (!this._catSprites.has(catId))
							{
								this._catSprites.set(catId, new Map<string, (readonly [SpriteFrame, number])[]>);
							}
							let thisCatMap = this._catSprites.get(catId);

							let animId = result[2];
							if (!thisCatMap.has(animId))
							{
								thisCatMap.set(animId, []);
							}
							let thisAnimFrames = thisCatMap.get(animId);

							let index = parseInt(result[3]);
							let repeat = result[4] === undefined ? 1 : parseInt(result[4]);
							thisAnimFrames[index] = [frame, repeat];

							if (animId === "Idle")
							{
								this._catUISprites.set(catId, frame);
							}
						}
					}

					// Create animation clips
					if (!this._catAnimations)
						this._catAnimations = new Map<string, AnimationClip>();
					for (let [cat, map] of this._catSprites)
					{
						for (let [anim, frames] of map)
						{
							let animName = getCatAnimId(cat, anim);
							let clip = this.getCatAnimationClip(frames);
							this._catAnimations.set(animName, clip);
						}
					}
				}

				this._catSprite1Progress = 1;
				this._catSprite1Done = true;
			});

		this._catSprite2Done = false;
		this._catSprite2Progress = 0;

		// Load cat
		resources.loadDir(ResourceManager.CAT_SPRITE_2_FOLDER_PATH, SpriteAtlas,
			(finish, total, item) => {
				this._catSprite1Progress = finish / total;
			},
			(err, assets) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					// Organize all frames
					if (!this._catSprites)
						this._catSprites = new Map<string, Map<string, (readonly [SpriteFrame, number])[]>>();

					for (let asset of assets)
					{
						for (let frame of asset.getSpriteFrames())
						{
							let frameName = frame.name;
							let tokens = frameName.split('/');
							frameName = tokens[tokens.length - 1];
							let result = this._catSpriteAnimRegex.exec(frameName);
							this._catSpriteAnimRegex.lastIndex = 0;		// reset regex

							if (result === null)
							{
								console.warn("SpriteFrame " + frameName + " in " + asset.name + " does not fit naming scheme. Please check");
								continue;
							}

							let catId = result[1];
							if (!this._catSprites.has(catId))
							{
								this._catSprites.set(catId, new Map<string, (readonly [SpriteFrame, number])[]>);
							}
							let thisCatMap = this._catSprites.get(catId);

							let animId = result[2];
							if (!thisCatMap.has(animId))
							{
								thisCatMap.set(animId, []);
							}
							let thisAnimFrames = thisCatMap.get(animId);

							let index = parseInt(result[3]);
							let repeat = result[4] === undefined ? 1 : parseInt(result[4]);
							thisAnimFrames[index] = [frame, repeat];
						}
					}

					// Create animation clips
					if (!this._catAnimations)
						this._catAnimations = new Map<string, AnimationClip>();
					for (let [cat, map] of this._catSprites) {
						for (let [anim, frames] of map) {
							let animName = getCatAnimId(cat, anim);
							let clip = this.getCatAnimationClip(frames);
							this._catAnimations.set(animName, clip);
						}
					}
				}

				this._catSprite2Progress = 1;
				this._catSprite2Done = true;
			});

		this._facilitySpriteDone = false;
		this._facilitySpriteProgress = 0;

		// Load facilities
		resources.loadDir(ResourceManager.FACILITY_SPRITE_FOLDER_PATH, SpriteFrame,
			(finish, total, item) =>
			{
				// TODO
			},
			(err, assets) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					this._facilitySprites = new Map<string, SpriteFrame>();
					for (let frame of assets)
					{
						this._facilitySprites.set(frame.name, frame);
					}
				}
			}
		);

		resources.loadDir(ResourceManager.FACILITY_ANIM_SPRITE_FOLDER_PATH, SpriteAtlas,
			(finish, total, item) =>
			{
				this._catSprite1Progress = finish / total;
			},
			(err, assets) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					// Organize all frames
					this._facilityAnimSprites = new Map<string, (readonly [SpriteFrame, number])[]>();
					for (let asset of assets)
					{
						for (let frame of asset.getSpriteFrames())
						{
							let frameName = frame.name;
							let tokens = frameName.split('/');
							frameName = tokens[tokens.length - 1];
							let result = this._facilitySpriteAnimRegex.exec(frameName);
							this._facilitySpriteAnimRegex.lastIndex = 0;
							// reset regex
							if (result === null)
							{
								console.warn("SpriteFrame " + frameName + " in " + asset.name + " does not fit naming scheme. Please check");
								continue;
							}

							let facilityId = result[1];
							if (!this._facilityAnimSprites.has(facilityId))
							{
								this._facilityAnimSprites.set(facilityId, []);
							}
							let thisFacilityFrames = this._facilityAnimSprites.get(facilityId);

							let index = parseInt(result[2]);
							let repeat = result[3] === undefined ? 1 : parseInt(result[3]);
							thisFacilityFrames[index] = [frame, repeat];
						}
					}

					// Create animation clips
					this._facilityAnimations = new Map<string, AnimationClip>();
					for (let [facilityId, frames] of this._facilityAnimSprites)
					{
						let clip = this.getFacilityAnimationClip(frames);
						this._facilityAnimations.set(facilityId, clip);
					}
				}

				this._facilitySpriteProgress = 1;
				this._facilitySpriteDone = true;
			});

		
		// Load initial block anim
		// TODO: Swticher
		this.loadPuzzleBlockSet("paw", null);
	}


	public loadPuzzleBlockSet(setName: string, onDoneAction: () => void)
	{
		if (setName === this._currentPuzzleBlockSet) return;

		resources.load(ResourceManager.PUZZLE_BLOCK_PATH + "/" + setName, SpriteAtlas,
			(finish, total, item) =>
			{
				this._catSprite1Progress = finish / total;
			},
			(err, asset) =>
			{
				if (err)
				{
					console.error(err);
				}
				else
				{
					this._puzzleBlockSprites = new Map<string, Map<string, (readonly [SpriteFrame, number])[]>>();
					// Organize all frames
					for (let frame of asset.getSpriteFrames())
					{
						let frameName = frame.name;
						let tokens = frameName.split('/');
						frameName = tokens[tokens.length - 1];
						let result = this._puzzleBlockAnimRegex.exec(frameName);
						this._puzzleBlockAnimRegex.lastIndex = 0;		// reset regex

						if (result === null)
						{
							console.warn("SpriteFrame " + frameName + " in " + asset.name + " does not fit naming scheme. Please check");
							continue;
						}

						let blockId = result[1];
						if (!this._puzzleBlockSprites.has(blockId))
						{
							this._puzzleBlockSprites.set(blockId, new Map<string, (readonly [SpriteFrame, number])[]>);
						}
						let thisBlockMap = this._puzzleBlockSprites.get(blockId);

						let animId = result[2];
						if (!thisBlockMap.has(animId))
						{
							thisBlockMap.set(animId, []);
						}
						let thisAnimFrames = thisBlockMap.get(animId);

						let index = parseInt(result[3]);
						let repeat = result[4] === undefined ? 1 : parseInt(result[4]);
						thisAnimFrames[index] = [frame, repeat];
					}
				}

				this._puzzleBlockAnims = new Map<string, AnimationClip>();
				for (let [block, map] of this._puzzleBlockSprites)
				{
					for (let [anim, frames] of map)
					{
						let animName = getBlockAnimId(block, anim);
						let clip = this.getBlockAnimationClip(frames);
						this._puzzleBlockAnims.set(animName, clip);
					}
				}

				if (onDoneAction) onDoneAction();
			});
	}



	// Data retrieval methods

	public getAllFacilityIds(ascending: boolean = true): string[]
	{
		return ascending ?
			[...this._facilities.keys()].sort((id1, id2) =>
			{
				return id1.localeCompare(id2);
			}) :
			[...this._facilities.keys()].sort((id1, id2) =>
			{
				return id2.localeCompare(id1);
			});
	}

	public getAllFacilityIdsSortedByBR(ascending: boolean = true): string[]
	{
		return ascending ?
			[...this._facilities.keys()].sort((id1, id2) =>
			{
				return this._facilities.get(id1).blockRequired - this._facilities.get(id2).blockRequired;
			}) :
			[...this._facilities.keys()].sort((id1, id2) =>
			{
				return -this._facilities.get(id1).blockRequired + this._facilities.get(id2).blockRequired;
			});
	}

	public getAllFacilityIdsByPayout(playerLevels: Map<string, number>, ascending: boolean): string[]
	{
		return ascending ?
			[...this._facilities.keys()].sort((id1, id2) =>
			{
				return Currency.compare(this._facilities.get(id1).payout[playerLevels.has(id1) ? playerLevels[id1] - 1 : 0],
										this._facilities.get(id1).payout[playerLevels.has(id2) ? playerLevels[id2] - 1 : 0]);
			}) :
			[...this._facilities.keys()].sort((id1, id2) =>
			{
				return Currency.compare(this._facilities.get(id1).payout[playerLevels.has(id2) ? playerLevels[id2] - 1 : 0],
										this._facilities.get(id1).payout[playerLevels.has(id1) ? playerLevels[id1] - 1 : 0]);
			});
	}

	public getAllFacilityIdsOfType(type: string): string[]
	{
		return [...this._facilities.keys()].filter((id) => 
		{
			return this._facilities.get(id).type === type;
		})
	}

	public getAllCatIds(ascending: boolean = true): string[]
	{
		return ascending ?
			[...this._cats.keys()].sort((id1, id2) =>
			{
				return id1.localeCompare(id2);
			}) :
			[...this._cats.keys()].sort((id1, id2) =>
			{
				return id2.localeCompare(id1);
			});
	}

	public getAllCatFoodIds(ascending: boolean = true): string[]
	{
		return ascending ?
			[...this._catFoods.keys()].sort((id1, id2) =>
			{
				return id1.localeCompare(id2);
			}) :
			[...this._catFoods.keys()].sort((id1, id2) =>
			{
				return id2.localeCompare(id1);
			});
	}

	public getEmptyFacilityData(): FacilityData
	{
		return this._emptyFacility.clone();
	}

	public getFacilityData(id: string): FacilityData
	{
		return id === "empty" ? this.getEmptyFacilityData() : this._facilities.get(id).clone();
	}

	public getCatData(id: string): CatData
	{
		return this._cats.get(id).clone();
	}

	public getCatFoodData(id: string): CatFoodData
	{
		return this._catFoods.get(id).clone();
	}
	
	public getLevelData(levelNumber: number): PuzzleLevelData
	{
		return levelNumber < this._puzzleLevelData.length ? this._puzzleLevelData[levelNumber] : null;
	}

	public getPuzzleFishChance(): number
	{
		return this._puzzleProperties.fishChance;
	}

	public getPuzzleWeights(): Array<readonly [string, number]>
	{
		return this._puzzleProperties.weights;
	}

	public getCatAnimation(catId: string, animId: string): readonly [AnimationClip, string]
	{
		let fullName = getCatAnimId(catId, animId);
		return [this._catAnimations.get(fullName), fullName];
	}

	public getCatUISprite(catId: string): SpriteFrame
	{
		return this._catUISprites.get(catId);
	}

	public getFacilityUISprite(facilityId: string): SpriteFrame
	{
		return this._facilitySprites.get(facilityId) ? this._facilitySprites.get(facilityId) : null;
	}

	public getFacilityAnimation(facilityId: string): AnimationClip
	{
		if (!this._facilityAnimations.has(facilityId))
		{
			// Not found? blank anim
			let clip = makeFacilityAnimationClip([null]);
			this._facilityAnimations.set(facilityId, clip);
		}

		return this._facilityAnimations.get(facilityId);
	}

	public getBlockAnimation(blockId: string, animId: string): readonly [AnimationClip, string]
	{
		let fullName = getBlockAnimId(blockId, animId);
		return [this._puzzleBlockAnims.get(fullName), fullName];
	}

	public getBlockPreview(blockId: string): SpriteFrame
	{
		return this._puzzleBlockSprites.get(blockId).get("still")[0][0];
	}


    public convertToCoinUsingRate(currency: Currency): Currency
    {
        if (currency.nameString === SOFT_CURRENCY)
        {
            return currency.clone();
        }
        else if (currency.nameString === HARD_CURRENCY)
        {
            return Currency.getSoftCurrency(Math.ceil(currency.amount * this.getConversionRateOfGemToCoin()));
        }
        else
        {
            throw new Error("Cannot convert from " + currency.nameString + " to coin.")
        }
    }

    public convertToFishUsingRate(currency: Currency): Currency
    {
        if (currency.nameString === FISH_CURRENCY)
        {
            return currency.clone();
        }
        else if (currency.nameString === HARD_CURRENCY)
        {
            return Currency.getSoftCurrency(Math.ceil(currency.amount * this.getConversionRateOfGemToFish()));
        }
        else
        {
            throw new Error("Cannot convert from " + currency.nameString + " to fish.")
        }
    }
	
	public convertToGemUsingRate(currency: Currency): Currency
    {
        if (currency.nameString === HARD_CURRENCY)
        {
            return currency.clone();
        }
        else if (currency.nameString === FISH_CURRENCY)
        {
            return Currency.getHardCurrency(Math.ceil(currency.amount / this.getConversionRateOfGemToFish()));
        }
		else if (currency.nameString === SOFT_CURRENCY)
		{
            return Currency.getHardCurrency(Math.ceil(currency.amount / this.getConversionRateOfGemToCoin()));
		}
        else
        {
            throw new Error("Cannot convert from " + currency.nameString + " to gem.")
        }
    }


	// Private helpers

    private getConversionRateOfGemToCoin(): number
    {
        let allIds: [string, Currency][] = MainGameManager.instance.playerDataManager.getAllPlayerFacilityIds().map(x => x[0])
			.map(x => [x, this.getFacilityData(x).payout[MainGameManager.instance.playerDataManager.getFacilityLevel(x) - 1]]);
        
        allIds.sort((a, b) => b[1].amount - a[1].amount);

        let rate = 0;
        if (allIds.length > 0)
        {
            rate = allIds[0][1].amount;
        }
        else
        {
			rate = this.getFacilityData("Toy_0").payout[0].amount;
        }

        console.log("Exchange gem -> coin rate: ", rate);

        return rate;
    }

    private getConversionRateOfGemToFish()
    {
        let rate = this.getConversionRateOfGemToCoin() / 4;

        console.log("Exchange gem -> fish rate: ", rate);

        return rate;
    }

	private getCatAnimationClip(frames: (readonly [SpriteFrame, number])[]) : AnimationClip
	{
		let expandedFrames = [];
		for (let [frame, repeat] of frames)
		{
			for (let i = 0; i < repeat; ++i)
			{
				expandedFrames.push(frame);
			}
		}

		let clip = makeCatAnimationClip(expandedFrames, 2);
		return clip;
	}

	private getFacilityAnimationClip(frames: (readonly [SpriteFrame, number])[]) : AnimationClip
	{
		let expandedFrames = [];
		for (let data of frames)
		{
			var frame = data[0];
			var repeat = data[1];
			for (let i = 0; i < repeat; ++i)
			{
				expandedFrames.push(frame);
			}
		}

		let clip = makeFacilityAnimationClip(expandedFrames, 2);
		return clip;
	}

	private getBlockAnimationClip(frames: (readonly [SpriteFrame, number])[]) : AnimationClip
	{
		let expandedFrames = [];
		for (let [frame, repeat] of frames)
		{
			for (let i = 0; i < repeat; ++i)
			{
				expandedFrames.push(frame);
			}
		}

		let clip = makeBlockAnimationClip(expandedFrames, 2);
		return clip;
	}
}