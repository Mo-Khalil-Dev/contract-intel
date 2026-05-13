// Main App — routing + tweaks

const { useState } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  accentColor: '#1d6fff',
  fontScale: 1,
  density: 'comfortable',
  showRiskBars: true,
}; /*EDITMODE-END*/

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState('dashboard');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showReport, setShowReport] = useState(false);

  function handleSelectContract(id) {
    setSelectedContract(id);
    setScreen('detail');
  }

  function handleBack() {
    setSelectedContract(null);
    setScreen('dashboard');
  }

  // Apply tweaks as CSS vars
  const appStyle = {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
    '--accent': tweaks.accentColor,
    '--font-scale': tweaks.fontScale,
    fontSize: `${13 * tweaks.fontScale}px`,
  };

  // Override T.blue with accent
  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accentColor);
  }, [tweaks.accentColor]);

  return (
    <div style={appStyle}>
      <Sidebar
        active={screen === 'detail' ? 'dashboard' : screen}
        onNav={(s) => {
          setSelectedContract(null);
          setScreen(s);
        }}
      />

      {screen === 'dashboard' && (
        <DashboardScreen onSelect={handleSelectContract} onUpload={() => setShowUpload(true)} />
      )}
      {screen === 'detail' && selectedContract && (
        <ContractDetailScreen
          contractId={selectedContract}
          onBack={handleBack}
          onNav={(id) => setSelectedContract(id)}
        />
      )}
      {screen === 'portfolio' && <PortfolioScreen onSelectContract={handleSelectContract} />}
      {screen === 'calendar' && <RenewalCalendarScreen />}
      {screen === 'templates' && <TemplatesScreen />}
      {screen === 'settings' && <SettingsScreen />}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}

      <TweaksPanel>
        <TweakSection label="Brand">
          <TweakColor
            label="Accent Color"
            value={tweaks.accentColor}
            onChange={(v) => setTweak('accentColor', v)}
          />
        </TweakSection>
        <TweakSection label="Typography">
          <TweakSlider
            label="Font Scale"
            value={tweaks.fontScale}
            min={0.85}
            max={1.2}
            step={0.05}
            onChange={(v) => setTweak('fontScale', v)}
          />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio
            label="Density"
            value={tweaks.density}
            options={['compact', 'comfortable']}
            onChange={(v) => setTweak('density', v)}
          />
          <TweakToggle
            label="Show Risk Bars"
            value={tweaks.showRiskBars}
            onChange={(v) => setTweak('showRiskBars', v)}
          />
        </TweakSection>
      </TweaksPanel>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f0f4f8; }
        ::-webkit-scrollbar-thumb { background: #c5cdd8; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9aa5b4; }
        input, select, textarea { outline: none; }
        input:focus, select:focus { border-color: ${tweaks.accentColor} !important; box-shadow: 0 0 0 2px ${tweaks.accentColor}22; }
        button:focus-visible { outline: 2px solid ${tweaks.accentColor}; outline-offset: 2px; }
      `}</style>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
