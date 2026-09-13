const apiToast = document.querySelector('#toast');
const apiQuery = 'AI 创作 长期主义';
const liveBadge = document.createElement('span');
liveBadge.className = 'live-source';
liveBadge.textContent = '知乎热榜 · 连接中';
document.querySelector('.topbar .eyebrow')?.append('  ', liveBadge);

async function loadZhihuHot() {
  try {
    const response = await fetch('/api/zhihu-hot');
    const result = await response.json();
    liveBadge.textContent = result.source === 'zhihu' ? '知乎热榜 · 实时' : '知乎热榜 · 演示';
    liveBadge.classList.add('ready');
    renderHotTopics(result);
  } catch {
    liveBadge.textContent = '知乎热榜 · 离线演示';
    renderHotTopics({ source: 'demo' });
  }
}

function renderHotTopics(result) {
  let panel = document.querySelector('#hot-topics');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'hot-topics';
    panel.className = 'hot-topics';
    document.querySelector('#match-view')?.append(panel);
  }
  const items = result?.data?.Items || result?.Data?.Items || result?.items || [];
  const fallback = [
    { title: '如何把复杂的事讲清楚？', score: '关系地图正在讨论', tag: '表达' },
    { title: 'AI 时代，什么能力仍然稀缺？', score: '来自知乎热榜', tag: '长期主义' },
    { title: '年轻人如何找到真正同频的人？', score: '适合发起圆桌', tag: '连接' }
  ];
  const rows = (items.length ? items.slice(0, 3).map(item => ({ title: item.Title || item.title || '知乎热门讨论', score: item.RankingScore ? `热度 ${Number(item.RankingScore).toFixed(2)}` : '知乎实时内容', tag: '热榜' })) : fallback);
  panel.innerHTML = `<div class="hot-heading"><div><span class="eyebrow">FROM ZHIHU NOW</span><h3>正在发生的讨论</h3></div><span class="hot-live">● ${result?.source === 'zhihu' ? '实时同步' : '演示话题'}</span></div><div class="hot-list">${rows.map((row, index) => `<button class="hot-row" data-topic="${String(row.title).replaceAll('"', '&quot;')}"><span class="hot-index">0${index + 1}</span><span class="hot-title">${row.title}</span><span class="hot-tag">${row.tag}</span><span class="hot-score">${row.score} →</span></button>`).join('')}</div>`;
  panel.querySelectorAll('.hot-row').forEach(row => row.addEventListener('click', () => {
    const toast = document.querySelector('#toast');
    toast.textContent = `已将「${row.dataset.topic}」加入你的关系地图`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
  }));
}

async function loadZhihuContext() {
  try {
    const response = await fetch(`/api/zhihu-search?query=${encodeURIComponent(apiQuery)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '请求失败');
    const count = Array.isArray(result.data) ? result.data.length : (Array.isArray(result.results) ? result.results.length : null);
    apiToast.textContent = result.source === 'zhihu'
      ? `已接入知乎搜索：${count === null ? '内容已返回' : `找到 ${count} 条相关内容`}`
      : '演示模式：配置 ZH_API_SECRET 后接入知乎实时内容';
    apiToast.classList.add('show');
    setTimeout(() => apiToast.classList.remove('show'), 2600);
  } catch (error) {
    apiToast.textContent = `知乎接口暂不可用：${error.message}`;
    apiToast.classList.add('show');
    setTimeout(() => apiToast.classList.remove('show'), 2600);
  }
}

document.querySelector('#refresh-btn')?.addEventListener('click', loadZhihuContext);
loadZhihuHot();
