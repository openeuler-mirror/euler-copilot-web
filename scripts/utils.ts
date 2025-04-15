import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { get } from 'http'
import { builtinModules } from 'module'
import { parse as parseEnv } from 'dotenv'

export function getEnv(): Record<string, string> {
  try {
    if (getEnv.env) {
      return getEnv.env
    }
    const env = parseEnv(fs.readFileSync(path.join(process.cwd(), '.env')))
    return (getEnv.env = env)
  }
  catch {
    return {}
  }
}
getEnv.env = undefined as Record<string, string> | undefined

/** node.js builtins module */
export const builtins = () =>
  builtinModules.filter(x => !/^_|^(internal|v8|node-inspect)\/|\//.test(x))

// 轮询监听vite启动
export function waitOn(arg0: { port: string | number, interval?: number }) {
  return new Promise<number | undefined>((resolve) => {
    const { port, interval = 149 } = arg0
    const url = `http://localhost:${port}`
    let counter = 0
    const timer: NodeJS.Timer = setInterval(() => {
      get(url, (res) => {
        clearInterval(timer as unknown as number)
        console.log('[waitOn]', chalk.green(`"${url}" are already responsive.`))
        resolve(res.statusCode)
      }).on('error', (error) => {
        console.log(error)
        console.log('[waitOn]', `counter: ${counter++}`)
      })
    }, interval)
  })
}
