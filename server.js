const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const root = __dirname;
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  });
}
const port = Number(process.env.PORT || 5173);
const secret = process.env.ZH_API_SECRET || '';
const apiBase = 'https://developer.zhihu.com';
const oauthAppId = process.env.ZHIHU_OAUTH_APP_ID || '';
const oauthAppKey = process.env.ZHIHU_OAUTH_APP_KEY || '';
const oauthRedirectUri = process.env.ZHIHU_OAUTH_REDIRECT_URI || `http://localhost:${port}/auth/zhihu/callback`;
const sessions = new Map();
let accountDataCache = { expiresAt: 0, value: null };

function headers() {
  return {
    Authorization: `Bearer ${secret}`,
    'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
    'Content-Type': 'application/json'
  };
}

async function zhihu(pathname, options = {}) {
  if (!secret) return { demo: true, data: null, message: '未配置 ZH_API_SECRET，当前使用演示数据' };
  const response = await fetch(`${apiBase}${pathname}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  const code = data.Code ?? data.code;
  if (!response.ok || (code !== undefined && Number(code) !== 0)) {
    throw new Error(`知乎 API ${response.status}${code !== undefined ? ` / ${code}` : ''}: ${data.Message || data.message || text.slice(0, 120)}`);
  }
  return data;
}

async function zhihuUser(pathname, oauthToken, options = {}) {
  if (!secret) return { demo: true, data: null, message: '未配置 ZH_API_SECRET，当前使用演示数据' };
  const response = await fetch(`${apiBase}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secret}`,
      'X-OAuth-Token': oauthToken,
      'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  const code = data.Code ?? data.code;
  if (!response.ok || (code !== undefined && Number(code) !== 0)) {
    throw new Error(`知乎用户 API ${response.status}${code !== undefined ? ` / ${code}` : ''}: ${data.Message || data.message || text.slice(0, 120)}`);
  }
  return data;
}

async function fetchOAuthUser(oauthToken) {
  const response = await fetch('https://openapi.zhihu.com/user', { headers: { Authorization: `Bearer ${oauthToken}` } });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok || !data.uid) throw new Error(`知乎登录信息获取失败（${response.status}）`);
  return data;
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(item => item.trim().split('=')) .filter(item => item.length === 2));
}

function setCookie(res, name, value, options = {}) {
  const parts = [`${name}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function exchangeCode(code) {
  const body = new URLSearchParams({ app_id: oauthAppId, app_key: oauthAppKey, grant_type: 'authorization_code', redirect_uri: oauthRedirectUri, code });
  const response = await fetch('https://openapi.zhihu.com/access_token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok || !data.access_token) throw new Error(`知乎 OAuth 换取 Token 失败（${response.status}）`);
  return data;
}

async function loadAccountData() {
  if (!secret) return { configured: false, source: 'demo', contents: null, followees: null, collections: null };
  if (accountDataCache.value && accountDataCache.expiresAt > Date.now()) return accountDataCache.value;
  const [contents, followees, collections] = await Promise.all([
    zhihu('/api/v1/user/contents?ContentType=all&Limit=20&SortField=ts&SortOrder=desc'),
    zhihu('/api/v1/user/followees?Limit=20'),
    zhihu('/api/v1/user/collections?Limit=20')
  ]);
  const value = { configured: true, source: 'zhihu', contents, followees, collections, fetchedAt: new Date().toISOString() };
  accountDataCache = { value, expiresAt: Date.now() + 5 * 60 * 1000 };
  return value;
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
}

function serveStatic(req, res) {
  const requested = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const safePath = path.normalize(requested).replace(/^([.][.][\\/])+/, '');
  const file = path.join(root, safePath);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return sendJson(res, 404, { error: 'Not found' });
  const ext = path.extname(file);
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

async function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === '/api/oauth/config') {
      return sendJson(res, 200, { configured: Boolean(oauthAppId && oauthAppKey), redirect_uri: oauthRedirectUri });
    }
    if (url.pathname === '/api/account-data') {
      return sendJson(res, 200, await loadAccountData());
    }
    if (url.pathname === '/auth/zhihu/start') {
      if (!oauthAppId || !oauthAppKey) return sendJson(res, 503, { error: '尚未配置 ZHIHU_OAUTH_APP_ID / ZHIHU_OAUTH_APP_KEY', demo: true });
      const state = crypto.randomBytes(24).toString('hex');
      sessions.set(`state:${state}`, { createdAt: Date.now(), redirectUri: oauthRedirectUri });
      setCookie(res, 'zhihu_oauth_state', state, { maxAge: 600 });
      const authorize = new URL('https://openapi.zhihu.com/authorize');
      authorize.searchParams.set('redirect_uri', oauthRedirectUri);
      authorize.searchParams.set('app_id', oauthAppId);
      authorize.searchParams.set('response_type', 'code');
      authorize.searchParams.set('state', state);
      res.writeHead(302, { Location: authorize.toString() });
      return res.end();
    }
    if (url.pathname === '/auth/zhihu/callback') {
      const state = url.searchParams.get('state');
      const code = url.searchParams.get('authorization_code') || url.searchParams.get('code');
      if (!state && !code) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end('<!doctype html><meta charset="utf-8"><title>知音局 OAuth 回调已就绪</title><style>body{font-family:system-ui,sans-serif;max-width:680px;margin:12vh auto;padding:24px;color:#193a34;background:#f4f1e9}main{border-top:2px solid #193a34;padding-top:24px}p{color:#52655f;line-height:1.7}</style><main><h1>知音局 OAuth 回调已就绪</h1><p>此地址可从公网访问。请从知乎授权页完成登录后返回，系统会继续校验授权状态并读取公开资料。</p></main>');
      }
      const saved = state ? sessions.get(`state:${state}`) : null;
      if (!state || !saved || Date.now() - saved.createdAt > 600000 || cookies(req).zhihu_oauth_state !== state) return sendJson(res, 400, { error: 'OAuth state 校验失败，请重新连接知乎' });
      sessions.delete(`state:${state}`);
      if (!code) return sendJson(res, 400, { error: '知乎未返回 authorization_code' });
      const token = await exchangeCode(code);
      const user = await fetchOAuthUser(token.access_token);
      const sessionId = crypto.randomUUID();
      sessions.set(`session:${sessionId}`, { token: token.access_token, expiresAt: Date.now() + Number(token.expires_in || 3600) * 1000, user });
      setCookie(res, 'zhiyin_session', sessionId, { maxAge: Number(token.expires_in || 3600) });
      res.writeHead(302, { Location: '/?oauth=success' });
      return res.end();
    }
    if (url.pathname === '/api/oauth/me') {
      const session = sessions.get(`session:${cookies(req).zhiyin_session}`);
      if (!session || session.expiresAt < Date.now()) return sendJson(res, 401, { authenticated: false });
      const [contents, followees, collections] = await Promise.all([
        zhihuUser('/api/v1/user/contents?ContentType=all&Limit=8&SortField=ts&SortOrder=desc', session.token),
        zhihuUser('/api/v1/user/followees?Limit=8', session.token),
        zhihuUser('/api/v1/user/collections?Limit=8', session.token)
      ]);
      return sendJson(res, 200, { authenticated: true, user: session.user, contents, followees, collections });
    }
    if (url.pathname === '/api/oauth/logout') {
      const sessionId = cookies(req).zhiyin_session;
      if (sessionId) sessions.delete(`session:${sessionId}`);
      setCookie(res, 'zhiyin_session', '', { maxAge: 0 });
      return sendJson(res, 200, { ok: true });
    }
    if (url.pathname === '/api/zhihu-search') {
      const query = url.searchParams.get('query') || 'AI 创作';
      const result = await zhihu(`/api/v1/content/zhihu_search?Query=${encodeURIComponent(query)}`);
      return sendJson(res, 200, { ...result, query, source: secret ? 'zhihu' : 'demo' });
    }
    if (url.pathname === '/api/global-search') {
      const query = url.searchParams.get('query') || '兴趣社交 同频';
      const result = await zhihu(`/api/v1/content/global_search?Query=${encodeURIComponent(query)}`);
      return sendJson(res, 200, { ...result, query, source: secret ? 'zhihu' : 'demo' });
    }
    if (url.pathname === '/api/zhihu-hot') {
      const result = await zhihu('/api/v1/content/hot_list');
      return sendJson(res, 200, { ...result, source: secret ? 'zhihu' : 'demo' });
    }
    if (url.pathname === '/api/zhihu-answer' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await zhihu('/v1/chat/completions', { method: 'POST', body });
      return sendJson(res, 200, { ...result, source: secret ? 'zhihu' : 'demo' });
    }
    return serveStatic(req, res);
  } catch (error) {
    sendJson(res, 502, { error: error.message, source: 'error' });
  }
}

module.exports = requestHandler;

if (require.main === module) {
  http.createServer(requestHandler).listen(port, () => console.log(`知音局 Demo running at http://localhost:${port}`));
}
