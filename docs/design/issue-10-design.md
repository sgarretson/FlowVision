# Issue #10: AI sub-categorization design

- API: POST /api/issues/clusterize => [{label, issueIds[], rationale}]
- Model: use openAIService; cap tokens; cache per filter hash.
- UI: chips with rationale popover; Select all related; persist selection across filters.
- Analytics: issue.clusterize_used, issue.select_all_related.
- Audit: CLUSTERIZE_RUN logged.
