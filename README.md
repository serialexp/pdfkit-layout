# pdfkit-layout

A layout system for [PDFKit](https://pdfkit.org/) that gives you a CSS-like box
model on top of PDFKit's drawing primitives. Position elements **proportionally**
(percentages of their parent) or **absolutely** (fixed points), nest them into a
tree, and lay children out automatically with a **flexbox-style** container.

It ships four composable building blocks:

- **`Box`** — a container with positioning, padding, margin and borders
- **`Text`** — text with font size, color, and horizontal/vertical alignment
- **`Image`** — an image fitted into a box (`contain` or `cover`)
- **`FlexBox`** — a flexbox container that sizes and positions its children for you

All four can be freely mixed in the same tree, and everything is rendered with a
single call to `layout(doc, root)`.

## Installation

```bash
npm install --save pdfkit-layout
# or
yarn add pdfkit-layout
# or
pnpm add pdfkit-layout
```

`pdfkit` is a peer dependency — install it alongside this package.

## Quick start

```typescript
import PDFDocument from "pdfkit";
import fs from "fs";
import { Box, Text, Image, layout } from "pdfkit-layout";

const doc = new PDFDocument({ size: "A4" });
doc.pipe(fs.createWriteStream("out.pdf"));

// A proportional box that fills the page content area, split into a
// header, an image, and a caption.
const root = new Box({ width: "100%", height: "100%", padding: 10 });

root.addChildren(
  new Text({
    x: 0, y: 0, width: "100%", height: "10%",
    text: "Hello, World!",
    fontSize: 24,
    align: "center",
    verticalAlign: "center",
  }),
  new Image({
    x: 0, y: 0.1, width: "100%", height: "70%",
    src: "static/tools1.jpg",
    fit: "contain",
  }),
  new Text({
    x: 0, y: 0.8, width: "100%", height: "20%",
    text: "A caption underneath the image",
    fontSize: 12,
    color: "#666666",
    align: "center",
    verticalAlign: "top",
  }),
);

layout(doc, root);
doc.end();
```

## Core concepts

### Measurement modes

Every node is positioned in one of two modes via the `measure` property
(default: `"proportional"`):

| mode | `x` / `y` | `width` / `height` |
| --- | --- | --- |
| `"proportional"` | fraction of the parent's content area (`0`–`1`) | fraction of parent (`0`–`1`, or a `"50%"` string) |
| `"absolute"` | fixed points from the page origin | fixed points |

In proportional mode you can express sizes either as a number in the `0`–`1`
range (`width: 0.5`) or as a percentage string (`width: "50%"`). **Only the `%`
unit is accepted in strings** — any other unit throws.

A proportional node needs either a parent box or a page to resolve against. The
root node resolves against the page's content area (page size minus margins).

### The tree

Boxes form a tree with `addChild()` / `addChildren()`. Child coordinates are
relative to the parent's **content area** (its bounds inset by the parent's
`padding`). This nests recursively, so a proportional child of a proportional
child of a proportional root all compose cleanly.

```typescript
const outer = new Box({ width: "100%", height: "100%", padding: 20 });
const inner = new Box({ x: 0, y: 0, width: "50%", height: "50%" }); // 50% of outer's content area
outer.addChild(inner);
```

### Rendering & clipping

`layout(doc, root)` walks the tree and draws everything in one pass:

1. FlexBox layout is computed first (if the node is a `FlexBox`).
2. The node clips drawing to its own bounds, then renders its image (if any),
   then its children, then its text (text always draws on top).
3. The border is stroked last, after the clip is released, so a wide border
   renders at full width centred on the box edge.

Because each node clips to its bounds, content never spills outside its box:
`Image({ fit: "cover" })` is trimmed to the box, and `measure: "absolute"`
children placed outside their parent are clipped at the parent boundary instead
of leaking out.

> `draw` is exported as an alias for `layout` for backwards compatibility.

## API reference

### `layout(doc, node)`

Renders a node (and its entire subtree) into a PDFKit document. Also available
as `draw`.

### `Box`

The base container. All other elements extend it and share these properties.

```typescript
new Box({
  x?: number,                 // default 0
  y?: number,                 // default 0
  width: number | string,     // required ("50%" or 0.5 proportional, points if absolute)
  height: number | string,    // required
  measure?: "proportional" | "absolute", // default "proportional"
  padding?: number,           // default 0 — insets the content area
  margin?: number,            // default 0 — shrinks the box inward from its bounds
  borderWidth?: number,       // default 0 — no border when 0
  borderColor?: string,       // default "black"
});
```

