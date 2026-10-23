import { API_ENDPOINTS } from '../config/apiEndpoints';
import { apiGet } from './apiClient';

/** A help page summary as returned by the list endpoint (no content field). */
export interface HelpPageSummary {
  slug: string;
  title: string;
  updated_at?: string;
}

/** A single help page incl. its HTML content, rendered on demand. */
export interface HelpPageDetail extends HelpPageSummary {
  content: string;
}

/**
 * Fetch the titles of all help pages saved in the backend (admin edits them
 * under Help in the admin panel). Public endpoint, no auth needed.
 */
export const getHelpPages = async (): Promise<HelpPageSummary[]> => {
  const payload = await apiGet<{ success: boolean; data: HelpPageSummary[] }>(
    API_ENDPOINTS.helpPages.list(),
    { name: 'helpPages.list' },
  );
  return payload?.data ?? [];
};

/**
 * Fetch the full content of one help page by its slug. Returns null when the
 * page has never been edited yet.
 */
export const getHelpPage = async (
  slug: string,
): Promise<HelpPageDetail | null> => {
  const payload = await apiGet<{ success: boolean; data: HelpPageDetail | null }>(
    API_ENDPOINTS.helpPages.get(slug),
    { name: 'helpPages.get', params: { slug } },
  );
  return payload?.data ?? null;
};