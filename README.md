# Fastaar Next.js integration

Accept bKash & Nagad payments in your Next.js application using [Fastaar](https://fastaar.com).

This package is optimized for the Next.js App Router, featuring full support for **React Server Components (RSC)**, **Server Actions**, and Next.js **Route Handlers** for webhook signature verification. Written entirely in TypeScript.

## Features

- **React Server Components**: `<CheckoutButton>` for instant checkout forms.
- **Server Actions**: Clean integration with server redirects.
- **Route Handlers Webhook Helper**: Automatically reads, verifies, and parses incoming webhooks.
- **Client Caching**: Singleton instance caching to prevent multiple instances during fast-refresh in development.
- **Full TypeScript Support**: Auto-complete and strict types for payments, config, and webhooks.

## Install

Install the package and its peer dependencies (if not already installed):

```bash
npm install @fastaar/nextjs
```

## Configuration

Set the following environment variables in your `.env.local` or hosting provider:

```env
# Required: Your Fastaar Live/Test API key
FASTAAR_API_KEY="fk_live_..."

# Optional: Your Webhook secret for signature verification
FASTAAR_WEBHOOK_SECRET="whsec_..."
```

---

## Usage

### 1. Simple Checkout Button (Server Component)

Use the built-in `<CheckoutButton>` React Server Component. It renders a HTML form that invokes a Server Action to create the payment intent and automatically redirects the customer.

```tsx
import { CheckoutButton } from '@fastaar/nextjs';

export default function CheckoutPage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Complete your purchase</h1>
      <p>Amount: 1,250 BDT</p>
      
      <CheckoutButton
        paymentParams={{
          amount: 1250,
          invoice_number: 'ORDER-42',
          success_url: 'https://your-site.com/thanks',
          cancel_url: 'https://your-site.com/cart',
          metadata: { userId: 'usr_1001' },
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Pay with bKash / Nagad
      </CheckoutButton>
    </main>
  );
}
```

### 2. Custom Flow (Server Actions)

If you need to perform additional server-side operations (like saving the order in your database as "pending" before redirecting), use `getFastaarClient` in your own Server Action:

```tsx
import { getFastaarClient } from '@fastaar/nextjs';
import { redirect } from 'next/navigation';

export default function CheckoutPage() {
  async function handleCheckout() {
    'use server';

    // 1. Create order in your database
    // const order = await db.order.create(...);

    // 2. Initialize Fastaar client and create payment
    const fastaar = getFastaarClient();
    const payment = await fastaar.createPayment({
      amount: 1250,
      invoice_number: 'ORDER-42',
      success_url: 'https://your-site.com/thanks',
      cancel_url: 'https://your-site.com/cart',
    });

    // 3. Redirect to checkout page
    redirect(payment.checkout_url);
  }

  return (
    <form action={handleCheckout}>
      <button type="submit">Pay Now</button>
    </form>
  );
}
```

### 3. Webhook Route Handler (Next.js App Router)

Handle payment status notifications securely using Next.js Route Handlers. The `verifyNextWebhook` helper handles raw stream reading and signature verification using your `FASTAAR_WEBHOOK_SECRET`.

Create a file at `app/api/webhooks/fastaar/route.ts`:

```typescript
import { verifyNextWebhook } from '@fastaar/nextjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { isValid, event } = await verifyNextWebhook(req);

  if (!isValid || !event) {
    return new NextResponse('Invalid signature', { status: 400 });
  }

  // Handle the webhook event
  if (event.event === 'payment.completed') {
    const payment = event.data;
    const invoiceNumber = payment.invoice_number;       // your order reference, e.g. 'ORDER-42'
    const trxId = payment.customer_trx_id;             // operator transaction ID

    // Mark order as paid in database idempotently
    // await db.order.update({ where: { id: invoiceNumber }, data: { paid: true, trxId } });
    
    console.log(`Payment completed for invoice ${invoiceNumber}`);
  }

  return new NextResponse('OK', { status: 200 });
}
```

### 4. Fetching Payment Details

To manually fetch details for a payment:

```typescript
import { getFastaarClient } from '@fastaar/nextjs';

const fastaar = getFastaarClient();

// Get by Fastaar payment ID
const payment = await fastaar.getPayment('01jxyz...');

// Look up by your own order reference
const payment = await fastaar.findByInvoiceNumber('ORDER-42');

// List payments
const payments = await fastaar.listPayments({ status: 'completed', per_page: 10 });
```

### 5. Customers

Store customer records to attach them to payments collected via payment links.

```typescript
import { getFastaarClient } from '@fastaar/nextjs';

const fastaar = getFastaarClient();

// Create a customer — name and phone are required
const customer = await fastaar.createCustomer({
  name:    'Rahim Uddin',
  phone:   '01712345678',
  email:   'rahim@example.com',   // optional
  address: 'Dhaka, Bangladesh',   // optional
  notes:   'VIP customer',        // optional
});

// Retrieve, update, list
const fetched   = await fastaar.getCustomer(customer.id);
const updated   = await fastaar.updateCustomer(customer.id, { name: 'Rahim Ahmed' });
const customers = await fastaar.listCustomers({ email: 'rahim@example.com' });
```

## License

MIT
