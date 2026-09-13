const oauthButton = document.querySelector('.auth-button');
let oauthConfigured = false;
const oauthDataStyle = document.createElement('style');
oauthDataStyle.textContent = `.oauth-data{margin:0 0 18px;border-top:1px solid #d9d6cf;border-bottom:1px solid #d9d6cf;padding:20px 0}.oauth-data-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:13px}.oauth-data-head b{font-size:14px}.oauth-data-head span{font-size:10px;color:#4e9978}.oauth-columns{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:10px}.oauth-column{border:1px solid #d9d6cf;padding:13px;min-height:110px}.oauth-column h4{font-size:10px;letter-spacing:1px;color:#8b887f;margin:0 0 12px}.oauth-column p{font-size:11px;line-height:1.6;margin:7px 0;color:#4c4b46}.oauth-empty{color:#aaa79f!important}@media(max-width:650px){.oauth-columns{grid-template-columns:1fr}}`;
document.head.appendChild(oauthDataStyle);

async function refreshOAuthState() {
  try {
    const configResponse = await fetch('/api/oauth/config');
    const config = await configResponse.json();
    oauthConfigured = Boolean(config.configured);
    if (oauthButton && oauthConfigured) oauthButton.textContent = '使用知乎登录';
    const meResponse = await fetch('/api/oauth/me');
    if (!meResponse.ok) return;
    const me = await meResponse.json();
    if (me.authenticated) applyOAuthUser(me);
  } catch {
    if (oauthButton) oauthButton.textContent = '连接知乎';
  }
}

function applyOAuthUser(payload) {
  const user = payload.user || {};
  if (oauthButton) oauthButton.textContent = `${user.fullname || '知乎用户'} · 已连接`;
  const avatars = document.querySelectorAll('.top-actions .avatar, .user-mini .avatar, .profile-avatar');
  avatars.forEach(item => { item.textContent = (user.fullname || '知').slice(0, 1); if (user.avatar_path) item.style.backgroundImage = `url(${user.avatar_path})`; });
  const profileTitle = document.querySelector('#profile-view h2');
  const profileDescription = document.querySelector('#profile-view .profile-header p');
  if (profileTitle) profileTitle.textContent = `${user.fullname || '知乎用户'}的观点画像`;
  if (profileDescription) profileDescription.textContent = user.headline || '已连接知乎公开资料';
  renderOAuthData(payload);
  const toast = document.querySelector('#toast');
  if (new URLSearchParams(location.search).get('oauth') === 'success') {
    toast.textContent = `已连接 ${user.fullname || '知乎用户'}，正在读取关注与创作…`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
    history.replaceState({}, '', '/');
  }
}

function renderOAuthData(payload) {
  const profileView = document.querySelector('#profile-view');
  if (!profileView) return;
  let panel = document.querySelector('#oauth-data');
  if (!panel) { panel = document.createElement('section'); panel.id = 'oauth-data'; panel.className = 'oauth-data'; profileView.insertBefore(panel, profileView.querySelector('.profile-columns')); }
  const contents = payload.contents?.Data?.Items || [];
  const followees = payload.followees?.Data?.Items || [];
  const collections = payload.collections?.Data?.Items || [];
  const escape = value => String(value || '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const list = (items, field, empty) => items.length ? items.slice(0, 3).map(item => `<p>${escape(item[field] || item.Fullname || item.Title)}</p>`).join('') : `<p class="oauth-empty">${empty}</p>`;
  panel.innerHTML = `<div class="oauth-data-head"><b>已授权的知乎资料</b><span>OAuth · 仅展示公开范围</span></div><div class="oauth-columns"><div class="oauth-column"><h4>最近创作</h4>${list(contents, 'Title', '暂未读取到创作')}</div><div class="oauth-column"><h4>关注的人</h4>${list(followees, 'Fullname', '暂未读取到关注')}</div><div class="oauth-column"><h4>近期收藏</h4>${list(collections, 'Title', '暂未读取到收藏')}</div></div>`;
}

oauthButton?.addEventListener('click', event => {
  if (!oauthConfigured) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  window.location.href = '/auth/zhihu/start';
}, true);

refreshOAuthState();
