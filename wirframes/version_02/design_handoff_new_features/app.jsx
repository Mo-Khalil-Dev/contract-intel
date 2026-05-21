// ContractIntel Redesign — App Shell
const { useState } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layoutVariant": "table",
  "riskStyle": "accordion",
  "uploadStyle": "default",
  "accentColor": "#2563EB",
  "similarDemo": "auto",
  "searchDemo": "auto"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const initialScreen = (typeof window !== 'undefined' && window.__INITIAL_SCREEN) || 'home';
  const initialContractId = (typeof window !== 'undefined' && window.__INITIAL_CONTRACT_ID) || null;
  const initialFlagId = (typeof window !== 'undefined' && window.__INITIAL_FLAG_ID) || null;
  const [screen, setScreen] = useState(initialScreen);
  const [contractId, setContractId] = useState(initialContractId);
  const [flagId, setFlagId] = useState(initialFlagId);
  const [uploadedFiles, setUploadedFiles] = useState(null);

  function goTo(s, extra = {}) {
    setScreen(s);
    if (extra.contractId !== undefined) setContractId(extra.contractId);
    if (extra.flagId !== undefined) setFlagId(extra.flagId);
  }

  function handleNav(s) {
    if (s === 'home') goTo('home');
    else if (s === 'portfolio') goTo('portfolio');
    else if (s === 'compare') goTo('compare');
    else if (s === 'renewals') goTo('renewals');
    else if (s === 'settings') goTo('settings');
    else if (s === 'upload') goTo('upload');
    else goTo(s);
  }

  // Search-driven nav helpers
  const [searchInitial, setSearchInitial] = useState({ query: '', tab: 'contracts' });
  function navToSearchPage(query, tab) {
    setSearchInitial({ query: query || '', tab: tab || 'contracts' });
    goTo('search');
  }
  function openContractFromSearch(r) { goTo('results', { contractId: r.contract.id }); }
  function openClauseFromSearch(r)   { goTo('results', { contractId: r.contract.id }); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", background: T.bg }}>
      <TopNav screen={screen} onNav={handleNav}>
        <GlobalSearch
          onNavToSearchPage={navToSearchPage}
          onOpenContract={openContractFromSearch}
          onOpenClause={openClauseFromSearch}
          demoState={tweaks.searchDemo}
        />
      </TopNav>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {screen === 'home' && (
          <HomeScreen onNav={handleNav} />
        )}
        {screen === 'upload' && (
          <UploadScreen
            onBack={() => goTo('portfolio')}
            onDone={files => { setUploadedFiles(files); goTo('processing'); }}
            layoutVariant={tweaks.layoutVariant}
            uploadStyle={tweaks.uploadStyle}
          />
        )}
        {screen === 'processing' && (
          <ProcessingScreen
            files={uploadedFiles}
            onDone={() => { setContractId(1); goTo('results', { contractId: 1 }); }}
          />
        )}
        {screen === 'results' && contractId && (
          <ResultsScreen
            contractId={contractId}
            onBack={() => goTo('portfolio')}
            onDeepDive={fid => goTo('deepdive', { flagId: fid })}
            onExport={() => goTo('export')}
            onNav={id => goTo('results', { contractId: id })}
            riskStyle={tweaks.riskStyle}
            similarDemo={tweaks.similarDemo}
          />
        )}
        {screen === 'deepdive' && contractId && (
          <DeepDiveScreen
            contractId={contractId}
            flagId={flagId}
            onBack={() => goTo('results', { contractId })}
          />
        )}
        {screen === 'compare' && (
          <CompareScreen
            onSelectContract={id => goTo('results', { contractId: id })}
          />
        )}
        {screen === 'portfolio' && (
          <PortfolioScreen
            onSelect={id => goTo('results', { contractId: id })}
            onUpload={() => goTo('upload')}
            layoutVariant={tweaks.layoutVariant}
          />
        )}
        {screen === 'playbook' && (
          <PlaybookScreen
            onSelectContract={id => goTo('results', { contractId: id })}
          />
        )}
        {screen === 'export' && (
          <ExportScreen
            contractId={contractId}
            onBack={() => goTo('results', { contractId })}
          />
        )}
        {screen === 'renewals' && <RenewalsScreen />}
        {screen === 'settings' && <SettingsScreen />}
        {screen === 'search' && (
          <SearchPage
            initialQuery={searchInitial.query}
            initialTab={searchInitial.tab}
            onOpenContract={openContractFromSearch}
            onOpenClause={openClauseFromSearch}
            onBrowse={() => goTo('portfolio')}
          />
        )}
      </div>

      <TweaksPanel>
        <TweakSection label="Layout">
          <TweakRadio
            label="Contract list view"
            value={tweaks.layoutVariant}
            options={[{ value: 'table', label: 'Table' }, { value: 'card', label: 'Cards' }, { value: 'minimal', label: 'Minimal' }]}
            onChange={v => setTweak('layoutVariant', v)}
          />
          <TweakRadio
            label="Risk flag style"
            value={tweaks.riskStyle}
            options={[{ value: 'accordion', label: 'Accordion' }, { value: 'cards', label: 'Cards' }]}
            onChange={v => setTweak('riskStyle', v)}
          />
        </TweakSection>
        <TweakSection label="Upload flow">
          <TweakRadio
            label="Drop zone size"
            value={tweaks.uploadStyle}
            options={[{ value: 'default', label: 'Default' }, { value: 'simple', label: 'Large' }]}
            onChange={v => setTweak('uploadStyle', v)}
          />
        </TweakSection>
        <TweakSection label="Brand">
          <TweakColor label="Accent color" value={tweaks.accentColor} onChange={v => setTweak('accentColor', v)} />
        </TweakSection>
        <TweakSection label="Similar clauses (Results › Clauses tab)">
          <TweakSelect
            label="Drawer state"
            value={tweaks.similarDemo}
            options={[
              { value: 'auto',    label: 'Auto (real flow)' },
              { value: 'loading', label: 'Loading (skeleton)' },
              { value: 'empty',   label: 'Empty / no precedent' },
              { value: 'single',  label: 'Single result' },
              { value: 'active',  label: 'Comparison active' },
              { value: 'error',   label: 'Error' },
              { value: 'closed',  label: 'Closed' },
            ]}
            onChange={v => setTweak('similarDemo', v)}
          />
        </TweakSection>
        <TweakSection label="Search overlay">
          <TweakSelect
            label="Overlay state"
            value={tweaks.searchDemo}
            options={[
              { value: 'auto',    label: 'Auto (real flow)' },
              { value: 'idle',    label: 'Idle (suggested)' },
              { value: 'loading', label: 'Loading' },
              { value: 'loaded',  label: 'Loaded results' },
              { value: 'low',     label: 'Low confidence' },
              { value: 'empty',   label: 'No results' },
              { value: 'error',   label: 'Error' },
              { value: 'closed',  label: 'Closed' },
            ]}
            onChange={v => setTweak('searchDemo', v)}
          />
        </TweakSection>
        <TweakSection label="Quick nav">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'Home', s: 'home' },
              { label: 'Upload', s: 'upload' },
              { label: 'Processing', s: 'processing' },
              { label: 'Results (Contract 1)', s: 'results', extra: { contractId: 1 } },
              { label: 'Deep Dive (Flag 1)', s: 'deepdive', extra: { contractId: 1, flagId: 1 } },
              { label: 'Compare', s: 'compare' },
              { label: 'Portfolio', s: 'portfolio' },
              { label: 'Playbook', s: 'playbook' },
              { label: 'Export', s: 'export', extra: { contractId: 1 } },
              { label: 'Renewals', s: 'renewals' },
              { label: 'Settings', s: 'settings' },
              { label: 'Search', s: 'search' },
            ].map(item => (
              <button key={item.s + (item.extra?.contractId || '') + (item.extra?.flagId || '')}
                onClick={() => goTo(item.s, item.extra || {})}
                style={{
                  background: screen === item.s ? T.blueLight : 'transparent',
                  color: screen === item.s ? T.blue : T.inkSoft,
                  border: 'none', borderRadius: 5, padding: '5px 8px',
                  textAlign: 'left', cursor: 'pointer', fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: screen === item.s ? 600 : 400,
                }}>
                {item.label}
              </button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>

      <style>{`
        @keyframes ciPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.borderMid}; border-radius: 3px; }
        input, select, textarea { outline: none; }
        input:focus, select:focus { border-color: ${T.blue} !important; box-shadow: 0 0 0 3px ${T.blueLight}; }
        button:focus-visible { outline: 2px solid ${T.blue}; outline-offset: 2px; }
      `}</style>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
