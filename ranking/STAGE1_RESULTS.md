# Stage 1 real-data run — 24 October 2026

Stage 1 completed successfully using the files already present in this checkout.
No Candidate ranking, null-model z-scores, scientific evaluation, jury, product
UI or docking code was implemented.

## Inputs and settings

- Mapping: `data/stream_a/string_id_map.json`, 2,808,992 bytes;
  releases `string-12.5` and `opentargets-26.09`.
  SHA-256: `3fd65c202d7b56b6b4814ef03b313ba9d28fe4b8c3145f9f5567b065e8831a67`.
- Links: `data/string/9606.protein.physical.links.full.v12.5.txt.gz`,
  9,617,451 compressed bytes; read directly from gzip.
  SHA-256: `6182e76caef148027491cf7f50c7cc41114aa4326d8a7d4fb31681099ff3eaea`.
- Filters: `combined_score >= 700` and direct `experiments >= 400`.
  Transferred experiments do not satisfy the direct-evidence threshold.
- Python 3.11.9, NumPy 2.4.6, SciPy 1.17.1; one process, 128 distance rows per
  chunk, `uint8` encoding with unreachable sentinel 255.

## Measured mapping and graph results

| Measurement | Result |
|---|---:|
| Mapping-release STRING proteins | 19,699 |
| Unambiguously mapped proteins | 19,212 (97.53%) |
| Unmapped proteins excluded | 487 |
| Ambiguous proteins in this release | 0 |
| Genes after protein-to-gene collapse | 19,199 |
| Genes with multiple mapped STRING proteins | 12 |
| Physical-link input rows | 1,296,490 |
| Rows passing both score filters | 235,718 |
| Passing rows excluded for mapping | 7,768 |
| Gene self-loop rows removed | 6 |
| Duplicate/reversed gene-edge rows removed | 113,975 |
| Unique undirected gene edges | 113,969 |
| Genes with at least one retained edge | 13,220 |
| Mapped genes isolated after filtering | 5,979 |
| Components, including isolated genes | 6,144 |
| Components containing edges | 165 |
| Largest component genes | 12,834 |
| Largest component edges | 113,713 |
| Genes outside the distance-table component | 6,365 |

The full graph intentionally retains all 19,199 mapped genes for coverage
reporting. The production distance table contains only the 12,834-gene largest
connected component. Its maximum finite distance is **13 hops**, with **zero
unreachable pairs**. No measured distance approaches the 254-hop encoding limit.

Among the 18,565 distinct proteins actually appearing in the physical-links file,
18,177 map to genes and 388 are unmapped. After score filtering, 13,263 of 13,493
participating proteins map to genes. These denominators differ from the full
mapping-release coverage above.

## Runtime and saved artifacts

Recorded build time was **31.405 seconds**: 2.211 seconds for input hashing,
loading and graph construction, and 28.929 seconds for shortest paths. The
remaining time includes saving and hashing artifacts. These timings exclude
Python environment installation and subsequent verification.

Bundle: `data/ranking/string-12.5-c700-e400/`.

| Artifact | Bytes |
|---|---:|
| `distances.npy` | 164,711,684 |
| `graph.npz` | 386,927 |
| `index.json` | 940,333 |
| `mapping_exclusions.json` | 18,998 |
| `manifest.json` | 65,290 |
| **Total** | **166,123,232** |

The distance table is about **157.08 MiB**; the complete bundle is about
**158.43 MiB**. The manifest records every artifact's checksum/size except its
own, along with input checksums, releases, filters, headers, software versions,
component sizes, coverage and timings. Input files and generated artifacts are
gitignored; none were staged or committed.

## Validation and missing information

- All **12 automated tests passed** on an artificial mapping and network. They
  cover duplicate/conflicting mappings, bad IDs, direct versus transferred
  evidence, duplicate/reversed edges, gene self-loops, isolates, disconnected
  paths, exact distances, integer overflow, saved-bundle reload, checksum
  failures, missing inputs and failed-build cleanup.
- Editable package installation succeeded. `python -m ranking inspect` verified
  checksums and reloaded the real graph, index and read-only memory-mapped matrix.
- Real-data checks passed for the entire matrix's symmetry, zero diagonal,
  absence of unreachable values and unit distance on every retained LCC edge.
  Four independent standard-library breadth-first searches matched all
  **51,336** corresponding saved distances. This verification took 0.806 seconds.
- `fixtures/README.md` was absent. The loader follows the downloaded mapping's
  inspected schema, documented in `ranking/README.md`.
- Original download URLs, extraction dates and licence notices were not included
  in the supplied files. Their absence is recorded in the manifest rather than
  filled with guessed metadata. This did not block the local build.
- Microsoft Store Python was inaccessible inside the execution sandbox. Tests
  and the real build succeeded using the project-local environment with approved
  execution outside the sandbox.

## Exact next step

Implement Candidate proximity against this saved LCC distance table, using the
existing `drug_targets.json` and Disease Target release schemas. First expose
retained/excluded Target coverage and raw mean-nearest distances for arbitrary
input Target sets; then add the separately specified degree-matched null model
in the next implementation stage. Stage 1 artifacts need no regeneration for
each Disease.
