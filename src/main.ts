import { initMiniApps } from './mini-apps/helpers.js'
import { miniAppsMap } from './mini-apps/index.js';

// const buyUpgrade = async (id: string) => {
//     return axios.request({
//         method: 'post',
//         url: 'https://api.hamsterkombat.io/clicker/buy-upgrade',
//         data: {
//             upgradeId: id,
//             timestamp: Date.now(),
//         }
//     })
// }

// (async () => {
//     try {
//         await sync().catch(() => void 0);
//         await tap();
//         await buyBoost().then(async () => {
//             await tap();
//         }).catch(() => void 0)
//     } catch (error) {
//         if(error instanceof AxiosError){
//             console.error(error.response?.data);
//         }
//     }
// })();

// const axios = _axios.create({
//   headers: {
//     'Accept-Encoding': 'gzip, deflate, br, zstd',
//     'Accept-Language': 'ru-UA,ru-RU;q=0.9,ru;q=0.8,en-US;q=0.7,en;q=0.6,uk;q=0.5',
//     'Cache-Control': 'no-cache',
//     'Connection': 'keep-alive',
//     'Host': 'api.hamsterkombat.io',
//     'Origin': 'https://hamsterkombat.io',
//     'Referer': 'https://hamsterkombat.io/',
//     'Pragma': 'no-cache',
//     'Sec-Fetch-Dest': 'empty',
//     'Sec-Fetch-Mode': 'cors',
//     'Sec-Fetch-Site': 'same-site',
//     'sec-ch-ua-mobile': '?0',
//     'sec-ch-ua-platform': '"Linux"',
//     'Authorization': `Bearer ${dotenvs.AUTH_TOKEN}`,
//     'Accept': 'application/json',
//     'Content-Type': 'application/json',
//     'User-Agent': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
//   },
// })

// async function sync() {
//   return await axios.request({
//     method: 'post',
//     url: 'https://api.hamsterkombat.io/clicker/sync',
//   })
// }

// async function tap() {
//   return await axios.request({
//     method: 'post',
//     url: 'https://api.hamsterkombat.io/clicker/tap',
//     data: {
//       count: 1000,
//       availableTaps: 7000,
//       timestamp: Date.now(),
//     },
//   })
// }

// async function buyBoost() {
//   return axios.request({
//     method: 'post',
//     url: 'https://api.hamsterkombat.io/clicker/buy-boost',
//     data: {
//       boostId: 'BoostFullAvailableTaps',
//       timestamp: Date.now(),
//     },
//   })
// }

(async () => {
  initMiniApps(miniAppsMap)
})()
