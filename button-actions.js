(() => {
  const modal = document.createElement('div');
  modal.className = 'action-modal';
  modal.innerHTML = '<div class="action-sheet" role="dialog" aria-modal="true"><button class="sheet-close" data-close aria-label="关闭">×</button><div class="sheet-content"></div></div>';
  document.body.appendChild(modal);
  const sheet = modal.querySelector('.sheet-content');

  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const toast = message => {
    if (typeof showToast === 'function') showToast(message);
  };
  const goView = view => document.querySelector(`[data-view="${view}"]`)?.click();
  const closePanel = () => modal.classList.remove('open');
  const openPanel = (html, ready) => {
    sheet.innerHTML = html;
    modal.classList.add('open');
    ready?.();
  };
  modal.addEventListener('click', event => {
    if (event.target === modal || event.target.closest('[data-close]')) closePanel();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(); });

  const fallbackResults = [
    { title: '搭子不是社交降级，而是关系的试用期', snippet: '先围绕一个具体问题相遇，再决定要不要把关系往前走。', source: '知音局线索' },
    { title: '为什么兴趣社群最后会长出关系结构？', snippet: '同一件事反复发生，弱连接才有机会变成稳定的共同记忆。', source: '知音局线索' },
    { title: '年轻人如何找到真正同频的人？', snippet: '从共同内容和可验证的表达痕迹开始，而不是从标签开始。', source: '知音局线索' }
  ];

  const normalizeItems = (payload, source) => {
    const items = payload?.Data?.Items || payload?.data?.Items || payload?.items || payload?.results || [];
    return items.slice(0, 5).map(item => ({
      title: item.Title || item.title || item.QuestionTitle || '正在发生的讨论',
      snippet: item.ContentText || item.Content || item.Excerpt || item.Description || '打开来源，看看这场讨论从哪里开始。',
      source,
      url: item.Url || item.url || ''
    }));
  };

  async function runSearch(query, resultsEl) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    resultsEl.innerHTML = '<div class="search-loading"><span></span><span></span><span></span>正在把知乎与全网的相关讨论放在一起…</div>';
    const [zhihuResponse, globalResponse] = await Promise.allSettled([
      fetch(`/api/zhihu-search?query=${encodeURIComponent(cleanQuery)}`).then(response => response.json()),
      fetch(`/api/global-search?query=${encodeURIComponent(cleanQuery)}`).then(response => response.json())
    ]);
    const zhihuItems = zhihuResponse.status === 'fulfilled' ? normalizeItems(zhihuResponse.value, '知乎') : [];
    const globalItems = globalResponse.status === 'fulfilled' ? normalizeItems(globalResponse.value, '全网') : [];
    const items = [...zhihuItems, ...globalItems];
    const finalItems = items.length ? items : fallbackResults;
    resultsEl.innerHTML = `<div class="search-result-meta"><span>关于「${escape(cleanQuery)}」</span><span>${items.length ? `知乎 ${zhihuItems.length} · 全网 ${globalItems.length}` : '演示线索'}</span></div>${finalItems.map((item, index) => `<article class="search-result" data-topic="${escape(item.title)}"><div class="search-result-index">0${index + 1}</div><div class="search-result-main"><div class="search-result-title">${escape(item.title)}</div><p>${escape(String(item.snippet).replace(/\s+/g, ' ').slice(0, 150))}</p><span>${escape(item.source)}</span></div>${item.url ? `<a class="search-result-link" href="${escape(item.url)}" target="_blank" rel="noreferrer" aria-label="打开来源">↗</a>` : '<span class="search-result-link">→</span>'}</article>`).join('')}`;
    resultsEl.querySelectorAll('.search-result').forEach(item => item.addEventListener('click', event => {
      if (event.target.closest('a')) return;
      selectTopic(item.dataset.topic);
    }));
  }

  function openSearch(initial = '') {
    openPanel(`<div class="sheet-kicker">DISCOVER THE THREAD</div><h3>从一个正在发生的问题开始</h3><p class="sheet-intro">知乎热榜告诉你此刻大家在讨论什么，全网搜索帮你看到更多背景。选中一个问题，它就会进入你的关系地图。</p><form class="search-form"><input id="thread-query" autocomplete="off" placeholder="搜索兴趣、观点或一个问题" value="${escape(initial)}"><button class="primary-btn" type="submit">开始搜索 <span>↗</span></button></form><div class="search-chips"><button type="button" data-query="搭子文化">搭子文化</button><button type="button" data-query="AI 表达">AI 表达</button><button type="button" data-query="城市生活">城市生活</button><button type="button" data-query="长期主义">长期主义</button></div><div class="search-results" id="search-results"></div>`, () => {
      const form = sheet.querySelector('.search-form');
      const input = sheet.querySelector('#thread-query');
      const results = sheet.querySelector('#search-results');
      form.addEventListener('submit', event => { event.preventDefault(); runSearch(input.value, results); });
      sheet.querySelectorAll('[data-query]').forEach(chip => chip.addEventListener('click', () => { input.value = chip.dataset.query; runSearch(input.value, results); }));
      input.focus();
      if (initial) runSearch(initial, results);
    });
  }

  function selectTopic(topic) {
    closePanel();
    goView('match');
    const heroTitle = document.querySelector('#match-view .hero-card h2');
    const heroCopy = document.querySelector('#match-view .hero-card p');
    if (heroTitle) heroTitle.innerHTML = '不是标签相似，<br/><em>是被同一个问题打动</em>';
    if (heroCopy) heroCopy.textContent = `你刚刚选中了「${topic}」。知音局会沿着共同阅读、点赞和收藏过的内容，找出值得继续聊的人。`;
    document.querySelector('.hero-card')?.classList.add('topic-focus');
    setTimeout(() => document.querySelector('.hero-card')?.classList.remove('topic-focus'), 1400);
    toast(`已把「${topic}」放进你的关系地图`);
  }

  function openRoundtableChooser() {
    openPanel(`<div class="sheet-kicker">START A SMALL TABLE</div><h3>选择一个你愿意继续聊的问题</h3><p class="sheet-intro">先从具体问题开始，不急着认识所有人。知音局会把观点相近但经历不同的人放到同一张桌子上。</p><div class="roundtable-choices"><button data-round-topic="AI 会不会改变我们表达自己的方式？"><b>AI 会不会改变我们表达自己的方式？</b><span>12 人在线 · 3 个新分歧</span></button><button data-round-topic="年轻人需要一份稳定的工作吗？"><b>年轻人需要一份稳定的工作吗？</b><span>8 人参与 · 观点正在收敛</span></button><button data-round-topic="我们为什么越来越难交到朋友？"><b>我们为什么越来越难交到朋友？</b><span>16 人参与 · 等待你的第一句</span></button></div>`, () => {
      sheet.querySelectorAll('[data-round-topic]').forEach(choice => choice.addEventListener('click', () => {
        activateRoundtableTopic(choice.dataset.roundTopic);
        closePanel();
      }));
    });
  }

  function activateRoundtableTopic(topic) {
    goView('roundtable');
    const heading = document.querySelector('#roundtable-view .roundtable-hero h2');
    const copy = document.querySelector('#roundtable-view .roundtable-hero p');
    if (heading) heading.innerHTML = '今晚只聊一个问题，<br/><em>把各自的答案放在桌上</em>';
    if (copy) copy.textContent = `正在讨论：${topic}  · 先说说你为什么会停在这个问题上。`;
    toast(`已切换到「${topic}」圆桌`);
  }

  function enterRoundtable() {
    const button = document.querySelector('#enter-roundtable');
    if (button) { button.innerHTML = '已进入圆桌 <span>✓</span>'; button.disabled = true; }
    openPanel(`<div class="sheet-kicker">YOU ARE IN</div><h3>先留下第一句，不必写得完美</h3><p class="sheet-intro">圆桌里的人会先看到这句话，再决定从哪里接住你。</p><textarea class="starter-input" placeholder="我停在这个问题上，是因为……"></textarea><div class="sheet-actions"><button class="text-btn" data-close>先旁听</button><button class="primary-btn" id="send-starter">发布第一句 <span>↗</span></button></div>`, () => {
      sheet.querySelector('#send-starter').addEventListener('click', () => {
        const value = sheet.querySelector('.starter-input').value.trim();
        if (!value) { toast('先写下一句话，再进入讨论'); return; }
        closePanel();
        toast('第一句已发出，等一个不同的答案接住你');
      });
    });
  }

  function editProfile() {
    openPanel(`<div class="sheet-kicker">YOUR POINT OF VIEW</div><h3>把画像写得更像你</h3><p class="sheet-intro">这些内容只用于本次 Demo 的匹配展示，不会替代你的知乎资料。</p><label class="profile-label" for="signature-input">你的表达签名</label><input class="profile-input" id="signature-input" value="我喜欢先把问题想清楚，再认真地和一个人聊完。"><label class="profile-label">保留在兴趣坐标里的关键词</label><div class="edit-tags"><button class="selected" data-edit-tag="AI × 创作">AI × 创作</button><button class="selected" data-edit-tag="长期主义">长期主义</button><button data-edit-tag="城市生活">城市生活</button><button class="selected" data-edit-tag="表达">表达</button><button data-edit-tag="阅读">阅读</button></div><div class="sheet-actions"><button class="text-btn" data-close>取消</button><button class="primary-btn" id="save-profile">保存画像 <span>↗</span></button></div>`, () => {
      sheet.querySelectorAll('[data-edit-tag]').forEach(tag => tag.addEventListener('click', () => tag.classList.toggle('selected')));
      sheet.querySelector('#save-profile').addEventListener('click', () => {
        const signature = sheet.querySelector('#signature-input').value.trim();
        const selected = [...sheet.querySelectorAll('.edit-tags .selected')].map(tag => tag.dataset.editTag);
        const quote = document.querySelector('#profile-view .quote-panel p');
        const cloud = document.querySelector('#profile-view .tag-cloud');
        const desc = document.querySelector('#profile-view .profile-header p');
        if (quote && signature) quote.textContent = signature;
        if (cloud && selected.length) cloud.innerHTML = selected.map((tag, index) => `<span class="tag ${index === 0 ? 'strong' : ''}">${escape(tag)}</span>`).join('');
        if (desc) desc.textContent = '刚刚更新 · 来自你的兴趣选择和知乎公开行为';
        closePanel();
        toast('画像已更新，下一次匹配会沿着新的兴趣坐标展开');
      });
    });
  }

  const extraMatches = [
    { name: 'Ava', role: '产品设计师 · 杭州', initials: 'A', color: '#d7ccf2', score: '84%', activity: '今天活跃', activityTone: 'now', tags: ['产品思维', '长期主义'], quote: '“好的产品会给人留下继续探索的余地。”' },
    { name: '米粒', role: '写作者 · 广州', initials: '米', color: '#f2b39d', score: '81%', activity: '昨天活跃', activityTone: 'recent', tags: ['阅读', '表达'], quote: '“我总在一个问题里，发现另一个人的生活。”' }
  ];
  function renderExtraMatches() {
    const grid = document.querySelector('#match-grid');
    if (!grid) return;
    extraMatches.forEach((person, index) => {
      const card = document.createElement('article');
      card.className = 'match-card extra-match';
      card.dataset.extra = 'true';
      card.dataset.person = `extra-${index}`;
      card.innerHTML = `<div class="card-top"><div class="person-avatar" style="background:${person.color}">${person.initials}</div><span class="activity ${person.activityTone}"><i></i>${person.activity}</span><span class="card-heart">♡</span></div><h4>${person.name}</h4><span class="role">${person.role}</span><p>${person.quote}</p><div class="match-score"><span>${person.tags.join(' · ')}</span><b>${person.score} 同频</b></div>`;
      card.addEventListener('click', () => toast(`已生成与 ${person.name} 的专属破冰话题`));
      grid.appendChild(card);
    });
  }

  document.querySelector('#search-btn')?.addEventListener('click', () => openSearch());
  document.querySelector('#discover-btn')?.addEventListener('click', () => {
    goView('match');
    document.querySelector('#hot-topics')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('这里是今天值得追踪的知乎讨论');
  });
  document.querySelector('#top-avatar')?.addEventListener('click', () => goView('profile'));
  document.querySelector('#top-avatar')?.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') goView('profile'); });
  document.querySelector('#match-all-btn')?.addEventListener('click', event => {
    const button = event.currentTarget;
    const expanded = button.dataset.expanded === 'true';
    if (expanded) {
      document.querySelectorAll('.extra-match').forEach(card => card.remove());
      button.dataset.expanded = 'false';
      button.innerHTML = '查看全部 <span>→</span>';
      toast('已收起额外匹配');
    } else {
      renderExtraMatches();
      button.dataset.expanded = 'true';
      button.innerHTML = '收起匹配 <span>↑</span>';
      toast('又找到 2 位可以继续聊的人');
    }
  });
  document.querySelector('#path-btn')?.addEventListener('click', () => {
    document.querySelector('.relationship-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelector('.node-me')?.classList.add('selected');
    toast('连接路径：共同问题 → 共同收藏 → 可继续的对话');
    setTimeout(() => document.querySelector('.node-me')?.classList.remove('selected'), 1800);
  });
  document.querySelector('#join-btn')?.addEventListener('click', openRoundtableChooser);
  document.querySelector('#enter-roundtable')?.addEventListener('click', enterRoundtable);
  document.querySelectorAll('.topic-card').forEach(card => card.addEventListener('click', () => activateRoundtableTopic(card.dataset.topic)));
  document.querySelector('#edit-profile-btn')?.addEventListener('click', editProfile);
  document.addEventListener('click', event => {
    const hotRow = event.target.closest('.hot-row');
    if (hotRow) openSearch(hotRow.dataset.topic || hotRow.textContent.trim());
    const sharedAction = event.target.closest('.shared-action');
    if (sharedAction) openSearch('共同收藏');
  });
})();
