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
   * Your order reference / idempotency key.
   * Retrying with the same invoice_number while a previous payment for it is still
   * active (not `failed`/`expired`) throws a FastaarError with errorType
   * `duplicate_invoice_number` (HTTP 409) instead of creating a duplicate.
   */
  invoice_number: string;

  /**
   * An existing customer to attach to this payment. Must belong to your merchant account.
   */
  customer_id?: number;

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
  invoice_number?: string;

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
  id: string;
  amount: string;
  amount_due: string;
  refunded_amount: string;
  gateway_charge: string;
  gateway_charge_type: 'percentage' | 'fixed' | null;
  gateway_charge_value: string | null;
  currency: string;
  livemode: boolean;
  source: string;
  status: string;
  invoice_number: string;
  customer_id?: number;
  provider?: string;
  payment_method?: string;
  customer_trx_id?: string;
  customer_sender_number?: string;
  metadata?: Record<string, string>;
  failure_reason?: string;
  success_url?: string;
  cancel_url?: string;
  checkout_url: string;
  expires_at: string;
  verified_at?: string;
  created_at: string;
}

/**
 * A single refund event on a payment — one per refund call, even across several
 * partial refunds.
 */
export interface Refund {
  id: number;
  amount: string;
  source: 'api' | 'panel';
  created_at: string;
}

/**
 * Parameters for updating a customer (all fields optional).
 */
export interface CustomerParams {
  name?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

/**
 * Parameters for creating a customer.
 */
export interface CreateCustomerParams {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

/**
 * A customer object returned by the Fastaar API.
 */
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Parameters for querying the list of customers.
 */
export interface ListCustomersParams extends Record<string, string | number | undefined> {
  email?: string;
  phone?: string;
  per_page?: number;
  page?: number;
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
