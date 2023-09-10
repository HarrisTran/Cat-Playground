import { _decorator, CCString } from 'cc';
import { PopOutBase } from '../../Common/UI/PopoutBase';
import { UIButton } from '../../Common/UI/UIButton';
const { ccclass, property } = _decorator;


@ccclass('MenuPopout')
export class MenuPopout extends PopOutBase
{
	@property([UIButton])
	private buttons: UIButton[] = [];
	@property([CCString])
	private screenEventString: string[] = [];

	protected onLoad(): void
	{
		super.onLoad();
		
		for (let i = 0; i < this.buttons.length; ++i)
		{
			// TODO: Give callback
			// this.buttons[i].setOnClickCallback()
		}
	}
}