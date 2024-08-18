export interface Promo {
  promoId: string
  keysPerDay: number
  image: Icon
  modalImage: Icon
  title: Title
  description: Description
  icon: Icon
  appUrl: string
  onboard: Onboard[]
}

export interface PromoState {
  promoId: string
  receiveKeysToday: number
  receiveKeysRefreshSec: number
}

interface Description {
  en: string
  de?: string
  es?: string
  fr?: string
  hi?: string
  id?: string
  pt?: string
  ru?: string
  th?: string
  tl?: string
  tr?: string
  uz?: string
  vi?: string
}

interface Icon {
  defaultUrl: string
  compressedUrl: string
}

interface Onboard {
  image: Icon
  title: Description
  description: Description
}

export enum PromoTitle {
  TWERK_RACE = 'Twerk Race',
  MERGE_AWAY = 'Merge Away',
  MY_CLONE_ARMY = 'My Clone Army',
  CHAIN_CUBE_2048 = 'Chain Cube 2048',
  TRAIN_MINER = 'Train Miner',
  BIKE_RIDE_3_D = 'Bike Ride 3D',
}

interface Title {
  en: PromoTitle
}
