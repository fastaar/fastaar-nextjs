import {
  CreateCustomerParams,
  CreatePaymentParams,
  Customer,
  CustomerParams,
  FastaarClientOptions,
  ListCustomersParams,
  ListPaymentsParams,
  Payment,
  Refund,
} from './types';

const API_BASE_URL = 'https://fastaar.com';

/**
 * Custom error class for Fastaar API errors.
 */
export class FastaarError extends Error {
  /**
   * The type of the error returned by the API (e.g. 'authentication_error', 'validation_error').
   */
  errorType: string;

  /**
   * The HTTP status code returned by the API.
   */
  statusCode: number;

  constructor(message: string, errorType = 'api_error', statusCode = 0) {
    super(message);
    this.name = 'FastaarError';
    this.errorType = errorType;
    this.statusCode = statusCode;
  }
}

/**
 * Client for interacting with the Fastaar Payment Gateway API.
 */
export class FastaarClient {
  private apiKey: string;
  private timeoutMs: number;

  /**
   * @param apiKey Your Fastaar API Key (fk_live_... or fk_test_...)
   * @param options Client configuration options
   */
  constructor(apiKey: string, options: FastaarClientOptions = {}) {
    if (!apiKey) {
      throw new FastaarError('API key is required to initialize FastaarClient.', 'authentication_error');
    }
    this.apiKey = apiKey;
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  // ---------------------------------------------------------------------------
  // Payments
  // ---------------------------------------------------------------------------

  /**
   * Create a payment intent. Returns the payment object including
   * `id`, `status`, and `checkout_url`.
   *
   * Reusing the same `invoice_number` while a previous payment for it is still
   * active (not `failed`/`expired`) throws a FastaarError with errorType
   * `duplicate_invoice_number` (HTTP 409) instead of creating a duplicate — look
   * the existing payment up with `findByInvoiceNumber()` rather than retrying blindly.
   * Supply `success_url`/`cancel_url` to return the customer to your site after checkout.
   */
  async createPayment(params: CreatePaymentParams): Promise<Payment> {
    return this.request<Payment>('POST', '/api/v1/payments', params);
  }

  /**
   * Retrieve a payment by its reference ID.
   */
  async getPayment(paymentId: string): Promise<Payment> {
    return this.request<Payment>('GET', `/api/v1/payments/${encodeURIComponent(paymentId)}`);
  }

  /**
   * List payments, newest first.
   */
  async listPayments(params: ListPaymentsParams = {}): Promise<Payment[]> {
    const stringParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        stringParams[key] = String(value);
      }
    }
    const query = new URLSearchParams(stringParams).toString();
    return this.request<Payment[]>('GET', `/api/v1/payments${query ? `?${query}` : ''}`);
  }

  /**
   * Find the most recent payment for one of your invoice numbers, or null if none exist.
   */
  async findByInvoiceNumber(invoiceNumber: string): Promise<Payment | null> {
    const payments = await this.listPayments({ invoice_number: invoiceNumber });
    return payments[0] ?? null;
  }

  /**
   * Refund a payment, in full or in part. Only payments with status `completed` or
   * `partially_refunded` can be refunded. Pass an amount to refund only part of the
   * remaining balance; omit it to refund whatever is still refundable.
   *
   * @returns The updated payment object. `status` is `refunded` once fully refunded,
   * or `partially_refunded` if some balance remains.
   * @throws FastaarError if the payment is not in a refundable state, or the amount
   * exceeds the remaining refundable balance.
   */
  async refundPayment(paymentId: string, amount?: number | string): Promise<Payment> {
    return this.request<Payment>(
      'POST',
      `/api/v1/payments/${encodeURIComponent(paymentId)}/refund`,
      amount !== undefined ? { amount } : undefined,
    );
  }

  /**
   * List a payment's refund history, newest first — one entry per refund call, even
   * across several partial refunds.
   */
  async listRefunds(paymentId: string): Promise<Refund[]> {
    return this.request<Refund[]>('GET', `/api/v1/payments/${encodeURIComponent(paymentId)}/refunds`);
  }

  // ---------------------------------------------------------------------------
  // Customers
  // ---------------------------------------------------------------------------

  async listCustomers(params: ListCustomersParams = {}): Promise<Customer[]> {
    const stringParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        stringParams[key] = String(value);
      }
    }
    const query = new URLSearchParams(stringParams).toString();
    return this.request<Customer[]>('GET', `/api/v1/customers${query ? `?${query}` : ''}`);
  }

  async createCustomer(params: CreateCustomerParams): Promise<Customer> {
    return this.request<Customer>('POST', '/api/v1/customers', params);
  }

  async getCustomer(customerId: number): Promise<Customer> {
    return this.request<Customer>('GET', `/api/v1/customers/${customerId}`);
  }

  async updateCustomer(customerId: number, params: CustomerParams): Promise<Customer> {
    return this.request<Customer>('PATCH', `/api/v1/customers/${customerId}`, params);
  }

  /**
   * Helper to perform HTTP request to Fastaar API.
   */
  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    let response: Response;

    try {
      response = await fetch(API_BASE_URL + path, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error: any) {
      throw new FastaarError(`Could not reach the Fastaar API: ${error.message}`, 'connection_error');
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload === null) {
      throw new FastaarError(
        payload?.error?.message ?? `Fastaar API returned HTTP ${response.status}.`,
        payload?.error?.type ?? 'api_error',
        response.status,
      );
    }

    return (payload.data ?? payload) as T;
  }
}

// Global caching pattern for Next.js hot-reloading
const globalForFastaar = globalThis as unknown as {
  fastaarClient?: FastaarClient;
};

/**
 * Retrieves a cached singleton instance of FastaarClient initialized with
 * environment variables (FASTAAR_API_KEY, FASTAAR_TIMEOUT_MS).
 * Useful in Next.js API route handlers, Server Actions, and Server Components.
 */
export function getFastaarClient(): FastaarClient {
  if (!globalForFastaar.fastaarClient) {
    const apiKey = process.env.FASTAAR_API_KEY;
    if (!apiKey) {
      throw new FastaarError(
        'FASTAAR_API_KEY environment variable is not defined.',
        'authentication_error'
      );
    }

    const timeoutMs = process.env.FASTAAR_TIMEOUT_MS
      ? parseInt(process.env.FASTAAR_TIMEOUT_MS, 10)
      : undefined;

    globalForFastaar.fastaarClient = new FastaarClient(apiKey, { timeoutMs });
  }

  return globalForFastaar.fastaarClient;
}
