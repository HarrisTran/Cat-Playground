import { PriorityQueue } from "./PriorityQueue";

export class SquareGridCoordinate
{
	x: number;
	y: number;

	public constructor(x: number, y: number)
	{
		this.x = x;
		this.y = y;
	}
}

export class SquareGrid
{
	private _width: number;
	private _height: number;
	private _unwalkables: Set<number>;

	public constructor(width: number, height: number, unwalkables?: SquareGridCoordinate[])
	{
		this._width = width;
		this._height = height;

		if (unwalkables)
		{
			this._unwalkables = new Set<number>(unwalkables.map(x => this.toIndex(x)));
		}
		else
		{
			this._unwalkables = new Set<number>();
		}
	}

	public addUnwalkable(coord: SquareGridCoordinate)
	{
		this._unwalkables.add(this.toIndex(coord));
	}

	public addUnwalkables(coords: SquareGridCoordinate[])
	{
		for (let coord of coords)
		{
			this.addUnwalkable(coord);
		}
	}

	public isInBounds(coord: SquareGridCoordinate): boolean
	{
		return 0 <= coord.x && coord.x < this._width && 0 <= coord.y && coord.y < this._height;
	}

	public isWalkable(coord: SquareGridCoordinate): boolean
	{
		return !this._unwalkables.has(this.toIndex(coord));
	}

	public getNeighbors(coord: SquareGridCoordinate): SquareGridCoordinate[]
	{
		let res: SquareGridCoordinate[] = (coord.x + coord.y % 2) ?
			[
				new SquareGridCoordinate(coord.x + 1, coord.y),
				new SquareGridCoordinate(coord.x - 1, coord.y),
				new SquareGridCoordinate(coord.x, coord.y - 1),
				new SquareGridCoordinate(coord.x, coord.y + 1),
				new SquareGridCoordinate(coord.x + 1, coord.y - 1),
				new SquareGridCoordinate(coord.x - 1, coord.y - 1),
				new SquareGridCoordinate(coord.x + 1, coord.y + 1),
				new SquareGridCoordinate(coord.x - 1, coord.y + 1),
			] :
			[
				new SquareGridCoordinate(coord.x, coord.y - 1),
				new SquareGridCoordinate(coord.x - 1, coord.y),
				new SquareGridCoordinate(coord.x + 1, coord.y),
				new SquareGridCoordinate(coord.x, coord.y + 1),
				new SquareGridCoordinate(coord.x - 1, coord.y + 1),
				new SquareGridCoordinate(coord.x + 1, coord.y + 1),
				new SquareGridCoordinate(coord.x - 1, coord.y - 1),
				new SquareGridCoordinate(coord.x + 1, coord.y - 1),
			];

		return res.filter(coord => this.isInBounds(coord) && this.isWalkable(coord));
	}

	// TODO: Support for removing unwalkables

	public toIndex(coord: SquareGridCoordinate): number
	{
		return coord.y * this._width + coord.x;
	}

	public toCoordinate(index: number): SquareGridCoordinate
	{
		return new SquareGridCoordinate(index % this._width, Math.floor(index / this._width));
	}
}

class QueueItem
{
	index: number;
	cost: number;
}

export class SquareGridPathfinder
{
	private _grid: SquareGrid;

	public addGrid(grid: SquareGrid)
	{
		this._grid = grid;
	}

	public getPath(start: SquareGridCoordinate, end: SquareGridCoordinate, reverseResult: boolean = false, includeStart: boolean = false): SquareGridCoordinate[]
	{
		let startIndex = this._grid.toIndex(start);
		let endIndex = this._grid.toIndex(end);
		let frontier = new PriorityQueue<QueueItem>((a: QueueItem, b: QueueItem) =>
		{
			return a.cost < b.cost;
		});

		frontier.push({ index: startIndex, cost: 0 });

		let cameFrom = new Map<number, number>();
		let costSoFar = new Map<number, number>();
		costSoFar.set(startIndex, 0);

		let foundPath = false;
		while (!frontier.isEmpty())
		{
			let item = frontier.pop();
			let currentIndex = item.index;

			if (currentIndex === endIndex)
			{
				foundPath = true;
				break;
			}

			let curr = this._grid.toCoordinate(currentIndex);
			for (let next of this._grid.getNeighbors(curr))
			{
				let nextIndex = this._grid.toIndex(next);
				let newCost = costSoFar.get(currentIndex) + (Math.abs(next.x - curr.x) + Math.abs(next.y - curr.y));

				if (!cameFrom.has(nextIndex) || newCost < costSoFar.get(nextIndex))
				{
					costSoFar.set(nextIndex, newCost);
					let item = { index: nextIndex, cost: newCost };
					frontier.push(item);
					cameFrom.set(nextIndex, currentIndex);
				}
			}
		}

		// Get path
		if (foundPath)
		{
			let path: SquareGridCoordinate[] = [];
			let currIndex = endIndex;
			while (currIndex !== startIndex)
			{
				let prevIndex = cameFrom.get(currIndex);
				path.push(this._grid.toCoordinate(currIndex));
				currIndex = prevIndex;
				if (includeStart)
				{
					path.push(start);
				}
			}

			// Reverse
			if (!reverseResult)
			{
				path.reverse();
			}
			return path;
		}
		else
		{
			return null;
		}
	}
}