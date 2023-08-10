import express from 'express'
import { build } from 'esbuild';
import type { ServeOnRequestArgs } from 'esbuild';
import fs from "fs";
import path from "path";
import portfinder from 'portfinder';
import { createServer } from "http";
import { DEFAULT_OUTDIR, DEFAULT_PLATFORM, DEFAULT_PORT, DEFAULT_HOST } from './constants';
import { createWebSocketServer } from "./server";
import { getAppData } from './appData';
import { getRoutes } from './routes';
import { generateEntry } from './entry';
import { generateHtml } from './html';
import { style } from './styles';

export const dev = async () => {
  const cwd = process.cwd();
  const app = express()
  // Socket 服务端与 express 结合使用
  const malitaServe = createServer(app)
  // 检测端口是否被占用,获取动态端口
  const port = await portfinder.getPortPromise({
    port: DEFAULT_PORT,
  });

  const output = path.resolve(cwd, DEFAULT_OUTDIR);

  app.get('/', (_req, res, next) => {
    res.set('Content-Type', 'text/html');
    const htmlPath = path.join(output, 'index.html');
    if (fs.existsSync(htmlPath)) {
        fs.createReadStream(htmlPath).on('error', next).pipe(res);
    } else {
        next();
    }
  })

  // 访问DEFAULT_OUTDIR时,重定向到esbuildOutput
  app.use(`/${DEFAULT_OUTDIR}`, express.static(output));
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
      // 生命周期
      // 获取项目元信息  
      const appData = await getAppData({
        cwd
      });
      console.log('appData', appData)
      // 获取 routes 配置
      const routes = await getRoutes({ appData });
      console.log('routes', routes)
      // 生成项目主入口
      await generateEntry({ appData, routes });
      // 生成 Html
      await generateHtml({ appData });

      await build({
        format: 'iife',
        logLevel: 'error',
        outdir: appData.paths.absOutputPath,
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
        plugins: [style()],
        entryPoints: [appData.paths.absEntryPath],
      });
      // [Issues](https://github.com/evanw/esbuild/issues/805)
      // 查了很多资料，esbuild serve 不能响应 onRebuild， esbuild build 和 express 组合不能不写入文件
    } catch (e) {
      console.log(e)
      process.exit(1)
    }
  })
}