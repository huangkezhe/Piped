/**
 * Piped 私人实例 - 移动端完美适配版
 * 针对 iOS Safari 做了专门优化 (防缩放、防遮挡、去除原生样式)
 */

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // 1. 获取配置
  const configuredPass = env.ACCESS_PASSWORDS || "admin";
  const validPasswords = configuredPass.split(",").map(p => p.trim());

  // 2. 检查 Cookie
  const COOKIE_NAME = "Yt_Auth_Session";
  const cookieHeader = request.headers.get("Cookie") || "";
  if (cookieHeader.includes(`${COOKIE_NAME}=true`)) {
    return next();
  }

  // 3. 处理登录 (POST)
  if (request.method === "POST" && url.pathname === "/login") {
    const formData = await request.formData();
    const inputPass = formData.get("password");

    if (validPasswords.includes(inputPass)) {
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `${COOKIE_NAME}=true; Path=/; Max-Age=2592000; Secure; HttpOnly; SameSite=Lax`,
        },
      });
    } else {
      return new Response(getHtmlPage(true), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  // 4. 拦截显示登录页
  return new Response(getHtmlPage(false), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// === 页面生成函数 (iOS 优化版) ===
function getHtmlPage(isError) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <!-- 关键优化 1: 禁止用户缩放，适配各种屏幕宽度 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Private Tube</title>
  <style>
    :root {
      --bg-color: #0f0f0f;
      --card-bg: #1f1f1f;
      --text-color: #ffffff;
      --accent-color: #ff0000;
      --input-bg: #121212;
      --border-color: #303030;
    }
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: var(--bg-color);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: var(--text-color);
      
      /* 关键优化 2: 使用 dvh 解决 Safari 底部地址栏遮挡问题 */
      min-height: 100vh;
      height: 100dvh; 
      
      /* 防止 iOS 点击高亮背景 */
      -webkit-tap-highlight-color: transparent;
    }
    .login-card {
      background-color: var(--card-bg);
      padding: 30px;
      border-radius: 16px; /* 更圆润的角 */
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
      text-align: center;
      width: 85%; /* 手机上占比宽一些 */
      max-width: 320px;
      
      /* 简单的进场动画 */
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .logo {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 25px;
      letter-spacing: -0.5px;
    }
    .logo span { color: var(--accent-color); }
    
    input[type="password"] {
      width: 100%;
      padding: 14px;
      margin-bottom: 15px;
      background-color: var(--input-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: white;
      box-sizing: border-box;
      outline: none;
      
      /* 关键优化 3: 必须 >= 16px 否则 iOS 会自动放大网页 */
      font-size: 16px; 
      
      /* 关键优化 4: 去除 iOS 默认的内阴影和圆角风格 */
      -webkit-appearance: none; 
      appearance: none;
    }
    
    input[type="password"]:focus {
      border-color: #3ea6ff;
    }
    
    button {
      width: 100%;
      padding: 14px;
      background-color: #cc0000;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      
      /* 关键优化 4: 去除 iOS 默认按钮样式 */
      -webkit-appearance: none; 
    }
    
    button:active {
      background-color: #990000;
      transform: scale(0.98); /* 点击时的按压感 */
    }
    
    .error {
      color: #ff4e45;
      margin-bottom: 15px;
      font-size: 14px;
      background: rgba(255, 78, 69, 0.15);
      padding: 10px;
      border-radius: 6px;
    }
    .footer {
      margin-top: 25px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="logo">Private <span>Tube</span></div>
    
    ${isError ? '<div class="error">密码错误</div>' : ''}
    
    <form method="POST" action="/login">
      <!-- autocomplete="current-password" 让手机可以自动填充保存的密码 -->
      <input type="password" name="password" placeholder="请输入密码" required autocomplete="current-password" />
      <button type="submit">进入</button>
    </form>
    
    <div class="footer">Secure Access</div>
  </div>
</body>
</html>
  `;
}
