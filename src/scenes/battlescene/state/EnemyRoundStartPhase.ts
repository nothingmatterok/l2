class EnemyRoundStartPhase extends ISceneState{
	protected scene: BattleScene;

	public initial(scene: IScene){
		super.initial(scene);
		ToastInfoManager.Ins.newToast("敌方回合开始阶段");

		MessageManager.Ins.sendMessage(MessageType.EnemyRoundStart);
		// TODO 回合结束阶段buff结算

		// 回合结束阶段技能效果
		
		// 如果不在演出说明没有需要演出的技能，直接切下一个阶段
		this.scene.mPhaseUtil.changePhaseWithDelay(BattleSSEnum.EnemyUseCardPhase);

	}

}