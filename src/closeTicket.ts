// cancel-subscription.ts

import { ticketStatusChanged } from './workflows';
import { Connection, Client } from '@temporalio/client';
import { Ticket } from './ticket';


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

    const handle = client.workflow.getHandle('ticketWorkflow_123'); // match the Workflow id
    let ticket: Ticket = await handle.query<Ticket, []>('ticket');
    console.log(`[Start] The workflow ticket is: `, ticket);
    

    await handle.signal(ticketStatusChanged, {newStatus: "closed"});

    ticket = await handle.query<Ticket, []>('ticket');
    console.log(`[End] The workflow ticket is: `, ticket);

    ticket = await handle.query<Ticket, []>('ticket');
    console.log(`[Over] The workflow ticket is: `, ticket);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
