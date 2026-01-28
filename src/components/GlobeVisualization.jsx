import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';

const GLOBE_IMAGE_URL =
  '//unpkg.com/three-globe/example/img/earth-night.jpg';
const GLOBE_BUMP_URL =
  '//unpkg.com/three-globe/example/img/earth-topology.png';

export default function GlobeVisualization({
  layers,
  onSelectModel,
  onSelectCompany,
  selectedCompany,
}) {
  const { companies, connections, status } = useData();
  const { filteredModels } = useFilters();
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

  // ---- Points: Company HQs ----
  const pointsData = useMemo(() => {
    if (!layers.companyHQs || status !== 'ready') return [];
    return companies.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      name: c.name,
      color: c.color,
      size: 0.4 + Math.min(c.modelsCount, 10) * 0.12,
      id: c.id,
      altitude: 0.01,
      company: c,
    }));
  }, [layers.companyHQs, companies, status]);

  // ---- Rings: Pulse effect on HQs ----
  const ringsData = useMemo(() => {
    if (!layers.companyHQs || status !== 'ready') return [];
    return companies.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      maxR: 3 + Math.min(c.modelsCount, 10) * 0.5,
      propagationSpeed: 2,
      repeatPeriod: 1200,
      color: () => c.color,
    }));
  }, [layers.companyHQs, companies, status]);

  // ---- Arcs: Company ↔ Research center ----
  const arcsData = useMemo(() => {
    if (!layers.connectionArcs || status !== 'ready') return [];
    if (selectedCompany) {
      return connections.filter((a) => a.company === selectedCompany);
    }
    return connections;
  }, [layers.connectionArcs, selectedCompany, connections, status]);

  // ---- Model release markers ----
  const modelMarkersData = useMemo(() => {
    if (!layers.filteredModels || status !== 'ready') return [];
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
  }, [layers.filteredModels, filteredModels, companies, status]);

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

  // ---- Accessor callbacks ----
  const pointColor = useCallback((d) => d.color, []);
  const pointAlt = useCallback((d) => d.size * 0.15, []);
  const pointRadius = useCallback((d) => d.size, []);
  const pointLabel = useCallback(
    (d) => {
      const dl = d.company?.totalDownloads;
      const dlStr = dl
        ? dl >= 1e9 ? `${(dl/1e9).toFixed(1)}B` : dl >= 1e6 ? `${(dl/1e6).toFixed(1)}M` : dl >= 1e3 ? `${(dl/1e3).toFixed(1)}K` : String(dl)
        : '0';
      return `<div style="background:rgba(10,14,26,0.9);border:1px solid ${d.color};padding:8px 12px;border-radius:6px;font-family:monospace;color:#e2e8f0;font-size:12px;">
        <div style="color:${d.color};font-weight:bold;margin-bottom:4px;">${d.name}</div>
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
        atmosphereColor="#00d9ff"
        atmosphereAltitude={0.2}
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
    </div>
  );
}
