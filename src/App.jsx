import { useState, useCallback } from 'react';
import { DataProvider } from './context/DataContext';
import { FilterProvider } from './context/FilterContext';
import GlobeVisualization from './components/GlobeVisualization';
import TopBar from './components/TopBar';
import SearchAndFilters from './components/SearchAndFilters';
import LeftSidebar from './components/LeftSidebar';
import BottomPanels from './components/BottomPanels';
import TimelineControls from './components/TimelineControls';
import ModelDetailPanel from './components/ModelDetailPanel';
import ComparisonPanel from './components/ComparisonPanel';

function AppContent() {
  const [layers, setLayers] = useState({
    modelReleases: true,
    companyHQs: true,
    connectionArcs: true,
  });
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const handleToggleLayer = useCallback((key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSelectModel = useCallback((model) => {
    setSelectedModel(model);
    setSelectedCompany(null);
  }, []);

  const handleSelectCompany = useCallback((company) => {
    setSelectedCompany(company);
    setSelectedModel(null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedModel(null);
    setSelectedCompany(null);
  }, []);

  const selectedCompanyName =
    selectedCompany && typeof selectedCompany === 'object'
      ? selectedCompany.name
      : selectedCompany;

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0e1a] relative">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,217,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,217,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Globe */}
      <GlobeVisualization
        layers={layers}
        onSelectModel={handleSelectModel}
        onSelectCompany={handleSelectCompany}
        selectedCompany={selectedCompanyName}
      />

      {/* UI Overlays */}
      <TopBar />
      <SearchAndFilters />
      <LeftSidebar
        layers={layers}
        onToggleLayer={handleToggleLayer}
        selectedCompany={selectedCompanyName}
        onSelectCompany={(name) => {
          if (name === null) {
            handleCloseDetail();
          } else {
            handleSelectCompany(name);
          }
        }}
      />
      <TimelineControls />
      <BottomPanels />
      <ModelDetailPanel
        model={selectedModel}
        company={selectedCompany}
        onClose={handleCloseDetail}
      />
      <ComparisonPanel />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <FilterProvider>
        <AppContent />
      </FilterProvider>
    </DataProvider>
  );
}
