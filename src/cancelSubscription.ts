// cancel-subscription.ts

import { cancelSubscription, BillingCycle } from './workflows';
import { Connection, Client } from '@temporalio/client';
import { Customer } from './customer';


async function run() {
    // Connect to the default Server location (localhost:7233)
    const connection = await Connection.connect();
    // In production, pass options to configure TLS and other settings:
    // {
    //   address: 'foo.bar.tmprl.cloud',
    //   tls: {}
    // }
  
    const client = new Client({
      connection,
      // namespace: 'foo.bar', // connects to 'default' namespace if not specified
    });

    const handle = client.workflow.getHandle('workflowId9999'); // match the Workflow id
    const cust: Customer = await handle.query<Customer, []>('cust');
    console.log(`[Start] The workflow customer object is: `, cust);
    cust.initialBillingPeriodCharge = cust.initialBillingPeriodCharge + 100.00;

    await handle.signal("cust", cust);

    const cust2 = await handle.query<Customer, []>('cust');
    console.log(`[After Change] The workflow customer object is: `, cust2);

    //await handle.signal(cancelSubscription);

    //console.log(`Sent cancelSubscription signal to workflowId9999`);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
