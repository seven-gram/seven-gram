import type { Api } from 'telegram'
import { useUserBot } from 'src/telegram/index.js'
import { brainRotDefenderModule, brainRotLogger } from './index.js'

const brainRotLinksPatterns = [
  /youtube\.com\/shorts/,
]

function checkIfStringContainsBrainRotPattern(string: string) {
  return brainRotLinksPatterns.some(pattern => pattern.test(string))
}

export async function checkIfMessageContainsBrainRotPattern(message: Api.Message) {
  if (checkIfStringContainsBrainRotPattern(message.text)) {
    return true
  }

  const urlsToCheck = new Set<string>(message.text.match(/\bhttps?:\/\/\S+/gi))

  for (const entity of message.entities ?? []) {
    if ('url' in entity) {
      urlsToCheck.add(entity.url)
    }
  }

  for (const url of urlsToCheck) {
    if (checkIfStringContainsBrainRotPattern(url)) {
      return true
    }
  }

  for (const url of urlsToCheck) {
    const response = await fetch(url).catch(() => void 0)
    if (response?.url && checkIfStringContainsBrainRotPattern(response.url)) {
      return true
    }
  }

  return false
}

export async function blockMessage(message: Api.Message) {
  const { me } = await useUserBot()
  const replyMessage = await message.reply({ message: `**[${brainRotDefenderModule.name}]** Message was blocked. User **${me.username || me.firstName}** will not see it.` })
  message.delete({ revoke: false })
  replyMessage?.delete({ revoke: false })
  brainRotLogger.info(
    `Message from user *${message.chat}* was blocked`
    + `\nContent: ${message.text}`,
  )
}
