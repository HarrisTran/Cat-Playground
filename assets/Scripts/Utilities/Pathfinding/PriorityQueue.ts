const top = 0;
const parent: (number) => number = i => ((i + 1) >>> 1) - 1;
const left: (number) => number = i => (i << 1) + 1;
const right: (number) => number = i => (i + 1) << 1;

export class PriorityQueue<T> 
{
	private _comparator: (a: T, b: T) => boolean;
	private _heap: T[];

	public constructor(comparator: (a: T, b: T) => boolean)
	{
		this._comparator = comparator;
		this._heap = [];
	}

	public size(): number
	{
		return this._heap.length;
	}

	public isEmpty(): boolean
	{
		return this.size() === 0;
	}

	public peek(): T
	{
		return this._heap[top];
	}

	public push(...values: T[])
	{
		values.forEach(v => {
			this._heap.push(v);
			this._shiftUp();
		});
	}

	public pop(): T
	{
		let value = this.peek();

		let bottom = this.size() - 1;
		if (bottom > top)
		{
			this._swap(top, bottom);
		}
		this._heap.pop();
		this._shiftDown();

		return value;
	}

	public replace(value)
	{
		let replacedValue = this.peek();
		this._heap[top] = value;
		this._shiftDown();
		return replacedValue;
	}

	private _greater(i, j)
	{
		return this._comparator(this._heap[i], this._heap[j]);
	}

	private _swap(i: number, j: number)
	{
		[this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
	}

	private _shiftUp()
	{
		let node = this.size() - 1;
		while (node > top && this._greater(node, parent(node)))
		{
			this._swap(node, parent(node));
			node = parent(node);
		}
	}

	private _shiftDown()
	{
		let node = top;
		while ((left(node) < this.size() && this._greater(left(node), node)) ||
			(right(node) < this.size() && this._greater(right(node), node)))
		{
			let maxChild = (right(node) < this.size() && this._greater(right(node), left(node)))
				? right(node) : left(node);
			this._swap(node, maxChild);
			node = maxChild;
		}
	}
}