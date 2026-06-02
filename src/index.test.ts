import { describe, expect, it, vi } from "vitest";
import { draw } from "./index";

// Mock Box class for testing
class Box {
  public readonly type: "box" | "image" | "text" = "box";

  children: Box[] = [];
  parentBox?: Box;
  padding = 0;
  margin = 0;
  borderColor: string;
  borderWidth: number;

  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private measure: "proportional" | "absolute";

  constructor(props: {
    x: number;
    y: number;
    width: number;
    height: number;
    padding?: number;
    margin?: number;
    borderWidth?: number;
    borderColor?: string;
    measure?: "proportional" | "absolute";
  }) {
    this.x = props.x;
    this.y = props.y;
    this.width = props.width;
    this.height = props.height;
    this.measure = props.measure ?? "proportional";

    this.padding = props.padding ?? 0;
    this.margin = props.margin ?? 0;
    this.borderColor = props.borderColor ?? "black";
    this.borderWidth = props.borderWidth ?? 1;
  }

  addChild(box: Box) {
    box.setParent(this);
    this.children.push(box);
  }

  private setParent(box: Box) {
    this.parentBox = box;
  }

  getBounds() {
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
    const baseSize = this.parentBox.getBounds();

    return {
      x: baseSize.x + baseSize.width * this.x,
      y: baseSize.y + baseSize.height * this.y,
      width: baseSize.width * this.width,
      height: baseSize.height * this.height,
    };
  }
}

class Image extends Box {
  public readonly type = "image";
  image: string;

  constructor(
    props: {
      x: number;
      y: number;
      width: number;
      height: number;
      padding?: number;
      margin?: number;
      borderWidth?: number;
      borderColor?: string;
      measure?: "proportional" | "absolute";
    } & { image: string },
  ) {
    super(props);
    this.image = props.image;
  }
}

class Text extends Box {
  public readonly type = "text";
  public text: string;
  public fontSize: number;
  public color: string;
  public textAlign: "left" | "center" | "right" | "justify";

  constructor(
    props: {
      x: number;
      y: number;
      width: number;
      height: number;
      padding?: number;
      margin?: number;
      borderWidth?: number;
      borderColor?: string;
      measure?: "proportional" | "absolute";
    } & {
      text: string;
      fontSize?: number;
      color?: string;
      textAlign?: "left" | "center" | "right" | "justify";
    },
  ) {
    super(props);
    this.text = props.text;
    this.fontSize = props.fontSize ?? 12;
    this.color = props.color ?? "black";
    this.textAlign = props.textAlign ?? "center";
  }
}

