import express from 'express'
import { build } from 'esbuild';
import type { ServeOnRequestArgs } from 'esbuild';
import path from "path";
import portfinder from 'portfinder';
import { createServer } from "http";
import { DEFAULT_ENTRY_POINT, DEFAULT_OUTDIR, DEFAULT_PLATFORM, DEFAULT_PORT, DEFAULT_HOST, DEFAULT_BUILD_PORT } from './constants';
import { createWebSocketServer } from "./server";

export const dev = async () => {
  const cwd = process.cwd();
  const app = express()
  // Socket 服务端与 express 结合使用
  const malitaServe = createServer(app)
  // 检测端口是否被占用,获取动态端口
  const port = await portfinder.getPortPromise({
    port: DEFAULT_PORT,
  });

  const esbuildOutput = path.resolve(cwd, DEFAULT_OUTDIR);

  app.get('/', (_req, res) => {
    res.set('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <title>Malita</title>
    </head>
    
    <body>
        <div id="malita">
            <span>loading...</span>
        </div>
        <script src="/${DEFAULT_OUTDIR}/index.js"></script>
        <script src="/malita/client.js"></script>
    </body>
    </html>`);
  })

  // 访问DEFAULT_OUTDIR时,重定向到esbuildOutput
  app.use(`/${DEFAULT_OUTDIR}`, express.static(esbuildOutput));
  // 注入 Socket 客户端脚本
  //__dirname 文件所在路径 cwd 命令执行路径
  app.use(`/malita`, express.static(path.resolve(__dirname, 'client')));

  const ws = createWebSocketServer(malitaServe)

  function sendMessage (type: string, data?: any) {
    ws.send(JSON.stringify({ type, data }))
  }

  malitaServe.listen(port, async () => {
    console.log(`App listening at http://${DEFAULT_HOST}:${port}`)

    try {
      await build({
        format: 'iife',
        logLevel: 'error',
        outdir: esbuildOutput,
        platform: DEFAULT_PLATFORM,
        bundle: true,
        watch: {
          // 监听重新构建事件
          onRebuild: (err, res) => {
            if (err) {
                console.error(JSON.stringify(err));
                return;
            }
            // 向socket客户端发送重新加载消息
            sendMessage('reload')
          }
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify('development'),
        },
        external: ['esbuild'],
        entryPoints: [path.resolve(cwd, DEFAULT_ENTRY_POINT)],
      });
      // [Issues](https://github.com/evanw/esbuild/issues/805)
      // 查了很多资料，esbuild serve 不能响应 onRebuild， esbuild build 和 express 组合不能不写入文件
    } catch (e) {
      console.log(e)
      process.exit(1)
    }
  })
}