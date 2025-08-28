// Define a type for search result items
type SearchResult = {
  id: string;
  title: string;
  snippet: string;
  url: string;
};

// Define the agent state type
interface ResearchAgentState {
  status: {
    phase:
      | "idle"
      | "initialized"
      | "gathering_information"
      | "analyzing_information"
      | "generating_report"
      | "completed";
    error: string | null;
    timestamp?: string;
  };
  e2b: {
    query: string;
    stage:
      | "not_started"
      | "searching"
      | "organizing_data"
      | "creating_detailed_report"
      | "outlining_report"
      | "drafting_executive_summary"
      | "writing_introduction"
      | "compiling_key_findings"
      | "developing_analysis"
      | "forming_conclusions"
      | "finalizing_report"
      | "report_complete";
    sources_found: number;
    sources?: SearchResult[];
    completed: boolean;
  };
  processing: {
    progress: number;
    report: string | null;
    completed: boolean;
    inProgress: boolean;
  };
  ui: {
    showSources: boolean;
    showProgress: boolean;
    activeTab: string;
  };
}

export type { ResearchAgentState };
