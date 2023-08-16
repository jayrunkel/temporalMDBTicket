import { Chance } from "chance";
import type { Customer } from "./customer";
import { supportEngineers, type Ticket } from "./ticket";
import { connectToDatabase } from "./services/utilities/src/mongodbConnect";

const chance = new Chance();
const mClient = connectToDatabase();

export async function createTicket(ticket: Ticket): Promise<Ticket> {

}

export async function assignTicketToEngineer(ticket: Ticket): Promise<Ticket> {
  const assignedTo = chance.pickone(supportEngineers);
  const status = "inProgress";
  const msg = `[${ticket.ticketNumber}] Assigned ticket to engineer: ${assignedTo}.`;

  console.log(msg);
  return {...ticket, assignedTo, status};
}

export async function sendTicketAssignmentNoficiationEmail(ticket: Ticket): Promise<string> {
  const msg = `[${ticket.ticketNumber}] Sent ticket engineer assignment notification email.`;
  console.log(msg);
  return msg;
}

export async function sendWaitingForCustomerEmailReminder(ticket: Ticket): Promise<string> {
  const msg = `[${ticket.ticketNumber}] Sent waiting for customer email.`;
  console.log(msg);
  return msg;
}

export async function escalateTicket(ticket: Ticket): Promise<Ticket> {
  const msg = `[${ticket.ticketNumber}] Escalating ticket.`;
  const status = "SLANotMet";
  console.log(msg);
  return {...ticket, status};
}

export async function sendEscalationEmailToCustomer(ticket: Ticket): Promise<string> {
  const msg = `[${ticket.ticketNumber}] Sent escalating ticket email to customer.`;
  console.log(msg);
  return msg;
}

export async function sendTicketClosedNofificationEmail(ticket: Ticket): Promise<string> {
  const msg = `[${ticket.ticketNumber}] Sent ticket close notification email to customer.`;
  console.log(msg);
  return msg;
}





/* ================================ FROM subscription example ==================== */
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


  