/**
 * Piped 私人实例 - 美化版网页登录中间件
 * 支持多密码、环境变量读取、Cookie 保持状态
 */

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // 1. 获取配置的密码 (从 Cloudflare 环境变量 ACCESS_PASSWORDS 读取)
  // 如果没设置，默认密码是 admin
  const configuredPass = env.ACCESS_PASSWORDS || "admin";
  // 支持用逗号分割多个密码，例如: "pass1,pass2,pass3"
  const validPasswords = configuredPass.split(",").map(p => p.trim());

  // 定义 Cookie 名称
  const COOKIE_NAME = "Yt_Auth_Session";

  // 2. 检查 Cookie 是否已登录
  const cookieHeader = request.headers.get("Cookie") || "";
  if (cookieHeader.includes(`${COOKIE_NAME}=true`)) {
    // 已登录，直接放行，进入 Piped 界面
    return next();
  }

  // 3. 处理登录请求 (POST)
  if (request.method === "POST" && url.pathname === "/login") {
    const formData = await request.formData();
    const inputPass = formData.get("password");

    if (validPasswords.includes(inputPass)) {
      // 密码正确！
      // 返回重定向响应，并写入 Cookie (有效期 30 天)
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/", // 登录成功跳回首页
          "Set-Cookie": `${COOKIE_NAME}=true; Path=/; Max-Age=2592000; Secure; HttpOnly; SameSite=Lax`,
        },
      });
    } else {
      // 密码错误，返回登录页并带上错误提示
      return new Response(getHtmlPage(true), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  // 4. 如果没登录，也不是 POST 请求，拦截所有访问，显示登录页
  return new Response(getHtmlPage(false), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// === 辅助函数：生成美化的登录页 HTML ===
function getHtmlPage(isError) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>安全访问验证</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #0f0f0f; /* YouTube 深色背景 */
      font-family: 'Roboto', Arial, sans-serif;
      color: white;
    }
    .login-card {
      background-color: #1f1f1f;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      text-align: center;
      width: 100%;
      max-width: 320px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #fff;
    }
    .logo span {
      color: #ff0000; /* YouTube 红 */
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 15px;
      margin: 10px 0;
      background-color: #121212;
      border: 1px solid #303030;
      border-radius: 4px;
      color: white;
      font-size: 16px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.3s;
    }
    input[type="password"]:focus {
      border-color: #3ea6ff;
    }
    button {
      width: 100%;
      padding: 12px;
      background-color: #cc0000;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 10px;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #ff0000;
    }
    .error {
      color: #ff4e45;
      margin-bottom: 15px;
      font-size: 14px;
      background: rgba(255, 78, 69, 0.1);
      padding: 8px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="logo">Private <span>Tube</span></div>
    
    ${isError ? '<div class="error">密码错误，请重试</div>' : ''}
    
    <form method="POST" action="/login">
      <input type="password" name="password" placeholder="请输入访问密码" required autofocus />
      <button type="submit">进入</button>
    </form>
    
    <div class="footer">
      受限资源 · 仅限授权访问
    </div>
  </div>
</body>
</html>
  `;
}
