import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function App() {
  return (
    <div className="bg-bg min-h-screen p-xl">
      <div className="mx-auto max-w-3xl space-y-xl">
        <header>
          <h1 className="text-ink text-4xl font-extrabold tracking-tighter">
            Contract Analysis Platform
          </h1>
          <p className="text-ink-soft text-lg">Phase 2 — Design System smoke test</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Shadcn UI primitives</CardTitle>
            <CardDescription>
              Themed by our design tokens. Buttons, inputs, badges, cards.
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

        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-sans text-base">DM Sans — body text uses this.</p>
            <p className="font-mono text-base">DM Mono — risk scores and numeric data use this.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
