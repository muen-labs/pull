# Image providers on RunningHub — measured comparison

Written 2026-11-15 from real runs against the live RunningHub account. Every number here is
measured, not estimated, except where a row says *est.* Costs are `credits` as the API reports them
(`remainPoint` delta), converted at RunningHub's own plan rate (`$/credit`, see *Pricing*).

**Read this before changing any provider call, any `docs/rh/*.json`, or any tier price.**

---

## TL;DR

| decision | answer |
|---|---|
| **Standard tier** | **Qwen-Image-2.1 base**, app `2121866771741765634` — 44 s, 6.97 credits (~1¢), face held, 2:3 when the subject is cropped |
| **Premium tier** | **gpt-image-2.5 Flare**, app `2121834890907099138` — 86 s, 26.40 credits (~2¢), face held, **transparent background** |
| **P-H3 (MiniMax H3)** | keep as the **many-reference / motion fallback**, not the default: 4 refs max in the image node, 117 s at 4 MP, 19.21 credits |
| **Dropped** | Viggle turbo LoRA (all files deleted — invented faces), ZooWork `image_generate` (superseded) |
| **Draft tier** | **do not ship one.** A tier that invents faces is a support ticket, and Standard is already ~1¢ |

---

## Measured runs (same four references: client portrait + jacket + top + trousers)

| provider / app | refs | size | wall | credits | cost* | face | garments | notes |
|---|---|---|---|---|---|---|---|---|
| **Qwen 2.1 base** `2121866771741765634` | 4 | 832×1248 (2:3) | **44 s** | **6.97** | **$0.010** | **✅** | ✅ | subject cropped to 2:3; coat open, top visible |
| Qwen 2.1 base | 4 | 1024² | 43 s | 6.97 | $0.010 | ✅ | ✅ | same graph, uncropped square subject |
| **P-H3 (MiniMax H3)** `2121860692906430466` | 4 | 2048² | 117 s | 19.21 | $0.028 | ✅ | ✅ | first fully successful H3 run |
| **gpt-image-2.5 Flare** `2121834890907099138` | up to 16 | 2:3 | 86 s | 26.40 | $0.039 | ✅ | ✅ | transparent output supported |
| Qwen 2.1 **turbo** `2121831903090294786` | 4 | 832×1248 | 43 s | 6.63 | $0.010 | **✗ lookalike** | ✅ | dropped: 6-step turbo loses identity |
| H3, single image door (3 attempts) | 1 | 2048² | 48–56 s | 7.48–14.79 | — | ✗ | ✗ | one door cannot carry identity + outfit |
| H3 with **6** doors filled | 6 | — | ~27 s | **0.00** | — | — | — | `IndexError` in `KSampler`; see *Hard limits* |

\* at the Basic monthly rate ($0.00148/credit). On annual Plus C ($0.00075/credit) divide by two.

**Failed runs cost 0 credits** when they die before sampling — which is why probing limits is cheap.
A run that reaches sampling bills in full even if the result is wrong.

---

## 1 · Qwen-Image-2.1 base — **the Standard tier**

- **App**: `2121866771741765634` ("qwen 2.1 4 refs"), built from `docs/rh/qwen-edit-4ref-en.json`.
- **Graph**: 4 × `LoadImage` → `TextEncodeQwenImage21` (single `resolution` INT, default 1024) → `KSampler` (20 steps, quality-first) → `VAEDecode` → `SaveImage`. Models: `qwen_image_2.1` bf16 + `qwen3vl_8b` + `qwen_image_2.1_vae`.
- **Doors** (map by **node id**, never by list order — the app lists them `12, 6, 4, 5`):

  | door | role |
  |---|---|
  | `n4` | Main image — the client (required) |
  | `n5` | Reference 1 — jacket |
  | `n6` | Reference 2 — top |
  | `n12` | Reference 3 — trousers |

  plus `n7.prompt`.

- **Aspect follows the subject.** The encoder has no width/height — it resizes references preserving
  aspect. **Crop the client portrait to the target ratio before upload** (2:3 for lookbook) and the
  same app returns 2:3 at identical cost. No graph change, no variants per ratio.
