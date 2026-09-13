const behaviorStyle = document.createElement('style');
behaviorStyle.textContent = `.behavior-badge{display:inline-block;margin-left:8px;background:#fff0e9;color:#c4775d;border-radius:99px;padding:5px 8px;font-size:9px;vertical-align:middle}.behavior-preview{display:flex;gap:7px;margin-top:16px}.behavior-preview span{background:#f7f4f0;color:#777983;border-radius:99px;padding:6px 8px;font-size:10px}`;
document.head.appendChild(behaviorStyle);
const hero = document.querySelector('.hero-card');
if (hero) {
  const label = hero.querySelector('.label');
  const title = hero.querySelector('h2');
  const paragraph = hero.querySelector('p');
  const action = hero.querySelector('#refresh-btn');
  if (label) label.textContent = '知乎行为画像 · 09.11';
  if (label) label.insertAdjacentHTML('afterend', '<span class="behavior-badge">点赞 / 收藏</span>');
  if (title) title.innerHTML = '不是标签相似，<br/><em>是留下过同样的痕迹</em>';
  if (paragraph) paragraph.textContent = '知音局从你在知乎点赞、收藏和持续阅读的内容里，找出真正让你停留过的问题，再去匹配同样被它们打动的人。';
  if (action) action.innerHTML = '重新寻找同频者 <span>↗</span>';
}
const authBox = document.querySelector('.auth-box');
if (authBox) {
  const heading = authBox.querySelector('h3');
  const description = authBox.querySelector('p');
  if (heading) heading.textContent = '连接你的知乎行为';
  if (description) description.textContent = '知音局匹配的不是简单标签，而是你真正点赞、收藏、反复阅读过的内容。Demo 当前使用模拟授权流程，不需要你输入 AccessSecret。';
  if (!authBox.querySelector('.behavior-preview')) authBox.querySelector('.auth-actions')?.insertAdjacentHTML('beforebegin', '<div class="behavior-preview"><span>♡ 点赞内容</span><span>▣ 收藏内容</span><span>↗ 关注话题</span></div>');
}
const roundtable = document.querySelector('.roundtable-hero');
if (roundtable) {
  const status = roundtable.querySelector('.label');
  const heading = roundtable.querySelector('h2');
  const description = roundtable.querySelector('p');
  const core = roundtable.querySelector('.round-core');
  if (status) status.textContent = '主持中 · 12 人在线';
  if (heading) heading.innerHTML = '如果工具可以替你表达，<br/><em>你还会自己说吗？</em>';
  if (description) description.textContent = '一场关于表达、代理与真实感的开放讨论。有人提出问题，有人分享经历，也有人温柔地保留分歧。';
  if (core) core.innerHTML = '知音<br/><small>主持</small>';
}
