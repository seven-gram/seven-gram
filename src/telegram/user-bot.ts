import { Api, TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import type { NewMessageEvent } from 'telegram/events/NewMessage.js'
import { NewMessage } from 'telegram/events/NewMessage.js'
import prompts from 'prompts'
import { isEqual } from 'lodash-es'
import type { EntityLike } from 'telegram/define.js'
import { systemLogger } from '../logger.js'
import { useConfigStore } from '../config.js'
import { createGlobalState } from '../shared.js'
import { TelegramHelpers } from './index.js'

async function createConnection(client: TelegramClient) {
  const { setMainSession } = await useConfigStore()
  await client.start({
    phoneNumber: async () =>
      (
        await prompts({
          message: 'Enter your phone number',
          name: 'phoneNumber',
          type: 'text',
        })
      ).phoneNumber,
    password: async () =>
      (
        await prompts({
          message: 'Enter your password',
          name: 'password',
          type: 'password',
        })
      ).password,
    phoneCode: async () =>
      (
        await prompts({
          message: 'Enter the code you recived',
          name: 'phoneCode',
          type: 'text',
        })
      ).phoneCode,
    onError: (error) => { systemLogger.error(error.message) },
  })
  const me = await client.getMe()
  await setMainSession({
    id: me.id,
    apiId: client.apiId,
    apiHash: client.apiHash,
    name: me.firstName || me.lastName || me.username || me.id.toString(),
    sessionString: client.session.save() as unknown as string,
  })

  return me
}

export const useUserBot = createGlobalState(async () => {
  const promptApiData = async () => {
    const { api_id } = await prompts({
      message: 'Enter api_id',
      name: 'api_id',
      type: 'number',
    })
    const { api_hash } = await prompts({
      message: 'Enter api_hash',
      name: 'api_hash',
      type: 'text',
      min: 10,
    })

    return {
      apiHash: String(api_hash),
      apiId: Number(api_id),
    }
  }

  const promptNewClient = async () => {
    const { apiId, apiHash } = await promptApiData()
    const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
      connectionRetries: 2,
    })

    return client
  }

  const client = await (async (): Promise<TelegramClient> => {
    const { configDatabase } = await useConfigStore()

    if (!configDatabase.data.mainSession) {
      return promptNewClient()
    }

    return new TelegramClient(
      new StringSession(configDatabase.data.mainSession.sessionString),
      configDatabase.data.mainSession.apiId,
      configDatabase.data.mainSession.apiHash,
      {
        connectionRetries: 2,
      },
    )
  })()

  let me = await (async () => createConnection(client))()

  const fetchMe = async () => me = await client.getMe()

  const waitForIncommingMessage = async (options: Pick<NewMessage, 'fromUsers' | 'pattern'>) => new Promise<NewMessageEvent>((resolve) => {
    const eventHandler = (event: NewMessageEvent) => {
      resolve(event)
      client.removeEventHandler(eventHandler, new NewMessage({}))
    }
    client.addEventHandler(eventHandler, new NewMessage({
      incoming: true,
      ...options,
    }))
  })

  const getDialogs = async (options?: Api.messages.GetDialogs['originalArgs']): Promise<Api.messages.TypeDialogs & Record<string, any>> => {
    return await client.invoke(new Api.messages.GetDialogs(options ?? {}))
  }

  interface DialogFiltersFilter {
    title?: string
    id?: number
  }
  type DialogFilter = Api.TypeDialogFilter & Record<string, any>
  const getDialogFilters = async (filter?: DialogFiltersFilter): Promise<DialogFilter[]> => {
    const dialogFilters = await client.invoke(new Api.messages.GetDialogFilters())

    if (!filter || !Object.keys({ filters: filter }).length)
      return dialogFilters.filters

    const filteredDialogFilters = dialogFilters.filters.filter(dialogFilter =>
      Object.entries(filter).every(([filterKey, filterValue]) => isEqual(dialogFilter[filterKey as keyof typeof dialogFilter], filterValue)),
    )

    return filteredDialogFilters
  }

  const getFirstDialogFilter = async (filter: DialogFiltersFilter): Promise<DialogFilter | undefined> => {
    const dialogFilters = await getDialogFilters(filter)

    return dialogFilters[0]
  }

  interface CreateDialogFilterOptions {
    title: string
    emoticon?: string
  }
  const createDialogFilter = async (options: CreateDialogFilterOptions, entities: EntityLike[]): Promise<void> => {
    const dialogFilters = await getDialogFilters()
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

  const addDialogsToDialogFilter = async (dialogFilterId: number, peerEntities: EntityLike[]): Promise<void> => {
    const peersEntities = await Promise.all(peerEntities.map(async entity => await client.getInputEntity(entity)))
    const dialogFilter = await getFirstDialogFilter({
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

  return {
    client,
    me,
    fetchMe,
    promptNewClient,
    waitForIncommingMessage,
    getDialogs,
    getDialogFilters,
    getFirstDialogFilter,
    createDialogFilter,
    addDialogsToDialogFilter,
    getWebAppDatar: TelegramHelpers.getWebAppData.bind(globalThis, client),
  }
})

export type UserBot = Awaited<ReturnType<typeof useUserBot>>
