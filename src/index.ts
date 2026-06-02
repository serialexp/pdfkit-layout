import type { LayoutNode } from "./flexbox";
import { FlexBox, isFlexBox } from "./flexbox";

type BoxProps = {
  x?: number;
  y?: number;
  width: number | string;
  height: number | string;
  padding?: number;
  margin?: number;
  borderWidth?: number;
  borderColor?: string;
  measure?: "proportional" | "absolute";
};
export class Box implements LayoutNode {
  public readonly type: "box" | "image" | "text" = "box";

  children: LayoutNode[] = [];
  parentBox?: LayoutNode;
  padding = 0;
  margin = 0;
  borderColor: string;
  borderWidth: number;

  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private measure: "proportional" | "absolute";

  constructor(props: BoxProps) {
    this.x = props.x ?? 0;
    this.y = props.y ?? 0;

    // check only percentage unit specifier allowed for width and height
    if (typeof props.width !== "number" && !props.width.includes("%")) {
      throw new Error("Only percentage unit specifier allowed for width");
    }
    if (typeof props.height !== "number" && !props.height.includes("%")) {
      throw new Error("Only percentage unit specifier allowed for height");
    }

    // take percentage sign off and divide by 100 when string
    this.width =
      typeof props.width === "string"
        ? parseFloat(props.width) / 100
        : props.width;
    this.height =
      typeof props.height === "string"
        ? parseFloat(props.height) / 100
        : props.height;

    this.measure = props.measure ?? "proportional";

    this.padding = props.padding ?? 0;
    this.margin = props.margin ?? 0;
    this.borderColor = props.borderColor ?? "black";
    this.borderWidth = props.borderWidth ?? 0;
  }

  addChild(node: LayoutNode) {
    node.parentBox = this;
    this.children.push(node);

    return this;
  }

  addChildren(...nodes: LayoutNode[]) {
    for (const node of nodes) {
      this.addChild(node);
    }

    return this;
  }

  getBounds(currentPage?: PDFKit.PDFPage) {
    // FlexBox parent overrides positioning regardless of measure mode
    if (this.parentBox && isFlexBox(this.parentBox)) {
      const layout = this.parentBox.computeChildLayout(this);
      return {
        x: layout.x + this.margin,
        y: layout.y + this.margin,
        width: layout.width - this.margin * 2,
        height: layout.height - this.margin * 2,
      };
    }

    if (this.measure === "absolute") {
      return {
        x: this.x + this.margin,
        y: this.y + this.margin,
        width: this.width - this.margin * 2,
        height: this.height - this.margin * 2,
      };
    }

    if (!this.parentBox && !currentPage) {
      throw new Error(
        "Cannot be proportional without parent or page added to the PDFDocument",
      );
    }

    const baseSize = this.parentBox
      ? this.parentBox.getBounds(currentPage)
      : {
          x: currentPage.margins.left,
          y: currentPage.margins.top,
          width:
            currentPage.width -
            currentPage.margins.left -
            currentPage.margins.right,
          height:
            currentPage.height -
            currentPage.margins.top -
            currentPage.margins.bottom,
        };

    const padding = ("padding" in baseSize ? baseSize.padding : 0) as number;
    const contentX = baseSize.x + padding;
    const contentY = baseSize.y + padding;
    const contentWidth = baseSize.width - padding * 2;
    const contentHeight = baseSize.height - padding * 2;

    return {
      x: contentX + contentWidth * this.x,
      y: contentY + contentHeight * this.y,
      width: contentWidth * this.width,
      height: contentHeight * this.height,
      padding: this.padding,
    };
  }

  getRequestedWidth(): number {
    return this.width;
  }

  getRequestedHeight(): number {
    return this.height;
  }

  getMeasure(): "proportional" | "absolute" {
    return this.measure;
  }
}

type ImageProps = BoxProps & {
  src: string;
  fit?: "contain" | "cover";
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "bottom" | "center";
};
export class Image extends Box {
  public readonly type = "image";

  src: string;
  fit: "contain" | "cover";
  align: undefined | "center" | "right";
  verticalAlign: undefined | "bottom" | "center";
  constructor(props: ImageProps) {
    super(props);

    this.src = props.src;
    this.fit = props.fit ?? "contain";
    this.align = props.align === "left" ? undefined : props.align ?? "center";
    this.verticalAlign =
      props.verticalAlign === "top"
        ? undefined
        : props.verticalAlign ?? "center";
  }
}

function isImage(box: ValidShape): box is Image {
  return box.type === "image";
}

type TextProps = BoxProps & {
  text: string;
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom" | "center";
};

export class Text extends Box {
  public readonly type = "text";

  public text: string;
  public fontSize: number;
  public color: string;
  public align: "left" | "center" | "right";
  public verticalAlign: "top" | "middle" | "bottom";
  constructor(props: TextProps) {
    super(props);

    this.text = props.text;
    this.fontSize = props.fontSize ?? 12;
    this.color = props.color ?? "black";
    this.align = props.align ?? "left";
    this.verticalAlign =
      props.verticalAlign === "center"
        ? "middle"
        : props.verticalAlign ?? "middle";
  }
}
function isText(box: ValidShape): box is Text {
  return box.type === "text";
}

