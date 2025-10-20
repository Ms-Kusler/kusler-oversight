/**
 * Integration Service - Handles data syncing from external platforms
 */

import { storage } from "./storage";
import { decryptCredentials } from "./encryption";
import type { Integration } from "@shared/schema";

// QuickBooks Integration
export async function syncQuickBooksData(integration: Integration) {
  if (!integration.credentials) {
    throw new Error('No credentials found for QuickBooks integration');
  }

  const credentials = decryptCredentials(integration.credentials);
  const { clientId, clientSecret, realmId, refreshToken } = credentials;

  if (!clientId || !clientSecret || !realmId) {
    throw new Error('Missing required QuickBooks credentials');
  }

  if (!refreshToken) {
    throw new Error('QuickBooks requires OAuth2 authorization flow with refresh token. Please complete OAuth setup in the Workflows page.');
  }

  try {
    // OAuth2 refresh token exchange (QuickBooks requires authorization code flow, not client_credentials)
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`QuickBooks auth failed: ${tokenResponse.statusText}. Refresh token may be expired - re-authorize in Workflows.`);
    }

    const { access_token } = await tokenResponse.json();

    // Fetch invoices
    const invoicesResponse = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Invoice WHERE MetaData.LastUpdatedTime > '2024-01-01' MAXRESULTS 100`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!invoicesResponse.ok) {
      throw new Error(`QuickBooks API failed: ${invoicesResponse.statusText}`);
    }

    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.QueryResponse?.Invoice || [];

    // Sync invoices to database
    for (const qbInvoice of invoices) {
      const existingInvoices = await storage.getInvoices(integration.userId);
      const exists = existingInvoices.some(inv => 
        inv.source === 'quickbooks' && inv.description?.includes(qbInvoice.DocNumber)
      );

      if (!exists) {
        await storage.createInvoice({
          userId: integration.userId,
          amount: Math.round((qbInvoice.TotalAmt || 0) * 100), // Convert to cents
          dueDate: new Date(qbInvoice.DueDate || Date.now()),
          status: qbInvoice.Balance > 0 ? 'due' : 'paid',
          client: qbInvoice.CustomerRef?.name || 'Unknown Client',
          description: `QuickBooks Invoice #${qbInvoice.DocNumber}`,
          source: 'quickbooks'
        });
      }
    }

    // Fetch payments
    const paymentsResponse = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Payment WHERE MetaData.LastUpdatedTime > '2024-01-01' MAXRESULTS 100`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      const payments = paymentsData.QueryResponse?.Payment || [];

      for (const qbPayment of payments) {
        const existingTransactions = await storage.getTransactions(integration.userId);
        const exists = existingTransactions.some(t => 
          t.source === 'quickbooks' && t.description?.includes(qbPayment.Id)
        );

        if (!exists) {
          await storage.createTransaction({
            userId: integration.userId,
            type: 'payment',
            amount: Math.round((qbPayment.TotalAmt || 0) * 100),
            description: `QuickBooks Payment #${qbPayment.PaymentRefNum || qbPayment.Id}`,
            category: 'payment',
            source: 'quickbooks'
          });
        }
      }
    }

    // Update integration last sync
    await storage.updateIntegration(integration.id, { 
      lastSynced: new Date()
    });

    return { success: true, invoices: invoices.length };
  } catch (error) {
    console.error('QuickBooks sync error:', error);
    // Integration error logged
    throw error;
  }
}

