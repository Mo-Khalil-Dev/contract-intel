
// App v2 — dark mode routing + tweaks

const { useState, useEffect } = React;

const TWEAK_DEFAULTS_V2 = /*EDITMODE-BEGIN*/{
  "accentColor": "#3b82f6",
  "glowIntensity": 0.6,
  "cardRadius": 10,
  "compactMode": false
}/*EDITMODE-END*/;

function AppV2() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS_V2);
  const [screen, setScreen] = useState('dashboard');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  function handleSelect(id) { setSelectedContract(id); setScreen('detail'); }
  function handleBack()     { setSelectedContract(null); setScreen('dashboard'); }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif", background: D.bg }}>
      <SidebarV2
        active={screen === 'detail' ? 'dashboard' : screen}
        onNav={s => { setSelectedContract(null); setScreen(s); }}
      />

      {screen === 'dashboard' && <DashboardV2 onSelect={handleSelect} onUpload={() => setShowUpload(true)} />}
      {screen === 'detail'    && selectedContract && <ContractDetailV2 contractId={selectedContract} onBack={handleBack} onNav={id => setSelectedContract(id)} />}
      {screen === 'portfolio' && <PortfolioV2 onSelectContract={handleSelect} />}
      {screen === 'calendar'  && <RenewalCalendarV2 />}
      {screen === 'templates' && <TemplatesV2 />}
      {screen === 'settings'  && <SettingsV2 />}

      {showUpload && <UploadModalV2 onClose={() => setShowUpload(false)} />}

      <TweaksPanel>
        <TweakSection label="Brand">
          <TweakColor label="Accent Color" value={tweaks.accentColor} onChange={v => setTweak('accentColor', v)} />
        </TweakSection>
        <TweakSection label="Visual">
          <TweakSlider label="Glow Intensity" value={tweaks.glowIntensity} min={0} max={1} step={0.1} onChange={v => setTweak('glowIntensity', v)} />
          <TweakSlider label="Card Radius" value={tweaks.cardRadius} min={0} max={20} step={2} onChange={v => setTweak('cardRadius', v)} />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakToggle label="Compact Mode" value={tweaks.compactMode} onChange={v => setTweak('compactMode', v)} />
        </TweakSection>
      </TweaksPanel>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${D.bg}; }
        ::-webkit-scrollbar-thumb { background: ${D.border2}; border-radius: 3px; }
        input, select, textarea { outline: none; }
        input:focus, select:focus { border-color: ${D.accent} !important; box-shadow: 0 0 0 2px ${D.accentGlow}; }
      `}</style>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppV2 />);
