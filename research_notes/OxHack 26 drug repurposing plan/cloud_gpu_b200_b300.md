# Should the team rent a top-end cloud GPU (B200/B300) for docking and co-folding at OxHack '26?

Research date: 24 Oct 2026, day 1 of the hackathon. Prices and stock were read live today from public APIs (RunPod GraphQL, the Vast.ai offer search and the Vultr API) and from provider pricing pages. No accounts were created and nothing was rented, so **nothing here was run on a real B200 or B300**. The compatibility conclusions come from build files, package metadata, NVIDIA support matrices and GitHub issues. This note builds on `sponsor_stack.md` (Vultr plans, MLH credit) and `docking_feasibility.md` (DGX Spark failures, DiffDock and Vina basics) without repeating them. **[UNVERIFIED]** marks claims I could not confirm from a primary source.

## Can a student team rent 1x B200 or B300 right now, from whom, at what price, and how quickly?

### Takeaway
Yes, but not from Vultr. Single B200s and B300s can be bought on demand with a card today:
- **RunPod:** B200 from $5.98/hr and B300 from $6.94/hr on Community Cloud. Stock is "Low", and there are European data centres.
- **Vast.ai:** one 1x B200 at $6.25/hr in Oregon, and a 1x B300 at $8.50/hr on a low-reliability UK host.
- **Modal:** per-second billing, equal to $6.25/hr for a B200 and $7.10/hr for a B300.
- **Lambda:** about $6.99/hr for a 1x B200.

Vultr and CoreWeave sell the B200 only as an 8-GPU node ($68 and $68.80/hr) and the B300 only through sales. Vultr's 8x B200 has no deployable location today. I did not measure time to first SSH with any provider.

