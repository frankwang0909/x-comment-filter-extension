// ============================================================
// 规则引擎：命中即屏蔽，无积分系统
// ============================================================

const RULES = {
	// ── 强制关键词：字符串包含（扫 displayName + username + text）──
	forcedKeywords: [
		'onlyfans',
		'fansly',
		'pornhub',
		'xvideos',
		'私信看图',
		'发福利',
		'看片',
		'约炮',
		'约啪',
		'援交',
		'外围',
		'小姐',
		'包养',
		'卖身',
		'破处',
		'附近的来',
		'母狗',
		'固炮',
		'骚妇',
		't.me/',
		'telegram.me',
	],

	// ── 正文模式：正则匹配 text，命中即屏蔽 ─────────────────────
	textPatterns: [
		// 黄推引流模板
		{ re: /来个?真人认识一下/, label: '真人认识模板' },
		{ re: /有[没]?有?弟弟想认识/, label: '弟弟认识模板' },
		{ re: /找个?(长期|固定)(搭子|伴侣)/, label: '长期搭子模板' },
		{ re: /有没有单身的?(哥哥|弟弟|男生|男大|男友)/, label: '单身哥哥模板' },
		{ re: /主人抱抱/, label: '主人模板' },
		{ re: /主人快来领我/, label: '主人模板' },
		{ re: /dd个?线下的?(哥哥|男生)/, label: '线下dd模板' },
		{ re: /d\s*d个?线下的?(哥哥|男生)/i, label: '线下dd模板' },
		{ re: /找个?温柔的?主人/, label: '主人模板' },
		{ re: /(?:想|找)(?:有)?个?会?疼人的?(哥哥|男生)/, label: '疼人哥哥模板' },
		{ re: /来个?真人/, label: '真人模板' },
		{ re: /比她好看的没她骚/, label: '比较模板' },
		{ re: /比她骚的没她好看/, label: '比较模板' },
		{ re: /刷了半天的?X/i, label: '刷X模板' },
		{ re: /主页能打(?:✈️?)?了?/, label: '主页打飞机模板' },
		{ re: /她好涩/, label: '色情模板' },
		{ re: /我不行了/, label: '色情模板' },
		{ re: /线下sao货/, label: '骚货模板' },
		{ re: /线下我就[日曰]过/, label: '色情模板' },
		{ re: /没人比她sao/, label: '色情模板' },
		{ re: /sao货/i, label: '骚货模板' },
		{ re: /骚货/, label: '骚货模板' },
		{ re: /推特.*第一骚/, label: '色情模板' },
		{ re: /第一骚/, label: '色情模板' },
		// 色情词
		{ re: /色图/, label: '色情词' },
		{ re: /涩涩/, label: '色情词' },
		{ re: /h图/i, label: '色情词' },
		{ re: /r18/i, label: '色情词' },
		{ re: /做爱/, label: '色情词' },
		// 导流
		{ re: /link\s*in\s*bio/i, label: '引流链接' },
		{ re: /bio\s*link/i, label: '引流链接' },
		{ re: /私信(我|联系)/, label: '引流模板' },
		{ re: /点主页/, label: '引流模板' },
		{ re: /主页有/, label: '引流模板' },
		{ re: /线下牵线/, label: '引流模板' },
		{ re: /主页自取/, label: '引流模板' },
		{ re: /主页进群/, label: '引流模板' },
		{ re: /附近的来/, label: '引流模板' },
		// 外链
		{ re: /t\.me\//, label: 'TG链接' },
		{ re: /tg频道/, label: 'TG频道' },
		{ re: /telegram/i, label: 'TG链接' },
		{ re: /discord\.gg/i, label: 'Discord链接' },
		// 割韭菜
		{ re: /我的投资(策略|心得|方法|组合|逻辑)/, label: '投资导流' },
		{ re: /我的(分析结果|交易策略|操盘思路|选股策略)/, label: '投资导流' },
		{ re: /稳赚不赔/, label: '投资导流' },
		{ re: /躺赢/, label: '投资导流' },
		{ re: /(内部|独家)(消息|资源|信息|喊单)/, label: '内部消息' },
		{ re: /跟单(赚钱|稳赚|带单)/, label: '跟单导流' },
		{ re: /代(操盘|炒币|炒股)/, label: '代操盘' },
		{ re: /(喊单|建仓|抄底)(群|信号|策略)/, label: '喊单导流' },
		{ re: /百倍(币|机会|潜力)/, label: '百倍币' },
		{ re: /土狗(项目|盘|币)/, label: '土狗币' },
		{ re: /(返佣|分红)(比例|模式|合作)/, label: '返佣导流' },
		{ re: /私信(领取|获取|免费)(信号|策略|资料)/, label: '私信导流' },
	],

	// ── 昵称模式：正则匹配 displayName，命中即屏蔽 ──────────────
	namePatterns: [
		{ re: /[\u4e00-\u9fa5]{1,4}[\s\S]*(?:🌸|🌺|🌼|💮){2,}/, label: '花朵昵称' },
		{
			re: /(找个搭子|蹲一个弟弟|蹲个弟弟|蹲一个哥哥|蹲个哥哥|无🚪|寻男大固泡|男大固泡|看我主页|附近真实约见|真实约见|约见资源|附近资源自取|附近的?DD啊?|全推唯一真实约见|全网唯一约炮社区|点我头像选人|线下牵线|主页自取|主页进群|点我主页自取|点我主页进群|找主人|主人)/,
			label: '昵称导流词',
		},
	],

	// ── 仿冒规则：同昵称骨架不同用户名一律屏蔽 ─────────────────
	// pattern: 正则（处理同形字变体）
	impersonationRules: [
		{
			pattern: /硅.居./,
			legitimateUsername: 'svscholar',
			label: '硅谷居士仿冒',
		},
		{ pattern: /陶.?瑞/, legitimateUsername: 'taoray', label: '陶瑞仿冒' },
		{ pattern: /Tig[ir]+s/i, legitimateUsername: 'tig88411109', label: 'Tigris仿冒' },
	],
};

function normalizeForMatch(value = '') {
	return String(value)
		.normalize('NFKC')
		.replace(
			/[\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180b-\u180f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,
			'',
		)
		.trim();
}

// ── 主判断函数：命中任意规则即返回 matched=true ───────────────
function scoreComment({ displayName, username, text }) {
	const nd = normalizeForMatch(displayName);
	const nu = normalizeForMatch(username);
	const nt = normalizeForMatch(text);
	const haystack = `${nd} ${nu} ${nt}`.toLowerCase();

	// 强制关键词
	for (const kw of RULES.forcedKeywords) {
		if (haystack.includes(kw.toLowerCase())) {
			return { matched: true, reasons: [`关键词: ${kw}`] };
		}
	}

	// 机器人网络联合检测：用户名=随机字母(4-10)+数字(4-6) 且 昵称==字母部分(首字母大写)
	// 典型案例：@gkwab52866 / Gkwab、@wdkepf54615 / Wdkepf（"全国安排"机器人群）
	const botNetworkMatch = nu.match(/^([a-z]{4,10})\d{4,6}$/i);
	if (botNetworkMatch) {
		const letters = botNetworkMatch[1].toLowerCase();
		if (nd.toLowerCase() === letters && /^[a-z]+$/i.test(nd)) {
			return { matched: true, reasons: ['机器人网络: 用户名/昵称随机字符串'] };
		}
	}

	// 仿冒检测
	for (const rule of RULES.impersonationRules) {
		const nameMatches = rule.pattern
			? rule.pattern.test(nd)
			: nd.includes(rule.displayName);
		if (nameMatches && nu !== rule.legitimateUsername) {
			return { matched: true, reasons: [`仿冒: ${rule.label}`] };
		}
	}

	// 正文模式
	for (const { re, label } of RULES.textPatterns) {
		if (re.test(nt)) {
			return { matched: true, reasons: [label] };
		}
	}

	// 昵称模式
	for (const { re, label } of RULES.namePatterns) {
		if (re.test(nd)) {
			return { matched: true, reasons: [label] };
		}
	}

	return { matched: false, reasons: [] };
}

function shouldFilter(result) {
	return result.matched;
}

// Node.js 导出（浏览器环境中此块被忽略）
if (typeof module !== 'undefined')
	module.exports = { RULES, normalizeForMatch, scoreComment, shouldFilter };
