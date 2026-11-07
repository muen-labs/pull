# Epic — PULL submission video (under two minutes)

| field | value |
|---|---|
| Status | Ready to shoot. One accepted divergence, recorded in §3 and §6: the PRISM widget does not render on the public `/requests` surface, and the cut does not need it there. |
| Owner | The founder. Narrator, operator and editor are the same person. |
| Target runtime | 1:54. The narration's last cue ends at 1:53.66, so there is about 6 s of slack under the cap. |
| Hard cap | 2:00. One second over is a failed take, not a rough cut. |
| Deliverable | 1920x1080, H.264, 60 fps source footage, one file |
| Beat sheet | Fixed. Cues 1–26 at the timecodes in §4. Do not renumber. |
| Narration | `docs/epics/pull-submission-video.srt` (26 cues, on disk) and its paste-ready source `docs/epics/pull-submission-video-narration.txt`. The timecodes in §4 are the SRT's own cue windows. This epic carries talking points and cue numbers only, never wording. |
| Companions | [`DEMO.md`](../../DEMO.md) the run of show · [`PRODUCT.md`](../../PRODUCT.md) the recorded decisions |

## 1. What the video is

A single-take-per-beat screen walk through PULL, narrated in first person by the founder, that proves three things at once: the stylist workflow is real end to end, the model work runs on ZooWork Managed Agents, and every model call is mirrored to Block Convey PRISM with the model named.

The product in one line, for whoever reads this doc first: PULL turns a folder of runway screenshots into signed-off looks. The agent reads and files each look, the client approves, passes or circles pieces on a login-less link, the agent drafts one request email per showroom, and the studio can compose a new look from four references with ZooWork and gpt-image-2.

## 2. Objective and audience

**Primary audience: the hackathon judges.** Their first gate is binary, "runs on ZooWork Managed Agents". A judge who watches once, muted, must be able to see a real ZooWork run complete on screen and read the two model names. The second gate is "is this a product or a wrapper": the video has to show the workflow a stylist actually does, in order, without a slide deck.

**Secondary audience: LinkedIn, as a PRISM advocate post.** Block Convey's observability is the reason this video exists in its current shape. The widget is on screen whenever the agent runs, it names PRISM as the trace mirror and credits ZooWork as the sponsor. A viewer from Block Convey should feel their product was used well, not name-dropped.

**What the video must prove, in order of importance:**

1. A real ZooWork Managed Agents run happens while the camera is on it, and returns a rendered image (the canvas beat). Not a mock, not a replay.
2. Both ZooWork model slots are named on screen. The widget's two-cell rail prints each model on two lines: the LLM cell reads `Gemini 3.8 Flash` over `gemini-3.8-flash`, the IMAGE cell reads `GPT Image 2` over `gpt-image-2`. The provider prefix (`litellm/`) is not printed on the rail; the full alias survives only as the cell's title tooltip. Do not promise the full string on screen in the narration.
3. Every call is observable, timed, and carries the model that produced it: the PRISM widget's rows, with durations that are readable in the final cut.
4. The stylist workflow is whole: screenshots → board filed by house → one client link, decisions and markup back → request emails per showroom → a composed look → researched suggestions with provenance → the record.
5. Nothing is asserted that a pixel does not support. See §12, which is the list of claims and the frame that proves each one.

**The widget, as it reads on screen** (so the shot list and the captions agree with it):

| part | text |
|---|---|
| header | `PRISM · trace mirror`, and on the right `sink · connected` (or `sink · not set` when the three PRISM variables are missing) |
| sponsor | `sponsor · ZooWork — Managed Agents · LLM + image models` |
| model rail | two cells, `LLM` / `IMAGE`, each with the human name over the wire name (see proof 2 above) |
| rows | one per call: a status dot, the tool (`zoowork.run`, `zoowork.vision`, `zoowork.image_generate`), a duration (or `running` / `failed`), and a note line that ends with the model |
| footer | `{n} model calls · {total}`, then `/trace is the record`; on the canvas a `hide` button |
| replay | `/suggest-looks` appends `· replay` to the sink line, because that page mirrors a recorded research run |

## 3. Constraints

- **Under 2:00, hard.** Target 1:54, which is the SRT's last cue (1:53.66) rounded up and the end card held. That leaves about 6 seconds of slack for one long word, not for a new beat.
- **One narrator, first person.** The founder's voice only. No second voice, no announcer, no on-screen presenter.
- **One screen recorder, one machine.** No second camera, no screen-in-screen, no talking head, no motion-graphics tooling beyond DaVinci Resolve. Cuts, one speed ramp, zoom/position moves, an end card.
- **Recordable in one session on the deployed app.** Local dev has no `ZOOWORK_API_KEY`, so the canvas takes its labelled fallback and the run is not real. The whole video is recorded against the deployment.
- **No invented features.** Every surface used here ships today. `/requests`, `/board`, `/client` and `/suggest-looks` are public design surfaces; `/canvas` calls the real route; `/trace` is a sample trace page, not a live query.

