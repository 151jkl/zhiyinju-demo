# 知乎 OAuth 配置

## 1. 获取赛事凭证

从黑客松页面获取 `App ID` 和 `App Key`：

<https://www.zhihu.com/hackathon?activity_code=zhihu_hackathon_2026_p>

不要把示例里的 `200` 或 `c114xxxxc72` 当作真实凭证。

## 2. 配置本地环境

在项目根目录 `.env` 增加：

```env
ZHIHU_OAUTH_APP_ID=你的赛事AppID
ZHIHU_OAUTH_APP_KEY=你的赛事AppKey
ZHIHU_OAUTH_REDIRECT_URI=https://mall-objectives-thumbs-mem.trycloudflare.com/auth/zhihu/callback
```

回调地址必须与赛事后台登记的地址完全一致，包括协议、域名、路径和尾部斜杠。当前使用的是临时公网隧道地址，隧道重启后地址可能变化，需要同步更新申请表和 `.env`。

## 3. 启动

```powershell
npm start
```

打开 <http://localhost:5173>，点击“连接知乎”。

## 4. OAuth 后端流程

- `/auth/zhihu/start` 生成随机 `state` 并跳转知乎授权页。
- `/auth/zhihu/callback` 校验 `state`，接收 `authorization_code`。
- 服务端调用 `https://openapi.zhihu.com/access_token` 换取 OAuth Token。
- 服务端调用 `https://openapi.zhihu.com/user` 获取昵称、头像和个人介绍。
- 用户数据接口使用服务端 AccessSecret + `X-OAuth-Token` 读取创作、关注和近期收藏。

OAuth Token、App Key 和 AccessSecret 永远不进入前端、URL、日志或提交记录。
