// ============================================================
// 规则引擎单元测试
// 直接 require 生产代码，避免规则副本与实现脱节
// 运行：node tests/rules.test.js
// ============================================================

const { RULES, normalizeForMatch, scoreComment, shouldFilter } = require('../core/rules.js');

// ── 最小测试框架 ──────────────────────────────────────────────
let passed = 0, failed = 0;
function expect(desc, actual, expected) {
  const ok = actual === expected;
  if (ok) { passed++; console.log(`  ✅ ${desc}`); }
  else    { failed++; console.error(`  ❌ ${desc}\n     expected=${expected}  got=${actual}`); }
}
function describe(name, fn) { console.log(`\n${name}`); fn(); }

// ── 套件 1：截图 14 个真实样本 ────────────────────────────────
describe('截图样本：14条黄推全部命中', () => {
  const samples = [
    { displayName:'雅晴🌸🌸', username:'JamesCamer25953', text:'来个真人认识一下🧡👠❤️vf' },
    { displayName:'若柔🌸🌸', username:'mckee_chel64629', text:'来个真人认识一下😊😘💝Zu7' },
    { displayName:'玥瑶🌸🌸', username:'KennedyAma9061',  text:'来个真人认识一下👇🤍👠v' },
    { displayName:'晓歆🌸🌸', username:'patrick_he48305', text:'有弟弟想认识吗？😉💝💦zT' },
    { displayName:'梦晴🌸🌸', username:'RiveraJuli89039', text:'找个长期搭子✨🥰🤤czl' },
    { displayName:'思彤🌸🌸', username:'HannahMoor77912', text:'找个长期搭子🥺👅🌹nb' },
    { displayName:'欣晴🌸🌸', username:'DavidHanse69498', text:'有没有单身哥哥😘🥺💝619' },
    { displayName:'可蕊🌸🌸', username:'OscarTurne31920', text:'有弟弟想认识吗？👀🌹🔥XAS' },
    { displayName:'梓雯🌸🌸', username:'ParksMiche25094', text:'dd个线下的哥哥🎀👈👗yt9' },
    { displayName:'晓希🌸🌸', username:'BurtonJohn90058', text:'有没有单身哥哥❤️💕👅P' },
    { displayName:'梦晴🌸🌸', username:'HudsonEliz23173', text:'找个温柔主人' },
    { displayName:'安玥🌸🌸', username:'RachelBenn92131', text:'dd个线下的哥哥❤️😍❤️DOa' },
    { displayName:'依琪🌸🌸', username:'MonicaHern12170', text:'想找会疼人的哥哥⭐❤️🤗x5' },
    { displayName:'清萱🌸🌸', username:'tucker_amy30480', text:'来个真人认识一下👅🌹👙kt' },
  ];
  samples.forEach((s) =>
    expect(`@${s.username}`, shouldFilter(scoreComment(s)), true)
  );
});

// ── 套件 2：强制命中关键词 ────────────────────────────────────
describe('强制命中关键词', () => {
  [
    { displayName:'x', username:'x', text:'onlyfans链接在主页' },
    { displayName:'x', username:'x', text:'私信看图，懂的来' },
    { displayName:'x', username:'x', text:'加我t.me/xxxchannel' },
    { displayName:'x', username:'x', text:'约炮找谁' },
    { displayName:'x', username:'x', text:'破处找我' },
    { displayName:'静雅母狗找主人约固炮', username:'x', text:'' },
    { displayName:'x', username:'x', text:'骚妇一枚' },
  ].forEach((s) => expect(`强制命中: "${s.displayName||s.text}"`, scoreComment(s).matched, true));
});

// ── 套件 3：正常内容不触发（反误判）─────────────────────────
describe('正常内容不触发（反误判）', () => {
  const normal = [
    { displayName:'张三',   username:'zhangsan',   text:'今天有福利哦，转发抽奖' },
    { displayName:'李四',   username:'lisi_dev',   text:'这个舞蹈真的很性感' },
    { displayName:'王五',   username:'wangwu2024', text:'这个人骚话真多' },
    { displayName:'科技博主', username:'techblog',  text:'AI 这波攻势真的很猛' },
  ];
  normal.forEach((s) =>
    expect(`不折叠: "${s.text}"`, shouldFilter(scoreComment(s)), false)
  );
});