**Surface facts the shot list relies on** (verify once on the deployment, then trust the cut):

| Surface | Real or design surface | What it means for the shot |
|---|---|---|
| `/` | Product page, real | Nothing to be careful about except the "Start a job" dialog |
| `/board` | Seeded design surface (fixtures, client state) | Shortlist and removals are local; nothing publishes |
| `/client` | Seeded design surface (localStorage) | "Send approvals" writes the browser record the bell and `/approved` read |
| `/requests` | Seeded design surface | The agent run is a played-back sequence; no mail is sent; no PRISM widget here today |
| `/canvas` | Real: one POST to `/api/canvas/look` → ZooWork agent → vision → gpt-image-2 → artifact | The only live ZooWork run in the cut, and the only live widget |
| `/suggest-looks` | Recorded research run + real trace data | Widget renders the mirror as a replay, and says so |
| `/trace` | Sample trace of an import run | Say "the record", never "the run you just watched" |

Note on the PRISM widget's home: it renders on `/canvas` (live), `/suggest-looks` (replay of the research run) and the studio's `/studio/jobs/[id]/requests` (behind a login, keyed to real `zoowork.run` trace steps). The public `/requests` surface in the beat sheet does not carry it. That is the one place where the brief and the build diverge, and the cut is honest about it.

## 4. Beat sheet

Every row is one recorded take (S1–S7). Cut between takes freely; cut inside a take only at the frame you planned.

| Cues | Timecode | Route | What the camera sees | Narrator covers (talking points) | Feature proven | Risk |
|---|---|---|---|---|---|---|
| 1–2 | 0:00.0–0:08.6 | `/` | Cold open on the hero: eyebrow "Sample trafficking", the H1 "From screenshots to signed-off looks." at display size, the "Start a job" button, the hairline rule and its paragraph. The look marquee drifts in under the fold by the cut. | What a stylist does today: a folder of runway screenshots, a spreadsheet, a group chat. That is the problem PULL is built against. Name the promise, then move. | Product framing | A static hero reads slow. Start tight on the type, no scroll for the first three seconds, let the marquee carry motion. Never click "Start a job" here: it opens a dialog over the H1. |
| 3–6 | 0:09.1–0:23.3 | `/board` | The review board: "Review board", the client's name large, "Dune Tour" beneath it, the board switcher chevron beside the name, due date and contact on the right. Six houses, five looks each, hairline grid, five per row. Hover one look: the `+` and `×` appear. Press `+` once: green check, olive outline, Shortlist count. Open the Shortlist popover. Then press `×` on another look: the tile is replaced from that house's reserve and a "Taste" line says which look it picked and why. | The agent reads each look, trims the chrome and files it under its house. Every house keeps five; nothing is published until the stylist says so. The board is a working surface, not a gallery. | Filing by house, shortlist, reserve backfill, nothing published | The reserve replacement is the interesting beat; if the Taste line has not appeared, wait for it (it is async). Do not open the Shortlist popover's "Send to client" button: it answers with "needs the database" and breaks the spell. |
| 7–10 | 0:23.8–0:42.0 | `/client` | The client's page: "Your looks", the client name large, "Approve what you love, pass the rest", the live counters ("0 approved · 0 passed · 30 to review"), "Private link". Hover a look: approve, brush, pass appear. Approve two looks. Press the brush on a third: the markup dialog ("<house> · look N", "Circle the pieces you want. Nothing outside the rings is requested."), draw one ring on a garment, "Save markup". The ring sits on the thumbnail. Press "Send approvals": the header says "Sent — Juje has the approved looks and your markups". Then the hand-off: the next page with the site header shows the bell, the bell popover reads "… approved 2 looks for Dune Tour · 1 with markup · new", and one click opens the approved board with the ring back on the studio side. | One link, no account, no install. The client's decision and the rings come back to the studio attached to the look, not as a paragraph in a text message. | Login-less client link, approve/pass, markup | The dialog is modal and the cursor is the only evidence. Draw slowly enough to read. Do not approve everything: leave the "to review" count non-zero. |
| 11–14 | 0:42.5–0:59.1 | `/requests` | The request screen: client name, "3 brands · 1 approved · 0 sent", the agent button in the header ("Redraft requests" on the seeded surface). Press it: the AgentRun strip fills one `agent.draft` row per house, then three drafts appear, one per house, each with the two approved looks as thumbnails, To / Subject / Body. Scroll one body far enough to read the "Shoot details" block: shoot date, call-in date, return date, ship to. If the PRISM widget is wired on this surface, it appears with the model rows; today it is wired on the studio requests route, not the public one (§6). Press **Approve** on one card only: the badge flips Draft → Approved, Send becomes enabled. | One email per showroom, written from the approved looks, with the shoot, call-in, return and ship-to already in it. Two gates: approve, then send. Nothing leaves the studio on one click. The calls behind the drafting are the ones PRISM mirrors. | Drafting per house, the shoot/call-in/return/ship-to block, the approve gate | The seeded surface already has drafts, so the button reads "Redraft requests". Do not press Send: this surface does not send mail and the badge would claim otherwise. There is no PRISM widget on the public `/requests` surface today (it landed on the studio route, which needs a login and a seeded job). Do not claim a live ZooWork call on this beat unless the widget is actually in frame; the canvas beat is the live proof and the widget quota is met by canvas plus suggest-looks. |
| 15–20 | 0:59.6–1:27.5 | `/canvas` | The node graph: four "Image" reference cards wired into "Look compose", then "Save image". Press "mark" on one garment reference, drag a red border around the piece, press "done". Press Run. The PRISM widget opens bottom-left with a running `zoowork.run` row, then `zoowork.vision` (reading the references), then `zoowork.image_generate` (rendering). The compose card shows the phase text as it happens. The render lands, the assets panel slides out, the asset count increments, the widget resolves to two rows with real durations and both models named. | ZooWork does the heavy lifting: it reads the four references and the border the stylist drew, writes the prompt, and gpt-image-2 renders at 1024x1024. The prompt on the card is the one the model wrote, and it is editable. The whole run is observable, timed and mirrored. | Real ZooWork vision + image call, prompt authorship, artifact render, both models named, PRISM rows | A real run takes 60–80 seconds, longer than this beat allows. The recorded footage is speed-ramped (§7) and the final widget frame is frozen. The run can fail; if it does, retake, never hide the failure. |
| 21–23 | 1:28.0–1:41.2 | `/suggest-looks` | "Skill · suggest looks", the H1, the meta line (client, research date, sources, associated houses, collections, looks). Scroll through "The record" cards (house + the moment that names it) into "The runway": per-house collections with eight looks each and a "Vogue Runway →" provenance link. Land on "What the agent did": the research trace, then the PRISM widget beside it. | The suggestions are researched, not guessed: the client's own record names the houses, and every collection links back to the Vogue Runway page it came from. The trace says which calls produced the answer. | Provenance, research trace, PRISM beside the trace | This run is recorded data, and the widget says so if it is a replay. Do not fast-count the rows; land on the provenance links and hold. |
| 24–26 | 1:41.7–1:53.7 | `/trace` | "Sample trace", the H1 "Every tool call, in the open.", the provider badge, then rows: tool name, OK or Error with duration, and the expandable Input / Output blocks. Open one row's arguments. Cut to the PRISM widget (or back to the finished canvas widget frame) for the credits cue at 1:46.3, then the end card at 1:50.1. | Every tool call carries its arguments, its result, how long it took and whether it failed. The record is the app's; PRISM is the mirror. Models by ZooWork, traces by PRISM. | Trace completeness, sponsor credit | `/trace` is a sample run page, so the narration says "the record", not "the run you just watched". There is no PRISM widget on `/trace` today: if it has not landed by shoot day, cut back to the canvas widget frame for the sponsor line. |

