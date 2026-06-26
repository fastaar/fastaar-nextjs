import React from 'react';
import { createCheckoutRedirect } from './actions';
import { CreatePaymentParams } from './types';

export interface CheckoutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Payment parameters such as amount, invoice_id, success_url, cancel_url, and metadata.
   */
  paymentParams: CreatePaymentParams;

  /**
   * Content of the button. Defaults to 'Pay with Fastaar'.
   */
  children?: React.ReactNode;
}

/**
 * A React Server Component that renders a checkout button.
 * Clicking the button invokes a Server Action that creates a payment
 * and redirects the user to the Fastaar checkout page.
 */
export function CheckoutButton({
  paymentParams,
  children,
  ...buttonProps
}: CheckoutButtonProps) {
  return (
    <form action={createCheckoutRedirect.bind(null, paymentParams)} style={{ display: 'inline-block' }}>
      <button type="submit" {...buttonProps}>
        {children ?? 'Pay with Fastaar'}
      </button>
    </form>
  );
}
