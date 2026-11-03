-- For databases where 040's table already exists but historical rows were not
-- backfilled. Run with writes stopped, after reviewing the target and backup.
-- Existing line items and all order headers/history remain untouched.
BEGIN;

LOCK TABLE purchase_orders, purchase_order_items IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
  invalid_order record;
BEGIN
  SELECT po.id, po."totalCents" AS stored_total,
         po.quantity::bigint * po."unitPriceCents"::bigint AS expected_total
  INTO invalid_order
  FROM purchase_orders po
  WHERE NOT EXISTS (SELECT 1 FROM purchase_order_items i WHERE i."orderId" = po.id)
    AND (po.quantity IS NULL OR po.quantity < 1
      OR po."unitPriceCents" IS NULL OR po."unitPriceCents" < 1
      OR po."totalCents" IS NULL OR po."totalCents" < 1
      OR po.quantity::bigint * po."unitPriceCents"::bigint <> po."totalCents"
      OR po.description IS NULL OR po.description !~ '[^[:space:]]'
      OR po.unit IS NULL OR po.unit !~ '[^[:space:]]')
  ORDER BY po.id
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Cannot reconcile ODC %: inconsistent historical header (stored %, expected %)',
      invalid_order.id, invalid_order.stored_total, invalid_order.expected_total
      USING ERRCODE = '23514';
  END IF;

  SELECT po.id, po."totalCents" AS stored_total,
         SUM(i.quantity::bigint * i."unitPriceCents"::bigint) AS expected_total
  INTO invalid_order
  FROM purchase_orders po
  JOIN purchase_order_items i ON i."orderId" = po.id
  GROUP BY po.id, po."totalCents"
  HAVING po."totalCents" <= 0
      OR BOOL_OR(i.quantity IS NULL OR i.quantity <= 0
        OR i."unitPriceCents" IS NULL OR i."unitPriceCents" <= 0
        OR i.position IS NULL OR i.position < 0
        OR i.description IS NULL OR i.description !~ '[^[:space:]]'
        OR i.unit IS NULL OR i.unit !~ '[^[:space:]]')
      OR COUNT(i.position) <> COUNT(DISTINCT i.position)
      OR COUNT(i."orderId") FILTER (WHERE i.position = 0) <> 1
      OR BOOL_OR(i.position = 0 AND
        (i.description IS DISTINCT FROM po.description
         OR i.quantity IS DISTINCT FROM po.quantity
         OR i.unit IS DISTINCT FROM po.unit
         OR i."unitPriceCents" IS DISTINCT FROM po."unitPriceCents"))
      OR SUM(i.quantity::bigint * i."unitPriceCents"::bigint) <> po."totalCents"
  ORDER BY po.id
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Cannot reconcile ODC %: inconsistent existing items (stored %, expected %)',
      invalid_order.id, invalid_order.stored_total, invalid_order.expected_total
      USING ERRCODE = '23514';
  END IF;
END $$;

INSERT INTO purchase_order_items ("orderId", position, description, quantity, unit, "unitPriceCents")
SELECT po.id, 0, po.description, po.quantity, po.unit, po."unitPriceCents"
FROM purchase_orders po
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_items i WHERE i."orderId" = po.id)
ORDER BY po.id;

COMMIT;
