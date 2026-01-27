import {
  ORG_TO_COMPANY,
  TRACKED_ORGS,
  COMPANY_COLORS,
  researchCenters,
} from '../data/companyMapping';

const HF_API = 'https://huggingface.co/api/models';
const CACHE_VERSION = 2; // bump to invalidate old caches
const CACHE_KEY = `hf_model_cache_v${CACHE_VERSION}`;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------
function getCache() {
  try {
    // Remove any legacy unversioned cache
    localStorage.removeItem('hf_model_cache');

    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch {
    // quota exceeded – ignore
  }
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem('hf_model_cache'); // legacy key
}

// ---------------------------------------------------------------------------
// Fetch models for a single org
// ---------------------------------------------------------------------------
async function fetchOrgModels(org) {
  const params = new URLSearchParams({
    author: org,
    sort: 'downloads',
    direction: '-1',
    limit: '30',
  });

  const res = await fetch(`${HF_API}?${params}`);
  if (!res.ok) {
    console.warn(`HF API error for ${org}: ${res.status}`);
    return [];
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Pick the "best" / most notable models per org
// ---------------------------------------------------------------------------
function scoreModel(m) {
  let score = 0;
  score += Math.log10((m.downloads || 0) + 1) * 10;
  score += Math.log10((m.likes || 0) + 1) * 5;
  // Prefer newer models
  if (m.createdAt) {
    const age = Date.now() - new Date(m.createdAt).getTime();
    const daysOld = age / (1000 * 60 * 60 * 24);
    if (daysOld < 90) score += 20;
    else if (daysOld < 180) score += 10;
    else if (daysOld < 365) score += 5;
  }
  return score;
}

function pickTopModels(models, maxPerOrg = 8) {
  return models
    .map((m) => ({ ...m, _score: scoreModel(m) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, maxPerOrg);
}

// ---------------------------------------------------------------------------
// Transform a raw HF model object into our app shape
// ---------------------------------------------------------------------------
function inferType(m) {
  const tags = m.tags || [];
  const pipe = m.pipeline_tag || '';
  if (pipe === 'text-to-image' || tags.includes('text-to-image')) return 'Image Gen';
  if (pipe === 'image-text-to-text' || tags.includes('image-text-to-text')) return 'Multimodal';
  if (pipe === 'automatic-speech-recognition') return 'Audio';
  if (pipe === 'text-generation' || pipe === 'text2text-generation') return 'LLM';
  if (pipe === 'feature-extraction') return 'Embeddings';
  return 'LLM';
}

function formatDownloads(n) {
  if (!n) return '0';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(iso) {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  return d.toISOString().split('T')[0];
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function transformModel(raw, orgKey) {
  const companyInfo = ORG_TO_COMPANY[orgKey];
  const companyName = companyInfo?.name || orgKey;
  const safeguards = raw.safetensors;
  let paramStr = 'Unknown';
  if (safeguards?.total) {
    const p = safeguards.total;
    if (p >= 1e12) paramStr = `${(p / 1e12).toFixed(1)}T`;
    else if (p >= 1e9) paramStr = `${(p / 1e9).toFixed(1)}B`;
    else if (p >= 1e6) paramStr = `${(p / 1e6).toFixed(0)}M`;
    else paramStr = String(p);
  }

  return {
    id: raw.id || raw.modelId,
    hfId: raw.id || raw.modelId,
    name: (raw.id || '').split('/').pop() || raw.modelId,
    company: companyName,
    companyId: companyInfo?.id || orgKey,
    date: formatDate(raw.createdAt),
    createdAt: raw.createdAt,
    lastModified: raw.lastModified,
    parameters: paramStr,
    type: inferType(raw),
    openSource: true,
    downloads: raw.downloads || 0,
    downloadsFormatted: formatDownloads(raw.downloads),
    likes: raw.likes || 0,
    tags: raw.tags || [],
    pipelineTag: raw.pipeline_tag || '',
    description: `${companyName} model with ${formatDownloads(raw.downloads)} downloads and ${raw.likes || 0} likes on Hugging Face.`,
    highlight: raw.downloads > 1_000_000
      ? `${formatDownloads(raw.downloads)} downloads`
      : raw.likes > 100
        ? `${raw.likes} community likes`
        : null,
  };
}

// ---------------------------------------------------------------------------
// Build derived data structures
// ---------------------------------------------------------------------------
function buildCompanies(modelsByOrg) {
  const companyMap = {};

  for (const [orgKey, models] of Object.entries(modelsByOrg)) {
    const info = ORG_TO_COMPANY[orgKey];
    if (!info) continue;
    const name = info.name;

    if (!companyMap[name]) {
      companyMap[name] = {
        id: info.id,
        name,
        hq: info.hq,
        lat: info.lat,
        lng: info.lng,
        color: COMPANY_COLORS[name] || '#00d9ff',
        modelsCount: 0,
        founded: info.founded,
        totalDownloads: 0,
        totalLikes: 0,
      };
    }
    companyMap[name].modelsCount += models.length;
    for (const m of models) {
      companyMap[name].totalDownloads += m.downloads || 0;
      companyMap[name].totalLikes += m.likes || 0;
    }
  }

  return Object.values(companyMap).sort(
    (a, b) => b.totalDownloads - a.totalDownloads
  );
}

function buildConnections(companies) {
  // Deterministic pseudo-random using company coordinates
  const arcs = [];
  for (const company of companies) {
    for (const center of researchCenters) {
      const dist = Math.sqrt(
        (company.lat - center.lat) ** 2 + (company.lng - center.lng) ** 2
      );
      // Use coordinates as a deterministic seed
      const seed =
        (Math.abs(company.lat * 1000) + Math.abs(center.lng * 1000)) % 100;
      if (dist > 10 && seed > 45) {
        arcs.push({
          startLat: company.lat,
          startLng: company.lng,
          endLat: center.lat,
          endLng: center.lng,
          color: company.color,
          company: company.name,
          center: center.name,
        });
      }
    }
  }
  return arcs;
}

function buildLiveUpdates(allModels) {
  return [...allModels]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20)
    .map((m) => ({
      time: timeAgo(m.createdAt),
      text: `${m.company} released ${m.name} — ${m.downloadsFormatted} downloads`,
      company: m.company,
    }));
}

// ---------------------------------------------------------------------------
// Main public function
// ---------------------------------------------------------------------------
export async function fetchAllData(onProgress) {
  // 1. Check cache
  const cached = getCache();
  if (cached) {
    return cached;
  }

  // 2. Fetch from HF API
  const modelsByOrg = {};
  const allModels = [];
  let completed = 0;

  // Fetch all orgs in parallel with small batches to avoid rate limits
  const batchSize = 4;
  for (let i = 0; i < TRACKED_ORGS.length; i += batchSize) {
    const batch = TRACKED_ORGS.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((org) => fetchOrgModels(org))
    );

    results.forEach((result, idx) => {
      const org = batch[idx];
      if (result.status === 'fulfilled' && result.value.length > 0) {
        const top = pickTopModels(result.value);
        const transformed = top.map((m) => transformModel(m, org));
        modelsByOrg[org] = transformed;
        allModels.push(...transformed);
      }
      completed++;
      onProgress?.(completed, TRACKED_ORGS.length);
    });

    // Small delay between batches to be polite to HF
    if (i + batchSize < TRACKED_ORGS.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // 3. Build derived structures
  const companies = buildCompanies(modelsByOrg);
  const connections = buildConnections(companies);
  const liveUpdates = buildLiveUpdates(allModels);

  const data = {
    companies,
    modelReleases: allModels.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ),
    connections,
    liveUpdates,
    modelsByOrg,
    fetchedAt: Date.now(),
  };

  // 4. Cache
  setCache(data);

  return data;
}

export { formatDownloads, timeAgo };
