import express from 'express'
import { serve } from 'esbuild';
import type { ServeOnRequestArgs } from 'esbuild';
import path from "path";
import portfinder from 'portfinder';
import { DEFAULT_ENTRY_POINT, DEFAULT_OUTDIR, DEFAULT_PLATFORM, DEFAULT_PORT, DEFAULT_HOST, DEFAULT_BUILD_PORT } from './constants';

export const dev = async () => {
  const cwd = process.cwd();
  const app = express()
  const port = await portfinder.getPortPromise({
    port: DEFAULT_PORT,
  });

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
        <script src="http://${DEFAULT_HOST}:${DEFAULT_BUILD_PORT}/index.js"></script>
    </body>
    </html>`);
  })
  app.listen(port, async () => {
    console.log(`App listening at http://${DEFAULT_HOST}:${port}`)

    try {
      const devServe = await serve({
        port: DEFAULT_BUILD_PORT,
        host: DEFAULT_HOST,
        servedir: DEFAULT_OUTDIR,
        onRequest: (args: ServeOnRequestArgs) => {
          console.log(
              `${args.method}: ${args.path} ${args.timeInMS} ms`
          );
        },
      }, {
        outdir: DEFAULT_OUTDIR,
        bundle: true,
        entryPoints: [path.resolve(cwd, DEFAULT_ENTRY_POINT)],
        define: {
          'process.env.NODE_ENV': JSON.stringify('development'),
        },
      })

      process.on('SIGINT', () => {
        devServe.stop()
        process.exit(0)
      });
      process.on('SIGTERM', () => {
        devServe.stop()
        process.exit(1)
      })
    } catch (e) {
      console.log(e)
      process.exit(1)
    }
  })
}