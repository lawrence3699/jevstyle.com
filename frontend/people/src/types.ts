export type Evidence = {text: string; url: string; kind: string; summary?: string; author_position?: string};
export type Affiliation = {name: string; kind: string; country: string; years: number[]};
export type AssessmentItem = {text: string; label: string; required: boolean; kind?: string; method?: string; value?: string | number | null};
export type Person = {
  id: string; name: string; role: string; affiliation: string; location: string;
  location_kind: string; source: string; url: string; company_domain: string;
  fetched_at: string; source_updated_at?: string; evidence: Evidence[];
  research_fields?: string[]; retrieval_query?: string; research_context_verified?: boolean;
  // Hydrated OpenAlex author record (source facts, not verified employment).
  publication_affiliation?: string; current_affiliation?: string; current_affiliation_kind?: string; current_affiliation_country?: string;
  affiliation_history?: Affiliation[]; topics?: string[]; works_count?: number | null; cited_by_count?: number | null; h_index?: number | null;
  first_year?: number | null; latest_year?: number | null; orcid?: string; openalex_url?: string; openalex_id?: string; sources?: string[];
  name_match?: {kind?: string; ambiguous?: boolean};
  evaluation?: {group: string; score: number | null; coverage: number; model: string; assessment_kind?: string; items: AssessmentItem[]} | null;
  contact?: {email: string; status: string; checked_at: string} | null;
  saved: boolean;
};
export type Links = {orcid: string; urls: {name: string; url: string}[]; emails: string[]; employment: {role: string; organization: string} | null; status: string};
export type Run = {
  id: string; kind: string; mode: string; state: string; stage: string; spec: any;
  profiles: Person[]; warnings: string[]; progress: number; maximum_micro: number;
  cost_micro: number; created_at: string; updated_at?: string; cancel_requested: boolean;
};
export type Translate = (english: string, chinese: string) => string;
