# Historical agent architecture

The exhibition agent is local and deterministic. `exhibitionAnswerPack.js` contains allow-listed
questions, grounded answers and calls to narrow UI tools such as `getMapAtYear`,
`selectHistoricalEntity` and `showSources`. Free-form text cannot invoke a tool.

## Future server adapter

A future server function may accept a question, language and current public map state. It must:

1. authenticate the application and rate-limit the request;
2. remove instructions and markup from retrieved content;
3. search embeddings only across published Postgres rows and approved source passages;
4. apply temporal and spatial PostGIS filters;
5. return citations, confidence and a typed tool proposal;
6. validate that proposal against an allow-list before the client executes it.

The vector index should store chunks linked to immutable source and content-review IDs. Retrieval
must keep disputed interpretations separate and label them. Prompt injection in source text is
treated as data, never as an instruction. The model has no administrative tools, SQL access,
publishing rights or service-role credential.

Secrets belong only in a server environment (for example a Supabase Edge Function secret store).
The frontend sends no provider key. If the server is unavailable, rejected, insufficiently sourced
or uncertain, the client returns to the reviewed local answer pack. AI responses must never block
the core demonstration.
