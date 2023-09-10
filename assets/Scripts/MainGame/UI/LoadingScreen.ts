import { _decorator, Component, Node, Sprite, tween, Tween, Vec3, CCFloat, CCBoolean, clamp, clamp01 } from 'cc';
import { LocalizedLabel } from '../../Common/LocalizedLabel';
const { ccclass, property } = _decorator;

export enum LoadScreenMode
{
    SPLASH = 1,
    NORMAL
}

@ccclass('LoadingScreen')
export class LoadingScreen extends Component
{
    @property({ group: { name: "Groups", id: "1", displayOrder: 1 }, type: Node })
    private globalNode: Node;
    @property({ group: { name: "Groups", id: "1", displayOrder: 1 }, type: Node })
    private normalGroup: Node;
    @property({ group: { name: "Groups", id: "1", displayOrder: 1 }, type: Node })
    private splashGroup: Node;

    @property({ group: { name: "Components", id: "2", displayOrder: 1 }, type: [Sprite] })
    private loadBarSprites: Sprite[] = [];
    @property({ group: { name: "Components", id: "2", displayOrder: 1 }, type: [LocalizedLabel] })
    private loadTexts: LocalizedLabel[] = [];

    private _mode: LoadScreenMode;

    public get mode(): LoadScreenMode
    {
        return this._mode;
    }

    public set mode(value: LoadScreenMode)
    {
        this._mode = value;

        if (this._mode === LoadScreenMode.SPLASH)
        {
            this.normalGroup.active = false;
            this.splashGroup.active = true;
        }
        else if (this._mode === LoadScreenMode.NORMAL)
        {
            this.normalGroup.active = true;
            this.splashGroup.active = false;
        }
    }

    protected onLoad(): void
    {
        this.mode = LoadScreenMode.SPLASH;
        this.globalNode.active = false;
    }

    protected start()
    {

    }

    public show()
    {
        this.globalNode.active = true;
    }

    public hideLoading()
    {
        this.globalNode.active = false;
    }

    public setProcessBar(value: number)
    {
        value = clamp01(value);
        for (let sprite of this.loadBarSprites)
        {
            sprite.fillRange = value;
        }

        this.setLoadingText(value);
    }

    public setCustomMessageKey(key: string)
    {
        for (let label of this.loadTexts)
        {
            label.stringKey = key;
        }
    }

    //show loading text
    private setLoadingText(value: number)
    {
        for (let label of this.loadTexts)
        {
            label.setParams(["percentage", Math.round(value * 100).toString()]);
        }
    }
}

