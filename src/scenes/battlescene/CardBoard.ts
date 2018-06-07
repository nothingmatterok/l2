/**
 * 卡牌区域，负责玩家的卡牌管理
 */
class CardBoard extends egret.DisplayObjectContainer {

	/**
	 * 玩家持有的卡牌列表
	 */
	private cards: Card[];
	private cardPool: Card[]; // 对象池
	public static maxCardNum = 10;
	public overFlowNum: number;

	public constructor() {
		super();
		this.cards = [];
		this.cardPool = [];

		this.y = LayerManager.Ins.stageHeight - 140;
		this.width = LayerManager.Ins.stageWidth;
		this.overFlowNum = 0;
	}

	/**
	 * 删除对应的角色的卡牌
	 */
	public removeCardOfChar(char: Character): void{
		let cardsForDelete: Card[] = [];
		for (let card of this.cards){
			if (card.skill.caster === char){
				cardsForDelete.push(card);
			}
		}
		this.removeCards(cardsForDelete);
	}

	/**
	 * 删除多张卡牌
	 */
	public removeCards(cards:Card[]): void{
		for(let index in cards){
			let card = cards[index]
			Util.removeObjFromArray(this.cards, card);
			card.unInitial();
			if (parseInt(index) == cards.length-1){
				// 如果是最后一张，对全体调整
				this.removeCardFromBoard(card, 0);
			} else {
				this.removeCardFromBoard(card, this.cards.length);
			}
		}
	}

	public distCardNormal(){
		let scene = SceneManager.Ins.curScene as BattleScene
		let skills = scene.mManualSkillIdPool;
		let index = Math.floor(Math.random() * skills.length);
		let skill:ManualSkill = scene.mManualSkillManager.newSkill(skills[index][0], skills[index][1]);
		let card: Card;
		if (this.cardPool.length > 0){
			card = this.cardPool.pop();
			card.setSkill(skill);
		} else{
			card = new Card(skill);
		}
		this.addCard(card);
	}

	public addCard(card: Card): void{
		if (this.cards.length < CardBoard.maxCardNum){
			card.initial();
			this.cards.push(card);
			this.addCardToBoard(card, this.cards.length - 1);
			
			let scene = SceneManager.Ins.curScene as BattleScene;
			let cardNumLabel = scene.mBattleUI.cardNumLabel;
			cardNumLabel.text = `${this.cards.length}/${CardBoard.maxCardNum}`
			if (this.cards.length == CardBoard.maxCardNum){
				cardNumLabel.textColor = 0xFF0000;
			} else {
				cardNumLabel.textColor = 0xADFF2F;
			}
		} else {
			this.overFlowNum += 1;
			this.addCardToBoard(card, CardBoard.maxCardNum + this.overFlowNum -1).call(
				()=>{
					this.removeCardFromBoard(card, CardBoard.maxCardNum);
					this.overFlowNum -= 1;
				}
			);
		}

	}

	/**
	 * 根据当前的cards的数量调整所有卡牌的对应位置
	 */
	private adjustCardsPosition(twTime: number = 600, minIndex:number=0): void {
		let cards: Card[] = this.cards;
		for (let i in cards) {
			if (parseInt(i) >= minIndex){
				let card: Card = cards[i]
				this.adjustCardPosition(card, parseInt(i), twTime);
			}
		}
	}

	/**
	 * 将一张卡牌调整到正确的位置
	 */
	private adjustCardPosition(card: Card, index: number, twTime: number = 400): egret.Tween {
		let newX = this.getCardX(index);
		let tw = egret.Tween.get(card);
		return tw.to({ x: newX }, twTime);
	}

	/**
	 * 计算卡牌的正确的X轴位置
	 */
	private getCardX(index: number): number {
		return 90 * index;
	}

	/**
	 * 添加一张卡牌到cardboard中
	 */
	public addCardToBoard(newCard: Card, index:number): egret.Tween {
		newCard.x = this.width + 100;
		this.addChild(newCard);
		return this.adjustCardPosition(newCard, index, 400)
	}

	/**
	 * 从玩家手中移除一张卡牌
	 */
	public removeCard(card:Card){
		// 逻辑上去除
		let cards: Card[] = this.cards;
		card.unInitial();
		let index = cards.indexOf(card);
		cards.splice(index, 1);
		this.removeCardFromBoard(card, index);
		let scene = SceneManager.Ins.curScene as BattleScene;
		let cardNumLabel = scene.mBattleUI.cardNumLabel;
		cardNumLabel.text = `${this.cards.length}/${CardBoard.maxCardNum}`
		cardNumLabel.textColor = 0xADFF2F;
	}

	public removeCardFromBoard(card: Card, index:number): void{

		// 表现上去除
		let tw = egret.Tween.get(card);
		let cardx = card.x;
		let cardy = card.y;
		let cardw = card.width;
		let cardh = card.height;
		let newcardx = cardx - 0.25 * cardw;
		let newcardy = cardy - 0.25 * cardh;
		this.adjustCardsPosition(450, index);
		tw.to(
			{
				scaleX: 1.5,
				scaleY: 1.5,
				alpha: 0,
				x: newcardx,
				y: newcardy
			},
			300
		).call(
			() => {
				this.removeChild(card);
				this.cardPool.push(card);
			}
		);
	}

	/**
	 * 销毁前要调用该方法释放资源
	 */
	public release(): void {
		for (let card of this.cards){
			card.unInitial();
			card.release();
		}
		for(let card of this.cardPool){
			card.release();
		}
		this.cards = null;
		this.cardPool = null;

	}

}