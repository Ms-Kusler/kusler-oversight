import { Resend } from 'resend';
import { storage } from './storage';
import type { User } from '@shared/schema';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export async function sendWeeklyReport(userId: string, data: {
  cashIn: number;
  cashOut: number;
  availableCash: number;
  invoicesDue: number;
  overdueInvoices: number;
}) {
  const user = await storage.getUser(userId);
  if (!user || !user.email) {
    return;
  }
  
  const prefs = user.emailPreferences as any;
  if (prefs && !prefs.weeklyReports) {
    return;
  }

  const template = createWeeklyReportTemplate(user, data);
  
  try {
    await resend.emails.send({
      from: 'Kusler Oversight <noreply@kuslerconsulting.com>',
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    console.log(`✓ Weekly report sent to user ${user.username} (${user.id})`);
  } catch (error) {
    console.error(`✗ Failed to send weekly report to user ${user.username} (${user.id}):`, error);
  }
}

export async function sendLowCashAlert(userId: string, currentCash: number, threshold: number) {
  const user = await storage.getUser(userId);
  if (!user || !user.email) {
    return;
  }
  
  const prefs = user.emailPreferences as any;
  if (prefs && !prefs.lowCashAlerts) {
    return;
  }

  const template = createLowCashAlertTemplate(user, currentCash, threshold);
  
  try {
    await resend.emails.send({
      from: 'Kusler Oversight <alerts@kuslerconsulting.com>',
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    console.log(`✓ Low cash alert sent to user ${user.username} (${user.id})`);
  } catch (error) {
    console.error(`✗ Failed to send low cash alert to user ${user.username} (${user.id}):`, error);
  }
}

export async function sendOverdueInvoiceReminder(userId: string, invoices: Array<{
  client: string;
  amount: number;
  dueDate: Date;
}>) {
  const user = await storage.getUser(userId);
  if (!user || !user.email) {
    return;
  }
  
  const prefs = user.emailPreferences as any;
  if (prefs && !prefs.overdueInvoices) {
    return;
  }

  const template = createOverdueInvoiceTemplate(user, invoices);
  
  try {
    await resend.emails.send({
      from: 'Kusler Oversight <alerts@kuslerconsulting.com>',
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    console.log(`✓ Overdue invoice reminder sent to user ${user.username} (${user.id})`);
  } catch (error) {
    console.error(`✗ Failed to send overdue invoice reminder to user ${user.username} (${user.id}):`, error);
  }
}

export async function sendIntegrationFailureAlert(userId: string, platform: string) {
  const user = await storage.getUser(userId);
  if (!user || !user.email) {
    return;
  }
  
  const prefs = user.emailPreferences as any;
  if (prefs && !prefs.integrationFailures) {
    return;
  }

  const template = createIntegrationFailureTemplate(user, platform);
  
  try {
    await resend.emails.send({
      from: 'Kusler Oversight <alerts@kuslerconsulting.com>',
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    console.log(`✓ Integration failure alert sent to user ${user.username} (${user.id})`);
  } catch (error) {
    console.error(`✗ Failed to send integration failure alert to user ${user.username} (${user.id}):`, error);
  }
}

function createWeeklyReportTemplate(user: User, data: {
  cashIn: number;
  cashOut: number;
  availableCash: number;
  invoicesDue: number;
  overdueInvoices: number;
}): EmailTemplate {
  const businessName = user.businessName || user.username;
  
  return {
    subject: `Weekly Financial Summary - ${businessName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
    .metric { background: #f8fafc; border-left: 4px solid #0ea5e9; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .metric-label { font-size: 14px; color: #64748b; margin-bottom: 5px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #0f172a; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">📊 Weekly Financial Summary</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${businessName}</p>
    </div>
    
    <div class="metric">
      <div class="metric-label">Money In This Week</div>
      <div class="metric-value positive">$${(data.cashIn / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
    </div>
    
    <div class="metric">
      <div class="metric-label">Money Out This Week</div>
      <div class="metric-value negative">$${(data.cashOut / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
    </div>
    
    <div class="metric">
      <div class="metric-label">Available Cash</div>
      <div class="metric-value">$${(data.availableCash / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
    </div>
    
    <div class="metric">
      <div class="metric-label">Invoices Due</div>
      <div class="metric-value">${data.invoicesDue} invoice${data.invoicesDue !== 1 ? 's' : ''}</div>
    </div>
    
    ${data.overdueInvoices > 0 ? `
    <div class="metric" style="border-left-color: #ef4444;">
      <div class="metric-label">⚠️ Overdue Invoices</div>
      <div class="metric-value negative">${data.overdueInvoices} invoice${data.overdueInvoices !== 1 ? 's' : ''}</div>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>This is your automated weekly financial summary from Kusler Oversight.</p>
      <p>You can manage your email preferences in your dashboard settings.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Weekly Financial Summary - ${businessName}

Money In This Week: $${(data.cashIn / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Money Out This Week: $${(data.cashOut / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Available Cash: $${(data.availableCash / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Invoices Due: ${data.invoicesDue}
${data.overdueInvoices > 0 ? `⚠️ Overdue Invoices: ${data.overdueInvoices}\n` : ''}

This is your automated weekly financial summary from Kusler Oversight.
You can manage your email preferences in your dashboard settings.
    `.trim()
  };
}

function createLowCashAlertTemplate(user: User, currentCash: number, threshold: number): EmailTemplate {
  const businessName = user.businessName || user.username;
  
  return {
    subject: `⚠️ Low Cash Alert - ${businessName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 4px; margin: 20px 0; }
    .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ Low Cash Alert</h1>
    <p>Hi ${businessName},</p>
    
    <div class="alert">
      <h2 style="margin-top: 0; color: #dc2626;">Your cash balance is running low</h2>
      <p style="font-size: 18px; margin: 10px 0;"><strong>Current Balance: $${(currentCash / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></p>
      <p>This is below your alert threshold of $${(threshold / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}.</p>
    </div>
    
    <p>Consider taking action to improve your cash flow:</p>
    <ul>
      <li>Follow up on overdue invoices</li>
      <li>Review upcoming expenses</li>
      <li>Accelerate receivables where possible</li>
    </ul>
    
    <a href="#" class="button">View Dashboard</a>
    
    <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
      You're receiving this alert because you've enabled low cash notifications in Kusler Oversight.
    </p>
  </div>
</body>
</html>
    `,
    text: `
⚠️ Low Cash Alert

Hi ${businessName},

Your cash balance is running low:
Current Balance: $${(currentCash / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Alert Threshold: $${(threshold / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}

Consider taking action to improve your cash flow:
- Follow up on overdue invoices
- Review upcoming expenses
- Accelerate receivables where possible

You're receiving this alert because you've enabled low cash notifications in Kusler Oversight.
    `.trim()
  };
}

function createOverdueInvoiceTemplate(user: User, invoices: Array<{ client: string; amount: number; dueDate: Date }>): EmailTemplate {
  const businessName = user.businessName || user.username;
  const totalOverdue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  return {
    subject: `💰 ${invoices.length} Overdue Invoice${invoices.length !== 1 ? 's' : ''} - ${businessName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .invoice { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .total { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>💰 Overdue Invoice Reminder</h1>
    <p>Hi ${businessName},</p>
    <p>You have <strong>${invoices.length} overdue invoice${invoices.length !== 1 ? 's' : ''}</strong> that need attention:</p>
    
    ${invoices.map(inv => `
    <div class="invoice">
      <strong>${inv.client}</strong><br>
      <span style="color: #64748b;">Due: ${inv.dueDate.toLocaleDateString()}</span><br>
      <span style="font-size: 18px; font-weight: bold; color: #dc2626;">$${(inv.amount / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
    </div>
    `).join('')}
    
    <div class="total">
      <strong>Total Overdue: $${(totalOverdue / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
    </div>
    
    <p>Following up on these invoices can improve your cash flow.</p>
  </div>
</body>
</html>
    `,
    text: `
💰 Overdue Invoice Reminder

Hi ${businessName},

You have ${invoices.length} overdue invoice${invoices.length !== 1 ? 's' : ''} that need attention:

${invoices.map(inv => `${inv.client} - $${(inv.amount / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (Due: ${inv.dueDate.toLocaleDateString()})`).join('\n')}

Total Overdue: $${(totalOverdue / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}

Following up on these invoices can improve your cash flow.
    `.trim()
  };
}

function createIntegrationFailureTemplate(user: User, platform: string): EmailTemplate {
  const businessName = user.businessName || user.username;
  
  return {
    subject: `⚠️ Integration Issue: ${platform} - ${businessName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ Integration Connection Issue</h1>
    <p>Hi ${businessName},</p>
    
    <div class="alert">
      <h2 style="margin-top: 0; color: #dc2626;">Your ${platform} integration has disconnected</h2>
      <p>Kusler Oversight is unable to sync data from ${platform}. This may affect your financial reports and automation.</p>
    </div>
    
    <p><strong>What to do:</strong></p>
    <ol>
      <li>Log into your Kusler Oversight dashboard</li>
      <li>Go to Workflows → Connected Integrations</li>
      <li>Reconnect your ${platform} account</li>
    </ol>
    
    <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
      If you continue to experience issues, please contact support.
    </p>
  </div>
</body>
</html>
    `,
    text: `
⚠️ Integration Connection Issue

Hi ${businessName},

Your ${platform} integration has disconnected. Kusler Oversight is unable to sync data from ${platform}.

What to do:
1. Log into your Kusler Oversight dashboard
2. Go to Workflows → Connected Integrations  
3. Reconnect your ${platform} account

If you continue to experience issues, please contact support.
    `.trim()
  };
}