### Cited Findings
**RunPod (live API, without a key)**
- B200 (180 GB) costs $7.99/hr on Secure Cloud and $5.98/hr on Community Cloud. B300 ("NVIDIA B300 SXM6 AC", 288 GB) costs $8.99/hr Secure and $6.94/hr Community. Asking for the lowest 1-GPU price (`gpuCount: 1`) returned $5.98 for the B200 and $6.94 for the B300, both with stockStatus "Low". — [RunPod GraphQL API](https://api.runpod.io/graphql)
- Comparison GPUs from the same query (Secure / Community, per hour):

  | GPU | Secure | Community | Stock |
  |---|---|---|---|
  | A40 48 GB | $0.59 | $0.35 | High |
  | L40S 48 GB | $1.09 | $0.79 | Medium |
  | A100 SXM 80 GB | $1.79 | $1.39 | — |
  | H100 SXM | $3.99 | $2.69 | High |
  | H200 SXM | $5.29 | $3.59 | — |
  | RTX PRO 6000 Blackwell 96 GB | $2.49 | $1.69 | — |
  | RTX 5090 | $1.19 | $0.69 | — |

  — [RunPod GraphQL API](https://api.runpod.io/graphql)
- **Stock by data centre.** The location field just says "Europe" for some, so countries are inferred from the IDs:
  - B200: EU-RO-1, US-CA-2, US-NC-2 and US-NE-1, all "Low".
  - B300: EU-NL-1, EUR-IS-1 and US-WA-2, all "Low".
  - A40: "High" in EU-SE-1.
  - L40S: "Low" in EU-NL-1 and EUR-IS-2.
  - None of the data centres listing these GPUs is in the UK.

  — [RunPod GraphQL API](https://api.runpod.io/graphql)
- The pricing page shows the same pod prices, plus serverless B200 at $8.64/hr and B300 at $10.65/hr. It describes pods as having "no commitments", uses per-second rates and mentions "30+ regions". No minimum deposit is stated. — [RunPod pricing](https://www.runpod.io/pricing)

**Vast.ai (live public offer search: on-demand, rentable, unrented)**
- **B200:** 10 offers (one 1x, one 2x, five 4x, three 8x). The only 1x was $6.25/hr in Oregon, US (driver 580.126.09, max CUDA 13.0, reliability 0.995). The others cost about $10.00–10.25/GPU-hr in the US and India. — [Vast.ai offers API](https://console.vast.ai/api/v0/bundles/)
- **B300:** 4 offers:
  - United Kingdom, 1x and 2x at $8.50/GPU-hr (driver 595.91.07, CUDA 13.2, reliability **0.607**).
  - Croatia, 1x and 2x at $9.94/GPU-hr (reliability 0.988).

  — [Vast.ai offers API](https://console.vast.ai/api/v0/bundles/)
- **Cheapest 1x comparison GPUs:** L40S $0.42/hr (DC, US), A40 $0.56/hr (Belgium, the only A40 offer), A100 SXM4 $0.41/hr, H100 SXM $2.40/hr, RTX 5090 $0.40/hr. — [Vast.ai offers API](https://console.vast.ai/api/v0/bundles/)

**Modal**
- **GPU prices:** B200 $0.001736/s and B300 $0.001972/s, which work out to $6.25/hr and $7.10/hr. Others: H200 $4.54/hr, H100 $3.95/hr, A100 80 GB $2.50/hr, L40S $1.95/hr, A10 $1.10/hr.
- **Billing:** by the second. The Starter plan includes $30/month of free credit and has no monthly fee.
- **Academic credits:** graduate students, labs and researchers can apply for up to $10k.
- **Regions:** choosing a region costs 1.15–1.75x base prices. No EU or UK region is named.

— [Modal pricing](https://modal.com/pricing)

**Lambda**
- The self-serve table lists the B200 SXM6 (180 GB) at $6.69 / $6.79 / $6.89 / $6.99 per GPU-hour. These appear to be the 8x / 4x / 2x / 1x sizes; the fetch tool matched the unlabelled tables to sizes by order and vCPU count, so that mapping is **[PARTLY VERIFIED]**. The page also lists H100 SXM at $3.99–$4.29, A100 40 GB at $1.99 and A6000 at $1.09. It gives no B300 price, regions or billing granularity. — [Lambda pricing](https://lambda.ai/pricing)

**Nebius**
- On-demand list prices: HGX B300 $9.50/GPU-hr, HGX B200 $8.50, H200 $5.40, H100 $4.50, L40S from $1.55. GB200 and GB300 are "Contact us".
- The page doesn't say whether 1-GPU B200 or B300 VMs exist.
- Individuals can pay by bank card through Stripe, with a $25 minimum first payment.

— [Nebius prices](https://nebius.com/prices)
- Nebius's UK B300 cluster (a first phase of 4,000 HGX B300s) is at Ark's Longcross Park in Surrey. It is aimed at business, academia, research and the public sector, and no single-GPU self-service is mentioned. — [DCD](https://www.datacenterdynamics.com/en/news/ai-cloud-nebius-deploys-nvidia-b300-gpu-cluster-in-uk/)

**Vultr and CoreWeave (8-GPU nodes only)**
- **Vultr today** (adds to the earlier note):
  - There is no single-GPU B200 or B300 plan, and no B300 plan in the API at all.
  - The only B200 is bare metal `vbm-256c-3072gb-8-b200-gpu` at $68/hr, with an empty location list.
  - Scanning every Vultr region's availability turned up only A16 and A40 Cloud GPU plans:
    - 1x A40 in London (lhr), Frankfurt (fra), Newark (ewr), Los Angeles (lax), Singapore (sgp) and Sydney (syd).
    - 4x A40 in Sydney.
  - L40S, GH200, A100, H100 and the AMD nodes list no locations.

  — [Vultr plans API](https://api.vultr.com/v2/plans?type=all&per_page=500); [Vultr bare-metal plans API](https://api.vultr.com/v2/plans-metal); [Vultr region availability API (lhr shown)](https://api.vultr.com/v2/regions/lhr/availability)
- **CoreWeave:**
  - HGX B200 comes only as an 8-GPU instance at $68.80/hr ($8.60/GPU-hr). HGX B300 and GB300 are "Contact sales".
  - Prices are the same in North America and Europe.
  - The only sign-up route described is sales ("Talk to an expert").
  - GB200 and GB300 instances are built from Superchips with Grace CPUs.

  — [CoreWeave pricing](https://www.coreweave.com/pricing)

**Aggregator-only (not confirmed on the provider's own page) [UNVERIFIED]**
- **Verda (formerly DataCrunch):**
  - 1x B200: $6.11/hr on demand ($2.14 spot) per one tracker.
  - B300: $7.50/hr per a RunPod comparison "verified 31 August 2026".
  - Conflict: a March 2026 DeployBase page lists $4.89 and $6.99.

  — [computeprices.com: Verda B200](https://computeprices.com/providers/verda/gpus/b200); [RunPod vs Verda](https://www.runpod.io/articles/comparison/runpod-vs-datacrunch-verda); [DeployBase](https://deploybase.ai/articles/verda-gpu-cloud-pricing-complete-guide-hr-for-every-gpu)
- **Hyperbolic:** B200 at $5.99/GPU-hr (updated 4 Aug 2026) per one tracker, versus $3.50/hr (Jul 2026) per another. The two conflict. — [computeprices.com: Hyperbolic](https://computeprices.com/providers/hyperbolic/gpus/b200); [CostBench](https://costbench.com/software/ai-gpu-cloud/hyperbolic/)
- **Shadeform:** only one tracked B200 configuration, 8 GPUs at $9.50/GPU-hr. No single-GPU price found. — [computeprices.com: Shadeform](https://computeprices.com/providers/shadeform/gpus/b200)
- **Prime Intellect:** no B200 or B300 price found.

### Inferences
- **Cheapest verified single GPUs:**
  - B200: RunPod Community at $5.98/hr, then Vast's single Oregon B200 and Modal, both at $6.25/hr.
  - B300: RunPod Community at $6.94/hr.
  - "Low" stock means the pod may not be available when you click.
- **European supply:** only RunPod (Romania, Netherlands, Iceland) and Vast (B300 hosts in the UK and Croatia) showed European Blackwell supply. For a batch docking worker, region hardly matters.
- **Avoid GB200 and GB300 offers.** Their Grace CPU is Arm (general knowledge). That brings back the aarch64 image problem seen on DGX Spark. GB200 was also about 4x slower than B200 on a small complex in NVIDIA's Boltz-2 table (see Q3).
- **Time to first job: about 15–45 min.** This is an estimate, not a measurement. Every provider needs a new account, card verification and probably a prepaid top-up, then an image pull. Large images take longer; the Boltz-2 NIM image alone is about 73 GB.

### Gaps
- Time to first SSH or first job was not measured; that needs accounts.
- I didn't check minimum top-ups for RunPod, Vast or Lambda. Modal's page doesn't say whether the $30 Starter credit needs a card.
- Lambda's 1x B200 price relies on the fetch tool's table mapping, and Lambda's live capacity isn't visible without an API key.
- It's unconfirmed whether Nebius sells 1-GPU B200/B300 VMs, or whether its UK cluster is self-serve.
- Verda, Hyperbolic, Shadeform and Prime Intellect weren't checked on their own sites.

## Would DiffDock, Boltz-2, GNINA or GPU-Vina run on B200/B300 out of the box, or hit Blackwell kernel/compatibility problems like those seen on DGX Spark?

### Takeaway
Modern software stacks support the B200 (sm_100):
- PyTorch 2.7 and later include sm_100 kernels.
- NVIDIA lists B200 and B300 as tested for the Boltz-2 NIM.
- cuEquivariance (the GPU kernel library Boltz uses) ships sm_100a and sm_103a kernels.
- Uni-Dock 1.2.0 builds natively for sm_100.

The app's preferred DiffDock path is exactly what breaks:
- The original repo pins torch 1.13.1+cu117, whose wheels hold kernels only up to sm_86 and no PTX. By NVIDIA's rules it **cannot run on H100 or B200/B300** without rebuilding the stack. It should run natively on A40, A100 and L40S.
- The DiffDock NIM is not validated on any Blackwell GPU.
- Chai-1's PyPI release forbids the Blackwell-capable PyTorch versions.
- GNINA needs its CUDA 12.8 binary or a source build.

B300 (sm_103) mostly runs sm_100 binaries through same-major compatibility, and PyTorch still has open sm_103 bugs in niche ops. This is far less fragile than DGX Spark (no Arm, no sm_121), but it is not "out of the box" for DiffDock.

### Cited Findings
**Architecture and toolchain**
- **Compute capabilities:**

  | Capability | GPUs |
  |---|---|
  | 12.1 | GB10 (DGX Spark) |
  | 12.0 | RTX PRO 6000 Blackwell, RTX 5090 |
  | 10.3 | B300, GB300 |
  | 10.0 | B200, GB200 |
  | 9.0 | H100, H200 |
  | 8.9 | L40S |
  | 8.6 | A40 |
  | 8.0 | A100 |

  — [NVIDIA CUDA GPUs](https://developer.nvidia.com/cuda-gpus)
- **NVIDIA's binary-compatibility rules:**
  - "A cubin generated for a certain compute capability is supported to run on any GPU with the same major revision", so a 10.0 cubin should run on a 10.3 GPU.
  - Apps built with older toolkits run on Blackwell only if "they are built to include PTX versions of their kernels".
  - "An application fails to execute if it does not include PTX", and cubin-only binaries "need to be rebuilt".
  - Architecture-specific PTX such as `compute_90a` isn't supported on Blackwell.

  — [NVIDIA Blackwell Compatibility Guide](https://docs.nvidia.com/cuda/blackwell-compatibility-guide/index.html)
- **PyTorch wheel arch lists (`TORCH_CUDA_ARCH_LIST`):**
  - release/2.7 with CUDA 12.8 is `7.5;8.0;8.6;9.0;10.0;12.0+PTX`.
  - release/2.9 and release/2.10 include `10.0` for CUDA 12.8, 12.9 and 13.0.
  - None lists `10.3`.

  — [PyTorch release/2.7 build_cuda.sh](https://github.com/pytorch/pytorch/blob/release/2.7/.ci/manywheel/build_cuda.sh); [release/2.9](https://github.com/pytorch/pytorch/blob/release/2.9/.ci/manywheel/build_cuda.sh); [release/2.10](https://github.com/pytorch/pytorch/blob/release/2.10/.ci/manywheel/build_cuda.sh)
- **B200 reproduction:**
  - Setup: an NVIDIA B200 with driver 580.159.04 and torch 2.6.0+cu124.
  - Arch list: sm_50 to sm_90.
  - Result: "NVIDIA B200 with CUDA capability sm_100 is not compatible with the current PyTorch installation."
  - The same issue states that PyTorch 2.7.0 is the first release with sm_100 kernels and cu128 wheels.

  — [chai-lab#427](https://github.com/chaidiscovery/chai-lab/issues/427)
- The latest PyTorch on PyPI is 2.14.1 (30 Sep 2026, Python ≥ 3.10). Its Linux wheel depends on `nvidia-cudnn-cu13`, so it is a CUDA 13 build. — [PyPI: torch](https://pypi.org/project/torch/)
- PyTorch runs on sm_103 but has open bugs specific to it:
  - Grouped_mm backward returns NaN in MoE training on torch 2.13.0+cu130. — [#193633](https://github.com/pytorch/pytorch/issues/193633)
  - `torch._int_mm` dispatches Ampere-era kernels on GB300, running 6.4–13.4x slower. — [#187094](https://github.com/pytorch/pytorch/issues/187094)
  - A flex_attention misaligned-address fault, now closed. — [#200348](https://github.com/pytorch/pytorch/issues/200348)
  - A native_aot topk manifest that excluded sm_103. — [#199874](https://github.com/pytorch/pytorch/issues/199874); fix in [#199877](https://github.com/pytorch/pytorch/pull/199877)

**DiffDock (original repo)**
- **Pinned versions** (`environment.yml`):
  - Core: python 3.9.18, `torch==1.13.1+cu117`.
  - Graph extensions: `torch-cluster==1.6.0+pt113cu117`, `torch-scatter==2.1.0+pt113cu117`, `torch-sparse==0.6.16+pt113cu117`, `torch-spline-conv==1.2.1+pt113cu117`, `torch-geometric==2.2.0`.
  - Models: `e3nn==0.5.1`, `fair-esm[esmfold]==2.0.0`, openfold at commit `4b41059…`.
  - Other: `pytorch-lightning==1.9.5`, `rdkit==2022.03.3`.
  - The Dockerfile builds `FROM nvidia/cuda:11.7.1-devel-ubuntu22.04`.

  — [DiffDock environment.yml](https://github.com/gcorso/DiffDock/blob/main/environment.yml); [DiffDock Dockerfile](https://github.com/gcorso/DiffDock/blob/main/Dockerfile)
- **What torch 1.13 was built for.** The 1.13 wheel build used `TORCH_CUDA_ARCH_LIST="3.7;5.0;6.0;7.0"`, plus `7.5;8.0;8.6` for CUDA 11.3–11.7. That means no 9.0, no 10.0 and no `+PTX`. — [pytorch/builder release/1.13 build_cuda.sh](https://github.com/pytorch/builder/blob/release/1.13/manywheel/build_cuda.sh)
- **Issue history.** A search of DiffDock's issues for B200, Blackwell, sm_100, sm_120, 5090 or "no kernel image" found nothing on 24 Oct 2026. Older open issues show install pain: "PyTorch and Cuda" (#149), "Installation failed (Openfold, CUDA issues)" (#228), torch-sparse incompatibility (#139) and an ATen C++17 compile error (#255). — [DiffDock issue search](https://github.com/gcorso/DiffDock/issues?q=B200+OR+Blackwell+OR+sm_100); [#228](https://github.com/gcorso/DiffDock/issues/228); [#149](https://github.com/gcorso/DiffDock/issues/149)
- **Newer wheels exist.** PyTorch Geometric (PyG) extension wheels exist for the Blackwell-capable torch builds. The indexes for torch 2.7.0+cu128 through 2.11.0+cu130 all resolve, for example `torch_cluster-1.6.3+pt28cu128` for CPython 3.9–3.13. — [PyG wheels, torch-2.8.0+cu128](https://data.pyg.org/whl/torch-2.8.0+cu128.html)

**DiffDock NIM**
- **Not validated on Blackwell.** I re-read the support matrix on 24 Oct (page last updated 6 Jul 2026):
  - Listed GPUs (all BF16, 1 GPU): H100 80GB HBM3, H200, A100-SXM4-80GB/40GB, L40S, RTX A6000 and A10G.
  - Absent: B200, B300, GB200, RTX PRO 6000 and every other Blackwell GPU.
  - Minimum driver: 535.104.05.

  — [DiffDock NIM support matrix](https://docs.nvidia.com/nim/bionemo/diffdock/latest/support-matrix.html)

**Boltz-2**
- **NIM support matrix** (last updated 30 Sep 2026):
  - Tested and relevant here: B200 (180 GB) and B300 (NVIDIA-B300-SXM6-AC, 288 GB), each at 1, 2, 4 or 8 GPUs.
  - Also tested: GB200, GB300, GB10, GH200, H100, H200, A100-80GB, L40S, RTX 6000 Ada and RTX PRO 6000 Blackwell WS.
  - A40 is not listed.
  - Needs driver ≥ 590.44.01 with CUDA 13.1; the image is about 73 GB.

  — [Boltz-2 NIM support matrix](https://docs.nvidia.com/nim/bionemo/boltz2/latest/support-matrix.html)
- The benchmarks come from NIM v1.6.0, and "absolute runtimes on 1.9.0 and on B300 / GB300 may differ". — [Boltz-2 NIM performance](https://docs.nvidia.com/nim/bionemo/boltz2/latest/performance.html)
- **Open-source `boltz`:**
  - The latest PyPI release is 2.2.1 (8 Sep 2025).
  - It requires `torch>=2.2` with no upper bound, Python 3.10–3.12, `numpy<2.0` and `pytorch-lightning==2.5.0`.
  - The `[cuda]` extra pulls `cuequivariance_*_cu12>=0.5.0`.
  - v2.2.0 made the kernels optional.

  — [PyPI: boltz](https://pypi.org/project/boltz/); [boltz releases](https://github.com/jwohlwend/boltz/releases)
- **Consumer Blackwell (sm_120).** Boltz failed until a cu128 PyTorch was installed. One commenter wrote: "Blackwell needs CUDA 12.8 toolkit which is compatible with PyTorch 2.7.0 and 2.7.1". — [boltz#484](https://github.com/jwohlwend/boltz/issues/484); [boltz#506](https://github.com/jwohlwend/boltz/issues/506)
- **No B200/B300 issues.** No boltz issue mentions B200, B300, sm_100 or sm_103. The GB10 hang (#663) is specific to sm_121. — [boltz issue search](https://github.com/jwohlwend/boltz/issues?q=B200+OR+B300+OR+Blackwell); [boltz#663](https://github.com/jwohlwend/boltz/issues/663)
- **cuEquivariance 0.13.0** (15 Oct 2026; cu12 and cu13 wheels for x86_64 and aarch64):
  - Requires `torch>=2.11`.
  - Prebuilt TriMul kernels run on "H100 SXM (80GB HBM3), H200, GH200 480GB, B200 and RTX PRO 6000 Blackwell".
  - Embedded kernels ship cubins for "sm_100a and sm_103a", covering compute capabilities (10, 0) and (10, 3).

  — [PyPI: cuequivariance-ops-torch-cu12](https://pypi.org/project/cuequivariance-ops-torch-cu12/)

**Chai-1**
- **The PyPI release blocks Blackwell.** `chai_lab` 0.6.1 (18 Mar 2025) is still the only PyPI release, and it declares `torch<2.7,>=2.3.1`, which "excludes every Blackwell GPU". The fix landed on `main` in June 2025 but was never released; the issue has been open since 7 Aug 2026. — [chai-lab#427](https://github.com/chaidiscovery/chai-lab/issues/427); [PyPI: chai_lab](https://pypi.org/project/chai-lab/)
- **Workaround.** A maintainer says to install chai-lab and then overwrite torch with 2.7, which "should just work". A user confirmed it on consumer Blackwell. — [chai-lab#381](https://github.com/chaidiscovery/chai-lab/issues/381)

**GNINA**
- **Releases.** The v1.3.2 notes say: "Default binary uses an older CUDA for compatibility. The cuda12.8 version is needed to support the latest cards." v1.3.3 (29 Jun 2026) lists only minor fixes and pygnina. — [GNINA releases](https://github.com/gnina/gnina/releases)
- **RTX 5090 / 5070 reports:**
  - The default binary failed with "CUDA error: no kernel image is available for execution on the device".
  - The cuda12.8 binary needed `libcudnn.so.9` and a CUDA 12.9 toolkit before it worked on an RTX 5070.
  - Another user hit a `GLIBC_2.35` requirement.
  - The maintainer has no Blackwell hardware.

  — [gnina#330](https://github.com/gnina/gnina/issues/330)
- **Source build on Blackwell.** On an RTX PRO 6000 Blackwell (Ubuntu 24.04, CUDA 13.0), a source build worked after the maintainer pushed CUDA 13 fixes. It used `libtorch 2.9.0+cu130` and `-DCMAKE_CUDA_ARCHITECTURES="120"`. — [gnina#340](https://github.com/gnina/gnina/issues/340)
- **CMake defaults:** `CMAKE_CUDA_ARCHITECTURES "all-major"` and, for CUDA ≥ 13, `TORCH_CUDA_ARCH_LIST "…9.0;9.0+PTX"`. — [GNINA CMakeLists.txt](https://github.com/gnina/gnina/blob/master/CMakeLists.txt)
- I found no GNINA report specific to B200 or B300. — [GNINA issue search](https://github.com/gnina/gnina/issues?q=B200+OR+Blackwell)

**GPU Vina variants**
- **Uni-Dock** (a GPU port of AutoDock Vina):
  - PR #184 (merged 15 Apr 2026) adds `sm_100` (B100/B200/GB200) and `sm_120` to `CMAKE_CUDA_ARCHITECTURES` and moves to CUDA 12.8. It notes that "Older toolkits can only run on Blackwell via PTX JIT compilation, which has performance overhead." — [Uni-Dock#184](https://github.com/dptech-corp/Uni-Dock/pull/184)
  - PR #199 (merged 12 Jun 2026) moves the Docker base image to `nvidia/cuda:12.9.2-devel-ubuntu22.04`. Release 1.2.0 is dated 11 Jun 2026. — [Uni-Dock#199](https://github.com/dptech-corp/Uni-Dock/pull/199); [Uni-Dock releases](https://github.com/dptech-corp/Uni-Dock/releases)
  - The current architecture list is 75, 80, 86, 89, 90, 100 and 120 (plus 70 on CUDA 12.x). It does not include 103. — [Uni-Dock CMakeLists.txt](https://github.com/dptech-corp/Uni-Dock/blob/main/unidock/CMakeLists.txt)
- **Vina-GPU 2.1** (whose repo also holds the QuickVina2-GPU and QuickVina-W-GPU variants) is written in OpenCL:
  - It builds against Boost 1.77 and the OpenCL library from CUDA 12.2, with `-DNVIDIA_PLATFORM -DOPENCL_3_0`.
  - Kernels are compiled from source or loaded from prebuilt `.bin` files.

  — [Vina-GPU-2.1 README](https://github.com/DeltaGroupNJUPT/Vina-GPU-2.1)

### Inferences
- **Original DiffDock on B200/B300: no.**
  - torch 1.13.1+cu117 carries kernels only up to sm_86 and no PTX, so it can't run on 9.x or 10.x GPUs. Expect the "not compatible / no kernel image" failure from chai-lab#427 on H100 and H200 too, not only on B200/B300. Not tested.
  - A port needs torch ≥ 2.7 with cu128 and matching PyG wheels (these exist for Python 3.9). It must keep `rdkit==2022.03.3`, because of the RDKit warning in `docking_feasibility.md`, and must rebuild openfold from an old commit. That is the "hours of dependency fixing" scenario.
- **The same pinned stack should run natively on the Vultr A40 (8.6) and on A100 (8.0).** It should also run on L40S (8.9), because sm_86 kernels run on 8.9. That makes the **A40 the most compatible GPU for original DiffDock**. This is inferred from the arch list and NVIDIA's rules; I haven't run it.
- **DiffDock NIM on B200/B300: unsupported or unknown.** Prefer L40S, A100 or H100, or NVIDIA's hosted endpoint (see `docking_feasibility.md`). A40 isn't listed either, but it is the same sm_86 class as the listed RTX A6000 and A10G (inference).
- **Boltz-2 on B200/B300: workable.**
  - The NIM is tested on both, but needs driver ≥ 590.44.01 with CUDA 13.1.
  - Via pip, `pip install boltz[cuda]` should now pull torch 2.14 (CUDA 13), cuEquivariance 0.13 (sm_100a/sm_103a kernels) and boltz 2.2.1. The untested risk is boltz's 2025 pins (`pytorch-lightning==2.5.0`, `numpy<2`) against torch 2.14.
  - Fallback: run with `--no_kernels`.
- **Chai-1: about 15 minutes of fixing.** Force torch ≥ 2.7 and accept the `pip check` failure. It also re-predicts the protein, so it's a weak fit for "dock into this PDB" (`docking_feasibility.md`).
- **GNINA: assume a build session on any Blackwell card.** It's a strong method but the riskiest choice on B200/B300.
- **Uni-Dock ≥ 1.2.0** probably works natively on B200. On B300 it would run the sm_100 kernels by same-major compatibility (inference).
- **Vina-GPU 2.1 and QuickVina2-GPU** compile their OpenCL kernels in the driver at runtime, so they should be architecture-agnostic on any recent NVIDIA driver. This is an inference; I didn't look for Blackwell reports.
- **Compared with DGX Spark:** HGX B200/B300 servers are normally x86 (general knowledge; I didn't check host CPUs), so they avoid both Spark problems, Arm images and sm_121 kernels. What's left is old pins (DiffDock, Chai-1 on PyPI, GNINA's default binary) and B300's reliance on sm_100 kernels.

### Gaps
- Nothing was run on a Blackwell GPU.
- I found no report of original DiffDock, or a torch 2.x port of it, on H100, B200 or B300.
- I found no B200/B300 report for open-source boltz, GNINA, Uni-Dock or Vina-GPU. I didn't search Vina-GPU's issues.
- I didn't check whether the Uni-Dock 1.2.0 conda or Docker artefacts actually contain the sm_100 build.
- Driver versions on RunPod's B200/B300 hosts aren't visible without an account, and the Boltz-2 NIM needs ≥ 590.44.01. Vast's B300 hosts showed driver 595.x.

## Which workloads in this app genuinely benefit from a top-end GPU, and what throughput would they get?

### Takeaway
None of them needs a B200 or B300:
- **Single on-demand dock:** seconds to about a minute on any 48 GB-class GPU. The time goes mostly on preparation and model loading.
- **GPU-Vina screen of all ~2,000–3,000 approved drugs:** minutes on any modern GPU.
- **Boltz-2 affinity across every drug:** about 4–13 h on one H100-class GPU. This is the only GPU-bound job. NVIDIA's own benchmark shows B200 roughly equal to H100 for Boltz-2 (H200 is faster), so a B200 doesn't change what's feasible.

Screening everything with Uni-Dock and rescoring only the top 50–100 with Boltz-2 does.

### Cited Findings
- **Boltz-2 NIM structure prediction** (TensorRT, no templates, v1.6.0), in seconds:

  | GPU | 186 residues | 1,286 residues | 2,033 residues |
  |---|---|---|---|
  | B200 | 1.56 | 29.63 | 83.43 |
  | H100 | 1.72 | 24.67 | 79.55 |
  | H200 | 1.44 | 21.62 | 71.01 |
  | A100-80GB | 2.90 | 37.80 | 138.09 |
  | L40S | 2.08 | 47.45 | — |
  | RTX PRO 6000 Blackwell | 1.66 | 39.79 | 117.66 |
  | GB200 | 6.15 | 37.65 | 109.54 |
  | GB10 | 7.42 | 353.91 | — |

  There are no B300 timings. — [Boltz-2 NIM performance](https://docs.nvidia.com/nim/bionemo/boltz2/latest/performance.html)
- **Boltz-2 affinity** (reported for H100 only):
  - 186-residue complex: 6.21 s with TensorRT, 18.52 s with the open-source backend.
  - Range across the test set: 6.21–81.19 s (TensorRT) and 18.52–130.67 s (open-source).
  - For structure prediction, the open-source backend is 1.45–6.44x slower than TensorRT.
  - The sample script lowers affinity sampling steps from 200 to 100 and diffusion samples from 5 to 3.

  — [Boltz-2 NIM performance](https://docs.nvidia.com/nim/bionemo/boltz2/latest/performance.html)
- Boltz-2 needs about 20 s per compound per GPU, which makes large virtual screens hard. The bottleneck is the diffusion structure step, and Boltzina is up to 11.8x faster. — [Boltzina, arXiv:2508.17555](https://arxiv.org/abs/2508.17555) (via search summary). Press coverage gives about 20 s per prediction on one GPU. — [Bio-IT World](https://www.bio-itworld.com/news/2025/06/06/mit-researchers-unveil-boltz-2-ai-model-predicts-protein-structure-binding-affinity-in-seconds)
- **DiffDock NIM speed benchmark** (92 PoseBusters complexes × 10 poses):

  | GPU | Optimised NIM | DiffDock v1.0 baseline |
  |---|---|---|
  | H100 SXM5 | 6.835 | 1.097 |
  | H100 PCIe | 5.226 | 0.932 |
  | L40S | 4.485 | 0.691 |
  | A100 80GB PCIe | 4.023 | 0.740 |
  | RTX A6000 | 2.852 | 0.374 |

  The page states no unit. "Speedup" is defined as optimised ÷ baseline, so the values behave as throughput. The NIM is 5.4–7.6x faster than v1.0. — [DiffDock NIM performance](https://docs.nvidia.com/nim/bionemo/diffdock/latest/performance.html)
- A PoseBench table reports DiffDock-L (5 samples) at about 88 s per complex on one A100 80GB, with a peak-memory column of about 70 GB. — [PoseBench, arXiv:2405.14108](https://arxiv.org/pdf/2405.14108) **[search snippet only; column meanings not checked]**
- **Uni-Dock speed:**
  - Claims a ">2000-fold speed-up on V100 GPU" against Vina on a single CPU core.
  - Search modes: fast (exhaustiveness 128, max_step 20), balance (384, 40) and detail (512, 40).
  - It sizes each GPU batch to the available memory.

  — [Uni-Dock README](https://github.com/dptech-corp/Uni-Dock/blob/main/unidock/README.md)
- Earlier notes put Uni-Dock at about 0.10 s per ligand in fast mode and 0.32 s in balance mode. — [Uni-Dock README](https://github.com/dptech-corp/Uni-Dock/blob/main/unidock/README.md); [Uni-Dock, JCTC](https://pubs.acs.org/doi/abs/10.1021/acs.jctc.2c01145) (as cited in `docking_feasibility.md`)
- Uni-Dock builds with `--use_fast_math`, i.e. FP32 arithmetic. — [Uni-Dock CMakeLists.txt](https://github.com/dptech-corp/Uni-Dock/blob/main/unidock/CMakeLists.txt)
- **NVIDIA HGX specs** (totals for 8 GPUs):

  | Spec | HGX B200 | HGX B300 |
  |---|---|---|
  | FP32 | 600 TFLOPS | 600 TFLOPS |
  | FP64 | 296 TFLOPS | 10 TFLOPS |
  | INT8 (sparse) | 72 POPS | 3 POPS |
  | FP4 (dense) | 72 PFLOPS | 108 PFLOPS |
  | GPU memory | 1.4 TB | 2.1 TB |

  — [NVIDIA HGX](https://www.nvidia.com/en-us/data-center/hgx/)

### Inferences
- **The single on-demand docking request:**
  - Typical times: Vina runs on CPU; DiffDock-class models take tens of seconds to about 1.5 min per complex; Boltz-2 takes about 2–20 s on any listed GPU with ≥ 48 GB.
  - A small Boltz-2 structure takes 1.56 s on B200 against 2.08 s on L40S. A user won't notice the difference. PDB prep, protonation, ESM embedding, conformer generation and cold start dominate.
  - For DiffDock, the NIM data put H100 SXM at only about 1.5x an L40S and about 2.4x an A40-class RTX A6000 (6.835/4.485 and 6.835/2.852).
- **Screening ~2,500 drugs with Uni-Dock:** about 13 min in balance mode (0.32 s/ligand), or about 4 min in fast mode. These figures date from V100-era benchmarks, and an A40 or L40S should be at least comparable (inference).
  - B200's FP32 is about 75 TFLOPS per GPU, not a large step for FP32 docking kernels. I didn't fetch the L40S figure.
  - B300 cuts FP64 and INT8 sharply. That helps LLM serving, not docking.
- **Boltz-2 affinity for all 2,500 drugs against a ~200-residue target:**

  | GPU | TensorRT NIM | Open-source |
  |---|---|---|
  | H100 | ~4.3 h (2,500 × 6.21 s) | ~12.9 h (2,500 × 18.52 s) |
  | L40S | ~5.2 h | ~15.6 h |
  | B200 | about the same as H100 | about the same as H100 |

  - The L40S figures are scaled by the 1.21x structure-time ratio. NVIDIA's B200 structure times are within 10–20% of H100's either way.
  - Add about 20% for 3,000 drugs.
  - Only parallel GPUs would get this under an hour, for example RunPod 8x B200 on Secure Cloud at about $64/hr if stock allows. Even then it's a fragile overnight job that eats most of the remaining time.
- **Better design for the HRT "predictions and decision making" pitch:**
  1. Screen all approved drugs in minutes with Uni-Dock or Vina-GPU.
  2. Compute enrichment against ChEMBL actives (ROC-AUC, EF1%, BEDROC) on CPU.
  3. Rescore only the top 50–100 with Boltz-2. That takes about 10 min with TensorRT, or about 31 min with the open-source backend, on one H100- or L40S-class GPU.

  This delivers a predictive-validation story without a top-end GPU.
- **Other parts of the app:** the LLM jury runs in Snowflake Cortex and the web app runs on CPU. Neither benefits from a local GPU.

### Gaps
- No B300 timings exist for any of these tools, and no direct B200 timings for DiffDock, GNINA or Uni-Dock.
- Boltz-2 affinity has been timed only on H100. The L40S and B200 estimates are scaled from structure timings.
- I have no primary per-complex DiffDock runtime in seconds. The NIM table has no unit and the PoseBench figure came from a snippet.
- Uni-Dock's per-ligand timings are from V100-era benchmarks. I found none for A40, L40S or B200.
- It's unverified whether DiffDock-L's peak memory fits a 48 GB A40 at the default batch settings; the PoseBench snippet suggests about 70 GB on an A100 80GB. The optimised NIM supports the 24 GB A10G, so the NIM path should fit.

## Does renting outside Vultr forfeit the Vultr prize, and can the $100 MLH Vultr credit be used on GPU plans?

### Takeaway
I found no published rule saying that using another GPU cloud forfeits "Best Use of Vultr". But the prize text is about deploying on Vultr compute and Cloud GPUs, so moving the GPU work elsewhere removes the strongest part of the Vultr story. Vultr can't supply a B200 or B300 today anyway.

Whether the $100 MLH code covers Cloud GPU is **unverified**. A Vultr credit programme announced this month excludes GPU products. So test the code in hour one by deploying an A40 after redeeming it.

### Cited Findings
- **Prize text.** The Vultr prize promotes one-click deployment, scalable cloud compute and Vultr Cloud GPUs. It asks teams to sign up, claim free credits and take their hack to the cloud, and states no judging criteria. The Devpost rules list prizes as "To be announced". — [Devpost](https://oxhack-2026.devpost.com/); [Devpost rules](https://oxhack-2026.devpost.com/rules) (as captured in `sponsor_stack.md`)
- **The credit.** MLH gives $100 of Vultr credit through a promo code. Vultr's MLH page states no amount, expiry, card requirement or product exclusions. — [MLH Vultr partner page](https://www.mlh.com/partners/vultr); [discover.vultr.com/mlh](https://discover.vultr.com/mlh) (as captured in `sponsor_stack.md`)
- **A precedent for excluding GPUs.** A secondary report on Vultr's Open Source Credits programme (announced 6 Oct 2026) says "Cloud GPU, GPU Bare Metal, Serverless Inference and other AI/ML products are excluded". It attributes this to the application page and links official pages, which I didn't read. — [VPSRanking](https://vpsranking.com/news/vps/vps-2026-10-06-vultr-open-source-credits/); [Vultr open-source credits page (not read)](https://discover.vultr.com/open-source-credits)
- **Unofficial claims.** Coupon sites say Vultr promotional credit applies to all services, including GPU instances. They are unofficial and may be out of date. — [Techjury](https://techjury.net/hosting-coupons/vultr/); [GrabOn](https://grabon.com/vultr-coupons/)
- **No Blackwell on Vultr today.** The 8x B200 bare-metal plan ($68/hr) has no locations, and there is no B300 plan. A 1x A40 ($1.712/hr) is deployable in London. — [Vultr bare-metal plans API](https://api.vultr.com/v2/plans-metal); [Vultr London availability](https://api.vultr.com/v2/regions/lhr/availability); [Vultr pricing](https://www.vultr.com/pricing/#cloud-gpu)

### Inferences
- Renting a B200 on RunPod or Modal doesn't disqualify the team under any rule I found, but it weakens the Vultr entry. "Docking worker on a Vultr A40 in London" demos better than "web page on a Vultr VM, GPU somewhere else".
- If the GPU work does move elsewhere, keep the API, the web app and ideally object storage on Vultr.
- **Ten-minute credit check:**
  1. Apply the MLH code under Billing.
  2. Try deploying `vcg-a40-24c-120g-48vram` in `lhr`.
  3. If the deploy is blocked or billing shows GPUs as excluded, use the fallback in the next section.

  At about $38 for 22 h, the A40 is cheap even if billed to a card.

### Gaps
- I found no official Vultr statement on whether MLH promo credit covers Cloud GPU, when it expires, or whether new accounts face GPU quotas or verification.
- I found no OxHack or MLH rule on mixing clouds, nor on how "Best Use of Vultr" is judged.
- I didn't read Vultr's official open-source-credits pages. The GPU exclusion rests on a secondary article.

## What is the recommended GPU choice, with cost and risk?

### Takeaway
**Don't rent a B200 or B300.** Run the docking worker on Vultr's **1x A40 48 GB in London** ($1.712/hr, about $38 for 22 h, nominally inside the $100 MLH credit). Three reasons:
- It is the GPU where DiffDock's pinned 2023 stack should run natively.
- It also handles Uni-Dock screening.
- It keeps the Vultr prize story intact.

Fallbacks:
- If Vultr blocks GPUs: a RunPod A40 or L40S ($0.35–$1.09/hr, about $8–$24 for 22 h; the A40 shows "High" stock in Sweden), with the app still on Vultr.
- For the Boltz-2 batch: a few hours of H100 or H200, or Modal's per-second billing.

A 22-hour B200 or B300 would cost about $130–$210, add Blackwell compatibility risk for DiffDock, Chai-1 and GNINA, face "Low" stock, and buy almost no speed for this app.

### Cited Findings
- Vultr 1x A40 48 GB (24 vCPU, 120 GB RAM): $1.712/hr, orderable in London. — [Vultr pricing](https://www.vultr.com/pricing/#cloud-gpu); [Vultr London availability](https://api.vultr.com/v2/regions/lhr/availability)
- Single-GPU prices are as cited in the first question. — [RunPod GraphQL API](https://api.runpod.io/graphql); [RunPod pricing](https://www.runpod.io/pricing); [Modal pricing](https://modal.com/pricing); [Lambda pricing](https://lambda.ai/pricing); [Nebius prices](https://nebius.com/prices); [Vast.ai offers API](https://console.vast.ai/api/v0/bundles/); [CoreWeave pricing](https://www.coreweave.com/pricing)
- The A40 is compute capability 8.6, which matches the sm_86 kernels in torch 1.13.1+cu117, the version DiffDock pins. — [NVIDIA CUDA GPUs](https://developer.nvidia.com/cuda-gpus); [pytorch/builder release/1.13](https://github.com/pytorch/builder/blob/release/1.13/manywheel/build_cuda.sh); [DiffDock environment.yml](https://github.com/gcorso/DiffDock/blob/main/environment.yml)
- Boltz-2 NIM minimums: a GPU with ≥ 48 GB, 64 GB RAM, 12 CPU cores, 80 GB disk, and driver ≥ 590.44.01 with CUDA 13.1. — [Boltz-2 NIM support matrix](https://docs.nvidia.com/nim/bionemo/boltz2/latest/support-matrix.html)

### Inferences
**Cost for the remaining ~22 hours** (list price × 22 h for an always-on box; computed)

| Option | $/hr | 22 h | Notes |
|---|---|---|---|
| **Vultr 1x A40 48 GB (London)** | 1.712 | **$37.66** | Recommended. Covered by the MLH $100 credit if it applies to GPUs |
| RunPod A40, Community / Secure | 0.35 / 0.59 | $7.70 / $12.98 | Fallback; "High" stock in EU-SE-1 |
| RunPod L40S, Community / Secure | 0.79 / 1.09 | $17.38 / $23.98 | Fallback; supported by both the DiffDock and Boltz-2 NIMs |
| Modal L40S | 1.95 | pay per second | $30 free credit ≈ 15 GPU-hours |
| RunPod H100 SXM, Community / Secure | 2.69 / 3.99 | $59.18 / $87.78 | Only for a few hours of Boltz-2 batch |
| RunPod 1x B200, Community / Secure | 5.98 / 7.99 | $131.56 / $175.78 | Stock "Low" |
| RunPod 1x B300, Community / Secure | 6.94 / 8.99 | $152.68 / $197.78 | Stock "Low" |
| Vast 1x B200 (Oregon) / 1x B300 (UK) | 6.25 / 8.50 | $137.54 / $187.02 | The UK B300 host has 0.607 reliability |
| Modal B200 / B300 | 6.25 / 7.10 | $137.49 / $156.18 if always on | Per-second billing, so you pay only while jobs run |
| Lambda 1x B200 | ~6.99 | ~$153.78 | Mapping to 1x is inferred |
| Nebius B200 / B300 | 8.50 / 9.50 | $187 / $209 | 1-GPU availability unverified |
| Vultr / CoreWeave 8x B200 | 68 / 68.80 | $1,496 / $1,514 | Vultr: not deployable. CoreWeave: via sales only |

**Plan**
1. **Now, about 30 min.**
   - Redeem the Vultr MLH code and deploy an A40 in `lhr`.
   - Run `nvidia-smi` and record the driver version. It decides whether the Boltz-2 NIM (needs ≥ 590.44.01) can run there.
2. **Docking worker on the A40.**
   - Primary: Vina on CPU across the 24 vCPUs (`docking_feasibility.md`).
   - DiffDock: use the repo's Docker or conda stack unchanged. It should be sm_86-native, but that's untested; check peak GPU memory on the first run.
   - Screening stretch: Uni-Dock ≥ 1.2.0.
3. **Stretch, only once the core flow works.**
   - Run the Uni-Dock screen of all approved drugs and the enrichment backtest against ChEMBL actives.
   - Rescore the top 50–100 with Boltz-2. Use the hosted NIM, or the A40 if its driver allows, or rent an H100/H200 on RunPod or Modal for 1–2 h (about $3–$11). Shut it down as soon as it finishes.
4. **If Vultr blocks GPUs.** Use a RunPod A40 or L40S for the worker and keep the API and web app on a Vultr VM.

**Risk register**
- **Compatibility (high for B200/B300).**
  - Original DiffDock can't run on 9.x or 10.x GPUs with its pins, and porting it takes hours.
  - The DiffDock NIM isn't validated on Blackwell.
  - Chai-1's PyPI pin forbids Blackwell-capable torch.
  - GNINA needs a special build.
  - B300 relies on sm_100 kernel compatibility and has open PyTorch sm_103 bugs.
- **Supply (medium).**
  - RunPod's B200 and B300 stock is "Low".
  - Vast has just one 1x B200, and its UK B300 host has 0.607 reliability.
  - Vultr has no B200 or B300 at all.
- **Cost (medium).** $130–$210 for an always-on Blackwell box, against $8–$38 for an A40 or L40S, for no meaningful speed-up.
- **Time (high).** Each extra provider means another account, card and top-up, plus image pulls (the Boltz-2 NIM is about 73 GB). A driver mismatch on hackathon day can cost the whole evening.
- **Prize (medium).** Running compute outside Vultr weakens "Best Use of Vultr", though nothing forbids it.
- **Residual risk of the recommendation.** The MLH credit may exclude GPUs, Vultr may gate GPU deploys on new accounts, or the A40's driver may be too old for the Boltz-2 NIM. All three would show up in the first 30 minutes, and each has a cheap fallback.

### Gaps
- End-to-end timings on the A40 (request to pose) were not measured. Benchmark on the box first.
- It's unknown whether Vultr's A40 image ships a driver ≥ 590.44.01, which the Boltz-2 NIM needs.
- It's unverified whether DiffDock-L's default inference fits in 48 GB (see the PoseBench memory note above).
