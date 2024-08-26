import { existsSync, mkdirSync } from 'node:fs'
import { memoize } from 'lodash-es'
import { JSONFileSyncPreset } from 'lowdb/node'
import type { ConfigOptions, DefineModuleOptions, Module, ModuleConfig } from 'src/modules/types.js'
import type { AnyRecord, NeverIfNullable } from 'src/shared.js'

export function defineModule<
  GDatabase extends AnyRecord | undefined,
  GExtendConfig extends AnyRecord | undefined,
  GConfigOptions extends GDatabase extends undefined ? undefined
    : ConfigOptions<NeverIfNullable<GDatabase>, NeverIfNullable<GExtendConfig>>,
>(options: DefineModuleOptions<GDatabase, GExtendConfig>): Module<GConfigOptions> {
  const { description, name, onInit, event } = options

  const commonConfigOptions = {
    description,
    name,
    event,
    onInit,
  }
  const configOptions = (options as any).configOptions

  if (typeof configOptions === 'undefined') {
    return commonConfigOptions as any
  }

  return {
    ...commonConfigOptions,
    config: createModuleConfig(configOptions),
  } as any
}

export function defineModules(modules: Module[]) {
  return modules
}

function createModuleConfig<
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

    return {
      database,
      ...options.extendCallback?.(database) as any,
    }
  })()
}
