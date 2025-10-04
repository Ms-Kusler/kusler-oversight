import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNav from "@/components/BottomNav";
import DebugPanel from "@/components/DebugPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, HelpCircle, MessageSquare } from "lucide-react";

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const faqs = [
    {
      category: "Getting Started",
      questions: [
        { q: "How do I connect my accounting software?", a: "Navigate to Workflows > Connected Integrations, then click 'Connect' next to your preferred accounting software (QuickBooks, Xero, etc.). Follow the OAuth flow to authorize access." },
        { q: "What data does Kusler Oversight track?", a: "Kusler Oversight tracks your cash flow, invoices, expenses, payment statuses, and generates automated reports. All data is synced in real-time from your connected apps." },
        { q: "How often is my data updated?", a: "Data syncs automatically every 15 minutes, or you can trigger a manual sync from any page. Real-time updates are pushed for critical events like payments received." },
      ]
    },
    {
      category: "Automation & Workflows",
      questions: [
        { q: "How do weekly email briefs work?", a: "Every Monday at 8 AM, Kusler Oversight compiles your financial data and sends a summary email including cash flow, upcoming bills, and action items. You can customize the schedule in Workflows settings." },
        { q: "Can I create custom workflows?", a: "Yes! Go to Workflows > New Workflow to create custom automation rules. You can set triggers (like low cash alerts) and actions (send email, create task, etc.)." },
        { q: "What happens if an integration fails?", a: "You'll receive an immediate notification. Kusler Oversight will attempt to reconnect automatically. If the issue persists, check Workflows > Connected Integrations for troubleshooting steps." },
      ]
    },
    {
      category: "Security & Data",
      questions: [
        { q: "Is my financial data secure?", a: "Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We run automated security scans every hour and never store your banking credentials - we use OAuth for all integrations." },
        { q: "Who can access my data?", a: "Only users you explicitly invite to your Kusler Oversight account. You can set role-based permissions (Owner, Manager, Viewer) to control access levels." },
        { q: "How long is data retained?", a: "Financial data is retained indefinitely while your account is active. You can export or delete your data at any time from Settings." },
      ]
    },
    {
      category: "Billing & Support",
      questions: [
        { q: "How does billing work?", a: "Kusler Oversight is billed monthly per business. Your subscription includes unlimited users, workflows, and data storage. See Settings > Billing for details." },
        { q: "Can I get help setting up?", a: "Absolutely! Click 'Request Developer Assistance' in the menu for priority support from Kusler Consulting. We offer onboarding calls and custom setup assistance." },
        { q: "What if I need a custom feature?", a: "Contact us via 'Request Developer Assistance' to discuss custom integrations or features. We work with clients to build tailored solutions." },
      ]
    }
  ];

  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          faq =>
            faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0)
    : faqs;

  return (
    <div className="min-h-screen pb-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute top-0 left-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '5s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <DashboardHeader companyName="Kusler Consulting" />
        
        <main className="px-4 space-y-5 pb-6 pt-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-foreground/90 mb-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Help & FAQ
            </h1>
            <p className="text-sm text-muted-foreground">Find answers to common questions</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 backdrop-blur-xl bg-card/60 border-border/50"
              data-testid="input-search-faq"
            />
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto p-4 backdrop-blur-xl bg-card/60 border-border/50 hover-elevate"
              onClick={() => console.log('Request assistance')}
              data-testid="button-request-assistance"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium">Request Developer Assistance</p>
                <p className="text-xs text-muted-foreground">Get help from Kusler Consulting</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-3 h-auto p-4 backdrop-blur-xl bg-card/60 border-border/50 hover-elevate"
              onClick={() => console.log('View tutorials')}
              data-testid="button-tutorials"
            >
              <div className="p-2 rounded-lg bg-chart-2/10">
                <HelpCircle className="w-5 h-5 text-chart-2" />
              </div>
              <div className="text-left">
                <p className="font-medium">Video Tutorials</p>
                <p className="text-xs text-muted-foreground">Watch step-by-step guides</p>
              </div>
            </Button>
          </div>

          {filteredFaqs.map((category, idx) => (
            <Card key={idx} className="backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
              <div className="p-4 sm:p-5 border-b border-border/50">
                <h2 className="font-semibold text-lg">{category.category}</h2>
              </div>
              <Accordion type="single" collapsible className="px-4 sm:px-5">
                {category.questions.map((faq, qIdx) => (
                  <AccordionItem key={qIdx} value={`${idx}-${qIdx}`} className="border-border/30">
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span className="font-medium text-sm">{faq.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          ))}

          {filteredFaqs.length === 0 && (
            <Card className="p-8 text-center backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              <Button 
                variant="ghost" 
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                Clear search
              </Button>
            </Card>
          )}
        </main>

        <BottomNav active="home" />
        <DebugPanel />
      </div>
    </div>
  );
}