- **Prompt rule — layered looks.** Naming a coat and a top yields a *closed* coat with the top hidden.
  Say: *"the coat from `<Picture 2>` **open and unbuttoned** over the top from `<Picture 3>`; the top
  must be clearly visible"*. This is a prompt fix, not a model limitation.
- **Prompt skeleton that works**:
  > Edit the main image. A full-body editorial lookbook photograph of the man in `<Picture 1>`,
  > wearing the black double-breasted overcoat from `<Picture 2>` open and unbuttoned over the
  > purple sequined top from `<Picture 3>`, and the cream wide-leg trousers from `<Picture 4>`.
  > Standing on a seamless light-grey studio floor, soft even daylight, 35mm film grain, natural
  > skin texture, vertical 2:3 frame. One single frame, no grid, no panels, no collage, no text.
- **Reference enumeration is the collage bug.** A prompt that lists references as separate items
  ("Image 1: … Image 2: …") makes the model draw *one panel per reference*. Always one sentence.

## 2 · gpt-image-2.5 Flare — **the Premium tier**

- **App**: `2121834890907099138` ("GPT Image 2.5 Flare Image to Image") — **16 image doors**, `n1.prompt`.
- 86 s, 26.40 credits, face held, 2:3, and **transparent background comes from the model** (that is
  what "Flare" means in Krea's catalogue: `gpt-image-2.5-flare` = transparency; `-sunburst` = speed).
- The 16 doors make it the natural fallback when a look needs more than four references.
- Krea sells the same model at **$0.225/render** (its `openai/gpt-image-2` route at 2:3 came back
  832×1248 in 63 s) — i.e. **6× the RunningHub cost** for the same family. Do not route PULL through
  Krea unless RunningHub is down.
- Edit-vs-generate is **unproven** for the hosted Krea endpoint: one render matched the reference face,
  but the prompt already described the face, so it may have generated. RunningHub's door-wired graph
  does not have this ambiguity.

## 3 · P-H3 (MiniMax H3) — the fallback

- **Names are misleading.** The app is called "P-H3", but the graph node is
  **`MiniMaxH3ImageConditioning`** with `minimax_h3_image_pruned_int8_convrot` + `qwen3vl_32b_minimax_h3_int8_convrot`
  + `minimax_h3_image_vae_fp16`. `PH3ImageConditioning` is a **different node** needing a
  `p-h3-image` VAE — do not retype the node without swapping the VAE.
- `MiniMaxH3ImageConditioning.images` is `COMFY_AUTOGROW_V3` with `prefix: "image_"`, `min 0, max 100`
  — so the JSON can declare many slots, but see the limits below. `PH3ImageConditioning` is fixed at
  `image_1…image_9`.
- Tooltip: **"image_1 is the picture to edit"** — the subject must be on `image_1` or the prompt's
  `<Picture 1>` edits a garment. A scrambled door order produced a "plausible man in the right coat"
  with an invented face for exactly this reason.
- **Size is a setting, not a sentence.** In the earlier graph `width`/`height` were wired to
  `GetImageSize`, so the output inherited whichever reference was measured (0.83, 1.00 — never the
  requested ratio). Fix: drop those links, set literal width/height (832×1248 = 1.04 MP, 2:3).
  At 4 MP it cost 19.21 credits; 1 MP is ~4× fewer pixels and should land near Qwen's 7.

### Hard limits (measured)

| limit | symptom |
|---|---|
| **6 references** at once | `IndexError` in `KSampler` (`extra_conds`, reference-latent shapes). Grey fillers (1:1 and 2:3) do **not** help; six *real* images fail identically. **Max 4 in this graph.** |
| **unfilled image door** | `AttributeError` in `ResizeImageMaskNode` — a null image crashes the chain. Publish only as many doors as every run will fill. |
| **many references** | the `MiniMaxH3ReferenceToVideo` / All-in-One graph *does* accept them — that's why it worked where the image node failed. `length` controls frames (5 = a contact sheet of five). |

## 4 · Dropped

- **Viggle** (v0.1 4-step r64, v0.2.1/v0.3 6-step): garments right, **face invented**; the node pack
  also fails to import on RunningHub ("Unknown pack: ViggleTurboLora/ViggleTurboSigmas"). All files
  deleted from `docs/rh/`.
- **ZooWork `image_generate`** (the old canvas path, ~80 s): superseded; its catalog has no
  image-generation model of its own.

---

## How to call a RunningHub app (the recipe that works)

1. **Read the doors** — `GET /api/webapp/apiCallDemo?apiKey=…&webappId=…` → `data.nodeInfoList`,
   each with `nodeId`, `fieldName`, `fieldType`. **Map images by node id, not list order.**
2. **Upload** — `POST /task/openapi/upload` (multipart: `apiKey`, `fileType=input`, `file`) → `data.fileName`.
3. **Run** — `POST /task/openapi/ai-app/run` `{ apiKey, webappId, nodeInfoList: [{nodeId, fieldName, fieldValue}] }`
   → `data.taskId`. Image doors take the uploaded fileName; text doors take the prompt.
4. **Poll** — `POST /task/openapi/status` `{ apiKey, taskId }` → `QUEUED|RUNNING|SUCCESS|FAILED`.
5. **Fetch** — `POST /task/openapi/outputs` → `data[0].fileUrl`.
6. **Cost** — `POST /uc/openapi/accountStatus` `{ apikey }` before and after; difference in `remainPoint`.

Failure detail lives in `outputs → data.failedReason` (with `exception_type`, `node_name`,
`traceback`) even though `status` only says `FAILED`.

**Rule learned the hard way:** read the doors *first* and stop if the image-door count is short of
what the run needs. Several single-door H3 runs cost ~32 credits proving a single image cannot carry
an identity and an outfit at once.

---

## Pricing (RunningHub, list rates)

| plan | price | credits/mo | $/credit | notes |
|---|---|---|---|---|
| Basic monthly | $18.90 | 12,800 | $0.00148 | 5 concurrent |
| Plus A monthly | $27.90 | 19,300 | $0.00145 | |
| **Plus C annual** | **$588.90** | **65,200** | **$0.00075** | 20 concurrent, queue priority, Seedance 26% of list |
| Pro annual | $999.90 | 123,100 | $0.00068 | Seedance 23% |
| Ultimate annual | $2,352.90 | 409,000 | $0.00038 | **+3 months**, Seedance 13% |

Consumer API key concurrency is **3** regardless of plan — PULL must queue renders accordingly.

**Sell prices implied** (cost × 3–5): Standard $0.05, Premium $0.15. At ~7 credits a Standard render,
300 included renders on the $59 Studio plan cost **$3** — allowances are affordable, unlike the
Krea-priced assumption ($22.50) that briefly made 100/300 look impossible.

---

## Files in `docs/rh/`

| file | status |
|---|---|
| `qwen-edit-4ref-en.json` | **current** — the Qwen 2.1 4-door graph (Standard) |
| `h3-4ref-1mp-rh.json` | current — H3 at 1.04 MP, 2:3 |
| `h3-4ref-2x3-rh.json` | H3 at 2:3, 4 MP (the graph that produced the 19.21-credit run) |
| `h3-4ref-rh.json` | H3 base, 4 doors, 2048² |
| `h3-allinone-8ref-rh.json` | the many-reference / video-node fallback |
| `h3-edit-*.json`, `h3-allinone-en.json`, `h3-edit-bridge-9ref.json` | history — earlier H3 attempts |
| ~~Viggle files, `ph3-edit-6ref-rh.json`~~ | deleted (dropped provider · wrong node/VAE) |

## Open questions

1. **Point price per plan** is confirmed, but whether annual credits arrive monthly or in one grant is
   not — verify at checkout before committing $588.90.
2. **P-H3 at 1 MP** has not been run; if it lands near 7 credits with the face held it competes with
   Qwen for Standard.
3. **Very large ref counts** need the All-in-One/video node, whose `length: 1` behaviour is untested
   for stills.
4. **Transparent cutouts**: Flare's alpha has not been verified downstream (board tiles, lookbook
   compositing).
