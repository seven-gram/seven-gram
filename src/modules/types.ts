import type { LowSync } from 'lowdb'
import type { AnyRecord, NeverIfNullable } from 'src/shared.js'
import type { NewMessageEvent } from 'telegram/events/NewMessage.js'

export enum EventType {
  COMMAND = 'command',
}

export interface ConfigOptions<
  GDatabase extends AnyRecord = AnyRecord,
  GExtendConfig extends AnyRecord | undefined = AnyRecord | undefined,
> {
  name: string
  defaultValue: GDatabase
  extendCallback?: (database: LowSync<GDatabase>) => GExtendConfig
}

export interface CommonCommandFields {
  pattern: string
  description: string
}

export interface PlainTextOptions<GRequired extends boolean> {
  required: GRequired
  helpText: string
}

type CommandHandler<GRequired extends boolean | undefined> = (
  options: GRequired extends undefined
    ? {
        messageEvent: NewMessageEvent
      }
    : GRequired extends true ? {
      messageEvent: NewMessageEvent
      plainText: string
    } : {
      messageEvent: NewMessageEvent
      plainText?: string
    }
) => Promise<void> | void

export type CommandOptions<GRequired extends boolean | undefined> =
  CommonCommandFields & {
    plainText?: PlainTextOptions<NeverIfNullable<GRequired>>
    handler: CommandHandler<GRequired>
  }
export type Command = CommandOptions<boolean | undefined> & {
  checkIsMatchWithPattern: (
    message: string,
    needToCheckPrefix?: boolean
  ) => boolean
}

export type CommandSettingsOptions =
|({ type: 'base' } & { command: Command })
|({ type: 'parrent' } & CommonCommandFields & { commands: Command[] })

type CommandSettings = CommandSettingsOptions & {
  matchCommand: (messageEvent: NewMessageEvent) => Command | undefined
}

export interface CommandEventOptions {
  type: 'command'
  commandSettings: CommandSettingsOptions
}

export interface CommandEvent extends CommandEventOptions {
  commandSettings: CommandSettings
}

type EventOptions = (CommandEventOptions)
export type Event = (CommandEvent)

interface CommonModuleOptionsOptions {
  name: string
  description: string
  onInit?: () => void | Promise<void>
  event?: EventOptions
}

interface CommonModuleOptions extends CommonModuleOptionsOptions {
  event?: Event
}

type BaseDefineModuleOptions<
  GModuleConfig,
> = GModuleConfig extends undefined
  ? CommonModuleOptionsOptions
  : CommonModuleOptionsOptions & {
    config: GModuleConfig
  }

export type DefineModuleOptions<GModuleConfig = undefined> =
BaseDefineModuleOptions<GModuleConfig>

interface ModuleConfigStaticOptions<GConfigOptions extends ConfigOptions> {
  database: LowSync<GConfigOptions['defaultValue']>
}

export type ModuleConfig<
  GConfigOptions extends ConfigOptions<any> = ConfigOptions<any>,
  GExtendRecord = GConfigOptions['extendCallback'] extends undefined
    ? undefined
    : ReturnType<NeverIfNullable<GConfigOptions['extendCallback']>>,
> = (
  GExtendRecord extends undefined ? ModuleConfigStaticOptions<GConfigOptions> : ModuleConfigStaticOptions<GConfigOptions> & {
    [Key in keyof NeverIfNullable<GExtendRecord>]: NeverIfNullable<GExtendRecord>[Key]
  })

type BaseModule<GConfig extends ModuleConfig | undefined> =
GConfig extends undefined ? CommonModuleOptions
  : (CommonModuleOptions & {
      config: GConfig
    })

export type Module<GConfig extends ModuleConfig | undefined = ModuleConfig | undefined> =
  BaseModule<GConfig>
