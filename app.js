const fallbackPeople = [
  { name: '周也', role: '独立开发者 · 上海', initials: '周', color: '#f5c5af', score: '94%', activity: '刚刚活跃', activityTone: 'now', tags: ['AI 产品', '长期主义'], quote: '“把复杂的东西做得好玩，是一种能力。”' },
  { name: '苏青', role: '编辑 / 纪录片爱好者', initials: '苏', color: '#c8bdf0', score: '89%', activity: '3 天前活跃', activityTone: 'recent', tags: ['表达', '城市观察'], quote: '“我更在意一个问题背后的真实生活。”' },
  { name: 'Kaito', role: '研究生 · 认知科学', initials: 'K', color: '#b9dece', score: '86%', activity: '2 个月前活跃', activityTone: 'away', tags: ['心理学', '学习方法'], quote: '“好的讨论不是说服，而是一起把问题讲清楚。”' }
];
const palette = ['#f5c5af', '#c8bdf0', '#b9dece', '#f2d99d', '#b7d4ec', '#e5b9cb'];
let people = [...fallbackPeople];
const grid = document.querySelector('#match-grid');
const toast = document.querySelector('#toast');

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function items(result) { return result?.Data?.Items || []; }
function initials(name) { return String(name || '知').trim().slice(0, 1) || '知'; }
function dateLabel(timestamp) {
  if (!timestamp) return '近期有更新';
  const date = new Date(Number(timestamp) * 1000);
  return `收藏于 ${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function topicTags(data) {
  const text = [...items(data.collections), ...items(data.contents)].map(item => `${item.Title || ''} ${item.Summary || ''}`).join(' ');
  const rules = [
    ['AI', /\bAI\b|人工智能|智能算法|Agent/i],
    ['学习方法', /学习|高考|研究生|教育|课程/],
    ['数学与物理', /数学|物理|圆锥曲线|联邦学习/],
    ['表达与写作', /作文|写作|表达|文章/],
    ['长期主义', /长期|成长|坚持|方法论/]
  ]; 
  const matched = rules.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  return (matched.length ? matched : ['知乎收藏', '持续探索', '真实兴趣']).slice(0, 5);
}

function buildPeople(data) {
  const followees = items(data?.followees);
  const collections = items(data?.collections);
  const candidates = [];
  const seen = new Set();
  const add = (person, source, item) => {
    const key = person?.UrlToken || person?.Url || person?.Name || person?.Fullname;
    if (!key || seen.has(key)) return;
    seen.add(key);
    candidates.push({
      name: person.Fullname || person.Name,
      role: person.Headline || (source === 'follow' ? '我的关注' : '出现在我的收藏里'),
      initials: initials(person.Fullname || person.Name),
      color: palette[candidates.length % palette.length],
      score: `${Math.max(78, 96 - candidates.length * 3)}%`,
      activity: source === 'follow' ? '正在关注' : dateLabel(item?.FavTime),
      activityTone: source === 'follow' ? 'now' : 'recent',
      tags: source === 'follow' ? ['关注对象', '长期阅读'] : [item?.ContentType || '收藏', ...(item?.Favlists || []).slice(0, 1).map(list => list.Title)],
      quote: item?.Title ? `“${String(item.Title).slice(0, 42)}”` : '“从长期关注里，找到一条值得继续聊的关系线。”'
    });
  };
  followees.forEach(person => add(person, 'follow'));
  collections.forEach(item => { if (item.Author) add(item.Author, 'collection', item); });
  return candidates.length ? candidates.slice(0, 6) : [...fallbackPeople];
}

function renderCards() {
  if (!grid) return;
  grid.innerHTML = people.map((person, index) => `<article class="match-card" data-person="${index}"><div class="card-top"><div class="person-avatar" style="background:${person.color}">${escapeHtml(person.initials)}</div><span class="activity ${person.activityTone}"><i></i>${escapeHtml(person.activity)}</span><span class="card-heart">♡</span></div><h4>${escapeHtml(person.name)}</h4><span class="role">${escapeHtml(person.role)}</span><p>${escapeHtml(person.quote)}</p><div class="match-score"><span>${person.tags.map(escapeHtml).join(' · ')}</span><b>${escapeHtml(person.score)} 同频</b></div></article>`).join('');
  document.querySelectorAll('.match-card').forEach(card => card.addEventListener('click', () => showToast(`已生成与 ${people[card.dataset.person].name} 的专属破冰话题`)));
}

function updatePersonalView(data) {
  const contents = items(data?.contents);
  const followees = items(data?.followees);
  const collections = items(data?.collections);
  const topics = topicTags(data);
  const countText = `${contents.length} 条创作 · ${followees.length} 位关注 · ${collections.length} 条近期收藏`;
  document.querySelector('#top-avatar')?.replaceChildren(document.createTextNode('我'));
  document.querySelector('.profile-avatar')?.replaceChildren(document.createTextNode('我'));
  const profileTitle = document.querySelector('#profile-view h2');
  const profileDescription = document.querySelector('#profile-view .profile-header p');
  if (profileTitle) profileTitle.textContent = '我的知乎画像';
  if (profileDescription) profileDescription.textContent = `实时读取 · ${countText}`;
  const heroDescription = document.querySelector('.hero-card p');
  if (heroDescription) heroDescription.textContent = `从你的 ${collections.length} 条近期收藏、${followees.length} 位关注对象和 ${contents.length} 条创作里，整理出一张正在生长的关系地图。`;
  const tagCloud = document.querySelector('.tag-cloud');
  if (tagCloud) tagCloud.innerHTML = topics.map((topic, index) => `<span class="tag ${index === 0 ? 'strong' : index > 2 ? 'soft' : ''}">${escapeHtml(topic)}</span>`).join('');
  const quote = document.querySelector('.quote-panel p');
  if (quote) quote.textContent = collections[0]?.Title ? `最近收藏：“${collections[0].Title}”` : '我喜欢从收藏和关注里，慢慢确认自己真正感兴趣的事。';
  const nodes = [...document.querySelectorAll('.relationship-map .map-node:not(.node-me)')];
  people.slice(0, nodes.length).forEach((person, index) => { nodes[index].textContent = person.initials; });
  document.querySelector('.node-me')?.replaceChildren(document.createTextNode('我'));
  document.querySelector('.cap-1')?.replaceChildren(document.createTextNode(topics[0] || '收藏主题'));
  document.querySelector('.cap-2')?.replaceChildren(document.createTextNode(topics[1] || '关注关系'));
  document.querySelector('.cap-3')?.replaceChildren(document.createTextNode('继续探索'));
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}

renderCards();
document.querySelector('#refresh-btn')?.addEventListener('click', () => {
  showToast('正在用新的关系线索为你匹配…');
  setTimeout(() => { people.reverse(); renderCards(); showToast('匹配完成，发现了新的同频关系'); }, 700);
});
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
  document.querySelector(`#${button.dataset.view}-view`)?.classList.add('active-view');
  const titles = { match: '今日，和一个同频的人聊聊', roundtable: '把观点放在桌面上，认识彼此', profile: '先认识自己，再遇见同频的人' };
  const title = document.querySelector('#view-title');
  if (title) title.textContent = titles[button.dataset.view];
}));

async function loadAccountData() {
  try {
    const response = await fetch('/api/account-data', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    if (data.source !== 'zhihu') return;
    people = buildPeople(data);
    renderCards();
    updatePersonalView(data);
    showToast('已载入你的知乎兴趣关系');
  } catch {
    // 无凭证时保留轻量演示数据，不影响页面打开。
  }
}

loadAccountData();
