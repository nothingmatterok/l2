class Buff {
	// buff info
	// normal info
	private _id: number;
	public get id(): number { return this._id; }
	private _buffName: string;
	public get buffName(): string { return this._buffName; }
	private _iconName: string;
	private _description: string;
	public get description(): string { return this._description; }
	private _isPositive: boolean; // 是否正面效果
	public get isPositive(): boolean { return this._isPositive; }
	private _maxLayer: number;  // 最大叠加层数
	private _layId: number; // 叠加id，相同的叠加id在一起计算maxLayer
	private _isDeadRemove: boolean; // 是否对象死亡时移除
	public get isDeadRemove(): boolean { return this._isDeadRemove; }
	private _initialRemainRound: number; // 初始剩余回合, -1为无限
	private _exType: BuffExTy; // buff外在类型，隐藏buff/普通buff/被动技能
	// attr benifit
	private _attrsAdd: number[];	// 属性加成
	private _attrsMul: number[];	// 属性加成
	// state
	private _isDiz: boolean;// 是否眩晕
	public get isDiz(): boolean { return this._isDiz; }
	private _isSlience: boolean;// 是否沉默
	public get isSlience(): boolean { return this._isSlience; }
	private _isUnarm: boolean; // 是否无法攻击
	public get isUnarm(): boolean { return this._isUnarm; }
	// affect
	private _isAffect: boolean; // 是否具有结算效果
	private _maxAffectTime: number; // 最大生效次数
	private _affectPhase: BuffAffectPhase; // 结算时机（条件）
	private _affectHurtId: number; // affect使用hurt来结算
	private _affectSkillId: number; // 触发一个技能
	private _isAffectSkillPreSetTarget: boolean;
	private _affectBuffIds: number[];

	// realtime
	private _char: Character;// buff归属单位
	private _remainRound: number; // 剩余回合数，默认在归属单位的结束回合阶段--，-1表示无限
	private _remainAffectTime: number; // 剩余结算次数，-1为无限
	private _attachRound: number;// 上buff的回合，如果buff达到最大上限，挤掉最早加的那个
	public mIconBitMap: egret.Bitmap;

	public initial(
		id: number,
		buffName: string,
		iconName: string,
		description: string,
		isPos: boolean,
		maxLayer: number,
		layId: number,
		isDeadRemove: boolean,
		initRemRound: number,
		exType: BuffExTy,
		attrsAdd: number[],
		attrsMul: number[],
		isDiz: boolean,
		isSlience: boolean,
		isUnarm: boolean,
		isAffect: boolean,
		maxAffectTime: number,
		affectPhase: BuffAffectPhase,
		affectHurtId: number,
		affectSkillId: number,
		isAffectSkillPreSetTarget: boolean,
		affectBuffIds: number[]
	): void {
		// buff info
		this._id = id;
		this._buffName = buffName;
		this._description = description;
		this._iconName = iconName;
		this._isPositive = isPos;
		this._maxLayer = maxLayer;
		this._layId = layId;
		this._isDeadRemove = isDeadRemove;
		this._initialRemainRound = initRemRound;
		this._exType = exType;
		this._attrsAdd = attrsAdd;
		this._attrsMul = attrsMul;
		this._isDiz = isDiz;
		this._isSlience = isSlience;
		this._isUnarm = isUnarm;
		this._isAffect = isAffect;
		this._maxAffectTime = maxAffectTime;
		this._affectPhase = affectPhase;
		this._affectHurtId = affectHurtId;
		this._affectSkillId = affectSkillId;
		this._affectBuffIds = affectBuffIds;
		this._isAffectSkillPreSetTarget = isAffectSkillPreSetTarget;
		// realtime
		this._remainRound = initRemRound;
		this._remainAffectTime = maxAffectTime;
	}


	public attachToChar(target: Character): void {
		let scene = SceneManager.Ins.curScene as BattleScene;
		this._attachRound = scene.mRound;
		let allBuff = target.mPassiveSkills.concat(target.mBuffs).concat(target.mHideBuffs);
		let sameLayBuffs: Buff[] = [];
		let earliestSameLayIdBuf: Buff;
		let buffLayNum = 0;
		let earliestRound = 0;
		for (let buff of allBuff) {
			if (buff._layId == this._layId) {
				buffLayNum++;
				sameLayBuffs.push(buff);
				if (buff._attachRound > earliestRound) {
					earliestRound = buff._attachRound;
					earliestSameLayIdBuf = buff;
				}
			}
		}

		// 如果到了上限，删除最早的同layidbuff
		if (buffLayNum >= this._maxLayer) {
			earliestSameLayIdBuf.removeFromChar();
		}

		// add buff to target
		switch (this._exType) {
			case BuffExTy.HideBuff:
				target.mHideBuffs.push(this);
				break;
			case BuffExTy.PassvieSkill:
				target.mPassiveSkills.push(this);
				break;
			case BuffExTy.NormalBuff:
				target.mBuffs.push(this);
				this.mIconBitMap = new egret.Bitmap(RES.getRes(this._iconName));
				// 调整targetbuff栏的位置
				target.adjustBuffIconPos();
				break;
		}

		this._char = target;
		// add attr
		let attrAdd = this._attrsAdd;
		let attrMul = this._attrsMul;
		let targetAttr = target.mAttr;
		for (let attrId in attrAdd) {
			let index = parseInt(attrId);
			if (attrAdd[index] > 0) {
				targetAttr.setAttrAddition(index, attrAdd[attrId], AttrAdditionType.ADD);
			}
		}
		for (let attrId in attrMul) {
			let index = parseInt(attrId);
			if (attrMul[index] > 0) {
				targetAttr.setAttrAddition(index, attrMul[attrId], AttrAdditionType.MUL);
			}
		}

		// if have effect, listen affect affectPhase
		if (this._isAffect) {
			if (this._affectPhase == BuffAffectPhase.TargetRoundStart) {
				let eType = target.camp == CharCamp.Enemy ? 
					MessageType.EnemyRoundStart : 
					MessageType.PlayerRoundStart;
				MessageManager.Ins.addEventListener(
					eType,
					this.affect,
					this
				);
			}
			if (this._affectPhase == BuffAffectPhase.HurtAffect) {
				MessageManager.Ins.addEventListener(
					MessageType.HurtAffect,
					this.affect,
					this
				);
			}
			if (this._affectPhase == BuffAffectPhase.BuffAttach) {
				MessageManager.Ins.addEventListener(
					MessageType.BuffAttach,
					this.affect,
					this
				);
			}
		}
	}

	public release(): void {
		// remove all listener
		for (let eType of [
			MessageType.EnemyRoundStart,
			MessageType.PlayerRoundStart,
			MessageType.BuffAttach,
			MessageType.HurtAffect
		]) {
			MessageManager.Ins.removeEventListener(
				eType,
				this.affect,
				this
			);
		}
		this._char = null;
		this.mIconBitMap = null;
		let scene = SceneManager.Ins.curScene as BattleScene;
		scene.mBuffManager.recycle(this);
	}

	// call by send message
	private affect(e: Message) {
		let scene = SceneManager.Ins.curScene as BattleScene;
		if (this._remainAffectTime > 0) {
			this._remainAffectTime = this._remainAffectTime - 1;
		}
		if (this._affectHurtId != 0) {
			let hurt = scene.mHurtManager.newHurt(
				this._affectHurtId,
				this._char
			);
			hurt.affect(this._char);
		}
		for (let id of this._affectBuffIds) {
			let buff = scene.mBuffManager.newBuff(id);
			buff.attachToChar(this._char);
		}
		if (this._affectSkillId != 0) {
			let skill = scene.mManualSkillManager.newSkill(
				this._affectSkillId,
				this._char
			);
			skill.setParam(e.messageContent);
			if (this._isAffectSkillPreSetTarget) {
				skill.setPreSettargets(e.messageContent.targets);
			}
			scene.addToCastQueue(skill);
		}
		// if affect times is 0
		if (this._remainAffectTime == 0) {
			this.removeFromChar();
		}
	}

	/**
	 * 场景清空的时候也要调用该方法来保证资源释放
	 */
	public removeFromChar() {
		let scene = SceneManager.Ins.curScene as BattleScene;
		if (this._char == null) {
			// 如果附加到的对象为空，说明已经被移除过了
			console.log(`buff已经被移除过了,buffid: ${this._id}`);
			return;
		}
		// 去除属性
		let attrAdd = this._attrsAdd;
		let attrMul = this._attrsMul;
		let target = this._char;
		let targetAttr = target.mAttr;
		for (let attrId in attrAdd) {
			let index = parseInt(attrId);
			if (attrAdd[index] > 0) {
				targetAttr.setAttrAddition(index, -attrAdd[attrId], AttrAdditionType.ADD);
			}
		}

		for (let attrId in attrMul) {
			let index = parseInt(attrId);
			if (attrMul[index] > 0) {
				targetAttr.setAttrAddition(index, -attrMul[attrId], AttrAdditionType.MUL);
			}
		}

		// remove from target
		switch (this._exType) {
			case BuffExTy.HideBuff:
				Util.removeObjFromArray(target.mHideBuffs, this);
				break;
			case BuffExTy.NormalBuff:
				let buffs = this._char.mBuffs;
				Util.removeObjFromArray(buffs, this);
				target.adjustBuffIconPos();
				break;
			case BuffExTy.PassvieSkill:
				Util.removeObjFromArray(target.mPassiveSkills, this);
				break;
		}
		this.release();
	}

	public onCharEndPhase() {
		if (this._remainRound > 0) {
			this._remainRound--;
		}
		if (this._remainRound == 0) {
			this.removeFromChar();
		}
	}

}

enum BuffAffectPhase {
	TargetRoundStart, // 目标开始时自动发生效果，最常规的发出时机
	BuffAttach,
	HurtAffect
}

enum AffectCaseBuffTargetType {
	AllFriends, // 全体友方单位做叠加
	AllEnemies, // 全体地方单位做叠加
	AnyOneFriend, // 我方任意某单位
	AnyOneEnemy, // 敌方任意某单位
	Self // 自己
}

enum BuffExTy {
	NormalBuff,//常规buff（玩家可以看到
	HideBuff,//隐藏buff，一般用来出发某些特定效果时用于计数（玩家看不到的
	PassvieSkill//被动buff（被动技能也通过buff机制来实现
}