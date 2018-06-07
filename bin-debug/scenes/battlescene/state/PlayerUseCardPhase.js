var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = this && this.__extends || function __extends(t, e) { 
 function r() { 
 this.constructor = t;
}
for (var i in e) e.hasOwnProperty(i) && (t[i] = e[i]);
r.prototype = e.prototype, t.prototype = new r();
};
var PlayerUseCardPhase = (function (_super) {
    __extends(PlayerUseCardPhase, _super);
    function PlayerUseCardPhase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PlayerUseCardPhase.prototype.initial = function () {
        _super.prototype.initial.call(this);
        ToastInfoManager.Ins.newToast("我方出牌阶段");
        // 显示下一个回合的按键
        this.scene.mBattleUI.roundEndButton.visible = true;
        // 绑定卡牌tap使用事件
        MessageManager.Ins.addEventListener(MessageType.CardTouchTap, this.onCardTouchTap, this);
        // TODO 自动模式下自动释放技能
    };
    /**
     * 阶段结束需要自行调用
     */
    PlayerUseCardPhase.prototype.phaseEnd = function () {
        // 一收到结束消息就要去掉使用卡牌的侦听
        MessageManager.Ins.removeEventListener(MessageType.CardTouchTap, this.onCardTouchTap, this);
        this.scene.mPhaseUtil.changePhaseWithDelay(BattleSSEnum.PlayerRoundEndPhase);
    };
    PlayerUseCardPhase.prototype.onCardTouchTap = function (e) {
        var card = e.messageContent;
        var scene = this.scene;
        if (scene.mWinnerCamp) {
            ToastInfoManager.Ins.newToast("胜负已分");
            return;
        }
        if (!(card.skill.caster && card.skill.caster.alive && card.skill.caster.isInBattle)) {
            ToastInfoManager.Ins.newToast("释放者处于无法释放的状态中");
            return;
        }
        var fireboard = scene.mPlayerFireBoard;
        var fireNeed = card.skill.fireNeed;
        if (fireNeed > fireboard.fireNum) {
            ToastInfoManager.Ins.newToast("能量不足");
            return;
        }
        // if can't cast, return
        var canCastInfo = card.skill.canCast();
        if (canCastInfo[0]) {
            ToastInfoManager.Ins.newToast(canCastInfo[1]);
            return;
        }
        // 使用技能
        card.skill.cast();
        // 移除所需要的点数
        for (var i = 0; i < card.skill.fireNeed; i++) {
            fireboard.removeFire();
        }
        // 移除卡牌
        scene.mCardBoard.removeCard(card);
    };
    PlayerUseCardPhase.prototype.unInitial = function () {
        _super.prototype.unInitial.call(this);
        // 隐藏回合结束按键，已经在按键的tap事件中隐藏了，这里不额外隐藏
        // this.scene.battleUI.roundEndButton.visible = false;
        // 结束的时候也要去掉侦听
        MessageManager.Ins.removeEventListener(MessageType.CardTouchTap, this.onCardTouchTap, this);
    };
    return PlayerUseCardPhase;
}(ISceneState));
__reflect(PlayerUseCardPhase.prototype, "PlayerUseCardPhase");
