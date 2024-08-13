import { defineMiniAppApi } from 'src/mini-apps/helpers/define.js'
import { getAccountInfo } from './account-info.js'
import { authByTelegramWebapp } from './auth.js'
import { getClickerUser } from './clicker-user.js'
import { getConfig } from './config.js'
import { tap } from './tap.js'
import { claimDailyKeysMinigame, startDailyKeysMinigame } from './minigame.js'
import { claimDailyCipher } from './daily-cipher.js'
import { applyPromoCode, getPromos } from './promocodes.js'
import { checkTask, getTasksList } from './tasks.js'

export const HamsterApi = defineMiniAppApi({
  getAccountInfo,
  authByTelegramWebapp,
  getClickerUser,
  tap,
  getConfig,
  startDailyKeysMinigame,
  claimDailyKeysMinigame,
  claimDailyCipher,
  getPromos,
  applyPromoCode,
  getTasksList,
  checkTask,
})
