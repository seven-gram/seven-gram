import type { TelegramClient } from 'telegram'
import { TelegramStatic } from 'src/telegram/index.js'
import type { EntitiesLike } from 'telegram/define.js'
import { UserBotHelpers } from '../index.js'

export async function addEntitiesToSpecialFolder(client: TelegramClient, entities: EntitiesLike) {
  const getDialogFilter = async () =>
    await UserBotHelpers.getFirstDialogFilter(client, { title: TelegramStatic.DIALOG_FILTER.title })

  let dialogFilter = await getDialogFilter()

  if (!dialogFilter) {
    await UserBotHelpers.createDialogFilter(client, TelegramStatic.DIALOG_FILTER, entities)
    dialogFilter = await getDialogFilter()
    if (!dialogFilter) {
      throw new Error(`Can not find dialog filter with title ${TelegramStatic.DIALOG_FILTER.title}`)
    }
  }
  await UserBotHelpers.addDialogsToDialogFilter(client, dialogFilter.id, entities)
}
