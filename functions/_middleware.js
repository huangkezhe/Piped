export async function onRequest(context) {
  // ======= 配置区域 =======
  const USERNAME = "admin";       // 用户名（默认 admin）
  const PASSWORD = "20092009";      // 访问密码（请修改这里！）
  // ========================

  const auth = context.request.headers.get("Authorization");

  // 如果没有认证信息，弹出密码框
  if (!auth) {
    return new Response("需要登录才能访问", {
      status: 401,
      headers: { 
        "WWW-Authenticate": 'Basic realm="Private YouTube"',
      },
    });
  }

  // 解码用户输入的账号密码
  const [scheme, encoded] = auth.split(" ");
  
  if (!encoded || scheme !== "Basic") {
    return new Response("Bad Request", { status: 400 });
  }

  const buffer = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const decoded = new TextDecoder().decode(buffer);
  const [user, pass] = decoded.split(":");

  // 验证账号密码
  if (user === USERNAME && pass === PASSWORD) {
    // 密码正确，放行
    return await context.next();
  }

  // 密码错误，继续弹框
  return new Response("密码错误，请重试", {
    status: 401,
    headers: { 
      "WWW-Authenticate": 'Basic realm="Private YouTube"',
    },
  });
}
