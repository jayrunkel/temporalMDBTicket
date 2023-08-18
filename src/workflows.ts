// /src/workflows.ts
import * as wf from '@temporalio/workflow';
import type * as activities from './activities';
import type { Customer } from "./customer";
import type { Ticket, TicketDescription, ticketStatusTypes } from "./ticket"

const acts = wf.proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '1 minute',
});

interface TicketStatusChange {
  newStatus: ticketStatusTypes | null;
  newComment?: number;
}

function resetTicketStatusChange() : TicketStatusChange {
  return {newStatus: null, newComment: -1}
}

type TicketStatusChangeType = TicketStatusChange;

export const ticketStatusChanged = wf.defineSignal<[TicketStatusChange]>('ticketStatusChanged');

// assume Atlas trigger kicks off workflow as soon as it is created
export async function ticketLifecycleWorkflow(ticketDescription: TicketDescription) {
  
  let newTicketStatus: TicketStatusChangeType = resetTicketStatusChange();
  wf.setHandler(ticketStatusChanged, (tc: TicketStatusChange) => void (newTicketStatus = {...tc}));

  const _ticket = await acts.createDBTicket(ticketDescription);
  const ticket = useState('ticket', _ticket);

  while (ticket.value.status != "closed") {
    console.log("Ticket Status: ", ticket.value.status);

    if (ticket.value.status === "unassigned") {
      /*
      const ticketUpdates = await acts.assignTicketToEngineer(ticket.value);  // if short staffed this could take a long time???
      ticket.value.status = ticketUpdates.status;
      ticket.value.assignedTo = ticketUpdates.assignedTo;
      */
      ticket.value = await acts.assignTicketToEngineer(ticket.value);  // if short staffed this could take a long time???
      console.log("Ticket: ", ticket.value);
      await acts.sendTicketAssignmentNoficiationEmail(ticket.value);
   
    } else if (ticket.value.status === "waitingForCustomer") {
        if (await wf.condition( () => newTicketStatus.newStatus != "waitingForCustomer", ticket.value.responseMinSLA)) {
          if (newTicketStatus.newStatus === null) {//timed out
            await acts.sendWaitingForCustomerEmailReminder(ticket.value);
          } else {
            ticket.value.status = newTicketStatus.newStatus;
            newTicketStatus = resetTicketStatusChange();
          }
        }
    } else if (ticket.value.status === "inProgress") {// TODO fix response sla units
        if (await wf.condition( () => newTicketStatus.newStatus != "inProgress", ticket.value.responseMinSLA)) {
          if (newTicketStatus.newStatus === null) {//timed out
            ticket.value = await acts.escalateTicket(ticket.value);
            await acts.sendEscalationEmailToCustomer(ticket.value);
          } else {
            ticket.value.status = newTicketStatus.newStatus;
            newTicketStatus = resetTicketStatusChange();
          }
        }
    } else if (ticket.value.status === "SLANotMet") { /* ticket in progress. The SLA hasn't been met */
        if (await wf.condition( () => newTicketStatus.newStatus != "SLANotMet", ticket.value.responseMinSLA)) {
          if (newTicketStatus.newStatus === null) {//timed out
            ticket.value = await acts.escalateTicket(ticket.value);
            await acts.sendEscalationEmailToCustomer(ticket.value);
          } else {
            console.log(`[SLANotMet] ticket status changed to: ${newTicketStatus.newStatus}`);
            ticket.value.status = newTicketStatus.newStatus;
            newTicketStatus = resetTicketStatusChange();
          }
        }
    } else {
        const errMsg = `Unknown ticket status: ${ticket.value.status}`;
        console.log(errMsg);
        throw new Error(errMsg);
    }

  }

  // The ticket has been closed
  console.log("Ticket Status: ", ticket.value.status);
  await acts.sendTicketClosedNofificationEmail(ticket.value);

}



export const cancelSubscription = wf.defineSignal('cancelSignal');
//export const customer = wf.defineQuery('cust'); // new

export async function SubscriptionWorkflow(cust: Customer) {
  let isCanceled = false; // internal variable to track cancelation state
  wf.setHandler(cancelSubscription, () => void (isCanceled = true));
  await acts.sendWelcomeEmail(cust);
  //await wf.sleep(trialPeriod);
  if (await wf.condition(() => isCanceled, cust.trialPeriod)) {
    //reach here if predicate is true
    await acts.sendCancellationEmailDuringTrialPeriod(cust);
    return "canceledTrial";
  } else {
    //reach here if timeout happens first
    //await acts.sendSubscriptionOverEmail(email);
    await BillingCycle(cust);
  }
}

export async function BillingCycle(_cust: Customer) {
  const cust = useState('cust', _cust); // wrapped up signals + queries + state
  const period = useState('period', 0); // same

  let isCanceled = false;
  wf.setHandler(cancelSubscription, () => void (isCanceled = true));

  await acts.chargeCustomerForBillingPeriod(cust.value);
  for (; period.value < cust.value.maxBillingPeriods; period.value++) {
    // Wait 1 billing period to charge customer or if they cancel subscription
    // whichever comes first
    if (await wf.condition(() => isCanceled, cust.value.billingPeriod)) {
      // If customer canceled their subscription send notification email
      await acts.sendCancellationEmailDuringActiveSubscription(cust.value);
      break;
    }
    else {
      await acts.chargeCustomerForBillingPeriod(cust.value);
    }
  }
  // if we get here the subscription period is over
  if (!isCanceled) await acts.sendSubscriptionOverEmail(cust.value);
}


// standard utility https://docs.temporal.io/dev-guide/typescript/features#signals
function useState<T = any>(name: string, initialValue: T) {
  const signal = wf.defineSignal<[T]>(name);
  const query = wf.defineQuery<T>(name);
  let state: T = initialValue;
  wf.setHandler(signal, (newVal: T) => void (state = newVal));
  wf.setHandler(query, () => state);
  return {
    signal,
    query,
    get value() {
      return state;
    },
    set value(newVal: T) {
      state = newVal;
    },
  };
}

/*
import { proxyActivities } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});
*/
/** A workflow that simply calls an activity */
/*
export async function example(name: string): Promise<string> {
  return await greet(name);
}
*/