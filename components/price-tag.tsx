import React from 'react';
import { Badge } from './ui/badge';
import { formatPrice, getUserLocale, getUserCurrency } from '@/lib/currency';

type PriceTagProps = {
  price: string;
};

const PriceTag: React.FC<PriceTagProps> = ({ price }) => {
  const locale = getUserLocale();
  const currency = getUserCurrency(locale);
  
  return (
      <Badge variant="price" className="uppercase text-xs tracking-wider">
        {price ? formatPrice(price, currency, locale) : '—'}
    </Badge>
  )
};
export default PriceTag;
