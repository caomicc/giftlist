import React from 'react';
import { formatPrice, getUserLocale } from '@/lib/currency';

type PriceTagProps = {
  price: string;
  /** The item's currency; every stored price has one */
  currency?: string;
};

/** A price in the item's own currency, as quiet text (green is reserved for "claimed / purchased"). */
const PriceTag: React.FC<PriceTagProps> = ({ price, currency = 'USD' }) => (
  <span className="text-xs text-muted-foreground tabular-nums">
    {price ? formatPrice(price, currency, getUserLocale()) : '—'}
  </span>
);

export default PriceTag;
