import type { Customer } from "./customer";


export async function greet(name: string): Promise<string> {
  return `Hello, ${name}!`;
}

export async function sendWelcomeEmail(cust: Customer): Promise<string> {
  console.log(`Welcom email sent. [${cust.email}]`);
  return `Welcome email sent`;
}

export async function sendSubscriptionOverEmail(cust: Customer): Promise<string> {
  console.log(`Subscription over email sent. [${cust.email}]`);
  return `Subscription over email sent`;
}

export async function sendCancellationEmailDuringTrialPeriod(cust: Customer): Promise<string> {
  console.log(`Cancellation email during trial period sent. [${cust.email}]`)
  return 'Cancellation trial email sent';
}

export async function chargeCustomerForBillingPeriod(cust: Customer): Promise<string> {
  console.log(`Customer charged $ ${cust.initialBillingPeriodCharge} for billing period number ${cust.billingPeriod}`);
  return `Charged $ ${cust.initialBillingPeriodCharge} for billing period ${cust.billingPeriod}`;
}

export async function sendCancellationEmailDuringActiveSubscription(cust: Customer): Promise<string> {
  console.log(`Cancellation email during subscription sent. [${cust.email}]`)
  return 'Cancellation subscription email sent';
}


  