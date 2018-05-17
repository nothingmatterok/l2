var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
/**
 * 表示一个伤害或治疗效果
 */
var Hurt = (function () {
    function Hurt(hurtType, fromChar, rate, isAbs, absValue, isPericeShield, isDoubleShield, isResurgence) {
        if (fromChar === void 0) { fromChar = null; }
        if (rate === void 0) { rate = 1; }
        if (isAbs === void 0) { isAbs = false; }
        if (absValue === void 0) { absValue = 10; }
        if (isPericeShield === void 0) { isPericeShield = false; }
        if (isDoubleShield === void 0) { isDoubleShield = false; }
        if (isResurgence === void 0) { isResurgence = false; }
        this.fromChar = fromChar;
        this.hurtType = hurtType;
        this.rate = rate;
        this.isAbs = isAbs;
        this.absValue = absValue;
        this.isPericeShield = isPericeShield;
        this.isDoubleShield = isDoubleShield;
        this.isResurgence = isResurgence;
    }
    /**
     * 施加伤害
     */
    Hurt.prototype.affect = function (target) {
        var mm = MessageManager.Ins;
        var targetAttr = target.attr;
        var harm = 0;
        // 处理护甲
        if (this.isAbs) {
            harm = this.absValue;
        }
        else {
            var fromAttr = this.fromChar.attr;
            var ar = this.hurtType == HurtType.Pysic ? targetAttr.arPys : targetAttr.arMagic;
            ar -= fromAttr.pierceAr;
            ar = ar > 0 ? ar : 0;
            harm = fromAttr.ap - ar;
            harm = harm > 0 ? harm : (fromAttr.ap / 10);
        }
        // 处理倍率
        harm *= this.rate;
        // 处理治疗生命
        if (this.hurtType == HurtType.HealHp && (target.alive || this.isResurgence)) {
            var newHp = targetAttr.curHp + harm;
            newHp = newHp > targetAttr.maxHp ? targetAttr.maxHp : newHp;
            var healValue = newHp - targetAttr.curHp;
            targetAttr.curHp = newHp;
            mm.sendMessage(MessageType.HealHp, [this.fromChar, target, healValue]);
            // 如果角色处于死亡状态，执行复活
            if (!target.alive) {
                target.alive = true;
                mm.sendMessage(MessageType.Resurgence, target);
            }
            return;
        }
        // 非治疗状态下，对已死亡单位无效
        if (!target.alive) {
            return;
        }
        // 处理增加护盾
        if (this.hurtType == HurtType.HealShield) {
            var newShield = targetAttr.shield + harm;
            newShield = newShield > targetAttr.maxShield ? targetAttr.maxShield : newShield;
            var healValue = newShield - targetAttr.shield;
            targetAttr.shield = newShield;
            mm.sendMessage(MessageType.HealShield, [this.fromChar, target, healValue]);
            return;
        }
        // 处理破盾
        if (targetAttr.shield > 0 && this.isDoubleShield) {
            harm *= 2;
        }
        // 处理非穿盾
        var harmRemain = harm;
        if (!this.isPericeShield) {
            var harmRemain_1 = harm - targetAttr.shield;
            if (harmRemain_1 <= 0) {
                targetAttr.shield = -harmRemain_1;
                mm.sendMessage(MessageType.HarmShield, [this.fromChar, target, harm]);
                return;
            }
            mm.sendMessage(MessageType.HarmShield, [this.fromChar, target, targetAttr.shield]);
            targetAttr.shield = 0;
        }
        // 伤害到hp
        var newTargetHp = targetAttr.curHp - harmRemain;
        // 生命归零，角色死亡
        if (newTargetHp < 0) {
            newTargetHp = 0;
            target.alive = false;
            // 发送角色死亡消息
            mm.sendMessage(MessageType.CharDie, target);
        }
        mm.sendMessage(MessageType.HarmHp, [this.fromChar, target, targetAttr.curHp - newTargetHp]);
        targetAttr.curHp = newTargetHp;
    };
    return Hurt;
}());
__reflect(Hurt.prototype, "Hurt");
/**
 * 伤害类型
 * 治疗生命于增加护盾必须于abs类型的伤害一起使用
 */
var HurtType;
(function (HurtType) {
    HurtType[HurtType["Pysic"] = 0] = "Pysic";
    HurtType[HurtType["Magic"] = 1] = "Magic";
    HurtType[HurtType["HealHp"] = 2] = "HealHp";
    HurtType[HurtType["HealShield"] = 3] = "HealShield"; // 增加护盾
})(HurtType || (HurtType = {}));
