import { useConfigDatabase } from 'src/config-database.js'
import type { TelegramClient } from 'telegram'
import { Api } from 'telegram'
import type { SetRequired } from 'type-fest'

import type { EntityLike } from 'telegram/define.js'
import { useBot } from 'src/telegram/bot/use-bot.js'
import { TelegramHelpers } from 'src/telegram/index.js'

export async function getOrCreateChannel(
  client: TelegramClient,
  options: SetRequired<Api.channels.CreateChannel['originalArgs'], 'title' | 'about'>,
): Promise<Api.Channel> {
  const configDatabase = useConfigDatabase()
  let channel: Api.Channel

  const channelId = configDatabase.database.data.userBot?.channels?.[options.title]
  if (channelId) {
    try {
      channel = await client.getEntity(TelegramHelpers.mapToPeerId(channelId, 'channel')) as Api.Channel
    }
    catch (error) {
      if (error instanceof Error) {
        channel = await createChannel()
      }
      else {
        throw error
      }
    }
  }
  else {
    channel = await createChannel()
  }

  async function createChannel() {
    const channel = (
      await client.invoke(new Api.channels.CreateChannel(options)) as Api.Updates
    ).chats[0] as Api.Channel
    configDatabase.database.data.userBot!.channels[options.title] = channel.id.toJSON()
    configDatabase.database.write()
    return channel
  }

  return channel
}

export async function inviteBotToChannel(client: TelegramClient, entity: EntityLike) {
  const bot = await useBot()
  await client.invoke(new Api.channels.InviteToChannel({
    channel: entity,
    users: [bot.me.username],
  }))
}
