import prompts from 'prompts'
import type { ChalkInstance } from 'chalk'
import chalk from 'chalk'
import type { MiniAppName } from './mini-apps/helpers.js'

type LoggerName = Uppercase<MiniAppName> | 'SYSTEM'

const chalkToMiniAppNameMap: Record<LoggerName, ChalkInstance> = {
  SYSTEM: chalk.bold.bgGray,
  HAMSTER: chalk.bold.bgYellow,
  // "OKX-RACER": chalk.bold.bgGreen,
}

export type Logger = ReturnType<typeof createLogger>

export function createLogger(name: LoggerName = 'SYSTEM') {
  const formattedName = chalkToMiniAppNameMap[name](`   ${name}   `)

  const info = (message: string) => {
    console.log(`📜 ${formattedName}   ${chalk.bold(message)}`)
  }

  const success = (message: string) => {
    console.log(`✅️ ${formattedName}   ${chalk.bold.green(message)}`)
  }

  const error = (message: string) => {
    console.log(`🚨 ${formattedName}   ${chalk.bold.red(message)}`)
  }

  async function prompt<
    String extends string,
    Options extends Parameters<typeof prompts>[1],
  >(message: string, questions: prompts.PromptObject<String>, options?: Options) {
    return prompts({ ...questions, message: `${formattedName}   ${message}` }, options)
  }

  return {
    info,
    success,
    error,
    prompt,
  }
}

export const systemLogger = createLogger('SYSTEM')
