export function isHHMM(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value)
}

export function parseHHMM(value: string): { hours: number; minutes: number } {
  if (!isHHMM(value)) throw new Error(`Invalid HH:MM: ${value}`)
  const [h, m] = value.split(':').map(Number)
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid time components: ${value}`)
  }
  return { hours: h, minutes: m }
}

