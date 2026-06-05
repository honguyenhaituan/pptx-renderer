# Architecture

`@aiden0z/pptx-renderer` follows a three-stage pipeline:

1. Parse
2. Model
3. Render

## 1) Parse Layer

Core modules:

- `src/parser/ZipParser.ts`
- `src/parser/XmlParser.ts`
- `src/parser/RelParser.ts`

Responsibilities:

- Open PPTX ZIP package and read entry files.
- Enforce resource limits (`ZipParseLimits`) to reduce DoS surface.
- Parse OOXML + relationship targets into safe intermediate structures.

## 2) Model Layer

Core modules:

- `src/model/Presentation.ts`
- `src/model/Slide.ts`
- `src/model/nodes/*`
- `src/search/TextSearch.ts`

Responsibilities:

- Build normalized in-memory presentation model.
- Resolve layout/master/theme inheritance.
- Parse node-level geometry, text, style, and relationship references.
- Build model-level text indexes and search results that are independent of mounted DOM.

## 3) Render Layer

Core modules:

- `src/core/Viewer.ts` — `PptxViewer` (primary API, extends `EventTarget`)
- `src/core/Renderer.ts` — `PptxRenderer` (deprecated v1 wrapper, extends `PptxViewer`)
- `src/renderer/SlideRenderer.ts` — returns `SlideHandle` with per-slide resource lifecycle
- `src/renderer/*Renderer.ts`

Responsibilities:

- Convert model into DOM elements per slide.
- Handle list/single-slide render modes via `renderList()` / `renderSlide()`.
- Instance-level `open()` for one-call parse→build→render (static `PptxViewer.open()` delegates to this).
- Render lifecycle events: `renderstart` / `rendercomplete` bracket every render cycle; `slidechange` fires after render.
- A newer render request supersedes older queued or batched work; stale list batches stop at frame boundaries before appending more DOM.
- Typed `on()` / `off()` helpers and state getters (`isRendering`, `zoomPercent`, `fitMode`).
- Manage media object URL lifecycle (blob URLs tracked per-handle and per-viewer).
- Handle internal/external navigation (with URL safety checks).
- Expose external slide rendering, scaled thumbnail preview, and search highlight helpers.
- Render common EMF fallback previews when the file contains embedded bitmap data or,
  with optional `pdfjs` URLs, an embedded PDF preview.

## Rendering Strategies

`renderList()` supports:

- Default (`windowed: false`): mount all slide DOM nodes.
- Windowed (`windowed: true`): mount near-viewport slides via `IntersectionObserver`, with fallback to full mode when unavailable.

This keeps default behavior backward compatible while enabling lower memory pressure for large decks.

## Search, Highlights, and Scaled Previews

Text search is a model-layer feature. `buildTextIndex()`, `searchText()`, and
`searchPresentation()` read normalized shape, table, and group text from `PresentationData`
instead of scanning rendered DOM nodes. `PptxViewer.searchText()` is the viewer-level
convenience wrapper around the same search model.

String queries default to case-insensitive matching and can opt into exact casing with
`matchCase: true`. RegExp queries keep caller-provided flags; the search layer only adds
`g` so all matches can be collected.

Search results return `TextSearchResult` metadata such as `slideIndex`, `nodeId`,
`nodePath`, match offsets, snippet text, and node `bounds`. The bounds are intrinsic
slide coordinates for the matched shape or table cell owner. This keeps the public API
stable even when a slide is not currently mounted.

`highlightSearchResult()` is a DOM helper for the common viewer UI case. It draws a
node-level overlay using default highlight styling, and accepts `SearchHighlightOptions`
for custom class names, border colors, background colors, shadows, padding, radius, and
z-index. The returned `SearchHighlightHandle` is owned by the caller; call
`dispose()` or `clearSearchHighlights()` to remove overlays.

The renderer intentionally does not provide character-level text highlighting today.
Mapping match offsets back to shaped Office text runs, wrapped lines, bullets, and
vertical text is a separate renderer problem. The current boundary is model-level search
plus node-level highlight overlays.

`renderThumbnailToContainer()` renders a slide at intrinsic size and scales the result
with CSS transforms inside a clipped wrapper. It is a scaled DOM/SVG preview for
navigation surfaces, not a separate bitmap generation pipeline. The caller owns the
returned `SlideHandle` and must dispose it when the preview is no longer needed.

## Design Constraints

- Keep parser/model deterministic for reproducible QA runs.
- Keep rendering resilient: per-node/per-slide failures should not crash the whole deck.
- Keep security boundaries explicit at parse and navigation boundaries.
- Keep optional heavy dependencies such as `pdfjs-dist` outside the core render path unless
  the consumer explicitly configures them.

## Non-Goals (Current)

- Full fidelity parity with Microsoft PowerPoint for every OOXML edge case.
- Server-side rendering runtime in this repository.
- Full EMF/WMF vector instruction rendering. EMF support is limited to fallback previews.
