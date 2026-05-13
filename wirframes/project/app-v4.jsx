// App v4 — Top nav routing

const { useState } = React;

const TWEAK_DEFAULTS_V4 = /*EDITMODE-BEGIN*/ {
  accentColor: '#2563eb',
  navColor: '#18181b',
  fontSize: 13,
}; /*EDITMODE-END*/

function AppV4() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS_V4);
  const { CONTRACTS } = window.APP_DATA;
  const [screen, setScreen] = useState('contracts');
  const [selectedId, setSelectedId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState(null);

  function handleNav(s) {
    setScreen(s);
    if (s !== 'contracts') setSelectedId(null);
  }

  function handleSelect(id) {
    setSelectedId(id);
    setScreen('detail');
  }

  const activeNav = [
    'contracts',
    'compare',
    'portfolio',
    'playbook',
    'renewals',
    'settings',
  ].includes(screen)
    ? screen
    : 'contracts';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "'Inter',sans-serif",
        fontSize: tweaks.fontSize,
        background: W.bg,
      }}
    >
      <TopNav active={activeNav} onNav={handleNav} />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {screen === 'contracts' && (
          <ContractsScreen onSelect={handleSelect} onUpload={() => setScreen('upload')} />
        )}
        {screen === 'compare' && <CompareScreen4 onSelectContract={handleSelect} />}
        {screen === 'detail' && selectedId && (
          <ContractDetailScreen4
            contractId={selectedId}
            onBack={() => {
              setSelectedId(null);
              setScreen('contracts');
            }}
            onNav={handleSelect}
          />
        )}
        {screen === 'portfolio' && <PortfolioScreen4 onSelectContract={handleSelect} />}
        {screen === 'playbook' && <PlaybookScreen4 onSelectContract={handleSelect} />}
        {screen === 'renewals' && <RenewalsScreen4 />}
        {screen === 'settings' && <SettingsScreen4 />}
        {screen === 'upload' && (
          <UploadScreen4
            onBack={() => setScreen('contracts')}
            onDone={(files) => {
              setUploadedFiles(files);
              setScreen('processing');
            }}
          />
        )}
        {screen === 'processing' && (
          <ProcessingScreen4
            files={uploadedFiles}
            onBack={() => {
              setUploadedFiles(null);
              setScreen('contracts');
            }}
          />
        )}
      </div>

      <TweaksPanel>
        <TweakSection label="Brand">
          <TweakColor
            label="Accent Color"
            value={tweaks.accentColor}
            onChange={(v) => setTweak('accentColor', v)}
          />
          <TweakColor
            label="Nav Color"
            value={tweaks.navColor}
            onChange={(v) => setTweak('navColor', v)}
          />
        </TweakSection>
        <TweakSection label="Typography">
          <TweakSlider
            label="Font Size"
            value={tweaks.fontSize}
            min={11}
            max={15}
            step={1}
            onChange={(v) => setTweak('fontSize', v)}
          />
        </TweakSection>
      </TweaksPanel>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing:border-box; }
        body { margin:0; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:#f4f4f5; }
        ::-webkit-scrollbar-thumb { background:#d4d4d8; border-radius:3px; }
        input,select,textarea { outline:none; font-family:inherit; }
        input:focus,select:focus { border-color:${W.accent} !important; box-shadow: 0 0 0 2px ${W.accentBg}; }
        button:focus-visible { outline:2px solid ${W.accent}; outline-offset:2px; }
      `}</style>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppV4 />);
