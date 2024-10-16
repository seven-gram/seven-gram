import type { TelegramClient } from 'telegram'
import type { EntitiesLike } from 'telegram/define.js'
import { TelegramStatic } from 'src/telegram/index.js'
import { addDialogsToDialogFilter, createDialogFilter, getFirstDialogFilter } from './messages.js'

export async function addEntitiesToSpecialFolder(client: TelegramClient, entities: EntitiesLike) {
  const getDialogFilter = async () =>
    await getFirstDialogFilter(client, { title: TelegramStatic.DIALOG_FILTER.title })

  let dialogFilter = await getDialogFilter()

  if (!dialogFilter) {
    await createDialogFilter(client, TelegramStatic.DIALOG_FILTER, entities)
    dialogFilter = await getDialogFilter()
    if (!dialogFilter) {
      throw new Error(`Can not find dialog filter with title ${TelegramStatic.DIALOG_FILTER.title}`)
    }
  }
  await addDialogsToDialogFilter(client, dialogFilter.id, entities)
}
