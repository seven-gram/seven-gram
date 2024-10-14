import type { TelegramClient } from 'telegram'
import type { EntityLike } from 'telegram/define.js'
import type { NewMessageEvent } from 'telegram/events/NewMessage.js'
import { isEqual } from 'lodash-es'
import { Api } from 'telegram'
import { NewMessage } from 'telegram/events/NewMessage.js'

export async function waitForIncommingMessage(client: TelegramClient, options: Pick<NewMessage, 'fromUsers' | 'pattern'>) {
  return new Promise<NewMessageEvent>((resolve) => {
    const eventHandler = (messageEvent: NewMessageEvent) => {
      resolve(messageEvent)
      client.removeEventHandler(eventHandler, new NewMessage({}))
    }
    client.addEventHandler(eventHandler, new NewMessage({
      incoming: true,
      ...options,
    }))
  })
}

export async function waitForOutgoingMessage(client: TelegramClient, options?: Pick<NewMessage, 'fromUsers' | 'pattern'>) {
  return new Promise<NewMessageEvent>((resolve) => {
    const eventHandler = (messageEvent: NewMessageEvent) => {
      resolve(messageEvent)
      client.removeEventHandler(eventHandler, new NewMessage({}))
    }
    client.addEventHandler(eventHandler, new NewMessage({
      outgoing: true,
      ...options,
    }))
  })
}

export async function getDialogs(client: TelegramClient, options?: Api.messages.GetDialogs['originalArgs']): Promise<Api.messages.TypeDialogs & Record<string, any>> {
  return await client.invoke(new Api.messages.GetDialogs(options ?? {}))
}

interface DialogFiltersFilter {
  title?: string
  id?: number
}
type DialogFilter = Api.TypeDialogFilter & Record<string, any>
export async function getDialogFilters(client: TelegramClient, filter?: DialogFiltersFilter): Promise<DialogFilter[]> {
  const dialogFilters = await client.invoke(new Api.messages.GetDialogFilters())

  if (!filter || !Object.keys({ filters: filter }).length)
    return dialogFilters.filters

  const filteredDialogFilters = dialogFilters.filters.filter(dialogFilter =>
    Object.entries(filter).every(([filterKey, filterValue]) => isEqual(dialogFilter[filterKey as keyof typeof dialogFilter], filterValue)),
  )

  return filteredDialogFilters
}

export async function getFirstDialogFilter(client: TelegramClient, filter: DialogFiltersFilter): Promise<DialogFilter | undefined> {
  const dialogFilters = await getDialogFilters(client, filter)

  return dialogFilters[0]
}

interface CreateDialogFilterOptions {
  title: string
  emoticon?: string
}
export async function createDialogFilter(client: TelegramClient, options: CreateDialogFilterOptions, entities: EntityLike[]): Promise<void> {
  const dialogFilters = await getDialogFilters(client)
  const dialogFiltersIds: number[] = dialogFilters.map(dialogFilter => dialogFilter.id).filter(Boolean)
  const id = Math.max(...new Set([1, ...dialogFiltersIds])) + 1
  const includePeers = await Promise.all(entities.map(async entity => await client.getInputEntity(entity)))

  await client.invoke(new Api.messages.UpdateDialogFilter({
    id,
    filter: new Api.DialogFilter({
      id,
      excludePeers: [],
      pinnedPeers: [],
      includePeers,
      ...options,
    }),
  }))
}

export async function addDialogsToDialogFilter(client: TelegramClient, dialogFilterId: number, peerEntities: EntityLike[]): Promise<void> {
  const peersEntities = await Promise.all(peerEntities.map(async entity => await client.getInputEntity(entity)))
  const dialogFilter = await getFirstDialogFilter(client, {
    id: dialogFilterId,
  })

  if (!dialogFilter) {
    throw new Error(`Can not find dialog filter with id ${dialogFilterId}`)
  }

  await client.invoke(new Api.messages.UpdateDialogFilter({
    id: dialogFilter.id,
    filter: new Api.DialogFilter({
      ...(dialogFilter as any),
      includePeers: [...dialogFilter.includePeers, ...peersEntities],
    }),
  }))
}
