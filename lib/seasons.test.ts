import test from 'node:test'
import assert from 'node:assert/strict'
import { SEASONS, seasonForMonth, seasonScript } from './seasons.ts'

test('every month maps to exactly one season', () => {
  const expected = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter']
  assert.deepEqual([...Array(12).keys()].map(seasonForMonth), expected)
  assert.equal(SEASONS.flatMap(s => s.months).sort((a, b) => a - b).join(), [...Array(12).keys()].join())
})

test('seasonScript sets data-season from the current month', () => {
  const root = { dataset: {} as Record<string, string> }
  new Function('document', 'Date', seasonScript)({ documentElement: root }, class { getMonth() { return 11 } })
  assert.equal(root.dataset.season, 'winter')
})
