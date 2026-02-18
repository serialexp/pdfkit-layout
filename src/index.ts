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
    const yPos =
      node.verticalAlign === "top"
        ? size.y + node.padding
        : node.verticalAlign === "middle"
          ? size.y + size.height / 2
          : size.y + size.height - node.padding;
    const textOptions = {
      height: size.height - node.padding * 2,
      width: size.width - node.padding * 2,
      align: node.align,
      lineGap: 0,
      paragraphGap: 0,
    };
    doc.fontSize(node.fontSize || 12).fillColor(node.color);
    const height = doc.heightOfString(node.text, textOptions);
    const adjustment =
      node.verticalAlign === "bottom"
        ? height
        : node.verticalAlign === "middle"
          ? height / 2
          : 0;
    doc.text(node.text, xPos, yPos - adjustment, textOptions);
  }

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