// Stripe Integration
export async function syncStripeData(integration: Integration) {
  if (!integration.credentials) {
    throw new Error('No credentials found for Stripe integration');
  }

  const credentials = decryptCredentials(integration.credentials);
  const { apiKey } = credentials;

  if (!apiKey) {
    throw new Error('Missing Stripe API key');
  }

  try {
    // Fetch recent charges
    const chargesResponse = await fetch(
      'https://api.stripe.com/v1/charges?limit=100',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (!chargesResponse.ok) {
      throw new Error(`Stripe API failed: ${chargesResponse.statusText}`);
    }

    const chargesData = await chargesResponse.json();
    const charges = chargesData.data || [];

    // Sync successful charges as payments
    for (const charge of charges) {
      if (charge.status === 'succeeded') {
        const existingTransactions = await storage.getTransactions(integration.userId);
        const exists = existingTransactions.some(t => 
          t.source === 'stripe' && t.description?.includes(charge.id)
        );

        if (!exists) {
          await storage.createTransaction({
            userId: integration.userId,
            type: 'payment',
            amount: charge.amount, // Already in cents
            description: `Stripe payment ${charge.id} - ${charge.description || 'Payment received'}`,
            category: 'payment',
            source: 'stripe'
          });
        }
      }
    }

    // Fetch customers (for future use)
    const customersResponse = await fetch(
      'https://api.stripe.com/v1/customers?limit=100',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    let customerCount = 0;
    if (customersResponse.ok) {
      const customersData = await customersResponse.json();
      customerCount = customersData.data?.length || 0;
    }

    await storage.updateIntegration(integration.id, { 
      lastSynced: new Date()
    });

    return { success: true, charges: charges.length, customers: customerCount };
  } catch (error) {
    console.error('Stripe sync error:', error);
    // Integration error logged
    throw error;
  }
}

// PayPal Integration
export async function syncPayPalData(integration: Integration) {
  if (!integration.credentials) {
    throw new Error('No credentials found for PayPal integration');
  }

  const credentials = decryptCredentials(integration.credentials);
  const { clientId, clientSecret } = credentials;

  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal credentials');
  }

  try {
    // Get OAuth token
    const tokenResponse = await fetch(
      'https://api-m.paypal.com/v1/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      }
    );

    if (!tokenResponse.ok) {
      throw new Error(`PayPal auth failed: ${tokenResponse.statusText}`);
    }

    const { access_token } = await tokenResponse.json();

    // Fetch transactions from last 30 days
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const transactionsResponse = await fetch(
      `https://api-m.paypal.com/v1/reporting/transactions?start_date=${startDate}&end_date=${endDate}&fields=all`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!transactionsResponse.ok) {
      throw new Error(`PayPal API failed: ${transactionsResponse.statusText}`);
    }

    const transactionsData = await transactionsResponse.json();
    const transactions = transactionsData.transaction_details || [];

    // Sync transactions
    for (const ppTxn of transactions) {
      if (ppTxn.transaction_info?.transaction_status === 'S') { // Success
        const existingTransactions = await storage.getTransactions(integration.userId);
        const exists = existingTransactions.some(t => 
          t.source === 'paypal' && t.description?.includes(ppTxn.transaction_info.transaction_id)
        );

        if (!exists) {
          const amount = parseFloat(ppTxn.transaction_info.transaction_amount.value) * 100;
          
          await storage.createTransaction({
            userId: integration.userId,
            type: 'payment',
            amount: Math.round(Math.abs(amount)),
            description: `PayPal ${ppTxn.transaction_info.transaction_id} - ${ppTxn.payer_info?.payer_name?.alternate_full_name || 'Payment'}`,
            category: 'payment',
            source: 'paypal'
          });
        }
      }
    }

    await storage.updateIntegration(integration.id, { 
      lastSynced: new Date()
    });

    return { success: true, transactions: transactions.length };
  } catch (error) {
    console.error('PayPal sync error:', error);
    // Integration error logged
    throw error;
  }
}

// Asana Integration
export async function syncAsanaData(integration: Integration) {
  if (!integration.credentials) {
    throw new Error('No credentials found for Asana integration');
  }

  const credentials = decryptCredentials(integration.credentials);
  const { accessToken } = credentials;

  if (!accessToken) {
    throw new Error('Missing Asana access token');
  }

  try {
    // Fetch user's workspaces
    const workspacesResponse = await fetch(
      'https://app.asana.com/api/1.0/workspaces',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!workspacesResponse.ok) {
      throw new Error(`Asana API failed: ${workspacesResponse.statusText}`);
    }

    const workspacesData = await workspacesResponse.json();
    const workspaces = workspacesData.data || [];

    let taskCount = 0;

    // Fetch tasks from each workspace
    for (const workspace of workspaces) {
      const tasksResponse = await fetch(
        `https://app.asana.com/api/1.0/tasks?workspace=${workspace.gid}&assignee=me&completed_since=now&opt_fields=name,completed,due_on,notes`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        const tasks = tasksData.data || [];

        // Create tasks in our system
        for (const asanaTask of tasks) {
          const existingTasks = await storage.getTasks(integration.userId);
          const exists = existingTasks.some(t => 
            t.description?.includes(`Asana:${asanaTask.gid}`)
          );

          if (!exists && !asanaTask.completed) {
            await storage.createTask({
              userId: integration.userId,
              type: 'task',
              title: asanaTask.name,
              description: `Synced from Asana:${asanaTask.gid} - ${asanaTask.notes || 'No notes'}`,
              priority: asanaTask.due_on ? 'high' : 'medium',
              status: 'pending'
            });
            taskCount++;
          }
        }
      }
    }

    await storage.updateIntegration(integration.id, { 
      lastSynced: new Date()
    });

    return { success: true, tasks: taskCount, workspaces: workspaces.length };
  } catch (error) {
    console.error('Asana sync error:', error);
    // Integration error logged
    throw error;
  }
}

// Monday.com Integration
export async function syncMondayData(integration: Integration) {
  if (!integration.credentials) {
    throw new Error('No credentials found for Monday.com integration');
  }

  const credentials = decryptCredentials(integration.credentials);
  const { apiKey } = credentials;

  if (!apiKey) {
    throw new Error('Missing Monday.com API key');
  }

  try {
    // GraphQL query to fetch boards and items
    const query = `
      query {
        boards(limit: 10) {
          id
          name
          items_page(limit: 50) {
            items {
              id
              name
              state
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`Monday.com API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const boards = data.data?.boards || [];

    let itemCount = 0;

    for (const board of boards) {
      const items = board.items_page?.items || [];

      for (const item of items) {
        if (item.state === 'active') {
          const existingTasks = await storage.getTasks(integration.userId);
          const exists = existingTasks.some(t => 
            t.description?.includes(`Monday:${item.id}`)
          );

          if (!exists) {
            await storage.createTask({
              userId: integration.userId,
              type: 'task',
              title: item.name,
              description: `Monday.com board: ${board.name} (ID:${item.id})`,
              priority: 'medium',
              status: 'pending'
            });
            itemCount++;
          }
        }
      }
    }

    await storage.updateIntegration(integration.id, { 
      lastSynced: new Date()
    });

    return { success: true, items: itemCount, boards: boards.length };
  } catch (error) {
    console.error('Monday.com sync error:', error);
    // Integration error logged
    throw error;
  }
}

// Xero Integration
export async function syncXeroData(integration: Integration) {
  if (!integration.credentials) {
    throw new Error('No credentials found for Xero integration');
  }

  const credentials = decryptCredentials(integration.credentials);
  const { clientId, clientSecret } = credentials;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Xero credentials');
  }

  try {
    // Note: Xero requires OAuth2 flow with refresh tokens
    // This is a simplified implementation
    
    // In production, you'd exchange refresh token for access token here
    // For now, we'll throw an error indicating OAuth setup is needed
    
    throw new Error('Xero requires OAuth2 setup. Please contact support for configuration.');

    // Example implementation (would need proper OAuth):
    // const invoicesResponse = await fetch(
    //   'https://api.xero.com/api.xro/2.0/Invoices',
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${access_token}`,
    //       'xero-tenant-id': tenantId,
    //       'Accept': 'application/json'
    //     }
    //   }
    // );

  } catch (error) {
    console.error('Xero sync error:', error);
    // Integration error logged
    throw error;
  }
}

// Main sync function dispatcher
export async function syncIntegration(integration: Integration) {
  console.log(`🔄 Syncing ${integration.platform} for user ${integration.userId}`);

  switch (integration.platform.toLowerCase()) {
    case 'quickbooks':
      return await syncQuickBooksData(integration);
    case 'stripe':
      return await syncStripeData(integration);
    case 'paypal':
      return await syncPayPalData(integration);
    case 'asana':
      return await syncAsanaData(integration);
    case 'monday':
      return await syncMondayData(integration);
    case 'xero':
      return await syncXeroData(integration);
    default:
      console.log(`⚠️  No sync handler for platform: ${integration.platform}`);
      return { success: false, message: 'Unsupported platform' };
  }
}
