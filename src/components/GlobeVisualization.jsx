import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { companies, connections, modelReleases, COMPANY_COLORS } from '../data/mockData';

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
  const globeRef = useRef();
  const [globeReady, setGlobeReady] = useState(false);
  const [hoverPoint, setHoverPoint] = useState(null);
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

    setGlobeReady(true);
  }, []);

  const pointsData = useMemo(() => {
    if (!layers.companyHQs) return [];
    return companies.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      name: c.name,
      color: c.color,
      size: 0.4 + c.modelsCount * 0.12,
      id: c.id,
      altitude: 0.01,
      company: c,
    }));
  }, [layers.companyHQs]);

  const ringsData = useMemo(() => {
    if (!layers.companyHQs) return [];
    return companies.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      maxR: 3 + c.modelsCount * 0.5,
      propagationSpeed: 2,
      repeatPeriod: 1200,
      color: () => c.color,
    }));
  }, [layers.companyHQs]);

  const arcsData = useMemo(() => {
    if (!layers.connectionArcs) return [];
    if (selectedCompany) {
      return connections.filter((a) => a.company === selectedCompany);
    }
    return connections;
  }, [layers.connectionArcs, selectedCompany]);

  const labelsData = useMemo(() => {
    if (!layers.companyHQs) return [];
    return companies.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      text: c.name,
      color: c.color,
      size: 0.7,
      dotRadius: 0.4,
      company: c,
    }));
  }, [layers.companyHQs]);

  const modelMarkersData = useMemo(() => {
    if (!layers.modelReleases) return [];
    const grouped = {};
    modelReleases.forEach((m) => {
      const company = companies.find((c) => c.id === m.companyId);
      if (!company) return;
      if (!grouped[m.companyId]) {
        grouped[m.companyId] = {
          lat: company.lat + (Math.random() - 0.5) * 2,
          lng: company.lng + (Math.random() - 0.5) * 2,
          models: [],
          company,
        };
      }
      grouped[m.companyId].models.push(m);
    });
    return Object.values(grouped).flatMap((g) =>
      g.models.map((m, i) => {
        const angle = (i / g.models.length) * Math.PI * 2;
        const radius = 1.5 + i * 0.3;
        return {
          lat: g.company.lat + Math.cos(angle) * radius,
          lng: g.company.lng + Math.sin(angle) * radius,
          name: m.name,
          color: g.company.color,
          altitude: 0.02 + i * 0.01,
          size: m.type === 'Reasoning' ? 0.6 : m.type === 'Multimodal' ? 0.5 : 0.4,
          model: m,
        };
      })
    );
  }, [layers.modelReleases]);

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

  const pointColor = useCallback((d) => d.color, []);
  const pointAlt = useCallback((d) => d.size * 0.15, []);
  const pointRadius = useCallback((d) => d.size, []);
  const pointLabel = useCallback(
    (d) =>
      `<div style="background:rgba(10,14,26,0.9);border:1px solid ${d.color};padding:8px 12px;border-radius:6px;font-family:monospace;color:#e2e8f0;font-size:12px;">
        <div style="color:${d.color};font-weight:bold;margin-bottom:4px;">${d.name}</div>
        <div>${d.company?.hq || ''}</div>
        <div style="color:#94a3b8;font-size:11px;">${d.company?.modelsCount || 0} models released</div>
      </div>`,
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

  const hexBinColor = useCallback((d) => d.color || '#00d9ff', []);
  const hexLabel = useCallback(
    (d) => {
      if (!d.model) return '';
      const m = d.model;
      return `<div style="background:rgba(10,14,26,0.95);border:1px solid ${d.color};padding:10px 14px;border-radius:8px;font-family:monospace;color:#e2e8f0;font-size:12px;max-width:250px;">
        <div style="color:${d.color};font-weight:bold;font-size:13px;margin-bottom:6px;">${m.name}</div>
        <div style="margin-bottom:3px;">Company: ${m.company}</div>
        <div style="margin-bottom:3px;">Released: ${m.date}</div>
        <div style="margin-bottom:3px;">Parameters: ${m.parameters}</div>
        <div style="margin-bottom:3px;">Type: ${m.type}</div>
        <div style="color:#00d9ff;font-size:11px;margin-top:6px;">Click for details →</div>
      </div>`;
    },
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
        // Model markers as custom points (using second layer of points)
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
