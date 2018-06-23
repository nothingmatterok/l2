class EnemyRoundStartPhase extends ISceneState{
	protected scene: BattleScene;

	public initial(scene: IScene){
		super.initial(scene);
		ToastInfoManager.Ins.newToast("敌方回合开始阶段");
		MessageManager.Ins.sendMessage(MessageType.EnemyRoundStart);
		// 释放技能
		let skillManager = this.scene.mManualSkillManager;
		for (let enemy of this.scene.mEnemies){
			let skillId = enemy.manualSkillsId[0];
			skillManager.newSkill(skillId, enemy).cast();
		}
		// 如果不在演出说明没有需要演出的技能，直接切下一个阶段
		this.scene.mPhaseUtil.changePhaseWithDelay(BattleSSEnum.EnemyUseCardPhase);
	}

}