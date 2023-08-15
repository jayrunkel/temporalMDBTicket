import { Connection, Client } from '@temporalio/client';
import { ticketLifecycleWorkflow } from './workflows';
import { Ticket } from './ticket';

//import type { Customer } from './customer';
//import { nanoid } from 'nanoid';

const jayTicket: Ticket =  {
  ticketNumber: 123,
  customerId: 456,
  responseMinSLA: 30, //response time in min SLA
  priority: "S3",
  status: "unassigned",
  assignedTo: null,

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
    workflowId: 'ticketWorkflow_' + jayTicket.ticketNumber,  //'workflowId-' + nanoid(),
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
