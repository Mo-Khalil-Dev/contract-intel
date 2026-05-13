
// App v3 — document workspace routing

const { useState } = React;

const TWEAK_DEFAULTS_V3 = /*EDITMODE-BEGIN*/{
  "accentColor": "#0969da",
  "fontSize": 12,
  "sidebarWidth": 288
}/*EDITMODE-END*/;

function AppV3() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS_V3);
  const { CONTRACTS } = window.APP_DATA;
  const [section, setSection]       = useState('contracts');
  const [selectedId, setSelectedId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState(null);
  // screen: 'contracts' | 'upload' | 'processing' | 'portfolio' | 'calendar' | 'settings'
  const [screen, setScreen]         = useState('contracts');

  function handleNav(s) {
    setScreen(s); setSection(s);
    if (s !== 'contracts') setSelectedId(null);
  }
  function handleSelect(id) { setSelectedId(id); setScreen('contracts'); setSection('contracts'); }
  function handleUploadDone(files) { setUploadedFiles(files); setScreen('processing'); }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter',sans-serif", background:V.bg, fontSize:tweaks.fontSize }}>
      <IconRail active={section} onNav={handleNav} />

      {screen === 'upload' && (
        <UploadScreenV3
          onBack={() => setScreen('contracts')}
          onDone={handleUploadDone}
        />
      )}

      {screen === 'processing' && (
        <ProcessingScreenV3
          files={uploadedFiles}
          onBack={() => { setUploadedFiles(null); setScreen('contracts'); }}
        />
      )}

      {screen === 'contracts' && (
        <>
          <ContractListPanel
            contracts={CONTRACTS}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpload={() => setScreen('upload')}
          />
          {selectedId
            ? <ContractDetailV3 contractId={selectedId} />
            : <VEmpty />
          }
        </>
      )}

      {screen === 'portfolio' && <PortfolioV3 onSelectContract={handleSelect} />}
      {screen === 'calendar'  && <RenewalCalendarV3 />}
      {screen === 'playbook'  && <PlaybookScreen onSelectContract={handleSelect} />}
      {screen === 'settings'  && <SettingsV3 />}

      <TweaksPanel>
        <TweakSection label="Brand">
          <TweakColor label="Accent" value={tweaks.accentColor} onChange={v => setTweak('accentColor', v)} />
        </TweakSection>
        <TweakSection label="Typography">
          <TweakSlider label="Font Size" value={tweaks.fontSize} min={10} max={15} step={1} onChange={v => setTweak('fontSize', v)} />
        </TweakSection>
      </TweaksPanel>

      <style>{`
        * { box-sizing:border-box; }
        body { margin:0; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:#f6f8fa; }
        ::-webkit-scrollbar-thumb { background:#d0d7de; border-radius:3px; }
        input,select,textarea { outline:none; }
        input:focus { border-color:${V.accent} !important; }
        button:focus-visible { outline:2px solid ${V.accent}; outline-offset:2px; }
      `}</style>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppV3 />);
