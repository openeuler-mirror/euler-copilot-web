import path from 'path';
import type { RollupOptions } from 'rollup';
import copy from 'rollup-plugin-copy';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import { builtins, getEnv } from './utils';

export interface ConfigOptions {
  env?: typeof process.env.NODE_ENV;
  proc: 'main' | 'render' | 'preload';
}

const compilationInclude = [
  'electron/main/**/*.ts',
  'electron/preload/**/*.ts',
];

export default function (opts: ConfigOptions) {
  const sourcemap = opts.proc === 'render';
  const options: RollupOptions = {
    input: path.join(__dirname, `../electron/${opts.proc}/index.ts`),
    output: {
      dir: path.join(__dirname, `../dist/${opts.proc}`),
      format: 'cjs',
      sourcemap,
    },
    plugins: [
      nodeResolve({
        extensions: ['.ts', '.js', 'json'],
      }),
      commonjs({
        include: compilationInclude,
      }),
      json(),
      typescript({
        sourceMap: sourcemap,
        noEmitOnError: true,
        include: compilationInclude,
        target: 'ES2022', // 支持私有字段语法
        lib: ['ES2022', 'DOM'], // 总是包含 DOM 库，因为 preload 文件需要访问 window
      }),
      alias({
        entries: {
          '@': path.join(__dirname, '../src'),
        },
      }),
      copy({
        targets: [
          { src: 'build/trayTemplate.png', dest: 'dist' },
          { src: 'build/tray.png', dest: 'dist' },
        ],
      }),
      replace({
        ...Object.entries({ ...getEnv(), NODE_ENV: opts.env }).reduce(
          (acc, [k, v]) =>
            Object.assign(acc, { [`process.env.${k}`]: JSON.stringify(v) }),
          {},
        ),
        preventAssignment: true,
      }),
    ],
    external: [...builtins(), 'electron'],
    onwarn: (warning) => {
      // https://github.com/rollup/rollup/issues/1089#issuecomment-365395213
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        console.error(`(!) ${warning.message}`);
      }
    },
  };

  return options;
}