describe("Box", () => {
  describe("absolute positioning", () => {
    it("should calculate bounds with absolute positioning and no margin", () => {
      const box = new Box({
        x: 10,
        y: 20,
        width: 100,
        height: 200,
        measure: "absolute",
      });

      expect(box.getBounds()).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 200,
      });
    });

    it("should calculate bounds with absolute positioning and margin", () => {
      const box = new Box({
        x: 10,
        y: 20,
        width: 100,
        height: 200,
        margin: 5,
        measure: "absolute",
      });

      expect(box.getBounds()).toEqual({
        x: 15,
        y: 25,
        width: 90,
        height: 190,
      });
    });
  });

  describe("proportional positioning", () => {
    it("should throw error if proportional box has no parent", () => {
      const box = new Box({
        x: 0.5,
        y: 0.5,
        width: 0.5,
        height: 0.5,
        measure: "proportional",
      });

      expect(() => box.getBounds()).toThrow(
        "Cannot be proportional without parent",
      );
    });

    it("should calculate bounds relative to parent", () => {
      const parent = new Box({
        x: 0,
        y: 0,
        width: 400,
        height: 600,
        measure: "absolute",
      });

      const child = new Box({
        x: 0.1,
        y: 0.2,
        width: 0.5,
        height: 0.3,
        measure: "proportional",
      });

      parent.addChild(child);

      expect(child.getBounds()).toEqual({
        x: 40, // 0 + 400 * 0.1
        y: 120, // 0 + 600 * 0.2
        width: 200, // 400 * 0.5
        height: 180, // 600 * 0.3
      });
    });

    it("should handle nested proportional boxes", () => {
      const root = new Box({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        measure: "absolute",
      });

      const parent = new Box({
        x: 0.1,
        y: 0.1,
        width: 0.8,
        height: 0.8,
        measure: "proportional",
      });

      const child = new Box({
        x: 0.25,
        y: 0.25,
        width: 0.5,
        height: 0.5,
        measure: "proportional",
      });

      root.addChild(parent);
      parent.addChild(child);

      const parentBounds = parent.getBounds();
      expect(parentBounds).toEqual({
        x: 80, // 0 + 800 * 0.1
        y: 60, // 0 + 600 * 0.1
        width: 640, // 800 * 0.8
        height: 480, // 600 * 0.8
      });

      const childBounds = child.getBounds();
      expect(childBounds).toEqual({
        x: 240, // 80 + 640 * 0.25
        y: 180, // 60 + 480 * 0.25
        width: 320, // 640 * 0.5
        height: 240, // 480 * 0.5
      });
    });
  });

  describe("child management", () => {
    it("should add children and set parent relationship", () => {
      const parent = new Box({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        measure: "absolute",
      });

      const child = new Box({
        x: 0,
        y: 0,
        width: 0.5,
        height: 0.5,
        measure: "proportional",
      });

      parent.addChild(child);

      expect(parent.children).toHaveLength(1);
      expect(parent.children[0]).toBe(child);
      expect(child.parentBox).toBe(parent);
    });
  });

  describe("properties", () => {
    it("should set default values", () => {
      const box = new Box({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        measure: "absolute",
      });

      expect(box.padding).toBe(0);
      expect(box.margin).toBe(0);
      expect(box.borderColor).toBe("black");
      expect(box.borderWidth).toBe(1);
    });

    it("should accept custom values", () => {
      const box = new Box({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        padding: 10,
        margin: 5,
        borderColor: "red",
        borderWidth: 2,
        measure: "absolute",
      });

      expect(box.padding).toBe(10);
      expect(box.margin).toBe(5);
      expect(box.borderColor).toBe("red");
      expect(box.borderWidth).toBe(2);
    });
  });
});

describe("Image", () => {
  it("should extend Box with image property", () => {
    const image = new Image({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      image: "/path/to/image.jpg",
      measure: "absolute",
    });

    expect(image.type).toBe("image");
    expect(image.image).toBe("/path/to/image.jpg");
    expect(image.getBounds()).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  });
});

describe("Text", () => {
  it("should extend Box with text properties", () => {
    const text = new Text({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: "Hello World",
      measure: "absolute",
    });

    expect(text.type).toBe("text");
    expect(text.text).toBe("Hello World");
    expect(text.fontSize).toBe(12);
    expect(text.color).toBe("black");
  });

  it("should accept custom font size and color", () => {
    const text = new Text({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: "Hello World",
      fontSize: 16,
      color: "blue",
      measure: "absolute",
    });

    expect(text.fontSize).toBe(16);
    expect(text.color).toBe("blue");
  });

  it("should default textAlign to center", () => {
    const text = new Text({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: "Hello World",
      measure: "absolute",
    });

    expect(text.textAlign).toBe("center");
  });

  it("should accept custom textAlign", () => {
    const textLeft = new Text({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: "Left aligned",
      textAlign: "left",
      measure: "absolute",
    });

    const textRight = new Text({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: "Right aligned",
      textAlign: "right",
      measure: "absolute",
    });

    const textJustify = new Text({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: "Justified text",
      textAlign: "justify",
      measure: "absolute",
    });

    expect(textLeft.textAlign).toBe("left");
    expect(textRight.textAlign).toBe("right");
    expect(textJustify.textAlign).toBe("justify");
  });
});

