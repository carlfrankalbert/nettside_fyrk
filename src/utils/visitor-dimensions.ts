/**
 * Aggregate visitor dimensions for /stats: country, network organisation,
 * device class and browser family, plus paths that hit the 404 page.
 *
 * Everything is derived server-side from the request (Cloudflare's `request.cf`
 * and the User-Agent header) and stored only as counts, never per visitor.
 * Nothing is read from or stored on the visitor's device.
 */

export interface AudienceData {
  countries: Record<string, number>;
  organizations: Record<string, number>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  /** Network name → its AS number. A property of the network, not the visitor */
  networkAsns: Record<string, number>;
}

/** The subset of Cloudflare's request.cf we use */
export interface RequestGeo {
  country?: string;
  asOrganization?: string;
  asn?: number;
}

export function emptyAudienceData(): AudienceData {
  return { countries: {}, organizations: {}, devices: {}, browsers: {}, networkAsns: {} };
}

export function classifyDevice(userAgent: string): string {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) return 'Nettbrett';
  if (/Mobi|iPhone|Android/i.test(userAgent)) return 'Mobil';
  return 'Desktop';
}

export function classifyBrowser(userAgent: string): string {
  if (/Edg(A|iOS)?\//.test(userAgent)) return 'Edge';
  if (/OPR\/|Opera/.test(userAgent)) return 'Opera';
  if (/SamsungBrowser/.test(userAgent)) return 'Samsung Internet';
  if (/Firefox|FxiOS/.test(userAgent)) return 'Firefox';
  if (/Chrome|CriOS/.test(userAgent)) return 'Chrome';
  if (/Safari/.test(userAgent)) return 'Safari';
  return 'Annet';
}

/** ISO 3166-1 alpha-2 only; drops Cloudflare's XX (unknown) and T1 (Tor) */
export function sanitizeCountry(value: string | undefined): string | undefined {
  if (!value || !/^[A-Z]{2}$/.test(value) || value === 'XX') return undefined;
  return value;
}

export function sanitizeOrganization(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[^\p{L}\p{N} .,&'()/-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 80);
  return cleaned || undefined;
}

export function sanitizeAsn(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value < 2 ** 32 ? value : undefined;
}

/**
 * Cloud, hosting, VPN and proxy networks: visits from these are almost always bots,
 * crawlers or link previews. Google Fiber is a residential ISP, so it is let through.
 */
const DATACENTER_PATTERN =
  /\b(amazon|aws|google(?! fiber)|microsoft|azure|digitalocean|hetzner|ovh|linode|akamai|oracle|alibaba|tencent|huawei cloud|contabo|scaleway|vultr|constant company|leaseweb|m247|cloudflare|datacamp|choopa|hostinger|ionos|upcloud|logicweb|hostwinds|colocrossing|psychz|quadranet|hosting|vps|data ?cent(er|re))\b|seedbox/i;

export function isDatacenterNetwork(organization: string): boolean {
  return DATACENTER_PATTERN.test(organization);
}

/** Path only (no query or fragment), limited to URL-safe characters */
export function sanitizeNotFoundPath(value: string | undefined): string | undefined {
  if (!value || !value.startsWith('/')) return undefined;
  const path = value.split(/[?#]/)[0].replace(/[^A-Za-z0-9/._~%-]/g, '').slice(0, 150);
  return path.length > 1 ? path : undefined;
}

/** The sanitized audience dimensions of one request */
export function audienceValues(geo: RequestGeo | undefined, userAgent: string) {
  return {
    country: sanitizeCountry(geo?.country),
    organization: sanitizeOrganization(geo?.asOrganization),
    asn: sanitizeAsn(geo?.asn),
    device: classifyDevice(userAgent),
    browser: classifyBrowser(userAgent),
  };
}
