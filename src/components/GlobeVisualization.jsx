import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';

const GLOBE_IMAGE_URL =
  '//unpkg.com/three-globe/example/img/earth-night.jpg';
const GLOBE_BUMP_URL =
  '//unpkg.com/three-globe/example/img/earth-topology.png';

const DIMMED_COLOR = '#334155'; // slate-700 gray for non-matching

export default function GlobeVisualization({
  layers,
  onSelectModel,
  onSelectCompany,
  selectedCompany,
}) {
  const { companies, connections, status } = useData();
  const { filteredModels, matchingCompanyIds, hasActiveFilters } = useFilters();
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const globe = globeRef.current;

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.4;
    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.1;
    globe.controls().minDistance = 150;
    globe.controls().maxDistance = 500;

    globe.pointOfView({ lat: 30, lng: -20, altitude: 2.5 }, 0);

    const scene = globe.scene();
    if (scene) {
      scene.background = new THREE.Color('#0a0e1a');
    }

    const renderer = globe.renderer();
    if (renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
    }
  }, []);

  // Helper: is this company matching the current filter?
  const isCompanyMatching = useCallback(
    (companyId) => {
      if (!matchingCompanyIds) return true; // null = no filter, all match
      return matchingCompanyIds.has(companyId);
    },
    [matchingCompanyIds]
  );

  // ---- Points: Company HQs (ALL companies, with matching flag) ----
  const pointsData = useMemo(() => {
    if (!layers.companyHQs || status !== 'ready') return [];
    return companies.map((c) => {
      const matching = isCompanyMatching(c.id);
      const baseSize = 0.4 + Math.min(c.modelsCount, 10) * 0.12;
      return {
        lat: c.lat,
        lng: c.lng,
        name: c.name,
        color: matching ? c.color : DIMMED_COLOR,
        originalColor: c.color,
        size: matching ? baseSize : baseSize * 0.5,
        id: c.id,
        altitude: 0.01,
        company: c,
        matching,
      };
    });
  }, [layers.companyHQs, companies, status, isCompanyMatching]);

  // ---- Rings: Pulse effect ONLY on matching HQs ----
  const ringsData = useMemo(() => {
    if (!layers.companyHQs || status !== 'ready') return [];
    return companies
      .filter((c) => isCompanyMatching(c.id))
      .map((c) => ({
        lat: c.lat,
        lng: c.lng,
        maxR: 3 + Math.min(c.modelsCount, 10) * 0.5,
        propagationSpeed: 2,
        repeatPeriod: 1200,
        color: () => c.color,
      }));
  }, [layers.companyHQs, companies, status, isCompanyMatching]);

  // ---- Arcs: Only between matching companies ----
  const arcsData = useMemo(() => {
    if (!layers.connectionArcs || status !== 'ready') return [];
    let arcs = connections;

    // Filter by selected company
    if (selectedCompany) {
      arcs = arcs.filter((a) => a.company === selectedCompany);
    }

    // If filters are active, only show arcs for matching companies
    if (matchingCompanyIds) {
      const matchingNames = new Set(
        companies.filter((c) => matchingCompanyIds.has(c.id)).map((c) => c.name)
      );
      arcs = arcs.filter((a) => matchingNames.has(a.company));
    }

    return arcs;
  }, [layers.connectionArcs, selectedCompany, connections, status, matchingCompanyIds, companies]);

  // ---- Model release markers (only filtered models) ----
  const modelMarkersData = useMemo(() => {
    if (!layers.modelReleases || status !== 'ready') return [];
    const grouped = {};
    filteredModels.forEach((m) => {
      const company = companies.find(
        (c) => c.name === m.company || c.id === m.companyId
      );
      if (!company) return;
      const key = company.name;
      if (!grouped[key]) {
        grouped[key] = { models: [], company };
      }
      grouped[key].models.push(m);
    });

    return Object.values(grouped).flatMap((g) =>
      g.models.map((m, i) => {
        const angle = (i / g.models.length) * Math.PI * 2;
        const radius = 1.5 + (i % 6) * 0.4;
        return {
          lat: g.company.lat + Math.cos(angle) * radius,
          lng: g.company.lng + Math.sin(angle) * radius,
          name: m.name,
          color: g.company.color,
          altitude: 0.02 + (i % 5) * 0.008,
          size: m.downloads > 1_000_000 ? 0.6 : m.downloads > 100_000 ? 0.5 : 0.4,
          model: m,
        };
      })
    );
  }, [layers.modelReleases, filteredModels, companies, status]);

  // ---- Click handlers ----
  const handlePointClick = useCallback(
    (point) => {
      if (point.company) {
        onSelectCompany(point.company);
        if (globeRef.current) {
          globeRef.current.pointOfView(
            { lat: point.lat, lng: point.lng, altitude: 1.8 },
            1000
          );
        }
      }
    },
    [onSelectCompany]
  );

  const handleHexClick = useCallback(
    (point) => {
      if (point.model) {
        onSelectModel(point.model);
        if (globeRef.current) {
          globeRef.current.pointOfView(
            { lat: point.lat, lng: point.lng, altitude: 1.5 },
            1000
          );
        }
      }
    },
    [onSelectModel]
  );

  // ---- Accessor callbacks (now filter-aware) ----
  const pointColor = useCallback((d) => d.color, []);
  const pointAlt = useCallback((d) => d.size * 0.15, []);
  const pointRadius = useCallback((d) => d.size, []);
  const pointLabel = useCallback(
    (d) => {
      // Non-matching companies: minimal label
      if (!d.matching) {
        return `<div style="background:rgba(10,14,26,0.7);border:1px solid #334155;padding:4px 8px;border-radius:4px;font-family:monospace;color:#64748b;font-size:11px;">
          ${d.name}
        </div>`;
      }
      // Matching companies: full rich label
      const dl = d.company?.totalDownloads;
      const dlStr = dl
        ? dl >= 1e9 ? `${(dl/1e9).toFixed(1)}B` : dl >= 1e6 ? `${(dl/1e6).toFixed(1)}M` : dl >= 1e3 ? `${(dl/1e3).toFixed(1)}K` : String(dl)
        : '0';
      return `<div style="background:rgba(10,14,26,0.9);border:1px solid ${d.originalColor};padding:8px 12px;border-radius:6px;font-family:monospace;color:#e2e8f0;font-size:12px;">
        <div style="color:${d.originalColor};font-weight:bold;margin-bottom:4px;">${d.name}</div>
        <div>${d.company?.hq || ''}</div>
        <div style="color:#94a3b8;font-size:11px;">${d.company?.modelsCount || 0} models · ${dlStr} downloads</div>
      </div>`;
    },
    []
  );

  const arcColor = useCallback((d) => [`${d.color}88`, `${d.color}ff`, `${d.color}88`], []);
  const arcStroke = useCallback(() => 0.4, []);
  const arcDashLength = useCallback(() => 0.4, []);
  const arcDashGap = useCallback(() => 0.2, []);
  const arcDashAnimateTime = useCallback(() => 2000 + Math.random() * 2000, []);
  const arcAltAutoScale = useCallback(() => 0.3, []);
  const arcLabel = useCallback(
    (d) =>
      `<div style="background:rgba(10,14,26,0.9);border:1px solid ${d.color};padding:6px 10px;border-radius:6px;font-family:monospace;color:#e2e8f0;font-size:11px;">
        <span style="color:${d.color};">${d.company}</span> ↔ ${d.center}
      </div>`,
    []
  );

  // Empty state check
  const showEmptyState = hasActiveFilters && filteredModels.length === 0 && status === 'ready';

  return (
    <div className="absolute inset-0">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={GLOBE_IMAGE_URL}
        bumpImageUrl={GLOBE_BUMP_URL}
        backgroundImageUrl=""
        backgroundColor="#0a0e1a"
        atmosphereColor={hasActiveFilters ? '#06b6d4' : '#00d9ff'}
        atmosphereAltitude={hasActiveFilters ? 0.25 : 0.2}
        showAtmosphere={true}
        animateIn={true}
        // Company HQ Points
        pointsData={pointsData}
        pointColor={pointColor}
        pointAltitude={pointAlt}
        pointRadius={pointRadius}
        pointLabel={pointLabel}
        onPointClick={handlePointClick}
        pointsMerge={false}
        // Pulse rings
        ringsData={ringsData}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor="color"
        // Connection arcs
        arcsData={arcsData}
        arcColor={arcColor}
        arcStroke={arcStroke}
        arcDashLength={arcDashLength}
        arcDashGap={arcDashGap}
        arcDashAnimateTime={arcDashAnimateTime}
        arcAltitudeAutoScale={arcAltAutoScale}
        arcLabel={arcLabel}
        // Model release markers
        htmlElementsData={modelMarkersData}
        htmlElement={(d) => {
          const el = document.createElement('div');
          el.style.width = '8px';
          el.style.height = '8px';
          el.style.borderRadius = '2px';
          el.style.background = d.color;
          el.style.boxShadow = `0 0 8px ${d.color}, 0 0 16px ${d.color}44`;
          el.style.cursor = 'pointer';
          el.style.transform = 'rotate(45deg)';
          el.title = d.name;
          el.addEventListener('click', () => handleHexClick(d));
          el.addEventListener('mouseenter', () => {
            el.style.width = '12px';
            el.style.height = '12px';
            el.style.boxShadow = `0 0 12px ${d.color}, 0 0 24px ${d.color}88`;
          });
          el.addEventListener('mouseleave', () => {
            el.style.width = '8px';
            el.style.height = '8px';
            el.style.boxShadow = `0 0 8px ${d.color}, 0 0 16px ${d.color}44`;
          });
          return el;
        }}
        htmlAltitude={(d) => d.altitude}
      />

      {/* FILTERED VIEW indicator overlay */}
      {hasActiveFilters && !showEmptyState && (
        <div className="absolute top-16 right-4 z-30 pointer-events-none">
          <div className="px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm">
            <span className="text-[10px] font-mono text-cyan-400 tracking-widest font-bold">FILTERED VIEW</span>
          </div>
        </div>
      )}

      {/* Globe glow ring when filtering */}
      {hasActiveFilters && (
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-full"
          style={{
            background: 'radial-gradient(circle at center, transparent 35%, rgba(6,182,212,0.04) 50%, transparent 65%)',
          }}
        />
      )}

      {/* Empty state overlay */}
      {showEmptyState && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="text-center pointer-events-auto">
            <div className="glass-panel rounded-xl p-8 max-w-sm border border-slate-700/50">
              <div className="text-4xl mb-3 opacity-40">
                <svg className="mx-auto" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-300 font-mono mb-1.5">No models match your filters</h3>
              <p className="text-xs text-slate-500 mb-4">Try clearing filters or adjusting your search criteria</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
