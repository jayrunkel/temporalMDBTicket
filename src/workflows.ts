// /src/workflows.ts
import * as wf from '@temporalio/workflow';
import type * as activities from './activities';
import type { Customer } from "./customer";

const acts = wf.proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '1 minute',
});

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