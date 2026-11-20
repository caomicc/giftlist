export type Season = 'winter' | 'spring' | 'summer' | 'fall'

// Northern hemisphere, meteorological seasons. Months are 0-based (Date#getMonth).
// Add a season or holiday: one entry here + one CSS block in styles/tailwind.css.
export const SEASONS: readonly { name: Season; months: readonly number[] }[] = [
  { name: 'winter', months: [11, 0, 1] },
  { name: 'spring', months: [2, 3, 4] },
  { name: 'summer', months: [5, 6, 7] },
  { name: 'fall', months: [8, 9, 10] },
]

export function seasonForMonth(month: number): Season {
  return SEASONS.find(s => s.months.includes(month))!.name
}

const byMonth = [...Array(12).keys()].map(seasonForMonth)

// Inlined in <head> so data-season is set before first paint.
export const seasonScript = `document.documentElement.dataset.season=${JSON.stringify(byMonth)}[new Date().getMonth()]`
