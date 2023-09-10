import {
	_decorator,
	CCFloat,
	Color,
	color,
	Component,
	easing,
	Node,
	Sprite,
	tween,
	Tween,
	UIOpacity,
	Vec3,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("WaveManager")
export class WaveManager extends Component {
	@property({ type: CCFloat })
	Time: number;
	@property({ type: CCFloat })
	RateTime: number;

	@property({ type: CCFloat })
	Pos: number;
	@property({ type: CCFloat })
	RatePos: number;

	@property({ type: CCFloat })
	BasePos: number;

	@property({ type: Node })
	ListWave: Node[] = [];

	@property({ type: CCFloat })
	ListBasePosX: number[] = [];
	@property({ type: CCFloat })
	ListBasePosY: number[] = [];



	@property({type:Node})
	Wave4:Node;
	@property({type:CCFloat})
	timew4in:number;
	@property({type:CCFloat})
	timew4out:number;
	@property({type:CCFloat})
	posw4:number;


	//Sea Sand

	@property({type:Node})
	Sand:Node;
    
	private RateFadeSand:number;
	@property({ type: CCFloat })
	MaxSandTime: number;
	@property({ type: CCFloat })
	CurrSandTime: number;
	@property({ type: CCFloat })
	DeltaTime: number;
	

	@property({ type: CCFloat })
	TweenSandTime: number;

	start() {
		this.SetTween();

		let c=this.TweenWave4(this.Wave4,this.timew4in
			,this.Wave4.position.x,this.posw4,0);
			c.repeatForever().start();



		this.Sand.getComponent(UIOpacity).opacity=0;
		this.CurrSandTime=this.MaxSandTime;




	}

	private SetTween() {
		this.Setpos();
		for (let i = 0; i < this.ListWave.length; i++) {
			let a = this.TweenWave(
				this.ListWave[i],
				this.Time + i * this.RateTime,
				this.ListBasePosX[i],
				i * this.RatePos + this.Pos,
				this.ListBasePosY[i]
			);
			a.repeatForever().start();
			//  console.log(+"Wave"+ i +"time: "+(this.Time+(i*this.RateTime)));
		}

		let b = this.TweenSand(this.node, this.TweenSandTime);
		b.repeatForever().start();
	}

	private Setpos() {
		for (let i = 0; i < this.ListWave.length; i++) {
			let a = this.ListWave[i].position.x;
			let b = this.ListWave[i].position.y;
			this.ListBasePosX.push(a);
			this.ListBasePosY.push(b);
		}
	}

	private TweenWave(
		target: Node,
		time: number,
		baseposX: number,
		posX: number,
		baseposY: number
	): Tween<Node> {
		let a = tween(target).to(
			time,
			{ position: new Vec3(posX, baseposY, 0) },
			{ easing: "linear" }
		);

		let b = tween(target).to(
			time,
			{ position: new Vec3(baseposX, baseposY, 0) },
			{ easing: "linear" }
		);

		let c = tween(target).sequence(a, b);
		return c;
		//'quadOut'
	}


	private TweenWave4(target:Node,time:number,baseposX:number,posX:number,baseposY:number):Tween<Node>
    {
        let a=tween(target).to(this.timew4in,{position:new Vec3(posX,baseposY,0)},{easing:'sineIn'});

        let b=tween(target).to(this.timew4out,{position:new Vec3(baseposX,baseposY,0)},{easing:'cubicOut'})

        let c=tween(target).sequence(a,b);
        return c;
   //'quadOut'

    }





	private TweenSand(target: Node, time: number): Tween<UIOpacity> {
		let a = tween(target.getComponent(UIOpacity)).to(
			time,
			{ opacity: 0 },
			{ easing: "cubicOut" }
		);

		let b = tween(target.getComponent(UIOpacity)).to(
			time,
			{ opacity: 255 },
			{ easing: "cubicOut" }
		);

		let c = tween(target.getComponent(UIOpacity)).sequence(a, b);
		return c;
	}

	private CalSand()
	{
       this.CurrSandTime-=this.DeltaTime;
	   this.Sand.getComponent(UIOpacity).opacity-=1;
	   if(this.CurrSandTime<=0)
	   {	
          this.Sand.getComponent(UIOpacity).opacity=255;
		  this.CurrSandTime=this.MaxSandTime;
	   }
	}

	update(deltaTime: number) {
		this.DeltaTime=deltaTime;
		this.CalSand();
		
	}
}
