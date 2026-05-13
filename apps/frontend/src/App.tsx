import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RiskBadge } from '@/components/core/RiskBadge';
import { RiskBar } from '@/components/core/RiskBar';
import { FlagsSummary } from '@/components/core/FlagsSummary';
import { TypePill } from '@/components/core/TypePill';
import { KPICard } from '@/components/core/KPICard';

function App() {
  return (
    <div className="bg-bg min-h-screen p-xl">
      <div className="mx-auto max-w-5xl space-y-xl">
        <header>
          <h1 className="text-ink text-4xl font-extrabold tracking-tighter">
            Contract Analysis Platform
          </h1>
          <p className="text-ink-soft text-lg">Phase 2 — Design System smoke test</p>
        </header>

        <section className="space-y-md">
          <h2 className="text-ink text-2xl font-bold">Shadcn UI primitives</h2>
          <Card>
            <CardHeader>
              <CardTitle>Buttons, badges, inputs, cards</CardTitle>
              <CardDescription>
                Themed by our design tokens via Tailwind v4 @theme block.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-md">
              <div className="flex flex-wrap gap-sm">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap gap-sm">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
              <Input placeholder="Type something..." />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-md">
          <h2 className="text-ink text-2xl font-bold">Domain components</h2>

          <Card>
            <CardHeader>
              <CardTitle>RiskBadge</CardTitle>
              <CardDescription>Numeric risk score with threshold-driven colour.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-md">
              <RiskBadge score={85} />
              <RiskBadge score={55} />
              <RiskBadge score={20} />
              <RiskBadge score={85} size="lg" />
              <RiskBadge score={55} size="lg" />
              <RiskBadge score={20} size="lg" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>RiskBar</CardTitle>
              <CardDescription>Horizontal progress with threshold colour.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-sm">
              <RiskBar score={85} />
              <RiskBar score={55} />
              <RiskBar score={20} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FlagsSummary</CardTitle>
              <CardDescription>Inline red / orange / green dot+count display.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-sm">
              <FlagsSummary red={3} orange={5} green={12} />
              <FlagsSummary red={1} orange={0} green={4} />
              <FlagsSummary green={10} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>TypePill</CardTitle>
              <CardDescription>Contract-type colour mapping.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-sm">
              <TypePill type="vendor" />
              <TypePill type="license" />
              <TypePill type="partnership" />
              <TypePill type="customer" />
              <TypePill type="lease" />
              <TypePill type="nda" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-md md:grid-cols-4">
            <KPICard
              label="Active Contracts"
              value={142}
              delta={{ direction: 'up', text: '+5 vs last week' }}
            />
            <KPICard
              label="Critical Flags"
              value={8}
              delta={{ direction: 'down', text: '-2 vs last week' }}
              hint="Across all portfolios"
            />
            <KPICard
              label="Urgent Renewals"
              value={12}
              delta={{ direction: 'flat', text: 'No change' }}
            />
            <KPICard
              label="Avg Risk Score"
              value={
                <span className="inline-flex items-center gap-2">
                  73 <RiskBadge score={73} />
                </span>
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
