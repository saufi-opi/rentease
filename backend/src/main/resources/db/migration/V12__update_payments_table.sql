-- Extend the payments table with Stripe gateway fields
ALTER TABLE payments
    ADD COLUMN gateway_transaction_id VARCHAR(255) NULL COMMENT 'Stripe PaymentIntent ID (pi_...)',
    ADD COLUMN gateway_ref             VARCHAR(255) NULL COMMENT 'Stripe Charge ID (ch_...)',
    ADD COLUMN payment_type            VARCHAR(20)  NULL COMMENT 'CARD or FPX',
    ADD COLUMN failure_reason          VARCHAR(500) NULL COMMENT 'Failure message from Stripe',
    ADD COLUMN refund_id               VARCHAR(255) NULL COMMENT 'Stripe Refund ID (re_...)',
    ADD COLUMN refund_amount           DECIMAL(10,2) NULL,
    ADD COLUMN refunded_at             DATETIME(6)  NULL;
