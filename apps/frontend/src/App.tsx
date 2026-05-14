import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RiskBadge } from '@/components/core/RiskBadge';
import { RiskBar } from '@/components/core/RiskBar';
import { FlagsSummary } from '@/components/core/FlagsSummary';
import { TypePill } from '@/components/core/TypePill';
import { KPICard } from '@/components/core/KPICard';
import { PageShell } from '@/components/layout/PageShell';
import { TopNav } from '@/components/layout/TopNav';
import { OrgBanner } from '@/components/layout/OrgBanner';
import { ProtectedRoute } from '@/components/features/ProtectedRoute/ProtectedRoute';
import { LoginCallbackPage } from '@/pages/LoginCallbackPage';
import { useAuth } from '@/hooks/useAuth';

function HomePage() {
  const { user, logout } = useAuth();

  const navLinks = [
    { href: '/', label: 'Home', current: true },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/renewals', label: 'Renewals' },
    { href: '/settings', label: 'Settings' },
  ];

  const displayUser = user ? { name: user.name || user.email, email: user.email } : undefined;

  return (
    <PageShell
      header={
        <>
          <TopNav links={navLinks} user={displayUser} onSignOut={logout} />
          <OrgBanner
            orgName="Northwind Holdings Ltd"
            workspaceTag="Legal Operations · Contract Review Workspace"
          />
        </>
      }
    >
      <div className="space-y-xl">
        <header>
          <h1 className="text-ink text-4xl font-extrabold tracking-tighter">Good morning, {user?.name || 'User'}.</h1>
          <p className="text-ink-soft text-lg">Phase 3 — Authentication complete</p>
        </header>

        <section className="space-y-md">
          <h2 className="text-ink text-2xl font-bold">Portfolio overview</h2>
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
              <CardTitle>RiskBadge / RiskBar / FlagsSummary / TypePill</CardTitle>
            </CardHeader>
            <CardContent className="space-y-md">
              <div className="flex flex-wrap items-center gap-md">
                <RiskBadge score={85} />
                <RiskBadge score={55} />
                <RiskBadge score={20} />
                <RiskBadge score={85} size="lg" />
              </div>
              <div className="space-y-sm">
                <RiskBar score={85} />
                <RiskBar score={55} />
                <RiskBar score={20} />
              </div>
              <div className="space-y-sm">
                <FlagsSummary red={3} orange={5} green={12} />
                <FlagsSummary green={10} />
              </div>
              <div className="flex flex-wrap gap-sm">
                <TypePill type="vendor" />
                <TypePill type="license" />
                <TypePill type="partnership" />
                <TypePill type="customer" />
                <TypePill type="lease" />
                <TypePill type="nda" />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<LoginCallbackPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
