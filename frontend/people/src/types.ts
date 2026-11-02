export type Evidence = {text: string; url: string; kind: string};
export type Person = {
  id: string; name: string; role: string; affiliation: string; location: string;
  location_kind: string; source: string; url: string; company_domain: string;
  fetched_at: string; source_updated_at?: string; evidence: Evidence[];
  research_fields?: string[]; retrieval_query?: string; research_context_verified?: boolean;
  evaluation?: {group: string; score: number | null; coverage: number; model: string;
    items: {text: string; label: string; required: boolean; kind?: string; method?: string}[]} | null;
  contact?: {email: string; status: string; checked_at: string} | null;
  saved: boolean;
};
export type Run = {
  id: string; kind: string; mode: string; state: string; stage: string; spec: any;
  profiles: Person[]; warnings: string[]; progress: number; maximum_micro: number;
  cost_micro: number; created_at: string; updated_at?: string; cancel_requested: boolean;
};
export type Translate = (english: string, chinese: string) => string;
