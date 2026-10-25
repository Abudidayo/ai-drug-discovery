cases.json lists the 14 frozen Disease IDs in protocol selection order; targets/ contains byte-identical copies of their 50-Target evidence_only files.
references.json contains all 293 exact approval.disease_ids pairs from pinned A2, with regulator-source metadata, release versions, source checksum and explicit FDA override inventory (both overrides are outside this cohort). These are source-record labels, not independently verified clinical indication truth.
protocol.md, protocol_frozen.json and replication.preregistered.json are unchanged copies of the published protocol and freezes. The drug release is ../../data/drug_targets.json; its checksum matches the replication freeze. Its legacy sidecar checksum is stale.
implementation.local.json seals the current read-only Zaid code and local dependencies. It passes verify, but was made during this export after published labels were accessible. Zaid’s original pre-label seal is absent; its timing and hash equivalence could not be verified. This comparison is descriptive and is not prescribed by the published fixed-panel protocol.
Validation: 7 passed, 0 failed. validate_inputs.py runs seven offline checks with Zaid’s own loaders, without scoring or running compare. manifest.json records source paths, hashes, counts, limitations and all bundle-file hashes except itself.

Run checks from w17:
```sh
PYTHONDONTWRITEBYTECODE=1 ../zaid-ro/ranking/.venv/bin/python -B results/shortlist_comparison_inputs/validate_inputs.py
```

Exact comparison command from /Users/jessicamak/oxhack-workers/zaid-ro (prepared only; not run):
```sh
PYTHONDONTWRITEBYTECODE=1 ranking/.venv/bin/python -B -m ranking.shortlist_comparison compare \
  --seal ../w17/results/shortlist_comparison_inputs/implementation.local.json \
  --cases ../w17/results/shortlist_comparison_inputs/cases.json \
  --targets-dir ../w17/results/shortlist_comparison_inputs/targets \
  --references ../w17/results/shortlist_comparison_inputs/references.json \
  --protocol ../w17/results/shortlist_comparison_inputs/protocol.md \
  --drugs ../w17/data/drug_targets.json \
  --artifacts ../w17/data/a6/stage1 \
  --out ../w17/data/shortlist-comparison-v1/official-run-v1
```

SHA256 (paths below are relative to this bundle, except the drug release):
cases.json  890baa3632cc688cc06a536a8c0d2069ada57f8256146878c9b129520eca25b0
implementation.local.json  638cf1294bca3d29a1b73947cb2e9ae75cac355d4a4341d6b256f139ec727469
protocol.md  b6659a69f5e3474fc71b748e8f748e57fb9c598ca1824c80b182065f63b2b65a
protocol_frozen.json  9da4997116da64cd30acaedb14df2bd006cfd2f7442633cf980bb5df736d7b34
references.json  b8bbc09fb1d6fa3366627aaac9ac97dccc50db7964775c079d7ed994f60f8cbc
replication.preregistered.json  d57b11620952e87e9a64ead80b3054728fea6f0cb50038cf6085c51968cf6cf7
targets/targets-EFO_0803536.json  2fb69fc893f61861e9ff30f8886c64d2d0e476079ee7635c6c2c2b8e9f8be481
targets/targets-MONDO_0005041.json  fd5d1795e465b9f61aa3562994ea6b144b0b579a39c684aab37988e54d3f2b13
targets/targets-MONDO_0005086.json  3b473a57d5439fdc387d45fb70c2818eaac2a7bf41af3ceb72f360a8d4b1be9a
targets/targets-MONDO_0005109.json  f04c1d5f82753e9378585610df93adce385eb844fcd720990f4a6808e57ef8b2
targets/targets-MONDO_0005133.json  44eb9d2284cd24f37d12da6dcc7d54a58cd321cc8ec32e8c78095a56d2e0b9bc
targets/targets-MONDO_0005147.json  dc4c12cf1e2818bd8304831e50826e46f854bb357d3447f8f87f7ad60b999c37
targets/targets-MONDO_0005252.json  111e27af02384ff8b30a67dced83951bb40d85ae36d982d5d2b3da7f8ff887ad
targets/targets-MONDO_0005277.json  e60a77c1b2eec0837dc44b0bb10c66a874b7b5f72e9180789de57776d2caa9ee
targets/targets-MONDO_0005393.json  72524894f06f9ad99b0470498e011cc8a80697a2613f5ee57c2a9641ced52bca
targets/targets-MONDO_0006624.json  2e2371925c9c715946ac596d1db224fa005e21566a2857a0da7bc81fd667b7ed
targets/targets-MONDO_0007915.json  a1216d8944ddc90bb734b0f9f18e19f6e9344d033aff410980597d5a0f04bc38
targets/targets-MONDO_0011438.json  4d8fc7e259628ca5dce5a2a4dfe503e5d98a00e026f81abd6b90f7ea1396d593
targets/targets-MONDO_0011786.json  c00f66a0b72518fc7abf87b26137e1f41bee6d168c53d62192c52f94823af5f2
targets/targets-MONDO_0015924.json  e65f6c408e6602ef6096ae10ab3da1da2a7f33e3ea305629d712b0513a7acbb8
validate_inputs.py  6552f9e379876062484582b1196189665ab63b5a30cca795cc24abce5b5a8399
../../data/drug_targets.json  bf133936221f124ec77877fdfb8a23dc26dd1b14aeb11735ee71540668cd7d24
