import { defineMiniAppApi } from 'src/modules/entries/mini-apps/helpers/define.js'
import { getAccountInfo } from './account-info.js'
import { authByTelegramWebapp } from './auth.js'
import { getConfig } from './config.js'
import { claimDailyCipher } from './daily-cipher.js'
import { claimDailyKeysMinigame, startDailyKeysMinigame } from './minigame.js'
import { applyPromoCode, getPromos, getPromosSettings } from './promocodes.js'
import { tap } from './tap.js'
import { checkTask, getTasksList } from './tasks.js'
import { buyUpgrade, getUpgradesForBuy } from './upgrades-for-buy.js'
import { getInterludeUser } from './user.js'

export const HamsterApi = defineMiniAppApi({
  getAccountInfo,
  authByTelegramWebapp,
  getInterludeUser,
  tap,
  getConfig,
  startDailyKeysMinigame,
  claimDailyKeysMinigame,
  claimDailyCipher,
  getPromos,
  getPromosSettings,
  applyPromoCode,
  getTasksList,
  checkTask,
  getUpgradesForBuy,
  buyUpgrade,
})
