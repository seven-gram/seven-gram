export interface InterludeUser {
  id: string
  totalDiamonds: number
  balanceDiamonds: number
  level: number
  availableTaps: number
  lastSyncUpdate: number
  exchangeId: string
  boosts: Boosts
  upgrades: { [key: string]: BoostEarnPerTap }
  tasks: Tasks
  airdropTasks: AirdropTasks
  referralsCount: number
  maxTaps: number
  earnPerTap: number
  earnPassivePerSec: number
  earnPassivePerHour: number
  lastPassiveEarn: number
  tapsRecoverPerSec: number
  referral: Referral
  claimedUpgradeComboAt: Date
  claimedCipherAt: Date
  balanceTickets: number
  referrerId: string
  skin: Skin
  startKeysMiniGameAt: Date
  totalKeys: number
  balanceKeys: number
  claimedKeysMiniGameAt: Date[]
  achievements: Achievement[]
  promos: Promo[]
}

interface Achievement {
  id: string
  unlockedAt: Date
  isNew: boolean
  isClaimed: boolean
}

interface AirdropTasks {
  airdrop_connect_ton_wallet: AirdropConnectTonWallet
}

interface AirdropConnectTonWallet {
  id: string
  walletAddress: string
  completedAt: Date
}

interface Boosts {
  BoostFullAvailableTaps: BoostEarnPerTap
  BoostMaxTaps: BoostEarnPerTap
  BoostEarnPerTap: BoostEarnPerTap
}

interface BoostEarnPerTap {
  id: string
  level: number
  lastUpgradeAt: number
  snapshotReferralsCount?: number
}

interface Promo {
  promoId: string
  receiveKeysTotal: number
  receiveKeysToday: number
  receiveKeysLastTime: Date
}

interface Referral {
  friend: Friend
}

interface Friend {
  isBot: boolean
  firstName: string
  lastName: string
  addedToAttachmentMenu: null
  id: number
  isPremium: null
  canReadAllGroupMessages: null
  languageCode: string
  canJoinGroups: null
  supportsInlineQueries: null
  photos: Array<Photo[]>
  username: string
}

interface Photo {
  width: number
  fileSize: number
  fileUniqueId: string
  fileId: string
  height: number
}

interface Skin {
  available: Available[]
  selectedSkinId: string
}

interface Available {
  skinId: string
  buyAt: Date
}

interface Tasks {
  streak_days: StreakDays
  select_exchange: HamsterDrop
  subscribe_telegram_channel: HamsterDrop
  subscribe_x_account: HamsterDrop
  invite_friends: HamsterDrop
  subscribe_youtube_channel: HamsterDrop
  watch_youtube_video_hk_cipher: HamsterDrop
  hamster_drop: HamsterDrop
  watch_youtube_video_okx: HamsterDrop
  hamster_youtube_academy: HamsterDrop
  hamster_youtube_easy_start: HamsterDrop
  hamster_youtube_academy_s1e2: HamsterDrop
  hamster_youtube_easy_start_s1e2: HamsterDrop
  hamster_youtube_academy_s1e3: HamsterDrop
  hamster_youtube_academy_s1e4: HamsterDrop
  hamster_youtube_easy_start_s1e4: HamsterDrop
  hamster_youtube_academy_s1e5: HamsterDrop
  hamster_youtube_academy_s1e6: HamsterDrop
  hamster_youtube_easy_start_s1e5: HamsterDrop
  hamster_youtube_easy_start_s1e8: HamsterDrop
  hamster_youtube_easy_start_s1e12: HamsterDrop
  hamster_youtube_local_video_e2: HamsterDrop
  hamster_youtube_easy_start_s1e17: HamsterDrop
  hamster_youtube_local_video_e3: HamsterDrop
  hamster_youtube_easy_start_s1e20: HamsterDrop
  hamster_youtube_local_video_e4: HamsterDrop
  hamster_youtube_easy_start_s1e21: HamsterDrop
  hamster_youtube_easy_start_s1e22: HamsterDrop
  hamster_youtube_local_video_e5: HamsterDrop
  hamster_youtube_easy_start_s1e24: HamsterDrop
  hamster_youtube_local_video_e6: HamsterDrop
  hamster_youtube_local_video_e8: HamsterDrop
  hamster_youtube_easy_start_s1e27: HamsterDrop
  hamster_youtube_local_video_e9: HamsterDrop
  hamster_youtube_easy_start_s1e28: HamsterDrop
  hamster_youtube_local_video_e10: HamsterDrop
  hamster_youtube_local_video_e11: HamsterDrop
  hamster_youtube_local_video_e12: HamsterDrop
  hamster_youtube_easy_start_s1e29: HamsterDrop
  hamster_youtube_local_video_e13: HamsterDrop
  hamster_youtube_local_video_e14: HamsterDrop
  hamster_youtube_local_video_e15: HamsterDrop
  hamster_youtube_local_video_e16: HamsterDrop
  hamster_youtube_easy_start_s1e30: HamsterDrop
}

interface HamsterDrop {
  id: string
  completedAt: Date
}

interface StreakDays {
  id: string
  completedAt: Date
  days: number
}
