# ADR 0012 — Ports named for the domain capability, not the technology

- **Status:** Accepted (supersedes the earlier `…Port`-suffixed naming)
- **Context:** Our first ports leaned technical (`MediaStoragePort`, `ContentSearchPort`,
  `DatabaseHealthPort`, `…Port` suffixes). In hexagonal/DDD, a port should express **what the
  application core requires** in the ubiquitous language; only the **adapter** names the technology.
- **Decision:**
  - **Port** (interface / abstract class) = the capability the core needs, in domain terms, **no
    `Port` suffix**: `ContentRepository` (DDD repository — kept), `CatalogueSearch`, `MediaLibrary`,
    `DatastoreHealthCheck`, `AppLogger`, `Tracer`, `RequestContext`.
  - **Adapter** = `<Technology><Capability>`: `DrizzleContentRepository`, `MeilisearchCatalogueSearch`,
    `S3MediaLibrary`, `DrizzleDatastoreHealthCheck`, `PinoAppLogger`, `OtelTracer`, `ClsRequestContext`.
  - **DI:** `{ provide: <PortClass>, useClass: <Adapter> }`; use-cases inject the port.
  - **Files** keep the `application/ports/*.port.ts` and `infrastructure/*.adapter.ts` role markers
    (a discovery aid — the *identifier* stays technology-free, the *filename* may mark its role).
- **Consequences:** the domain reads as intent; swapping technology never changes a port name. This is
  the standard for **all** new features, skills, and docs going forward. Reference: r/softwarearchitecture
  "I finally understood hexagonal architecture" discussion.