Methods:

- `addChild(node)` — append a child, returns the box (chainable)
- `addChildren(...nodes)` — append several children, returns the box (chainable)

### `Text` (extends `Box`)

```typescript
new Text({
  ...boxProps,
  text: string,
  fontSize?: number,          // default 12
  color?: string,             // default "black"
  align?: "left" | "center" | "right",          // horizontal, default "left"
  verticalAlign?: "top" | "center" | "middle" | "bottom", // default "middle"
});
```

Text is positioned using real font metrics (cap height / ascender) rather than
PDFKit's line-box height, so vertically-centred and bottom-aligned text sit on
their visible glyph bounds instead of floating above centre. Multi-line text is
supported and respects `padding`.

### `Image` (extends `Box`)

```typescript
new Image({
  ...boxProps,
  src: string,                // path to the image file
  fit?: "contain" | "cover",  // default "contain"
  align?: "left" | "center" | "right",          // default "center"
  verticalAlign?: "top" | "center" | "bottom",  // default "center"
});
```

- **`contain`** scales the image to fit entirely inside the box (letterboxed).
- **`cover`** scales it to fill the box, clipping the overflow to the bounds.

`align` / `verticalAlign` control placement of the image within the box when
`contain` leaves spare room.

### `FlexBox`

A flexbox-style container that measures and positions its children for you. It
sits in the same tree as `Box`/`Text`/`Image` — it can contain them, and they
can contain it.

```typescript
new FlexBox({
  x: number,
  y: number,
  width: number,
  height: number,
  measure: "proportional" | "absolute",
  padding?: number,           // default 0
  margin?: number,            // default 0
  borderWidth?: number,       // default 1
  borderColor?: string,       // default "black"
  direction?: "row" | "column",                  // default "row"
  justifyContent?: "flex-start" | "flex-end" | "center"
    | "space-between" | "space-around" | "space-evenly", // default "flex-start"
  alignItems?: "flex-start" | "flex-end" | "center" | "stretch", // default "flex-start"
  gap?: number,               // default 0 — spacing between children
});
```

- **`direction`** sets the main axis (`row` = horizontal, `column` = vertical).
- **`justifyContent`** distributes children along the main axis.
- **`alignItems`** aligns children on the cross axis; `stretch` makes each child
  fill the cross axis.
- **`gap`** adds fixed spacing between adjacent children.

When a FlexBox is the parent, it **overrides the child's own `x`/`y`/size**:
children are measured (absolute children by their fixed size, proportional
children as a fraction of the FlexBox content area) and then placed by the flex
rules. A child's `margin` is still honoured and shrinks it within its slot.

```typescript
import { FlexBox, Box, layout } from "pdfkit-layout";

const bar = new FlexBox({
  x: 0, y: 0, width: 600, height: 100,
  measure: "absolute",
  direction: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: 20,
});

bar.addChild(new Box({ width: 150, height: 60, measure: "absolute" }));
bar.addChild(new Box({ width: 150, height: 60, measure: "absolute" }));

layout(doc, bar); // FlexBox positions the children automatically
```

## Feature showcase / example

The repository includes [`example.ts`](./example.ts), a runnable script that
generates a multi-page `example.pdf` exercising every feature:

- **Page 1** — proportional positioning, nested proportional boxes, padding and
  margin, all arranged with a vertical (`column`) FlexBox using
  `justifyContent: "space-between"` and `alignItems: "stretch"`.
- **Page 2** — `Text` properties: `fontSize`, `color`, `align`, `verticalAlign`,
  `padding`, and `borderWidth` / `borderColor`.
- **Page 3** — `Image` properties (`fit: "contain"` vs `"cover"`, `align` /
  `verticalAlign`) and a gallery of FlexBox row layouts demonstrating
  `flex-start`, `space-between`, and `center` justification.

Run it with:

```bash
npx tsx example.ts
```

## Development

```bash
pnpm build         # compile TypeScript to dist/
pnpm test          # run tests once (vitest)
pnpm test:watch    # tests in watch mode
pnpm test:ui       # interactive vitest UI
pnpm biome check   # lint + format check (use --write to auto-fix)
```

## License

ISC