describe("draw", () => {
  it("should render a simple box with border", () => {
    const mockDoc = {
      stroke: vi.fn().mockReturnThis(),
      lineWidth: vi.fn().mockReturnThis(),
      rect: vi.fn().mockReturnThis(),
      clip: vi.fn().mockReturnThis(),
      save: vi.fn().mockReturnThis(),
      restore: vi.fn().mockReturnThis(),
    } as unknown as PDFKit.PDFDocument;

    const box = new Box({
      x: 10,
      y: 20,
      width: 100,
      height: 200,
      borderWidth: 2,
      borderColor: "red",
      measure: "absolute",
    });

    draw(mockDoc, box);

    expect(mockDoc.stroke).toHaveBeenCalledWith("red");
    expect(mockDoc.lineWidth).toHaveBeenCalledWith(2);
    expect(mockDoc.rect).toHaveBeenCalledWith(10, 20, 100, 200);
  });

  it("should not render border if borderWidth is 0", () => {
    const mockDoc = {
      stroke: vi.fn().mockReturnThis(),
      lineWidth: vi.fn().mockReturnThis(),
      rect: vi.fn().mockReturnThis(),
      clip: vi.fn().mockReturnThis(),
      save: vi.fn().mockReturnThis(),
      restore: vi.fn().mockReturnThis(),
    } as unknown as PDFKit.PDFDocument;

    const box = new Box({
      x: 10,
      y: 20,
      width: 100,
      height: 200,
      borderWidth: 0,
      measure: "absolute",
    });

    draw(mockDoc, box);

    expect(mockDoc.stroke).not.toHaveBeenCalled();
    expect(mockDoc.lineWidth).not.toHaveBeenCalled();
    // rect is still called once to set up the clipping path, but no border stroke.
    expect(mockDoc.rect).toHaveBeenCalledTimes(1);
    expect(mockDoc.rect).toHaveBeenCalledWith(10, 20, 100, 200);
    expect(mockDoc.clip).toHaveBeenCalledTimes(1);
  });

  it("should render image boxes (default fit: contain)", () => {
    const mockDoc = {
      image: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
      lineWidth: vi.fn().mockReturnThis(),
      rect: vi.fn().mockReturnThis(),
      clip: vi.fn().mockReturnThis(),
      save: vi.fn().mockReturnThis(),
      restore: vi.fn().mockReturnThis(),
    } as unknown as PDFKit.PDFDocument;

    const image = new RealImage({
      x: 10,
      y: 20,
      width: 100,
      height: 200,
      src: "/path/to/image.jpg",
      borderWidth: 0,
      measure: "absolute",
    });

    draw(mockDoc, image);

    // Default fit is "contain" → maps to pdfkit's `fit:` option.
    // Default align is "center", verticalAlign defaults to "center" which the
    // Image constructor normalises to "middle" → passed as pdfkit's `valign`.
    expect(mockDoc.image).toHaveBeenCalledWith("/path/to/image.jpg", 10, 20, {
      fit: [100, 200],
      align: "center",
      valign: "center",
    });
  });

  it("should pass cover instead of fit when Image fit='cover'", () => {
    const mockDoc = {
      image: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
      lineWidth: vi.fn().mockReturnThis(),
      rect: vi.fn().mockReturnThis(),
      clip: vi.fn().mockReturnThis(),
      save: vi.fn().mockReturnThis(),
      restore: vi.fn().mockReturnThis(),
    } as unknown as PDFKit.PDFDocument;

    const image = new RealImage({
      x: 0,
      y: 0,
      width: 50,
      height: 80,
      src: "/path/to/image.jpg",
      fit: "cover",
      borderWidth: 0,
      measure: "absolute",
    });

    draw(mockDoc, image);

    expect(mockDoc.image).toHaveBeenCalledWith("/path/to/image.jpg", 0, 0, {
      cover: [50, 80],
      align: "center",
      valign: "center",
    });
  });

  it("should render text boxes (top-aligned, padded)", () => {
    const mockDoc = {
      fontSize: vi.fn().mockReturnThis(),
      fillColor: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
      lineWidth: vi.fn().mockReturnThis(),
      rect: vi.fn().mockReturnThis(),
      clip: vi.fn().mockReturnThis(),
      save: vi.fn().mockReturnThis(),
      restore: vi.fn().mockReturnThis(),
      heightOfString: vi.fn().mockReturnValue(20),
      currentLineHeight: vi.fn().mockReturnValue(20),
    } as unknown as PDFKit.PDFDocument;

    const text = new RealText({
      x: 10,
      y: 20,
      width: 100,
      height: 200,
      text: "Hello World",
      fontSize: 16,
      color: "blue",
      padding: 5,
      align: "left",
      verticalAlign: "top",
      borderWidth: 0,
      measure: "absolute",
    });

    draw(mockDoc, text);

    expect(mockDoc.fontSize).toHaveBeenCalledWith(16);
    expect(mockDoc.fillColor).toHaveBeenCalledWith("blue");
    // verticalAlign:"top" places the cap-top of the first line at
    //   y = size.y + padding = 25
    // pdfkit's text-y is the line-box top, which sits ABOVE the cap top by
    // (ascender - capHeight). With no real font on this mock, we fall back to
    // ascender = 800/1000 * fontSize = 12.8 and capHeight = ascender * 0.72
    // = 9.216, so the offset is 12.8 - 9.216 = 3.584. Line-box top = 25 -
    // 3.584 = 21.416. lineGap/paragraphGap are forced to 0.
    expect(mockDoc.text).toHaveBeenCalledWith(
      "Hello World",
      15,
      expect.closeTo(21.416, 3),
      {
        width: 90,
        height: 190,
        align: "left",
        lineGap: 0,
        paragraphGap: 0,
      },
    );
  });

  it("should middle-align text vertically by default", () => {
    const mockDoc = {
      fontSize: vi.fn().mockReturnThis(),
      fillColor: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
      lineWidth: vi.fn().mockReturnThis(),
      rect: vi.fn().mockReturnThis(),
      clip: vi.fn().mockReturnThis(),
      save: vi.fn().mockReturnThis(),
      restore: vi.fn().mockReturnThis(),
      heightOfString: vi.fn().mockReturnValue(20),
      currentLineHeight: vi.fn().mockReturnValue(20),
    } as unknown as PDFKit.PDFDocument;

    const text = new RealText({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: "Centered",
      borderWidth: 0,
      measure: "absolute",
    });

    draw(mockDoc, text);

    // Default verticalAlign: middle. With the mock doc there is no real font,
    // so font-metric fallbacks apply: ascender = 800/1000 * 12 = 9.6,
    // capHeight = ascender * 0.72 = 6.912.
    // mock heightOfString = 20, mock currentLineHeight(true) = 20 → one line.
    //   lineExtra = 20 - 6.912 = 13.088
    //   visibleBlockHeight = max(6.912, 20 - 13.088) = 6.912
    //   boxCentre = 50, visibleTop = 50 - 3.456 = 46.544
    //   line_top = 46.544 - (9.6 - 6.912) = 43.856
    // Default align is "left".
    expect(mockDoc.text).toHaveBeenCalledWith(
      "Centered",
      0,
      expect.closeTo(43.856, 3),
      {
        width: 100,
        height: 100,
        align: "left",
        lineGap: 0,
        paragraphGap: 0,
      },
    );
  });

  it("should recursively render children", () => {
    const mockDoc = {
      stroke: vi.fn().mockReturnThis(),
      lineWidth: vi.fn().mockReturnThis(),
      rect: vi.fn().mockReturnThis(),
      clip: vi.fn().mockReturnThis(),
      save: vi.fn().mockReturnThis(),
      restore: vi.fn().mockReturnThis(),
    } as unknown as PDFKit.PDFDocument;

    const parent = new Box({
      x: 0,
      y: 0,
      width: 400,
      height: 600,
      borderWidth: 2,
      measure: "absolute",
    });

    const child1 = new Box({
      x: 0.1,
      y: 0.1,
      width: 0.4,
      height: 0.4,
      borderWidth: 1,
      measure: "proportional",
    });

    const child2 = new Box({
      x: 0.5,
      y: 0.5,
      width: 0.4,
      height: 0.4,
      borderWidth: 1,
      measure: "proportional",
    });

    parent.addChild(child1);
    parent.addChild(child2);

    draw(mockDoc, parent);

    // Each node now produces a clip-rect AND (if borderWidth > 0) a border-rect.
    // 3 nodes × 2 = 6 rect calls. The specific x/y/w/h values must still appear.
    expect(mockDoc.rect).toHaveBeenCalledTimes(6);
    expect(mockDoc.rect).toHaveBeenCalledWith(0, 0, 400, 600);
    expect(mockDoc.rect).toHaveBeenCalledWith(40, 60, 160, 240);
    expect(mockDoc.rect).toHaveBeenCalledWith(200, 300, 160, 240);
    // And every node should have been clipped exactly once.
    expect(mockDoc.clip).toHaveBeenCalledTimes(3);
    expect(mockDoc.save).toHaveBeenCalledTimes(3);
    expect(mockDoc.restore).toHaveBeenCalledTimes(3);
  });

  it("should clip every node to its bounds (own drawing + descendants)", () => {
    // Verifies the core invariant: nothing a node or its descendants draw can
    // appear outside the node's bounds. Achieved by save() → rect().clip() →
    // … → restore() around the body.
    const callOrder: string[] = [];
    const mockDoc = {
      stroke: vi.fn().mockReturnThis(),
      lineWidth: vi.fn().mockReturnThis(),
      rect: vi.fn(function (this: PDFKit.PDFDocument) {
        callOrder.push("rect");
        return this;
      }),
      clip: vi.fn(function (this: PDFKit.PDFDocument) {
        callOrder.push("clip");
        return this;
      }),
      save: vi.fn(function (this: PDFKit.PDFDocument) {
        callOrder.push("save");
        return this;
      }),
      restore: vi.fn(function (this: PDFKit.PDFDocument) {
        callOrder.push("restore");
        return this;
      }),
    } as unknown as PDFKit.PDFDocument;

    const parent = new RealBox({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      borderWidth: 0,
      measure: "absolute",
    });
    const child = new RealBox({
      x: 0,
      y: 0,
      width: 200, // intentionally larger than parent — must still get clipped
      height: 200,
      borderWidth: 0,
      measure: "absolute",
    });
    parent.addChild(child);

    draw(mockDoc, parent);

    // Parent: save → rect+clip → recurse(child: save → rect+clip → restore) → restore
    expect(callOrder).toEqual([
      "save",
      "rect",
      "clip",
      "save",
      "rect",
      "clip",
      "restore",
      "restore",
    ]);
  });
});