// ── 套件 4：零宽字符绕过样本 ─────────────────────────────────
describe('零宽字符绕过样本', () => {
  const samples = [
    { displayName:'知悦🌸🌸', username:'johnwalker85872', text:'小‌狗​求​主人抱抱💗💋1' },
    { displayName:'含柔🌸🌸', username:'ehall26686',      text:'有没​有单身哥哥🫶🌹i' },
    { displayName:'',         username:'barronrebe61998', text:'主人快​来领我👄💕F' },
    { displayName:'',         username:'sampleuser12345', text:'d‌d个线下的哥哥' },
    { displayName:'采婉🌸🌸', username:'nash_diane35020',  text:'来个真​人认识‌一下👙😉v1' },
    { displayName:'悦蕊🌸🌸', username:'barronrebe61998',  text:'来‌个真人认识一下❣💫t5' },
    { displayName:'雨蕊🌸🌸', username:'mannmark3498',      text:'找个温柔主人👠👗9m' },
    { displayName:'小鱼干❤️', username:'asehelland81530',  text:'找个温柔的主人☀f' },
    { displayName:'小柠檬❤️', username:'ystocker54629',    text:'想有个会疼人的哥哥🐏e' },
    { displayName:'陈思洁❤️无🚪线下', username:'jenniferad89661', text:'🐏6x🐻' },
    { displayName:'小瓶盖❤️找个搭子', username:'alcolea67217',    text:'☀4u🐇' },
    { displayName:'张安然❤️蹲一个弟弟', username:'lisasmith141593', text:'🔅7a🐅' },
    { displayName:'优优酱❤️寻男大固泡', username:'stutztheop73071', text:'☀4l🐇🐅' },
    { displayName:'陈思洁❤️', username:'harperwill9566', text:'找个温柔的主人✈🤘t' },
    { displayName:'小芒果❤️', username:'rosieharri75739', text:'找个会疼人的哥哥🐻🐨s' },
    { displayName:'柠栀❤️无🚪线下', username:'staceybutl35148', text:'🐦0b🐇🐂' },
    { displayName:'小奶油❤️', username:'cirinouren63648', text:'想有个会疼人的哥哥🚀🐀a' },
    { displayName:'💎看我主页💋全是附近真实约见资源🤍', username:'maricelaf52128', text:'👍' },
    { displayName:'困困不想睡❤️附近的DD啊', username:'nettepatri99949', text:'🐇3y🐇🔅' },
    { displayName:'小豆豆❤️寻男大固泡', username:'damianl2453', text:'🐏8w🐇🚀' },
    { displayName:'小奶油❤️蹲一个弟弟', username:'rogerp53288', text:'🚀4x🐇' },
    { displayName:'张安然❤️蹲一个弟弟', username:'gilliansmi83176', text:'☀5q🐦' },
    { displayName:'🍑 全推唯一真实约见 💌 附近资源自取', username:'mlowler38556', text:'🤩👏 🫶' },
    { displayName:'💎 全网唯一约炮社区 ☔️ 点我头像选人', username:'lorrianes14939', text:'🔥💞💌 💞' },
  ];

  expect('标准化移除零宽字符', normalizeForMatch('有没​有').includes('​'), false);

  samples.forEach((s) =>
    expect(`原样本命中 @${s.username}`, shouldFilter(scoreComment(s)), true)
  );
});

// ── 套件 5：擦边引流文案 ────────────────────────────────────
describe('擦边引流文案样本', () => {
  const samples = [
    { displayName:'丛山彤', username:'softballgal511', text:'e比她好看的没她骚💘比她骚的没她好看 @2018D1 💔' },
    { displayName:'蓬春琳', username:'mariabarisci',   text:'3比她好看的没她骚👍比她骚的没她好看 @2018D1 8' },
    { displayName:'应雨安', username:'kimcallaway',    text:'`比她好看的没她骚🔥比她骚的没她好看 @danitinahd }' },
    { displayName:'毋铃',   username:'andgik',         text:'+c刷了半天的X😙就她的主页能打✈️了 @xiaonm88 [' },
    { displayName:'',       username:'2018d1',         text:']刷了半天的X😚就她的主页能打✈️了' },
    { displayName:'علياء🤎💫', username:'alih43',      text:'>她好涩💕我不行了👉 @2018D1 s' },
    { displayName:'诸葛初夏', username:'nvbobf',      text:'s比她好看的没她骚💋比她骚的没她好' },
    { displayName:'营采',   username:'ddubey',         text:'u&线下sao货没人比她sao @xiaonm88 \'' },
    { displayName:'习安志', username:'silas767',       text:'a比她好看的没她骚💟比她骚的没她好看 @danitinahd k' },
    { displayName:'习安志', username:'silas767',       text:'💞线下我就曰过💝这个骚货👉 @danitinahd 🔥' },
    { displayName:'诸葛初夏', username:'nvbobf',       text:'s推特🤤第一骚 @danitinahd ^' },
    { displayName:'todays greatest hits', username:'todaysgreatesth', text:'+推特💋第一骚 @2018D1 g' },
    { displayName:'9🐣🐣🐣🐣🐣🐣🐣🐣', username:'raul_plus', text:'n推特❣️第一骚 @danitinahd ❤️' },
    { displayName:'诸葛初夏', username:'nvbobf',       text:'4推特🫶第一骚 @danitinahd 💗' },
    { displayName:'ملاك 🍒', username:'kimbravo15',    text:'🫶推特🥺第一骚 @danitinahd ]' },
  ];

  samples.forEach((s) =>
    expect(`擦边文案命中 @${s.username}`, shouldFilter(scoreComment(s)), true)
  );
});

// ── 套件 6：仿冒检测 ─────────────────────────────────────────
describe('仿冒检测', () => {
  expect('硅谷居士仿冒被拦', shouldFilter(scoreComment({ displayName:'硅硲居土', username:'CharleneMayo31', text:'我的分析结果' })), true);
  expect('硅谷居士真实账号放行', shouldFilter(scoreComment({ displayName:'硅谷居士', username:'svscholar', text:'今天发了一篇文章' })), false);
  expect('陶瑞仿冒被拦', shouldFilter(scoreComment({ displayName:'陶瑞', username:'fakeuser123', text:'我的投资策略' })), true);
  expect('陶瑞真实账号放行', shouldFilter(scoreComment({ displayName:'陶瑞', username:'taoray', text:'分享一下最新想法' })), false);
});

// ── 汇总 ──────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(44)}`);
console.log(`共 ${passed + failed} 条  ✅ ${passed} 通过  ${failed > 0 ? '❌ ' + failed + ' 失败' : '全部通过'}`);
if (failed > 0) process.exit(1);