type ValidShape = Box | Image | Text | FlexBox;

export const layout = (doc: PDFKit.PDFDocument, node: ValidShape) => {
  // Trigger layout if FlexBox
  if (isFlexBox(node)) {
    node.performLayout();
  }

  const size = node.getBounds(doc.page);

  // Semantics: a node's content (its own drawing + every descendant's
  // drawing) NEVER extends beyond the node's bounds. We enforce this with a
  // clipping region around the node's body. Notable consequences:
  //   - `Image({ fit: 'cover' })` actually covers without spilling: pdfkit's
  //     `cover` mode draws an over-large image; the clip trims it.
  //   - Children with `measure: 'absolute'` placed outside their parent get
  //     clipped at the parent boundary instead of leaking out.
  // The border is drawn AFTER the clip is released so a strokeWidth=N stroke
  // renders at full width centred on the box edge instead of being clipped
  // to half-width.
  doc.save();
  doc.rect(size.x, size.y, size.width, size.height).clip();

  if (isImage(node)) {
    doc.image(node.src, size.x, size.y, {
      [node.fit === "contain" ? "fit" : "cover"]: [size.width, size.height],
      align: node.align,
      valign: node.verticalAlign,
    });
  }

  for (const child of node.children) {
    layout(doc, child as ValidShape);
  }

  if (isText(node)) {
    const xPos = size.x + node.padding;
    const fontSize = node.fontSize || 12;
    doc.fontSize(fontSize).fillColor(node.color);

    // Position text using FONT METRICS, not pdfkit's heightOfString. The line
    // box reserves space for descenders below the baseline (~20% of font size
    // for typical Latin fonts) which is empty for cap-only text. Centering
    // the line box therefore makes the visible glyphs appear above centre.
    // We compute positions for the *visible* glyph bbox instead:
    //   - cap top    = baseline - capHeight
    //   - baseline   = where letters sit
    //   - cap bottom = baseline (for caps; descenders extend below)
    // pdfkit's `doc.text(text, x, y, …)` interprets `y` as the top of the
    // line box, where: line_top = baseline - ascender. So once we know the
    // desired baseline, line_top = baseline - ascender.
    //
    // Multi-line text: heightOfString tells us the full multi-line line-box
    // height; we use that for top-of-first-line vs centre-of-block reasoning.
    const textOptions = {
      height: size.height - node.padding * 2,
      width: size.width - node.padding * 2,
      align: node.align,
      lineGap: 0,
      paragraphGap: 0,
    };
    // biome-ignore lint/suspicious/noExplicitAny: _font is private but is the
    // only way to read font metrics in pdfkit.
    const font = (doc as any)._font;
    const ascender = ((font?.ascender ?? 800) * fontSize) / 1000;
    // capHeight is missing on some font subtypes; fall back to a reasonable
    // ratio of ascender. The fallback errs toward the line-box value, which
    // is the previous behaviour.
    const capHeight =
      font?.capHeight != null
        ? (font.capHeight * fontSize) / 1000
        : ascender * 0.72;

    // Compute the *visible* (cap-bbox) height of the rendered block.
    //   blockHeight = numLines * lineHeightWithGap (what pdfkit reserves)
    //   visibleBlockHeight =
    //     (numLines - 1) * lineHeightWithGap + capHeight
    //     = blockHeight - (lineHeightWithGap - capHeight)
    // i.e. peel one line's "non-glyph reservation" (descender room + lineGap)
    // off the bottom, since the last line ends at its baseline visually.
    const blockHeight = doc.heightOfString(node.text, textOptions);
    const lineHeightWithGap = doc.currentLineHeight(true);
    const lineExtra = Math.max(0, lineHeightWithGap - capHeight);
    const visibleBlockHeight = Math.max(capHeight, blockHeight - lineExtra);

    // From the desired *visible* top, pdfkit's text-y (= line-box top of
    // the first line) sits ABOVE it by (ascender - capHeight).
    const offsetForLineBoxTop = ascender - capHeight;

    let lineTop: number;
    if (node.verticalAlign === "top") {
      const visibleTop = size.y + node.padding;
      lineTop = visibleTop - offsetForLineBoxTop;
    } else if (node.verticalAlign === "middle") {
      const boxCentre = size.y + size.height / 2;
      const visibleTop = boxCentre - visibleBlockHeight / 2;
      lineTop = visibleTop - offsetForLineBoxTop;
    } else {
      // bottom: visible bottom (baseline of last line for caps) sits at
      // box bottom minus padding.
      const visibleBottom = size.y + size.height - node.padding;
      const visibleTop = visibleBottom - visibleBlockHeight;
      lineTop = visibleTop - offsetForLineBoxTop;
    }

    doc.text(node.text, xPos, lineTop, textOptions);
  }

  doc.restore();

  if (node.borderWidth > 0) {
    doc
      .lineWidth(node.borderWidth)
      .rect(size.x, size.y, size.width, size.height)
      .stroke(node.borderColor);
  }
};

// Alias for backward compatibility with tests
export const draw = layout;

// Re-export FlexBox types and class
export { FlexBox } from "./flexbox";
export type {
  FlexBoxProps,
  FlexDirection,
  JustifyContent,
  AlignItems,
  LayoutNode,
} from "./flexbox";
