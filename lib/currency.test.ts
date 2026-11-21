import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCurrency, formatPrice, isCurrency, parsePrice } from './currency.ts'

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

test('parsePrice splits a preview price into amount and currency', () => {
  assert.deepEqual(parsePrice('29.99 GBP'), { amount: '29.99', currency: 'GBP' })
  assert.deepEqual(parsePrice('£1,299.99'), { amount: '1299.99', currency: 'GBP' })
  assert.deepEqual(parsePrice('$65'), { amount: '65', currency: 'USD' })
  assert.deepEqual(parsePrice('€12,50'), { amount: '12.50', currency: 'EUR' }) // decimal comma stored as a dot
  assert.deepEqual(parsePrice('80'), { amount: '80', currency: null })
  assert.deepEqual(parsePrice('around 40'), { amount: 'around 40', currency: null })
})

test('a decimal comma is a decimal, not a thousands separator', () => {
  assert.equal(formatPrice('12,50', 'EUR', 'en-US'), '€12.50')
  assert.equal(formatPrice('1,299.99', 'USD', 'en-US'), '$1,299.99')
})

test('a currency the price text names wins over the stored default', () => {
  assert.equal(formatPrice('29.99 GBP', 'USD', 'en-US'), '£29.99') // legacy Amazon UK rows defaulted to USD
  assert.equal(formatPrice('$34.99 CAD', 'USD', 'en-US'), 'CA$34.99')
  assert.equal(formatPrice('$65', 'EUR', 'en-US'), '€65.00') // a bare $ is ambiguous: keep the item's currency
  assert.deepEqual(parsePrice('$34.99 CAD'), { amount: '34.99', currency: 'CAD' })
})
