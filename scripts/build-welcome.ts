import { build } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import chalk from 'chalk';
import ora from 'ora';
import minimist from 'minimist';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

const argv = minimist(process.argv.slice(2));
const TAG = '[build-welcome.ts]';

const buildWelcome = async (watch = false) => {
  const spinner = ora(`${TAG} Building welcome page...`);

  try {
    if (!watch) spinner.start();

    // 构建 Vue 应用
    await build({
      root: resolve(__dirname, '../electron/welcome'),
      base: './', // 使用相对路径，解决 Electron 中资源加载问题
      build: {
        outDir: resolve(__dirname, '../dist/welcome'),
        emptyOutDir: !watch, // 在watch模式下不清空目录
        rollupOptions: {
          input: resolve(__dirname, '../electron/welcome/main.ts'),
          output: {
            entryFileNames: 'welcome-app.js',
            chunkFileNames: '[name].js',
            assetFileNames: '[name].[ext]',
          },
        },
        // 确保资源文件被正确复制
        copyPublicDir: false,
        watch: watch ? {} : null, // 启用Vite内置的watch模式
        // 设置资源内联阈值，确保小图片被正确处理
        assetsInlineLimit: 0, // 禁用内联，确保所有资源都作为文件输出
      },
      plugins: [vue()],
      resolve: {
        alias: {
          '@': resolve(__dirname, '../src'),
        },
      },
      define: {
        'process.env.NODE_ENV': watch ? '"development"' : '"production"',
      },
    });

    // 复制并更新 HTML 文件
    const distDir = resolve(__dirname, '../dist/welcome');
    if (!existsSync(distDir)) {
      mkdirSync(distDir, { recursive: true });
    }

    // 读取原始 HTML 文件
    let htmlContent = readFileSync(
      resolve(__dirname, '../electron/welcome/welcome.html'),
      'utf-8',
    );

    // 插入 CSS 链接（在 </head> 前）
    htmlContent = htmlContent.replace(
      '</head>',
      '    <link rel="stylesheet" href="./main.css">\n</head>',
    );

    // 写入更新后的 HTML 文件
    writeFileSync(resolve(distDir, 'welcome.html'), htmlContent);

    if (!watch) {
      spinner.succeed(`${TAG} Welcome page built successfully`);
    } else {
      console.log(
        `${TAG} ${chalk.green('Welcome page built successfully (watch mode)')}`,
      );
    }
  } catch (error) {
    console.log(`\n${TAG} ${chalk.red('构建欢迎页面报错')}\n`, error, '\n');
    if (!watch) spinner.fail(`${TAG} Welcome page build failed`);
    throw error;
  }
};

if (require.main === module) {
  if (argv.watch) {
    console.log(
      `${TAG} ${chalk.blue('Starting welcome page in watch mode...')}`,
    );
    buildWelcome(true).catch(process.exit);
  } else {
    buildWelcome(false).catch(process.exit);
  }
}

export { buildWelcome };
