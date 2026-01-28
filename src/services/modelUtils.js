// ---------------------------------------------------------------------------
// Model analytics utilities — velocity, trends, quality, filtering, sorting
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;

// -- Age helpers --
export function daysOld(createdAt) {
  if (!createdAt) return Infinity;
  return Math.max(0, (Date.now() - new Date(createdAt).getTime()) / DAY_MS);
}

export function ageLabel(createdAt) {
  const d = daysOld(createdAt);
  if (d < 1) return 'Today';
  if (d < 2) return 'Yesterday';
  if (d < 7) return `${Math.floor(d)}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function isNew(createdAt) {
  return daysOld(createdAt) < 7;
}

// -- Velocity: downloads per day since release --
export function velocity(model) {
  const days = Math.max(1, daysOld(model.createdAt));
  return (model.downloads || 0) / days;
}

export function velocityFormatted(model) {
  const v = velocity(model);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M/day`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K/day`;
  if (v >= 1) return `${Math.round(v)}/day`;
  return '<1/day';
}

// -- Quality score (composite) --
export function qualityScore(model) {
  let s = 0;
  s += Math.log10((model.downloads || 0) + 1) * 10;
  s += Math.log10((model.likes || 0) + 1) * 8;
  s += Math.min(velocity(model) / 100, 30);
  const age = daysOld(model.createdAt);
  if (age < 30) s += 15;
  else if (age < 90) s += 10;
  else if (age < 180) s += 5;
  return s;
}

// -- Activity level --
export function activityLevel(model) {
  const v = velocity(model);
  if (v > 10_000) return 'High';
  if (v > 500) return 'Medium';
  return 'Low';
}

// -- Parameter size bucket --
export function sizeBucket(model) {
  const p = model.parameters;
  if (!p || p === 'Unknown') return null;
  const numStr = p.replace(/[^0-9.]/g, '');
  const num = parseFloat(numStr);
  if (isNaN(num)) return null;
  const isB = p.includes('B');
  const isT = p.includes('T');
  const isM = p.includes('M') && !p.includes('MoE');
  let params;
  if (isT) params = num * 1000;
  else if (isB) params = num;
  else if (isM) params = num / 1000;
  else params = num;
  if (params < 1) return 'tiny';
  if (params < 7) return 'small';
  if (params < 13) return 'medium';
  if (params < 70) return 'large';
  return 'huge';
}

export const SIZE_LABELS = {
  tiny: '<1B',
  small: '1-7B',
  medium: '7-13B',
  large: '13-70B',
  huge: '70B+',
};

// -- Time range filter --
export function withinTimeRange(model, range) {
  if (range === 'all') return true;
  const days = daysOld(model.createdAt);
  const limits = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };
  return days <= (limits[range] || Infinity);
}

// -- Filtering --
export function filterModels(models, { search, timeRange, filters }) {
  let result = models;

  // Time range
  if (timeRange !== 'all') {
    result = result.filter((m) => withinTimeRange(m, timeRange));
  }

  // Search
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        (m.pipelineTag || '').toLowerCase().includes(q) ||
        (m.hfId || '').toLowerCase().includes(q) ||
        (m.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }

  // Type filter
  if (filters.type && filters.type.length > 0) {
    result = result.filter((m) => filters.type.includes(m.type));
  }

  // Size filter
  if (filters.size && filters.size.length > 0) {
    result = result.filter((m) => {
      const bucket = sizeBucket(m);
      return bucket && filters.size.includes(bucket);
    });
  }

  return result;
}

// -- Sorting --
export function sortModels(models, sortBy) {
  const sorted = [...models];
  switch (sortBy) {
    case 'trending':
      return sorted.sort((a, b) => velocity(b) - velocity(a));
    case 'recent':
      return sorted.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    case 'popular':
      return sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    case 'quality':
      return sorted.sort((a, b) => qualityScore(b) - qualityScore(a));
    case 'liked':
      return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    default:
      return sorted;
  }
}

// -- "What's New" grouping --
export function groupByRecency(models) {
  const now = Date.now();
  const today = [];
  const yesterday = [];
  const thisWeek = [];
  const older = [];

  for (const m of models) {
    const d = daysOld(m.createdAt);
    if (d < 1) today.push(m);
    else if (d < 2) yesterday.push(m);
    else if (d < 7) thisWeek.push(m);
    else older.push(m);
  }

  return [
    { label: 'Today', models: today },
    { label: 'Yesterday', models: yesterday },
    { label: 'This Week', models: thisWeek },
    { label: 'Older', models: older },
  ].filter((g) => g.models.length > 0);
}

// -- Smart insights from real data --
export function computeInsights(models) {
  if (!models.length) return [];
  const sorted = [...models];

  const trending = sorted
    .sort((a, b) => velocity(b) - velocity(a))
    .slice(0, 3);

  const justReleased = sorted
    .filter((m) => daysOld(m.createdAt) < 2)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const favorites = sorted
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 3);

  const risingStar = sorted
    .filter((m) => daysOld(m.createdAt) < 30)
    .sort((a, b) => velocity(b) - velocity(a))
    .slice(0, 3);

  return [
    { key: 'trending', title: 'Trending Now', subtitle: 'Fastest download velocity', models: trending, icon: '↗' },
    { key: 'new', title: 'Just Released', subtitle: 'Last 48 hours', models: justReleased, icon: '✦' },
    { key: 'favorites', title: 'Community Favorites', subtitle: 'Most liked models', models: favorites, icon: '♥' },
    { key: 'rising', title: 'Rising Stars', subtitle: 'Fastest growing (<30d)', models: risingStar, icon: '★' },
  ].filter((g) => g.models.length > 0);
}
