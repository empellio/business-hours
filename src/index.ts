export * from './core/types'
export { createBusinessHours } from './core/compute'
export { formatSlot, formatDayName } from './core/format'
export { toJSON } from './core/normalize'

import type { BusinessHours, Config } from './core/types'
import { createBusinessHours as _create } from './core/compute'

export function fromJSON(configLike: Config): BusinessHours {
  return _create(configLike)
}

