
// App — Lloyds theme — PRINT version: stacks all screens, one per page

const { useState: useStatePrint } = React;

function PrintPage({ label, children }) {
  return (
    <section className="print-page" data-label={label}
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: W.bg,
        breakAfter: 'page',
        pageBreakAfter: 'always',
        breakInside: 'avoid',
      }}
    >
      <div style={{
        padding: '6px 16px',
        background: W.accent,
        color: '#fff',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>ContractIntel · Lloyds</span>
        <span>{label}</span>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        {children}
      </div>
    </section>
  );
}

function AppV4Print() {
  const { CONTRACTS } = window.APP_DATA;
  const firstId = CONTRACTS[0]?.id;
  // Hide tweaks panel in print
  const noop = () => {};

  return (
    <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, background: W.bg, color: W.ink }}>
      <PrintPage label="01 · Contracts">
        <ContractsScreen onSelect={noop} onUpload={noop} />
      </PrintPage>

      {firstId && (
        <PrintPage label="02 · Contract Detail">
          <ContractDetailScreen4 contractId={firstId} onBack={noop} onNav={noop} />
        </PrintPage>
      )}

      <PrintPage label="03 · Portfolio">
        <PortfolioScreen4 onSelectContract={noop} />
      </PrintPage>

      <PrintPage label="04 · Playbook">
        <PlaybookScreen4 onSelectContract={noop} />
      </PrintPage>

      <PrintPage label="05 · Renewals">
        <RenewalsScreen4 />
      </PrintPage>

      <PrintPage label="06 · Settings">
        <SettingsScreen4 />
      </PrintPage>

      <PrintPage label="07 · Upload">
        <UploadScreen4 onBack={noop} onDone={noop} />
      </PrintPage>

      <PrintPage label="08 · Processing">
        <ProcessingScreen4 files={[{ name: 'Acme Vendor Agreement 2024.pdf', size: 1457280 }]} onBack={noop} />
      </PrintPage>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        body { margin: 0; }
        html, body { background: ${W.bg}; }

        /* Stacked layout — no scroll containers */
        .print-page {
          page-break-after: always;
          break-after: page;
        }
        .print-page > div { overflow: visible !important; }
        .print-page * {
          overflow: visible !important;
          max-height: none !important;
        }

        /* Override anything trying to be 100vh or sticky */
        .print-page [style*="height: 100vh"],
        .print-page [style*="height:100vh"] { height: auto !important; min-height: 0 !important; }
        .print-page [style*="position: sticky"],
        .print-page [style*="position:sticky"] { position: static !important; }
        .print-page [style*="position: fixed"],
        .print-page [style*="position:fixed"] { position: static !important; }

        /* Print rules */
        @page {
          size: A3 landscape;
          margin: 0;
        }
        @media print {
          html, body {
            background: ${W.bg};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>
    </div>
  );
}

const rootPrint = ReactDOM.createRoot(document.getElementById('root'));
rootPrint.render(<AppV4Print />);