Runtime arithmetic, taken from the SRT's own cue windows: 8.6 + 14.2 + 18.2 + 16.6 + 27.9 + 13.2 + 12.0 = about 110.7 seconds of speech (1:50.7), with the natural gaps between beats filling out to the last cue at 1:53.660. The cut is 1:54, with the end card holding from the start of cue 26 (1:50.1) to the final frame.

## 5. Click path per shot

### S1 — Landing, cues 1–2

1. Open the deployed origin. Confirm the viewport is the recording viewport and the page is at the top.
2. Hold. Do not scroll for the first three seconds; let the type land.
3. One slow scroll, about 200 px, so the marquee enters frame. Stop.

Do not: click "Start a job", open the menu, or scroll to the pricing section. This shot is 8.6 seconds, and the SRT gives cues 1 and 2 their own lines in it.

### S2 — Board, cues 3–6

1. Menu (two hairlines, top right) → **Board**. Wait for the Taste chips to appear above the grid (they read the photographs, so they arrive a beat late).
2. Move the cursor to the middle house's second look and pause so both hover glyphs are on screen.
3. Press `+` on that look. Press `+` on a second look in another house.
4. Open **Shortlist** (top right) so the count and the thumbnails are visible, then close it.
5. Hover a third look and press `×`. Wait for the replacement tile to appear and for the "Taste · look NN — …" line to show under the header.
6. Optionally open the board switcher to show the other two boards, then close.

Do not: press "Send to client" in the Shortlist popover (it answers "Held in the browser… needs the database"), remove a house from its header (that takes five looks off at once and the grid jumps), or reload. The board is seeded, so a reload returns it in the same state but loses the shortlist.

### S3 — Client, cues 7–10

