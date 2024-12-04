import type { EntityLike } from 'telegram/define.js'
import { defineModuleConfig } from 'src/modules/helpers/define.js'

interface ConfigDatabase {
  usersBlacklist: EntityLike[]
}

const defaultValue: ConfigDatabase = {
  usersBlacklist: [],
}

export const brainRotDefenderConfig = defineModuleConfig({
  name: 'brain-rot-defender',
  defaultValue,
  extendCallback(database) {
    const toggleUserInBlacklist = (entity: string): void => {
      const index = database.data.usersBlacklist.indexOf(entity)
      if (index === -1) {
        database.data.usersBlacklist.push(entity)
      }
      else {
        database.data.usersBlacklist.splice(index, 1)
      }
      database.write()
    }

    return {
      toggleUserInBlacklist,
    }
  },
})
