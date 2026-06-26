"use server";

import { redirect } from 'next/navigation';
import { getFastaarClient } from './client';
import { CreatePaymentParams } from './types';

/**
 * Server Action to create a payment intent and redirect the user to the checkout URL.
 * 
 * @param params Payment creation parameters
 */
export async function createCheckoutRedirect(params: CreatePaymentParams): Promise<never> {
  const client = getFastaarClient();
  const payment = await client.createPayment(params);
  redirect(payment.checkout_url);
}
