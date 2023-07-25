import { Connection, Client } from '@temporalio/client';
import { SubscriptionWorkflow } from './workflows';
import type { Customer } from './customer';
//import { nanoid } from 'nanoid';

const cust: Customer = {
    email: 'jay.runkel@mongodb.com',
    trialPeriod: 60000, // 1 minute
    billingPeriod: 300000, // 5 minutes
    maxBillingPeriods: 12,
    initialBillingPeriodCharge: 100.00,
    id: "jay1965"
}

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

  const handle = await client.workflow.start(SubscriptionWorkflow, {
    // type inference works! args: [name: string]
    args: [ cust ],
    taskQueue: 'tutorial',
    // in practice, use a meaningful business ID, like customerId or transactionId
    workflowId: 'workflowId9999',  //'workflowId-' + nanoid(),
  });
  console.log(`Started workflow ${handle.workflowId}`);

  // optional: wait for client result
  console.log(await handle.result()); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});