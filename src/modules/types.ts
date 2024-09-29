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

export interface CommandEvent {
  type: 'command'
  command: {
    pattern: string
    description: string
    handler: (options: {
      event: NewMessageEvent
      plainMessage?: string | undefined
    }) => Promise<void> | void
  }
}

type Event = (CommandEvent)

interface ModuleOptionsStaticOptions {
  name: string
  description: string
  onInit?: () => void | Promise<void>
  event?: Event
}

type BaseDefineModuleOptions<
  GDatabase extends AnyRecord | undefined,
  GExtendConfig extends AnyRecord | undefined,
> = GExtendConfig extends undefined ? ModuleOptionsStaticOptions :
  ModuleOptionsStaticOptions & {
    configOptions: ConfigOptions<NeverIfNullable<GDatabase>, NeverIfNullable<GExtendConfig>>
  }

export type DefineModuleOptions<
  GDatabase extends AnyRecord | undefined = AnyRecord | undefined,
  GExtendConfig extends AnyRecord | undefined = AnyRecord | undefined,
> = BaseDefineModuleOptions<GDatabase, GExtendConfig>

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

type BaseModule<GConfigOptions extends ConfigOptions | undefined> =
GConfigOptions extends undefined ? ModuleOptionsStaticOptions
  : (ModuleOptionsStaticOptions & {
      config: ModuleConfig<NeverIfNullable<GConfigOptions>>
    })

export type Module<GConfigOptions extends ConfigOptions | undefined = ConfigOptions | undefined> =
  BaseModule<GConfigOptions>
