import { _decorator, Component, Toggle, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIToggleHelper')
export class UIToggleHelper extends Component
{
    @property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Node })
	private offNode: Node;
	@property({ group: { name: "Components", id: "1", displayOrder: 1 }, type: Toggle })
	private toggle: Toggle;

	public onValue()
	{
		this.offNode.active = !this.toggle.isChecked;
	}
}

