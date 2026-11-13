-- Run after 040 with application writes stopped. All preconditions and changes
-- are transactional; existing order totals and histories are preserved.
-- ECMAScript String.trim() whitespace, independent of database locale.
BEGIN;

LOCK TABLE purchase_orders, purchase_order_items IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
  invalid_order record;
BEGIN
  SELECT po.id, po."totalCents" AS stored_total,
         COALESCE(SUM(item.quantity::bigint * item."unitPriceCents"::bigint), 0) AS item_total
  INTO invalid_order
  FROM purchase_orders po
  LEFT JOIN purchase_order_items item ON item."orderId" = po.id
  GROUP BY po.id, po."totalCents"
  HAVING COUNT(item."orderId") = 0
      OR po."totalCents" <= 0
      OR BOOL_OR(item.quantity IS NULL OR item.quantity <= 0
        OR item."unitPriceCents" IS NULL OR item."unitPriceCents" <= 0
        OR item.position IS NULL OR item.position < 0
        OR item.description IS NULL OR translate(item.description, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF', '') = ''
        OR item.unit IS NULL OR translate(item.unit, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF', '') = '')
      OR COUNT(item.position) <> COUNT(DISTINCT item.position)
      OR COUNT(item."orderId") FILTER (WHERE item.position = 0) <> 1
      OR BOOL_OR(item.position = 0 AND
        (item.description IS DISTINCT FROM po.description
         OR item.quantity IS DISTINCT FROM po.quantity
         OR item.unit IS DISTINCT FROM po.unit
         OR item."unitPriceCents" IS DISTINCT FROM po."unitPriceCents"))
      OR COALESCE(SUM(item.quantity::bigint * item."unitPriceCents"::bigint), 0) <> po."totalCents"
  ORDER BY po.id
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Cannot migrate ODC %: inconsistent or missing items (stored %, items %)',
      invalid_order.id, invalid_order.stored_total, invalid_order.item_total
      USING ERRCODE = '23514';
  END IF;
END $$;

ALTER TABLE purchase_orders
  ADD COLUMN "subtotalCents" integer,
  ADD COLUMN "vatRateBps" integer,
  ADD COLUMN "vatCents" integer;

UPDATE purchase_orders
SET "subtotalCents" = "totalCents", "vatRateBps" = 0, "vatCents" = 0;

ALTER TABLE purchase_orders
  ALTER COLUMN "subtotalCents" SET NOT NULL,
  ALTER COLUMN "vatRateBps" SET NOT NULL,
  ALTER COLUMN "vatCents" SET NOT NULL,
  ADD CONSTRAINT "CHK_purchase_order_vat"
    CHECK ("subtotalCents" > 0 AND "vatRateBps" IN (0, 1600)
      AND "vatCents" = CASE WHEN "vatRateBps" = 0 THEN 0
        ELSE (("subtotalCents"::bigint * 16 + 50) / 100) END
      AND "totalCents"::bigint = "subtotalCents"::bigint + "vatCents"::bigint);

COMMIT;
