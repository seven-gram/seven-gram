import type { NewMessageEvent } from 'telegram/events/NewMessage.js'
import type { LowSync } from 'lowdb'
import type { AnyRecord, NeverIfNullable } from 'src/shared.js'

export enum ModuleType {
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

interface BaseDefineModuleOptionsStaticOptions {
  name: string
  description: string
  type: `${ModuleType}`
  onInit?: () => void | Promise<void>
}

type BaseDefineModuleOptions<
  GDatabase extends AnyRecord | undefined,
  GExtendConfig extends AnyRecord | undefined,
> = GExtendConfig extends undefined ? BaseDefineModuleOptionsStaticOptions :
  BaseDefineModuleOptionsStaticOptions & {
    configOptions: ConfigOptions<NeverIfNullable<GDatabase>, NeverIfNullable<GExtendConfig>>
  }

interface CommandHandlerOptions {
  event: NewMessageEvent
  plainMessage?: string | undefined
}

type DefineCommandModuleOptions<
  GDatabase extends AnyRecord | undefined = undefined,
  GExtendConfig extends AnyRecord | undefined = undefined,
> =
  BaseDefineModuleOptions<GDatabase, GExtendConfig> & {
    type: 'command'
    command: {
      pattern: string
      description: string
      handler: (options: CommandHandlerOptions) => Promise<void> | void
    }
  }

export type DefineModuleOptions<
  GDatabase extends AnyRecord | undefined = AnyRecord | undefined,
  GExtendConfig extends AnyRecord | undefined = AnyRecord | undefined,
> = (
  DefineCommandModuleOptions<GDatabase, GExtendConfig>
)

interface ModuleConfigStaticOptions<GConfigOptions extends ConfigOptions> {
  database: LowSync<GConfigOptions['defaultValue']>
}

export type ModuleConfig<
  GConfigOptions extends ConfigOptions<any>,
  GExtendRecord = GConfigOptions['extendCallback'] extends undefined ? undefined : ReturnType<NeverIfNullable<GConfigOptions['extendCallback']>>,
> = (
  GExtendRecord extends undefined ? ModuleConfigStaticOptions<GConfigOptions> : ModuleConfigStaticOptions<GConfigOptions> & {
    [Key in keyof NeverIfNullable<GExtendRecord>]: NeverIfNullable<GExtendRecord>[Key]
  })

type BaseModuleStaticOptions = BaseDefineModuleOptionsStaticOptions

type BaseModule<GConfigOptions extends ConfigOptions | undefined> =
GConfigOptions extends undefined ? BaseModuleStaticOptions
  : (BaseModuleStaticOptions & {
      config: ModuleConfig<NeverIfNullable<GConfigOptions>>
    })

type CommandModule<GConfigOptions extends ConfigOptions | undefined> =
  BaseModule<GConfigOptions> & {
    command: DefineCommandModuleOptions['command']
  }

export type Module<GConfigOptions extends ConfigOptions | undefined = ConfigOptions | undefined> = (
  CommandModule<GConfigOptions>
)
