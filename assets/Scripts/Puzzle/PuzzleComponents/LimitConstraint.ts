
export class LimitConstraint
{
    public indexes: Set<number>;

    public constructor(indexes: number[])
    {
        this.indexes = new Set<number>();
        for (let index of indexes)
        {
            this.indexes.add(index);
        }
    }
}
