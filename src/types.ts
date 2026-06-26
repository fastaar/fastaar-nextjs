/**
 * Configuration options for the Fastaar client.
 */
export interface FastaarClientOptions {
  /**
   * Timeout in milliseconds for API requests. Defaults to 15000.
   */
  timeoutMs?: number;
}

/**
 * Parameters for creating a new payment.
 */
export interface CreatePaymentParams {
  /**
   * The amount to charge (can be a number or string representation of a decimal).
   */
  amount: number | string;

  /**
   * Your custom reference identifier for the invoice/order.
   * Supplying the same invoice_id will retrieve the existing payment intent
   * instead of creating a duplicate, ensuring idempotency.
   */
  invoice_id?: string;

  /**
   * The URL to redirect the customer to upon successful payment completion.
   */
  success_url?: string;

  /**
   * The URL to redirect the customer to if they cancel the checkout process.
   */
  cancel_url?: string;

  /**
   * Arbitrary key-value metadata to attach to the payment.
   */
  metadata?: Record<string, string>;
}

/**
 * Parameters for querying the list of payments.
 */
export interface ListPaymentsParams extends Record<string, string | number | undefined> {
  /**
   * Filter payments by status (e.g., 'completed', 'pending', 'cancelled').
   */
  status?: string;

  /**
   * Filter payments by your custom invoice/order reference.
   */
  invoice_id?: string;

  /**
   * Number of payments to return per page.
   */
  per_page?: number;

  /**
   * Page number to retrieve (for pagination).
   */
  page?: number;
}

/**
 * Representation of a payment object returned by the Fastaar API.
 */
export interface Payment {
  /**
   * Unique Fastaar transaction identifier.
   */
  id: string;

  /**
   * The transaction amount.
   */
  amount: string;

  /**
   * The associated invoice ID supplied when the payment was created.
   */
  invoice_id?: string;

  /**
   * The current status of the payment (e.g., 'completed', 'pending', 'cancelled').
   */
  status: string;

  /**
   * The secure hosted checkout URL where the customer completes payment.
   */
  checkout_url: string;

  /**
   * The customer's mobile number, if paid (e.g. bKash or Nagad wallet number).
   */
  wallet_number?: string;

  /**
   * The payment method used (e.g., 'bkash', 'nagad').
   */
  payment_method?: string;

  /**
   * Transaction ID from the mobile operator/gateway (e.g. bKash trxID).
   */
  trx_id?: string;

  /**
   * Indicates whether this payment is live or test mode.
   */
  livemode: boolean;

  /**
   * Arbitrary metadata stored on the payment.
   */
  metadata?: Record<string, string>;

  /**
   * Payment creation timestamp.
   */
  created_at: string;

  /**
   * Payment completion timestamp (if completed).
   */
  completed_at?: string;
}

/**
 * Structure of a Fastaar Webhook event request body.
 */
export interface WebhookEvent {
  /**
   * The type of event (e.g., 'payment.completed').
   */
  event: string;

  /**
   * Indicates whether this event occurred in live mode or test mode.
   */
  livemode: boolean;

  /**
   * The payment object details associated with this event.
   */
  data: Payment;
}
