import type { PromoTitle } from './types/promocodes.js'

const PROMO_OPTIONS_MAP: Record<PromoTitle, {
  token: string
  eventTimeout?: number
}> = {
  'My Clone Army': {
    token: '74ee0b5b-775e-4bee-974f-63e7f4d5bacb',
    eventTimeout: 120 * 1000,
  },
  'Chain Cube 2048': {
    token: 'd1690a07-3780-4068-810f-9b5bbf2931b2',
  },
  'Bike Ride 3D': {
    token: 'd28721be-fd2d-4b45-869e-9f253b554e50',
  },
  'Merge Away': {
    token: '8d1cc2ad-e097-4b86-90ef-7a27e19fb833',
  },
  'Train Miner': {
    token: 'c4480ac7-e178-4973-8061-9ed5b2e17954',
  },
  'Twerk Race': {
    token: '61308365-9d16-4040-8bb0-2f4a4c69074c',
  },
}

export const HamsterStatic = {
  HAMSTER_URL: 'https://hamsterkombatgame.io/',
  HAMSTER_BOT_ENTITY: '@hamster_kombat_bot',
  DEFAULT_HEADERS: {
    'Accept': '*/*',
    'Accept-Language': 'ru,ru-RU;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive',
    'Origin': 'https://hamsterkombatgame.io',
    'Referer': 'https://hamsterkombatgame.io/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; RMX3630 Build/TP1A.220905.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.165 Mobile Safari/537.36',
    'X-Requested-With': 'org.telegram.messenger',
    'Sec-Ch-Ua': '"Android WebView";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?1',
    'Sec-Ch-Ua-Platform': '"Android"',
  },
  PROMO_OPTIONS_MAP,
}
