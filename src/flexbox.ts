// Common interface for all layout nodes
export interface LayoutNode {
  readonly type: string;
  children: LayoutNode[];
  parentBox?: LayoutNode;
  padding: number;
  margin: number;
  borderColor: string;
  borderWidth: number;
  addChild(node: LayoutNode): void;
  getBounds(currentPage?: PDFKit.PDFPage): {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// FlexBox types
export type FlexDirection = "row" | "column";
export type JustifyContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly";
export type AlignItems = "flex-start" | "flex-end" | "center" | "stretch";

export type FlexBoxProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  measure: "proportional" | "absolute";
  padding?: number;
  margin?: number;
  borderWidth?: number;
  borderColor?: string;
  direction?: FlexDirection;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  gap?: number;
};

// Helper interface for nodes that can be measured
interface MeasurableNode extends LayoutNode {
  getRequestedWidth(): number;
  getRequestedHeight(): number;
  getMeasure(): "proportional" | "absolute";
}

function isMeasurable(node: LayoutNode): node is MeasurableNode {
  return (
    "getRequestedWidth" in node &&
    "getRequestedHeight" in node &&
    "getMeasure" in node
  );
}

export class FlexBox implements LayoutNode {
  public readonly type = "flexbox";

  children: LayoutNode[] = [];
  parentBox?: LayoutNode;
  padding = 0;
  margin = 0;
  borderColor: string;
  borderWidth: number;

  direction: FlexDirection;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
  gap: number;

  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private measure: "proportional" | "absolute";

  private childLayouts: Map<
    LayoutNode,
    { x: number; y: number; width: number; height: number }
  > = new Map();

  constructor(props: FlexBoxProps) {
    this.x = props.x;
    this.y = props.y;
    this.width = props.width;
    this.height = props.height;
    this.measure = props.measure ?? "proportional";

    this.padding = props.padding ?? 0;
    this.margin = props.margin ?? 0;
    this.borderColor = props.borderColor ?? "black";
    this.borderWidth = props.borderWidth ?? 1;

    this.direction = props.direction ?? "row";
    this.justifyContent = props.justifyContent ?? "flex-start";
    this.alignItems = props.alignItems ?? "flex-start";
    this.gap = props.gap ?? 0;
  }

  addChild(node: LayoutNode) {
    node.parentBox = this;
    this.children.push(node);
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

    if (!this.parentBox) {
      throw new Error("Cannot be proportional without parent");
    }

    const baseSize = this.parentBox.getBounds(currentPage);

    return {
      x: baseSize.x + baseSize.width * this.x,
      y: baseSize.y + baseSize.height * this.y,
      width: baseSize.width * this.width,
      height: baseSize.height * this.height,
    };
  }

  computeChildLayout(child: LayoutNode): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (!this.childLayouts.has(child)) {
      throw new Error("Child layout not computed - call performLayout first");
    }
    return this.childLayouts.get(child)!;
  }

  performLayout() {
    const bounds = this.getBounds();
    const contentWidth = bounds.width - this.padding * 2;
    const contentHeight = bounds.height - this.padding * 2;

    this.childLayouts.clear();

    if (this.children.length === 0) {
      return;
    }

    const isRow = this.direction === "row";
    const mainAxisSize = isRow ? contentWidth : contentHeight;
    const crossAxisSize = isRow ? contentHeight : contentWidth;

    // Collect child sizes
    const childSizes: number[] = [];
    const childCrossSizes: number[] = [];
    const totalGap = this.gap * (this.children.length - 1);

    for (const child of this.children) {
      let mainSize: number;
      let crossSize: number;

      if (isMeasurable(child)) {
        const measure = child.getMeasure();
        if (measure === "proportional") {
          const widthValue = contentWidth * child.getRequestedWidth();
          const heightValue = contentHeight * child.getRequestedHeight();
          mainSize = isRow ? widthValue : heightValue;
          crossSize = isRow ? heightValue : widthValue;
        } else {
          mainSize = isRow
            ? child.getRequestedWidth()
            : child.getRequestedHeight();
          crossSize = isRow
            ? child.getRequestedHeight()
            : child.getRequestedWidth();
        }
      } else {
        mainSize = 0;
        crossSize = 0;
      }

      childSizes.push(mainSize);
      childCrossSizes.push(crossSize);
    }

    const totalChildSize = childSizes.reduce((sum, size) => sum + size, 0);
    const remainingSpace = mainAxisSize - totalChildSize - totalGap;

    // Calculate positioning
    let currentPos = this.calculateJustifyStart(remainingSpace);
    const spaceBetween = this.calculateSpaceBetween(
      remainingSpace,
      this.children.length,
    );

    // Position each child
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const mainSize = childSizes[i];
      const childCrossSize = childCrossSizes[i];
      const crossPos = this.calculateCrossAxisPosition(
        childCrossSize,
        crossAxisSize,
      );
      const finalCrossSize = this.calculateCrossAxisSize(
        childCrossSize,
        crossAxisSize,
      );

      const layout = isRow
        ? {
            x: bounds.x + this.padding + currentPos,
            y: bounds.y + this.padding + crossPos,
            width: mainSize,
            height: finalCrossSize,
          }
        : {
            x: bounds.x + this.padding + crossPos,
            y: bounds.y + this.padding + currentPos,
            width: finalCrossSize,
            height: mainSize,
          };

      this.childLayouts.set(child, layout);
      currentPos +=
        mainSize + (i < this.children.length - 1 ? this.gap : 0) + spaceBetween;
    }
  }

  private calculateJustifyStart(remainingSpace: number): number {
    switch (this.justifyContent) {
      case "flex-start":
        return 0;
      case "flex-end":
        return remainingSpace;
      case "center":
        return remainingSpace / 2;
      case "space-between":
        return 0;
      case "space-around":
        return remainingSpace / (this.children.length * 2);
      case "space-evenly":
        return remainingSpace / (this.children.length + 1);
    }
  }

  private calculateSpaceBetween(
    remainingSpace: number,
    childCount: number,
  ): number {
    switch (this.justifyContent) {
      case "space-between":
        return childCount > 1 ? remainingSpace / (childCount - 1) : 0;
      case "space-around":
        return remainingSpace / childCount;
      case "space-evenly":
        return remainingSpace / (childCount + 1);
      default:
        return 0;
    }
  }

  private calculateCrossAxisPosition(
    childCrossSize: number,
    crossAxisSize: number,
  ): number {
    switch (this.alignItems) {
      case "flex-start":
        return 0;
      case "flex-end":
        return crossAxisSize - childCrossSize;
      case "center":
        return (crossAxisSize - childCrossSize) / 2;
      case "stretch":
        return 0;
    }
  }

  private calculateCrossAxisSize(
    childCrossSize: number,
    crossAxisSize: number,
  ): number {
    if (this.alignItems === "stretch") {
      return crossAxisSize;
    }
    return childCrossSize;
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

// Type guard function
export function isFlexBox(node: LayoutNode): node is FlexBox {
  return node.type === "flexbox";
}
