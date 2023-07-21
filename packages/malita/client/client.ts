function getSocketHost() {
  const url: any = location
  const host = url.host
  const isHttps = url.protocol === 'https:'
  return `${isHttps ? 'wss' : 'ws'}://${host}`
}

if ('WebSocket' in window) {
  const socket = new window.WebSocket(getSocketHost(), 'malita-hmr')
  let pingTimer: NodeJS.Timer | null = null;

  // socket监听接收消息
  socket.addEventListener('message', async ({data}) => {
    data = JSON.parse(data)

    // 启动心跳检测
    if (data.type === 'connected') {
      console.log(`[malita] connected.`);
      // 心跳包 
      pingTimer = setInterval(() => socket.send('ping'), 30000);
    }

    // 重新加载页面
    if (data.type === 'reload') window.location.reload()
  })

  // 断线重连逻辑, 循环请求
  async function waitForSuccessfulPing(ms = 1000) {
    while (true) {
      try {
        await fetch(`/__malita_ping`);
        // 请求成功,跳出循环
        break;
      } catch (e) {
        // 请求失败,间隔1s继续请求, 直到成功为止
        await new Promise((resolve) => setTimeout(resolve, ms));
      }
    }
  }

  // socket监听关闭
  socket.addEventListener('close', async () => {
    // 关闭心跳检测
    if (pingTimer) clearInterval(pingTimer);
    console.info('[malita] Dev server disconnected. Polling for restart...');
    // 启动断线重连
    await waitForSuccessfulPing();
    location.reload();
  });
}