1. From the board, go to `/client` (menu → **Client page**, or the URL).
2. Hover a look, press the green check on two looks in different houses.
3. Press the brush on a third look. In the dialog, drag one closed ring around a garment (a slow loop, one shape, no scribble). Leave the description line in frame for a beat: "Circle the pieces you want. Nothing outside the rings is requested." Press **Save markup**.
4. Press **Send approvals**. The header flips to "Sent — Juje has the approved looks and your markups" and the button is replaced.
5. This step is not optional: cue 10 ("that markup comes back to your board") needs a frame. Load a page in the site group (the next beat's route does it), open the bell, and hold on the popover row: "… approved 2 looks for Dune Tour", "1 with markup · new", "See the approved looks and markups". One click opens `/approved`, which shows the ring back on the studio's copy of the look. Hold that for about a second, then go to the requests beat. If the bell shows nothing, the browser profile is not the one that sent the approval; use the URL path instead (`/approved`) rather than re-recording the client beat.

Do not: reload `/client` after sending (it reopens the sent state, which is fine, but a mid-take reload looks like a mistake), clear the markup, or press "Hide all markup" after drawing.

### S4 — Requests, cues 11–14

1. Get to the route. `/client` has no site menu, so either press the browser's back button to return to a page group with the header and use the menu → **Request emails**, or open `/requests` by URL (the chrome is cropped, so URL navigation is invisible). The seeded surface opens with three drafts and the first card already Approved.
2. Press the agent button in the header. On the seeded surface its label is **Redraft requests**. Do not wait for a label change; the run starts on the press.
3. Let the AgentRun rows land (one per house, roughly two seconds total), then scroll the first card into frame: thumbnails, To, Subject, Body.
4. Scroll inside the first body until the "Shoot details" block is readable: shoot date, call-in, return, ship to.
5. Skip the widget on this surface: it is not rendered on the public `/requests` page. If the Lead wires it before shoot day, scroll it into frame and hold for two seconds; if not, the beat carries the drafts and the gate, and the widget appears in the canvas and suggest-looks beats.
6. Press **Approve** on the second card so the badge flips Draft → Approved and its Send button becomes enabled. Do not press Send.

Do not: press Send (this surface does not send mail), edit the To address into something invalid (the card says "No showroom address — the request cannot be sent"), press "Polish" (it is a stand-in rewrite, and the beat does not need another agent claim), or say the drafts called a model on this surface. The drafting here is the deterministic template; the AI path exists on the studio route, which this beat does not film.

### S5 — Canvas, cues 15–20

1. Menu → **Studio** (`/canvas`). Do not resize or reload; the graph is client state and a reload throws away the run.
2. Press **mark** on the second reference card (a garment), drag one red border around the piece, press **done**. The border stays on the card and is baked into the copy the vision model reads.
3. Press **Run** (top right). The PRISM widget opens bottom-left with `zoowork.run`, then `zoowork.vision`, then `zoowork.image_generate`; the compose card prints the phase it is on. About a fifth of a second later the graph re-frames itself to give the widget its strip of the frame: let it, and do not press **Fit** to "fix" it.
4. Do not touch anything while it runs, and do not open or close the assets panel: it steals width from the canvas and re-fits the graph under the camera.
5. When the render lands: the asset panel slides out, the asset count increments, the widget resolves to two rows with durations. Hold on the widget.
6. Optional, after the hold: the compose card now shows the prompt the model wrote ("written by the assistant · editable"). Pan to it for two seconds.

Do not: reload the canvas, press Run twice (the guard blocks the second press but the camera sees the click), press **Fit** mid-run, dismiss the widget with **hide**, switch tabs, or change the window size. All of those either reset the run or lose the durations that the acceptance criteria need.

### S6 — Suggest looks, cues 21–23

1. Menu → **Suggest looks**.
2. Scroll through "The record" at a readable speed. Stop once with two house cards and their dates in frame.
3. Continue to "The runway". Hold where a collection header and its "Vogue Runway →" link are visible with the tiles.
4. Land on "What the agent did": the research trace, then the PRISM widget below it.

Do not: click a collection link (it opens vogue.com in a new tab and the take ends there), or scroll into the "Sources" list and read it out; the links do that work visually.

### S7 — Trace and close, cues 24–26

1. Open `/trace` directly by URL. The chrome is never in the frame, so navigation is invisible.
2. Hold on the header, then scroll one screen to the first rows: tool, OK/Error, duration.
3. Expand one row (native disclosure) so Input and Output are on screen. Hold.
4. Cut to the finished canvas widget (or the widget on `/trace` if it has landed) as cue 25 names the credits at 1:46.3, and hold it through 1:50.1.
5. End card from the start of cue 26, 1:50.1, to the final frame at 1:54.0.

Do not: read the Shippo error row aloud as a failure of this run (it is a sample trace), or claim `/trace` is the trace of the canvas run.

## 6. Pre-production checklist

Work top to bottom; stop at the first red.

**Deployment (do this the day before, not the hour before)**

- [ ] Deploy the current build to the Vercel project. Set, in the project's environment for Production: `ZOOWORK_API_KEY` (secret), `ZOOWORK_ENABLED=true` (the canvas checks for the literal string `true`), `PRISMTRACE_HOST=https://prism.blockconvey.com`, `PRISMTRACE_PROJECT_ID`, `PRISMTRACE_API_KEY`. Optional: `ZOOWORK_MODEL` to pin the agent's LLM.
- [ ] Redeploy after setting them. Vercel applies environment changes on a new deployment, not on the old one.
- [ ] Confirm the deployment can run a 60–80 second function. `/api/canvas/look` declares `maxDuration = 300`; if the plan caps function duration below the run, the run dies at the cap with no result line.
- [ ] Open `/canvas` on the deployment and press Run once, unrecorded. This is the warm-up: the first run creates and starts the ZooWork agent (the code waits up to 45 s for it) and may take longer than the recorded run. Confirm the render lands. Do not record this one.
- [ ] Confirm the widget on `/canvas` shows `sink · connected` when the run finishes. If it reads `sink · not set`, `PRISMTRACE_HOST`, `PRISMTRACE_PROJECT_ID` and `PRISMTRACE_API_KEY` are missing on the deployment: set them and redeploy before shooting. Do not shoot the widget with the sink off; the sink state is a line a judge reads.
- [ ] `npm run prism:check` against the same values (from `.env.local` or with the vars exported). Expect `ingest 200 ok` and `health connected`, exit 0. This is the sink test, not the deployment test: the deployment has its own copies.
- [ ] Press Run on `/canvas` a second time and time it. This is the number the speed ramp is planned against. Write it down.
- [ ] Note that the widget's LLM cell names the model the ZooWork agent was actually provisioned with. On a cold agent that is `Gemini 3.8 Flash` (`gemini-3.8-flash`). If the cell reads something else, the agent already exists with another primary model: either accept that name on screen and in the narration, or recreate the canvas agent / unset `ZOOWORK_MODEL` before recording. Never relabel the cell in post.
- [ ] Open `/requests` and confirm the public surface still has no PRISM widget (it is wired on `/studio/jobs/[id]/requests`, which needs a login and a seeded job). Decide now: shoot the beat as specified and let the canvas and suggest-looks beats carry the widget quota, or have the Lead wire the public surface before shoot day. Do not wait until the edit to discover it.
- [ ] Open `/studio/jobs/[id]/requests` once, logged in, and confirm its widget renders when a real `zoowork.run` step exists. This is background: the beat sheet does not film the studio route, but the fact decides whether a studio-route take is even possible if the public surface stays unwired.
- [ ] Confirm `/suggest-looks` shows the widget beside the research trace and that it reads `· replay` (that page mirrors a recorded research run, and the marker is the honest part of the shot).
- [ ] Open `/trace` and confirm whether it carries a PRISM widget. If it does not, plan the cut-back to the canvas widget frame for the sponsor line.

**Content**

- [ ] The requests beat needs no database seeding. `/requests` seeds two approved looks per house from the fixtures itself. Seeding (`npm run demo:seed`) is only for studio routes, and this cut films none of them. Do not say the drafts came from a stored job.
- [ ] No OCR pre-warm is needed for this cut. Tesseract only runs on the import flow (`/studio`), which is not filmed. If someone adds an import shot, pre-warm it first: `/studio` → import → "Use the 10 sample looks" → wait for READY.
- [ ] Do not film `/setup`, the magic-link screen, the contacts book, or any settings page. They carry env status, real addresses, or vendor config.

**Machine and browser**

- [ ] Recording display set to 1920x1080 (the timeline size), browser zoom 100%, page viewport exactly 1600x900 inside the window (16:9, so nothing is distorted when it is scaled to 1080p).
- [ ] Bookmarks bar hidden, one tab only, no pinned tabs, no extensions toolbar, no devtools.
- [ ] Same browser profile used for every take. `/client` writes the approval into that profile's localStorage and the bell, `/approved` and the studio's Approved tab read it back. A different profile and the hand-off does not exist.
- [ ] macOS Do Not Disturb on, notifications off, Slack and mail quit, phone face down, screen saver and sleep disabled, no scheduled backups.
- [ ] Cursor visible in the recorder, at a readable size. Keep mouse movement slow and purposeful; no circling the pointer while thinking.
- [ ] Recorder configured: 60 fps, region = the page area only (not the window, so the chrome never reaches the cut), system audio muted, microphone off, cursor capture on.
- [ ] Free disk space for 60 fps capture, and a test recording longer than 80 seconds to confirm no dropped frames.

**Script and voice**

- [ ] The SRT exists, its 26 cue windows match §4, and its text has been walked against §12's "cues that outrun their frames" before the voice is rendered. Any cue that needs a re-record is re-recorded then, not after the picture is cut.
- [ ] Voice generated from the SRT text and paced to the SRT itself (about 126 wpm overall; see the cue budget in §8). Listen once with a stopwatch against the timecodes in §4; note which cues run long.
- [ ] One dry run of the voice against the beat list, no picture, to hear the total length. The SRT ends at 1:53.66; if the read is longer, mark pauses for trimming before touching the timeline.

## 7. Capture spec

- **60 fps, 1920x1080 recorder canvas.** Source footage keeps the extra frames for the one speed ramp; the export is 1080p.
- **System audio muted.** Narration is recorded separately and laid in during assembly. No key clicks, no music from the machine.
- **One continuous take per beat.** Start the recorder before the page is touched, stop it after the beat's last frame. Name the files `S1-landing.mov` … `S7-trace.mov`. Cuts between takes are free; a cut inside a take is a re-take.
- **The canvas take is one continuous take that includes the whole run.** Do not stop the recorder during the 60–80 second render, and do not try to record it in fragments. The ramp is applied to one clip.
- **Plan the ramp before the take.** The canvas beat's window is 0:59.6–1:27.5, 27.9 s, and about 7 s of that goes to the graph, the mark, and the render landing, so the run segment has roughly 18–20 s. An 80 s run in 18 s is a 4.4x ramp. Target 4x–8x; never above 8x, because the streaming phase text becomes unreadable and the run looks fake. Numbers: 80 s at 4x is 20 s, at 6x is 13 s, at 8x is 10 s. Pick the speed that lets the beat hold the finished widget for at least 2.5 s at 100%.
- **Record the widget hold at 100% speed.** The ramp applies to the run only. The final widget frame with both durations and both model names is not sped up, not blurred, not scaled below 85%.
- **Take head and tail handles.** Two seconds of stillness before the first click and after the last on every take, so a cut has somewhere to land.

## 8. Resolve assembly spec

Project: 1920x1080, 30 fps timeline, 48 kHz audio.

| track | content |
|---|---|
| V1 | Screen capture, scaled to fill 1920x1080. No scaling above 1.25x; if a shot needs a push, use a Transform zoom on a duplicated clip instead of re-scaling the source. |
| V2 | Optional: the look render as a still, held over the canvas cut if the render lands off-frame. Do not composite anything else. |
| A1 | Voice, from the ElevenLabs render of the SRT text. One continuous file, cut and nudged to the beats. |
| A2 | Music bed. Low, no vocals, ducked under the voice: about -20 dB under speech, back up in the gaps and under the end card. Fade out over the final 1.5 s. |
| S1 | Subtitles, imported from `docs/epics/pull-submission-video.srt`, burned into the export. |

**Assembly rules**

1. Lay the voice first, against the beat timecodes. Picture follows the voice, not the other way round.
2. **If the voice runs over, trim pauses in Resolve rather than padding the cut.** Silence between sentences comes out (split, delete, ripple delete) until the voice fits the beat. Never stretch a shot, never slow a hold below 100%, never add a beat.
3. One speed ramp only: the canvas run segment. In Resolve, right-click the clip → **Change Clip Speed** (or Retime Controls), set the percentage, and leave the ramp constant so the numbers that stream by stay honest.
4. Zoom-ins: two, both simple Transform keyframes, both under 1.2x. One on the PRISM widget's model rail on the canvas beat, one on the look render as it lands. No pan-and-scan elsewhere: the app's own type is the design.
5. No title cards. No lower thirds. No logo animation. The only graphic is the end card.
6. End card, on black, from 1:50.1 (the start of cue 26) to the final frame at 1:54.0: "PULL — from screenshots to signed-off looks." and beneath it, smaller, "Models by ZooWork · Traces by PRISM". Cue 25 speaks the credit over the widget at 1:46.3 and cue 26 speaks the product line over the card, so the captions and the card agree.
7. Captions: burn in. Check that no caption crosses a cut it does not belong to, and that no caption sits over the widget rows you need read.
8. Export: H.264, 1920x1080, 30 fps, high quality, audio AAC 48 kHz. File name `pull-submission.mp4`. Watch it end to end in QuickTime and once in a browser before submitting.

**Cue budget, measured from the SRT** (26 cues, 233 words of cue text). This is the timing the picture is cut against. It is a budget, not a script:

| Cues | Window | Seconds | Words | Implied pace |
|---|---|---|---|---|
| 1–2 | 0:00.0–0:08.6 | 8.6 | 20 | ~140 wpm |
| 3–6 | 0:09.1–0:23.3 | 14.2 | 29 | ~123 wpm |
| 7–10 | 0:23.8–0:42.0 | 18.2 | 41 | ~135 wpm |
| 11–14 | 0:42.5–0:59.1 | 16.6 | 35 | ~127 wpm |
| 15–20 | 0:59.6–1:27.5 | 27.9 | 58 | ~125 wpm |
| 21–23 | 1:28.0–1:41.2 | 13.2 | 28 | ~127 wpm |
| 24–26 | 1:41.7–1:53.7 | 12.0 | 22 | ~110 wpm |

Overall the SRT is written at roughly 126 words per minute, not 150. Generate each cue with ElevenLabs' speed control set to hit its own window (slow it down if the default take finishes early), and check cue 1 against 3.5 s before rendering the other 25. If a take cannot be made to fit, re-time the SRT; never change the cue count or the beat order.

## 9. Acceptance criteria

Binary. Every line must be yes before the file is submitted.

- [ ] Runtime is 1:54, within 3 seconds either way, and under 2:00.
- [ ] Cues 1–26 are all present, in order, each inside its timecode window within about one second.
- [ ] A live ZooWork run completes on screen: the render lands, the assets panel opens, the asset count increases.
- [ ] Both model names are legible in the final cut at least once: "Gemini 3.8 Flash" and "GPT Image 2", each with its wire name (`gemini-3.8-flash`, `gpt-image-2`) on the same cell.
- [ ] The PRISM widget is visible in at least two different beats.
- [ ] The widget's finished durations are readable at 100% speed for at least 2.5 seconds.
- [ ] The "Look compose" card shows the prompt the assistant wrote ("written by the assistant · editable").
- [ ] The requests beat shows the shoot / call-in / return / ship-to block, and the Send control is disabled until Approve is pressed.
- [ ] The client beat shows a drawn markup ring coming back on the studio side: the bell popover line and/or `/approved` with the ring visible.
- [ ] The suggest-looks beat shows at least one collection's Vogue Runway provenance link.
- [ ] The trace beat shows at least one expanded row with arguments and output.
- [ ] The sponsor line "Models by ZooWork · Traces by PRISM" is on screen, and ZooWork is credited as the sponsor in the widget header.
- [ ] No claim in the narration is unsupported by the frame it plays over (§12).
- [ ] No replay is narrated as a live call. If a surface is replaying a recorded run, the cut says so or the narration does not claim otherwise.
- [ ] Voice is intelligible, single, no clipping, no clicks, no system sounds; music sits under it.
- [ ] Captions match the voice word for word, and the final cue carries the end-card lines.
- [ ] Nothing personal is on screen: no notification, no other tab, no key, no inbox, and no client or showroom contact beyond the demo fixtures (the demo client name is fixture data and is fine).
- [ ] The export plays in QuickTime and in a browser, and the file is what gets uploaded.

## 10. Risks and fallbacks

| Risk | What it looks like | What to do |
|---|---|---|
| The ZooWork run overruns its beat | The run is still going at 1:28, or the measured run is over ~100 s | Already planned for: ramp harder up to 8x and take the hold out of the freeze. If even 8x cannot fit, the take is unusable as a live beat; stop and retake when the queue is quieter. Do not cut a 3-minute run into 20 seconds, it reads as fake. |
| The run fails | The compose card shows an error, the panel shows "provider unavailable — …", and the widget's running rows turn into failed rows with the reason | Retake. The labels are honest and stay in the frame if it happens on camera; it is not a shot you can use for the acceptance criteria. There is no fallback that satisfies "a real run completes", so the shoot moves. |
| PRISM sink offline | The widget reads "sink · not set" | Fix it before shooting: set the three `PRISMTRACE_*` variables on the deployment and redeploy, then confirm `sink · connected` on a warm-up run. If PRISM itself is down on the day and the variables are set, the dot may still read not-connected: shoot anyway, never hide the widget, never say "connected", keep the credit line (it is where the mirror goes), and note the outage in the post copy rather than in the video. |
| The widget is not on the requests beat's surface | The public `/requests` page has no widget; the widget landed on the studio requests route, which needs a login and a seeded job | Expected, not a fault. The beat carries the drafts and the two gates; the widget quota is met by canvas and suggest-looks (§9 says two beats, and that is what the cut has). If the Lead wires the public surface before shoot day, take the extra two seconds there. Do not film the studio route to force it into this beat. |
| `/trace` carries no widget | The page ends at the sample rows | Cut back to the finished canvas widget frame for the credits cues (1:46.3 onward) and the sponsor line. Do not invent a widget. |
| Login or database unavailable | A studio route redirects, or a page errors | No beat needs either. All seven routes in the cut are public; if one starts asking for a session, the deployment is wrong, not the shot. Fix the deployment, do not film around it. |
| The function is killed at the platform cap | The stream ends with no result line, the canvas shows an error | Check the deployment's function duration limit before shoot day and against the warm-up run. If the cap is under the run, the canvas beat cannot be recorded there; move the deployment. |
| Voice timing drift | The ElevenLabs read is 6–10 seconds long for the cut | Trim pauses per §8 rule 2 and re-time the SRT. Never pad the picture. If a cue still cannot fit, cut the words, not the widget hold. |
| Cold start or a slow first run | The first run takes 100 s or more | The warm-up run exists for this. Do the warm-up immediately before recording, and keep the app warm between takes by not idling for ten minutes. |
| Dropped frames during the ramp | Visible judder in the sped-up run | Record 60 fps, ramp on a 30 fps timeline, and check the ramp clip at 100% zoom before export. If it judders, re-record the canvas take. |

## 11. What we cut if we must lose 15 seconds

Cut in this order, and only until the 15 seconds are found. If a cut moves a beat, the SRT is re-timed by the Lead and the corresponding cues are re-recorded; the talking points do not change.

1. Board: drop the board switcher open/close and one house of scrolling. 4 s.
2. Client: drop the second approval and the bell popover; one approve, one markup, send. 3 s.
3. Requests: stop scrolling the email body after "ship to"; do not show To/Subject fields. 3 s.
4. Suggest looks: cut from the record cards straight to one runway row instead of two. 3 s.
5. Trace: cut the expanded row's output block; keep the arguments. 2 s.

Never cut: the render landing with the asset count, the finished widget frame with both models and both durations, the sponsor line, the end card. Those are the four things the judges are looking for.

## 12. Claims and proof

Read this before recording the voice. Every claim needs a frame. If the frame is not in the cut, the claim comes out.

| Claim (the idea, not the wording) | The frame that proves it |
|---|---|
| The agent files looks by house, one look at a time | The board: six house headers, five tiles each, look number and season under every tile, the Taste chips reading the pattern |
| A house keeps its five; the board refills itself | Press `×`: the tile is replaced and the "Taste · look NN — …" line names the replacement |
| Nothing is published until the stylist says so | No publish happens anywhere in the cut; the client link is a separate step the video does not pretend to take |
| The client needs no account | The client page: "Private link", no sign-in, decisions happen in one pass |
| The client's markup is the selection, and it comes back | The markup dialog's line "Nothing outside the rings is requested", the ring on the thumbnail, then the bell popover ("1 with markup · new") and `/approved` showing the ring back on the studio side |
| One email per showroom, built from the approved looks | Three draft cards, one per house, each carrying its two approved looks as thumbnails |
| The email already carries shoot, call-in, return and ship-to | The "Shoot details" block in the body |
| Nothing sends until a human approves | Send disabled on a Draft card, enabled only on the Approved one; the beat never presses Send |
| ZooWork reads the references and the drawn border | The red border drawn on the card, then the phase text while it runs, then the compose card's "written by the assistant · editable" prompt |
| gpt-image-2 renders the look | The render in the assets panel, the Generations entry labelled `gpt-image-2`, the widget's IMAGE cell and row |
| Every model call is observable, timed and carries its model | The widget: two rows, `zoowork.vision` and `zoowork.image_generate`, each with a duration, a model name, and the footer's model-call count |
| PRISM is the mirror, the app's trace is the record | The widget header naming PRISM and the sink state, plus the footer "is the record", plus the `/trace` beat |
| The suggestions are researched, not guessed | The record cards naming the moment, the Vogue Runway links, the sources list, the research trace |
| Every tool call carries its arguments, result, duration, status | One expanded `/trace` row with Input and Output visible |

**Cues that outrun their frames.** The SRT is the Lead's; this is the list of places where its cue text assumes something the filmed surfaces do not show. Walked on 2026-11-07: cues 8, 13 and 23 were re-recorded in the SRT (rev 2, same cue count, same windows, same word counts) and are resolved below. Cues 3 and 4 are accepted, with the reason stated.

| Cue | Window | The gap | Resolution |
|---|---|---|---|
| 3 | 0:09.1–0:11.4 | It asks for a folder drop, and the board beat opens on a board that is already filed. No import footage exists in this cut. | Accept: the line is an instruction into the workflow, and the filed board is the evidence that the folder was read. If it grates when cut, the Lead re-records it as the board's state. |
| 4 | 0:11.7–0:15.2 | It names the caption read and the trim; the board shows only the result (look number and season under each tile). | Accept: the result is on screen, the operation is not. Do not add an import shot; it costs the board's 14 seconds. |
| 8 | 0:29.2–0:32.7 | It named a star control. The public `/client` surface has approve, markup and pass, no star. The DB-backed `/b/[token]` board does have 1–3 priority stars. | Resolved in the SRT: it now reads the page's own sentence, "They approve what they love, and pass the rest." No star is implied, the window is unchanged, and the markup cue follows. Moving the beat to `/b/[token]` was rejected: it needs a job, a database and a publish. |
| 13 | 0:51.8–0:55.3 | It said the email sends. The cut stops at the approve gate and never presses Send, because the public surface does not send. | Resolved in the SRT: "You read it, edit it, and approve it." The send gate stays in the epic's talking points and cue 14; the frame proves the approve gate, and no frame claims mail left. Do not press Send to manufacture the shot. |
| 23 | 1:35.2–1:41.2 | It said every look links to its source. The page links each collection to Vogue Runway; the tiles themselves are not links. | Resolved in the SRT: "each collection linked to its source." Matches the page. |

**Do not say, because the frame does not exist:**

- That an email was received by a showroom, or that the request was sent. Nothing in this cut sends mail.
- That the looks were imported on camera. The board is seeded from the fixture set.
- That the agent read these captions from these screenshots on camera. The filing is real product behavior; the import is not in the cut.
- That `/trace` is the trace of the canvas run you just watched. It is a sample run page.
- That PRISM is a provider or a model vendor. It is the observability sink; ZooWork provides the models.
- Any model name that is not on screen, any price, any customer, any partner.
