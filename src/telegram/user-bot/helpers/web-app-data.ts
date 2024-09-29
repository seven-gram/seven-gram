import type { TelegramClient } from 'telegram'
import type { EntityLike } from 'telegram/define.js'
import { Api } from 'telegram'

export async function getWebAppData(client: TelegramClient, entity: EntityLike, url: string): Promise<string> {
  const webView = await client.invoke(
    new Api.messages.RequestWebView({
      peer: entity,
      bot: entity,
      url,
      platform: 'android',
      fromBotMenu: false,
    }),
  )

  const hashParams = Object.fromEntries(new URLSearchParams(new URL(webView.url).hash))

  const tgWebAppData = hashParams['#tgWebAppData']

  if (!tgWebAppData) {
    throw new Error(`Can not extract tgWebAppData from miniapp ${url} init params`)
  }

  return tgWebAppData
}