// Import real classes for FlexBox tests
import {
  Box as RealBox,
  FlexBox as RealFlexBox,
  Image as RealImage,
  Text as RealText,
} from "./index";

describe("FlexBox", () => {
  describe("basic properties", () => {
    it("should set default values", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        measure: "absolute",
      });

      expect(flexBox.direction).toBe("row");
      expect(flexBox.justifyContent).toBe("flex-start");
      expect(flexBox.alignItems).toBe("flex-start");
      expect(flexBox.gap).toBe(0);
      expect(flexBox.padding).toBe(0);
      expect(flexBox.margin).toBe(0);
      expect(flexBox.borderWidth).toBe(1);
      expect(flexBox.borderColor).toBe("black");
    });

    it("should accept custom values", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        measure: "absolute",
        direction: "column",
        justifyContent: "center",
        alignItems: "stretch",
        gap: 10,
        padding: 5,
        margin: 3,
        borderWidth: 2,
        borderColor: "red",
      });

      expect(flexBox.direction).toBe("column");
      expect(flexBox.justifyContent).toBe("center");
      expect(flexBox.alignItems).toBe("stretch");
      expect(flexBox.gap).toBe(10);
      expect(flexBox.padding).toBe(5);
      expect(flexBox.margin).toBe(3);
      expect(flexBox.borderWidth).toBe(2);
      expect(flexBox.borderColor).toBe("red");
    });
  });

  describe("layout - direction row", () => {
    it("should layout children horizontally with flex-start", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        justifyContent: "flex-start",
        padding: 0,
      });

      const child1 = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      const child2 = new RealBox({
        x: 0,
        y: 0,
        width: 150,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child1);
      flexBox.addChild(child2);
      flexBox.performLayout();

      const layout1 = flexBox.computeChildLayout(child1);
      const layout2 = flexBox.computeChildLayout(child2);

      expect(layout1).toEqual({ x: 0, y: 0, width: 100, height: 50 });
      expect(layout2).toEqual({ x: 100, y: 0, width: 150, height: 50 });
    });

    it("should layout children with gap", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        gap: 20,
        padding: 0,
      });

      const child1 = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      const child2 = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child1);
      flexBox.addChild(child2);
      flexBox.performLayout();

      const layout1 = flexBox.computeChildLayout(child1);
      const layout2 = flexBox.computeChildLayout(child2);

      expect(layout1.x).toBe(0);
      expect(layout2.x).toBe(120); // 100 + 20 gap
    });
  });

  describe("layout - direction column", () => {
    it("should layout children vertically", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 100,
        height: 400,
        measure: "absolute",
        direction: "column",
        padding: 0,
      });

      const child1 = new RealBox({
        x: 0,
        y: 0,
        width: 50,
        height: 100,
        measure: "absolute",
        borderWidth: 0,
      });

      const child2 = new RealBox({
        x: 0,
        y: 0,
        width: 50,
        height: 150,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child1);
      flexBox.addChild(child2);
      flexBox.performLayout();

      const layout1 = flexBox.computeChildLayout(child1);
      const layout2 = flexBox.computeChildLayout(child2);

      expect(layout1).toEqual({ x: 0, y: 0, width: 50, height: 100 });
      expect(layout2).toEqual({ x: 0, y: 100, width: 50, height: 150 });
    });
  });

  describe("layout - justifyContent", () => {
    it("should handle flex-end", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        justifyContent: "flex-end",
        padding: 0,
      });

      const child = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child);
      flexBox.performLayout();

      const layout = flexBox.computeChildLayout(child);
      expect(layout.x).toBe(300); // 400 - 100
    });

    it("should handle center", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        justifyContent: "center",
        padding: 0,
      });

      const child = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child);
      flexBox.performLayout();

      const layout = flexBox.computeChildLayout(child);
      expect(layout.x).toBe(150); // (400 - 100) / 2
    });

    it("should handle space-between", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        justifyContent: "space-between",
        padding: 0,
      });

      const child1 = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      const child2 = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child1);
      flexBox.addChild(child2);
      flexBox.performLayout();

      const layout1 = flexBox.computeChildLayout(child1);
      const layout2 = flexBox.computeChildLayout(child2);

      expect(layout1.x).toBe(0);
      expect(layout2.x).toBe(300); // 100 + 200 remaining space
    });

    it("should handle space-evenly", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        justifyContent: "space-evenly",
        padding: 0,
      });

      const child1 = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      const child2 = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child1);
      flexBox.addChild(child2);
      flexBox.performLayout();

      const layout1 = flexBox.computeChildLayout(child1);
      const layout2 = flexBox.computeChildLayout(child2);

      // 200 remaining / 3 spaces = 66.666... per space
      expect(layout1.x).toBeCloseTo(66.67, 1);
      expect(layout2.x).toBeCloseTo(233.33, 1); // 66.67 + 100 + 66.67
    });
  });

  describe("layout - alignItems", () => {
    it("should handle flex-start (cross axis)", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        alignItems: "flex-start",
        padding: 0,
      });

      const child = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child);
      flexBox.performLayout();

      const layout = flexBox.computeChildLayout(child);
      expect(layout.y).toBe(0);
      expect(layout.height).toBe(50);
    });

    it("should handle center (cross axis)", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        alignItems: "center",
        padding: 0,
      });

      const child = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child);
      flexBox.performLayout();

      const layout = flexBox.computeChildLayout(child);
      expect(layout.y).toBe(25); // (100 - 50) / 2
      expect(layout.height).toBe(50);
    });

    it("should handle flex-end (cross axis)", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        alignItems: "flex-end",
        padding: 0,
      });

      const child = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child);
      flexBox.performLayout();

      const layout = flexBox.computeChildLayout(child);
      expect(layout.y).toBe(50); // 100 - 50
      expect(layout.height).toBe(50);
    });

    it("should handle stretch (cross axis)", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        alignItems: "stretch",
        padding: 0,
      });

      const child = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexBox.addChild(child);
      flexBox.performLayout();

      const layout = flexBox.computeChildLayout(child);
      expect(layout.y).toBe(0);
      expect(layout.height).toBe(100); // stretched to full height
    });
  });

  describe("mixed tree compatibility", () => {
    it("should support Box parent with FlexBox child", () => {
      const boxParent = new RealBox({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        measure: "absolute",
        borderWidth: 0,
      });

      const flexChild = new RealFlexBox({
        x: 0.1,
        y: 0.1,
        width: 0.8,
        height: 0.8,
        measure: "proportional",
        borderWidth: 0,
      });

      boxParent.addChild(flexChild);

      const bounds = flexChild.getBounds();
      expect(bounds).toEqual({
        x: 80, // 0 + 800 * 0.1
        y: 60, // 0 + 600 * 0.1
        width: 640, // 800 * 0.8
        height: 480, // 600 * 0.8
      });
    });

    it("should support FlexBox parent with Box children", () => {
      const flexParent = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        padding: 0,
      });

      const boxChild = new RealBox({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        measure: "absolute",
        borderWidth: 0,
      });

      flexParent.addChild(boxChild);
      flexParent.performLayout();

      const bounds = boxChild.getBounds();
      expect(bounds).toEqual({ x: 0, y: 0, width: 100, height: 50 });
    });

    it("should support nested FlexBox", () => {
      const outerFlex = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 400,
        measure: "absolute",
        direction: "column",
        padding: 0,
      });

      const innerFlex = new RealFlexBox({
        x: 0,
        y: 0,
        width: 1,
        height: 0.5,
        measure: "proportional",
        direction: "row",
        padding: 0,
        borderWidth: 0,
      });

      outerFlex.addChild(innerFlex);
      outerFlex.performLayout();

      const bounds = innerFlex.getBounds();
      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 400, // 100% of parent width
        height: 200, // 50% of parent height
      });
    });
  });

  describe("proportional sizing in FlexBox", () => {
    it("should treat proportional children as percentages", () => {
      const flexBox = new RealFlexBox({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        measure: "absolute",
        direction: "row",
        padding: 0,
      });

      const child1 = new RealBox({
        x: 0,
        y: 0,
        width: 0.25, // 25% of parent width
        height: 1, // 100% of parent height
        measure: "proportional",
        borderWidth: 0,
      });

      const child2 = new RealBox({
        x: 0,
        y: 0,
        width: 0.5, // 50% of parent width
        height: 1,
        measure: "proportional",
        borderWidth: 0,
      });

      flexBox.addChild(child1);
      flexBox.addChild(child2);
      flexBox.performLayout();

      const layout1 = flexBox.computeChildLayout(child1);
      const layout2 = flexBox.computeChildLayout(child2);

      expect(layout1.width).toBe(100); // 400 * 0.25
      expect(layout2.width).toBe(200); // 400 * 0.5
    });
  });
});
