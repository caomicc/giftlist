import React from 'react';
import { Badge } from './ui/badge';

type PriceTagProps = {
  price: string;
};

const PriceTag: React.FC<PriceTagProps> = ({ price }) => {
  return (
      <Badge variant="price" className="uppercase text-xs tracking-wider">
        {price
          ? (() => {
            // If price is a string, check if it starts with "$"
            let priceStr = String(price).trim()
            // Add $ if not present and is a number
            if (!priceStr.startsWith("$") && /^\d+(\.\d+)?$/.test(priceStr)) {
              priceStr = `$${priceStr}`
            }
            // Add .00 if no cents
            if (/^\$\d+$/.test(priceStr)) {
              priceStr = `${priceStr}.00`
            }
            return priceStr
          })()
      : price}
    </Badge>
  )
};
export default PriceTag;
