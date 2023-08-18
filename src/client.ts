import { Connection, Client } from '@temporalio/client';
import { ticketLifecycleWorkflow } from './workflows';
import { Ticket, TicketDescription } from './ticket';

//import type { Customer } from './customer';
//import { nanoid } from 'nanoid';

const jayTicket: TicketDescription =  {
  customerId: 1,
  title: "This is my first ticket",
  description: "Wow, I really made a mess of things!",
  priority: "S3"
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

  const handle = await client.workflow.start(ticketLifecycleWorkflow, {
    // type inference works! args: [name: string]
    args: [ jayTicket ],
    taskQueue: 'ticketHandling',
    // in practice, use a meaningful business ID, like customerId or transactionId
    workflowId: 'ticketWorkflow_' + jayTicket.customerId,  //'workflowId-' + nanoid(),
  });
  console.log(`Started workflow ${handle.workflowId}`);

  // optional: wait for client result
  console.log(await handle.result()); // Hello, Temporal!
}

/*
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
*/

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
