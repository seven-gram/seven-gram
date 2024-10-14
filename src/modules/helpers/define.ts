import type { Command, CommandOptions, ConfigOptions, DefineModuleOptions, Event, Module, ModuleConfig } from 'src/modules/types.js'
import type { AnyRecord } from 'src/shared.js'
import type { NewMessageEvent } from 'telegram/events/NewMessage.js'
import { existsSync, mkdirSync } from 'node:fs'
import { escapeRegExp, memoize, merge } from 'lodash-es'
import { JSONFileSyncPreset } from 'lowdb/node'
import { useConfig } from 'src/config.js'
import { systemLogger } from 'src/logger.js'

const config = useConfig()

export function defineModule<
  GModuleConfig extends ModuleConfig | undefined,
>(options: DefineModuleOptions<GModuleConfig>): Module<GModuleConfig> {
  const { event: eventOptions } = options
  let event: Event | undefined

  if (eventOptions?.type === 'command' && eventOptions.commandSettings) {
    event = {
      type: 'command',
      commandSettings: {
        ...eventOptions.commandSettings,
        matchCommand(messageEvent: NewMessageEvent) {
          const messageString = messageEvent.message.text

          if (eventOptions.commandSettings.type === 'base') {
            return eventOptions.commandSettings.command.checkIsMatchWithPattern(messageString)
              ? eventOptions.commandSettings.command
              : undefined
          }
          else if (eventOptions.commandSettings.type === 'parrent') {
            const regExp = new RegExp(`^${escapeRegExp(config.getComputedCommandPrefix())}(?<commandPattern>\\w*)\\s?(?<subcommandPattern>\\w*)?\\s?(?<plainText>.*)?`)
            const regExpExecArray = regExp.exec(messageString)

            if (!regExpExecArray?.groups) {
              return undefined
            }

            const { commandPattern, subcommandPattern, plainText } = regExpExecArray.groups

            if (!commandPattern) {
              return undefined
            }

            if (commandPattern !== eventOptions.commandSettings.pattern) {
              return undefined
            }

            if (!subcommandPattern) {
              messageEvent.message.reply({ message: `Subcommand missed` })
              return undefined
            }

            const command = eventOptions.commandSettings.commands
              .find(command => command.checkIsMatchWithPattern(
                `${subcommandPattern} ${plainText}`.trim(),
                false,
              ))

            if (!command) {
              messageEvent.message.reply({ message: `Subcommand not match` })
            }

            return command
          }
          return undefined
        },
      },
    }
  }

  const returnData: any = {
    description: options.description,
    name: options.name,
    event,
    onInit: options.onInit,
  }

  if (('config' in options)) {
    returnData.config = options.config
  }

  return returnData
}

export function defineModules(modules: Module[]) {
  const finalModules: Module[] = []

  for (const module of modules) {
    if (finalModules.some(finalModule => finalModule.name === module.name)) {
      systemLogger.info(`Modules names dublication detected. Skip ${module.name} module`)
      continue
    }

    if (module.event?.type === 'command') {
      const moduleRootPattern = module.event.commandSettings.type === 'base'
        ? module.event.commandSettings.command.pattern
        : module.event.commandSettings.pattern

      const moduleWithRootCommandPatternIntersection = finalModules.find((finalModule) => {
        const finalModuleRootPattern = finalModule.event?.commandSettings.type === 'base'
          ? finalModule.event.commandSettings.command.pattern
          : finalModule.event?.commandSettings.pattern

        return finalModuleRootPattern === moduleRootPattern
      })

      if (moduleWithRootCommandPatternIntersection) {
        systemLogger.info(`Modules root command pattern intersection detected in modules ${moduleWithRootCommandPatternIntersection.name} and ${module.name}. Skipping ${module.name}`)
        continue
      }
    }

    finalModules.push(module)
  }

  function matchCommand(messageEvent: NewMessageEvent) {
    let command: Command | undefined

    for (const module of finalModules) {
      command = module.event?.commandSettings.matchCommand(messageEvent)

      if (command)
        break
    }

    return command
  }

  async function parseCommand(messageEvent: NewMessageEvent) {
    const command = matchCommand(messageEvent)

    if (!command) {
      return
    }

    const regExp = new RegExp(`${command.pattern}(?<plainText>.*)?`)
    const regExpExecArray = regExp.exec(messageEvent.message.text)

    if (!regExpExecArray?.groups) {
      messageEvent.message.reply({ message: `No groups in regexp` })
      return
    }

    const plainText = regExpExecArray.groups?.plainText?.trim() as string | undefined

    if (command.plainText?.required) {
      if (!plainText) {
        messageEvent.message.reply({ message: `Can not find **${command.plainText}** plain-text in message` })
        return
      }
    }

    try {
      await command.handler({
        messageEvent,
        plainText,
      })
    }
    catch (error) {
      if (error instanceof Error) {
        systemLogger.error(`An unhandled error occurs while execution *${command.pattern}* command.\n\`\`\`Message: ${error.message}\`\`\``)
      }
    }
  }

  return {
    entries: finalModules,
    parseCommand,
  }
}

export function defineModuleConfig<
  GDatabase extends AnyRecord,
  GExtendConfig extends AnyRecord | undefined,
  GModuleConfig extends ModuleConfig<ConfigOptions<GDatabase, GExtendConfig>>,
>(options: ConfigOptions<GDatabase, GExtendConfig>): GModuleConfig {
  return memoize((): GModuleConfig => {
    const dir = `databases/`

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const database = JSONFileSyncPreset<GDatabase>
    (`${dir}/${options.name}-module-config.json`, options.defaultValue)
    database.data = merge(options.defaultValue, database.data)
    database.write()

    return {
      database,
      ...options.extendCallback?.(database) as any,
    }
  })()
}

export function defineModuleCommand<
  GReguired extends true | false | undefined = undefined,
>(
  commandOptions: CommandOptions<GReguired>,
): Command {
  function checkIsMatchWithPattern(message: string, needToCheckPrefix = true): boolean {
    const regExp = new RegExp(`^${needToCheckPrefix ? escapeRegExp(config.getComputedCommandPrefix()) : ''}(?<commandPattern>\\w*)\\s?(?<plainText>.*)?`)
    const regExpExecArray = regExp.exec(message)

    if (!regExpExecArray?.groups) {
      return false
    }

    const { commandPattern } = regExpExecArray.groups

    if (!commandPattern) {
      return false
    }

    return commandOptions.pattern === commandPattern
  }

  return {
    ...commandOptions,
    checkIsMatchWithPattern,
  }
}
