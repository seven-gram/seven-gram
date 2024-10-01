export interface UpgradeForBuy {
  id: string
  name: string
  price: number
  profitPerHour: number
  condition: null
  section: Section
  level: number
  currentProfitPerHour: number
  profitPerHourDelta: number
  isAvailable: boolean
  isExpired: boolean
  cooldownSeconds?: number
  maxLevel?: number
  totalCooldownSeconds?: number
  toggle?: Toggle
  expiresAt?: Date
}

enum Section {
  Specials = 'Specials',
}

interface Toggle {
  enableAt: Date
}
