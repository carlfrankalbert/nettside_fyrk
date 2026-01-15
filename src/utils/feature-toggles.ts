/**
 * Feature Toggle System
 *
 * Allows controlling feature visibility with three states:
 * - 'off': Feature is disabled for everyone
 * - 'beta': Feature is only visible to users with beta cookie
 * - 'on': Feature is visible to everyone
 */

export type FeatureStatus = 'off' | 'beta' | 'on';

export interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
}

export interface FeatureTogglesData {
  features: FeatureToggle[];
  updatedAt: string;
}

/** Key used for storing feature toggles in KV */
export const FEATURE_TOGGLES_KV_KEY = 'feature_toggles';

/** Cookie name for beta access */
export const BETA_COOKIE_NAME = 'fyrk_beta_access';

/** Cookie max age in seconds (30 days) */
export const BETA_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * Default feature definitions
 * Add new features here with their initial state
 */
export const DEFAULT_FEATURES: FeatureToggle[] = [
  {
    id: 'okr-sjekken',
    name: 'OKR-sjekken',
    description: 'AI-drevet verktøy for å vurdere kvaliteten på OKR-sett',
    status: 'on',
  },
  {
    id: 'konseptspeilet',
    name: 'Konseptspeilet',
    description: 'Refleksjonsverktøy for produktkonsepter – hjelper brukere å se antakelser og modenhet i idéer',
    status: 'on',
  },
  {
    id: 'antakelseskart',
    name: 'Antakelseskartet',
    description: 'Avdekker implisitte antakelser i produkt- og strategibeslutninger',
    status: 'on',
  },
  {
    id: 'beslutningslogg',
    name: 'Beslutningsloggen',
    description: 'Dokumenter beslutninger med klarhet – eksporter som Markdown',
    status: 'on',
  },
];

/**
 * Check if a user has beta access based on cookies
 */
export function hasBetaAccess(cookies: { get(name: string): { value: string } | undefined }): boolean {
  const betaCookie = cookies.get(BETA_COOKIE_NAME);
  return betaCookie?.value === 'true';
}

/**
 * Check if a specific feature is enabled for the current user
 */
export async function isFeatureEnabled(
  featureId: string,
  kv: KVNamespace | undefined,
  cookies: { get(name: string): { value: string } | undefined }
): Promise<boolean> {
  if (!kv) {
    return false;
  }

  const togglesData = await getFeatureToggles(kv);
  const feature = togglesData.features.find((f) => f.id === featureId);

  if (!feature) {
    return false;
  }

  switch (feature.status) {
    case 'on':
      return true;
    case 'beta':
      return hasBetaAccess(cookies);
    case 'off':
    default:
      return false;
  }
}

/**
 * Get all feature toggles from KV storage
 */
export async function getFeatureToggles(kv: KVNamespace): Promise<FeatureTogglesData> {
  const stored = await kv.get(FEATURE_TOGGLES_KV_KEY);

  if (stored) {
    try {
      const data = JSON.parse(stored) as FeatureTogglesData;
      // Merge with default features to ensure new features are included
      const mergedFeatures = mergeFeatures(data.features, DEFAULT_FEATURES);
      return {
        features: mergedFeatures,
        updatedAt: data.updatedAt,
      };
    } catch {
      // If parsing fails, return defaults
    }
  }

  return {
    features: DEFAULT_FEATURES,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Save feature toggles to KV storage
 */
export async function saveFeatureToggles(
  kv: KVNamespace,
  features: FeatureToggle[]
): Promise<void> {
  const data: FeatureTogglesData = {
    features,
    updatedAt: new Date().toISOString(),
  };
  await kv.put(FEATURE_TOGGLES_KV_KEY, JSON.stringify(data));
}

/**
 * Merge stored features with default features
 * - Keeps stored status for existing features
 * - Adds new features from defaults
 * - Removes features that are no longer in defaults
 */
function mergeFeatures(
  stored: FeatureToggle[],
  defaults: FeatureToggle[]
): FeatureToggle[] {
  const storedMap = new Map(stored.map((f) => [f.id, f]));

  return defaults.map((defaultFeature) => {
    const storedFeature = storedMap.get(defaultFeature.id);
    if (storedFeature) {
      // Keep stored status but update name/description from defaults
      return {
        ...defaultFeature,
        status: storedFeature.status,
      };
    }
    return defaultFeature;
  });
}
