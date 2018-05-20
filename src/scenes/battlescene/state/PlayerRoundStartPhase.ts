/**
 * 玩家回合开始阶段
 */
class PlayerRoundStartPhase extends ISceneState {
	protected scene: BattleScene;

	public initial() {
		super.initial();
		// TODO 回合开始阶段需要做的事情在这里做完

		// 1.发牌 + 能量
		// 2.buff结算
		// 3.回合开始的技能及效果
		ToastInfoManager.Ins.newToast("我方回合开始阶段");

		// 发牌
		let scene = this.scene;
		scene.cardBoard.distCardNormal();
		scene.cardBoard.distCardNormal();

		// 加能量
		scene.playerFireBoard.addFires(2);

		// buff结算(待增加

		// 回合开始的技能及效果（待增加

		// 切下一个阶段
		PhaseUtil.changePhase(BattleSSEnum.PlayerUseCardPhase);
	}

	public unInitial() {
		super.unInitial();
	}
}