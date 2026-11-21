import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCurrency, formatPrice, isCurrency } from './currency.ts'

// Intl separates amount and symbol with non-breaking spaces
const n = (s: string) => s.replace(/\s/g, ' ')

test('prices use the item’s currency, whatever the viewer’s locale', () => {
  assert.equal(n(formatPrice('65.00', 'USD', 'ru-RU')), '65,00 $')
  assert.equal(formatPrice('40', 'GBP', 'en-US'), '£40.00')
})

test('text that isn’t a number is shown as entered', () => {
  assert.equal(formatPrice('around 40', 'USD', 'en-US'), 'around 40')
})

test('a malformed currency code never throws', () => {
  assert.equal(formatCurrency(10, 'dollars', 'en-US'), '10.00')
})

test('isCurrency accepts only the supported codes', () => {
  assert.equal(isCurrency('EUR'), true)
  assert.equal(isCurrency('eur'), false)
  assert.equal(isCurrency('XYZ'), false)
})
