const authStyle = document.createElement('style');
authStyle.textContent = `
.live-source{display:inline-block;margin-left:8px;color:#c37b61;background:#fff0e9;border-radius:99px;padding:4px 7px;letter-spacing:0;font-size:9px}.live-source.ready{color:#4d9277;background:#e8f5ee}
.hot-topics{margin-top:24px;background:#fff;border-radius:18px;padding:22px 23px}.hot-heading{display:flex;justify-content:space-between;align-items:end}.hot-heading h3{font-size:17px;margin:8px 0 0}.hot-live{font-size:10px;color:#5a9a7e;background:#ebf7ef;border-radius:99px;padding:6px 9px}.hot-list{margin-top:15px}.hot-row{width:100%;display:flex;align-items:center;gap:13px;border:0;border-top:1px solid #f0eff0;background:transparent;padding:13px 0;text-align:left;font:inherit;cursor:pointer}.hot-row:hover .hot-title{color:#d47f61}.hot-index{font:600 11px 'DM Sans';color:#e4997b}.hot-title{font-size:12px;color:#4c4e58;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hot-tag{font-size:10px;color:#8a7ab5;background:#f2effd;border-radius:99px;padding:4px 7px}.hot-score{font-size:10px;color:#a2a4ad}
.auth-button{border:1px solid #e7e4e0;background:#fff;border-radius:99px;padding:9px 13px;color:#565862;font:500 11px inherit;cursor:pointer}.auth-button:hover{border-color:#e7a083;color:#c87558}.auth-modal{position:fixed;inset:0;background:#24263155;display:none;place-items:center;z-index:10}.auth-modal.open{display:grid}.auth-box{width:min(420px,calc(100vw - 32px));background:#fff;border-radius:22px;padding:28px;box-shadow:0 20px 60px #24263130}.auth-box h3{margin:0 0 8px;font-size:21px}.auth-box>p{margin:0 0 20px;color:#858791;font-size:12px;line-height:1.7}.auth-label{display:block;color:#6c6e78;font-size:11px;margin:13px 0 7px}.auth-input{width:100%;border:1px solid #e8e6e2;border-radius:10px;padding:11px 12px;outline:none;font:12px inherit}.auth-input:focus{border-color:#e8a181}.auth-actions{display:flex;gap:9px;justify-content:flex-end;margin-top:22px}.auth-cancel{border:0;background:#f4f3f1;border-radius:10px;padding:11px 15px;color:#777983;font:500 12px inherit;cursor:pointer}.auth-note{color:#b0a29b;font-size:10px;margin-top:15px}
`;
document.head.appendChild(authStyle);
const topActions = document.querySelector('.top-actions');
const authButton = document.createElement('button');
authButton.className = 'auth-button';
authButton.textContent = '连接知乎';
topActions?.prepend(authButton);
const modal = document.createElement('div');
modal.className = 'auth-modal';
modal.innerHTML = `<div class="auth-box"><h3>连接你的知乎账号</h3><p>黑客松参赛作品已开通知乎 OAuth。点击后会跳转知乎官方授权页，完成授权后读取你的公开资料；用户无需另外申请 Access Secret。</p><div class="oauth-config-state" id="oauth-config-state">正在检查赛事 OAuth 配置…</div><div class="auth-actions"><button class="auth-cancel" id="auth-cancel">稍后再说</button><button class="primary-btn" id="auth-confirm">开始知乎授权 <span>↗</span></button></div><div class="auth-note">请将回调地址登记为当前公网 HTTPS 地址；临时隧道重启后可能需要同步更新赛事项目配置。</div></div>`;
document.body.appendChild(modal);
async function readOAuthConfig() {
  try {
    const response = await fetch('/api/oauth/config', { cache: 'no-store' });
    return await response.json();
  } catch {
    return { configured: false };
  }
}
async function showOAuthEntry() {
  const config = await readOAuthConfig();
  if (config.configured) {
    window.location.href = '/auth/zhihu/start';
    return;
  }
  const state = modal.querySelector('#oauth-config-state');
  if (state) state.textContent = '赛事 OAuth 凭证尚未配置。黑客松无需额外申请，请先从赛事项目页获取 App ID / App Key 并配置到服务端。';
  modal.classList.add('open');
}
authButton.addEventListener('click', showOAuthEntry);
modal.querySelector('#auth-cancel').addEventListener('click', () => modal.classList.remove('open'));
modal.querySelector('#auth-confirm').addEventListener('click', async () => {
  const config = await readOAuthConfig();
  if (config.configured) {
    window.location.href = '/auth/zhihu/start';
    return;
  }
  const state = modal.querySelector('#oauth-config-state');
  if (state) state.textContent = '还不能开始授权：请先在部署平台环境变量中配置赛事 App ID / App Key。';
});
