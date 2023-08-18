import { Chance } from "chance";
import type { Customer } from "./customer";
import { supportEngineers, TicketDescription, type Ticket } from "./ticket";
import { connectToDatabase } from "./services/utilities/src/mongodbConnect";
import { createTicket } from "./services/ticket/src/ticketService";
import { MongoClient } from "mongodb";
import { assertIsDefined } from "./services/utilities/src/utlities";


const chance = new Chance();
let mClient : MongoClient | undefined = undefined;

async function setUpDBConnection () : Promise<MongoClient> {
  const client = await connectToDatabase();
  assertMClient(client);
  return client;
}

export async function getDBClient () : Promise<MongoClient> {
  if (mClient === undefined) {
    mClient = await setUpDBConnection()
  }
  return mClient;
}

function assertMClient(dbClient: MongoClient | undefined) : asserts dbClient is MongoClient {
  if (dbClient === undefined) {
    throw new Error ("Database connection not available");
  }
}



export async function createDBTicket(ticketDesc: TicketDescription): Promise<Ticket> {
  const client = await getDBClient();

  const newTicket: Ticket = {
    ticketNumber: 0,
    customerId: ticketDesc.customerId,
    responseMinSLA: 30, //need to get from user doc
    priority: ticketDesc.priority,
    status: "unassigned",
    assignedTo: null
  };
  
  const newTicketNum = await createTicket(client, ticketDesc.customerId, ticketDesc.title, ticketDesc.description, ticketDesc.priority);
  assertIsDefined(newTicketNum);

  newTicket.ticketNumber = newTicketNum;
  return newTicket;
}

export async function assignTicketToEngineer(ticket: Ticket): Promise<Ticket> {
  try {
    const assignedTo = chance.pickone(supportEngineers);
    assertIsDefined(assignedTo);
    const status = "inProgress";
    const msg = `[${ticket.ticketNumber}] Assigned ticket to engineer: ${assignedTo}.`;
    console.log(msg);
    return {...ticket, assignedTo, status}
  }
  catch (err) {
    console.log(err);
    return ticket;
  }
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


  