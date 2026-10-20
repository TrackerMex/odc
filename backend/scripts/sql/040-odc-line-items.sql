-- Backfill each existing ODC as its original single line item. Run as one
-- transaction with writes stopped; a failed precondition leaves no schema or
-- data changes behind.
BEGIN;

LOCK TABLE purchase_orders IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
  inconsistent_order record;
BEGIN
  SELECT
    order_row.id,
    order_row."totalCents"::bigint AS stored_total,
    order_row.quantity::bigint * order_row."unitPriceCents"::bigint AS expected_total
  INTO inconsistent_order
  FROM purchase_orders AS order_row
  WHERE order_row.quantity < 1
    OR order_row."unitPriceCents" < 1
    OR order_row."totalCents" < 1
    OR order_row."totalCents"::bigint <>
      order_row.quantity::bigint * order_row."unitPriceCents"::bigint
    OR btrim(order_row.description) = ''
    OR btrim(order_row.unit) = ''
  ORDER BY order_row.id
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'Cannot migrate ODC %: invalid historical line item (stored total %, expected %)',
      inconsistent_order.id,
      inconsistent_order.stored_total,
      inconsistent_order.expected_total
      USING ERRCODE = '23514';
  END IF;
END $$;

CREATE TABLE purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" uuid NOT NULL,
  position integer NOT NULL,
  description varchar NOT NULL,
  quantity integer NOT NULL,
  unit varchar NOT NULL,
  "unitPriceCents" integer NOT NULL,
  CONSTRAINT "FK_purchase_order_items_order"
    FOREIGN KEY ("orderId") REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT "CHK_purchase_order_items_position"
    CHECK (position >= 0),
  CONSTRAINT "CHK_purchase_order_items_quantity"
    CHECK (quantity > 0),
  CONSTRAINT "CHK_purchase_order_items_unit_price"
    CHECK ("unitPriceCents" > 0),
  CONSTRAINT "CHK_purchase_order_items_description"
    CHECK (btrim(description) <> ''),
  CONSTRAINT "CHK_purchase_order_items_unit"
    CHECK (btrim(unit) <> '')
);

CREATE UNIQUE INDEX "IDX_purchase_order_items_order_position"
  ON purchase_order_items ("orderId", position);

INSERT INTO purchase_order_items (
  "orderId",
  position,
  description,
  quantity,
  unit,
  "unitPriceCents"
)
SELECT
  id,
  0,
  description,
  quantity,
  unit,
  "unitPriceCents"
FROM purchase_orders
ORDER BY id;

COMMIT;
