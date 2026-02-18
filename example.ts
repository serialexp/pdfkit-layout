// ABOUTME: Example script that generates a PDF showcasing all pdfkit-layout features.
// ABOUTME: Run with: npx tsx example.ts

import PDFDocument from "pdfkit";
import fs from "fs";
import { Box, Text, Image, FlexBox, layout } from "./src/index";

const doc = new PDFDocument({ size: "A4" });
doc.pipe(fs.createWriteStream("example.pdf"));

const pageWidth = 451; // content width (A4 width minus 72pt margins)
const left = 72; // left margin

// Helper for absolute-positioned section labels
function sectionTitle(y: number, text: string) {
  const t = new Text({
    x: left,
    y: y,
    width: pageWidth,
    height: 30,
    measure: "absolute",
    text: text,
    fontSize: 20,
    color: "#16213e",
    align: "left",
    verticalAlign: "bottom",
  });
  layout(doc, t);
}

function label(x: number, y: number, width: number, text: string) {
  const t = new Text({
    x: x,
    y: y,
    width: width,
    height: 16,
    measure: "absolute",
    text: text,
    fontSize: 9,
    color: "#888888",
    align: "left",
    verticalAlign: "bottom",
  });
  layout(doc, t);
}

// ============================================================
// Page 1: Title + Proportional Positioning (using FlexBox column layout)
// ============================================================

const page1 = new FlexBox({
  x: left,
  y: 72,
  width: pageWidth,
  height: 698, // A4 content area height
  measure: "absolute",
  direction: "column",
  justifyContent: "space-between",
  alignItems: "stretch",
  borderWidth: 0,
});

// Title section
const titleBox = new Box({
  x: 0, y: 0, width: pageWidth, height: 80,
  measure: "absolute",
});
titleBox.addChildren(
  new Text({
    x: 0, y: 0, width: "100%", height: "65%",
    text: "pdfkit-layout",
    fontSize: 36,
    color: "#1a1a2e",
    align: "center",
    verticalAlign: "center",
  }),
  new Text({
    x: 0, y: 0.65, width: "100%", height: "35%",
    text: "A flexbox-style layout system for PDFKit",
    fontSize: 14,
    color: "#666666",
    align: "center",
    verticalAlign: "top",
  }),
);
page1.addChild(titleBox);

// Section: Proportional Positioning
const propSection = new Box({
  x: 0, y: 0, width: pageWidth, height: 210,
  measure: "absolute",
});
propSection.addChildren(
  new Text({
    x: 0, y: 0, width: "100%", height: "14%",
    text: "Proportional Positioning",
    fontSize: 20,
    color: "#16213e",
    align: "left",
    verticalAlign: "bottom",
  }),
);

const proportionalParent = new Box({
  x: 0, y: 0.17, width: "100%", height: "83%",
  borderWidth: 1,
  borderColor: "#cccccc",
  padding: 10,
});
proportionalParent.addChildren(
  new Text({
    x: 0, y: 0, width: "50%", height: "50%",
    text: "Top-Left (50% x 50%)",
    fontSize: 11, color: "#e94560", align: "center", verticalAlign: "center",
    borderWidth: 1, borderColor: "#e94560",
  }),
  new Text({
    x: 0.5, y: 0, width: "50%", height: "50%",
    text: "Top-Right (50% x 50%)",
    fontSize: 11, color: "#0f3460", align: "center", verticalAlign: "center",
    borderWidth: 1, borderColor: "#0f3460",
  }),
  new Text({
    x: 0, y: 0.5, width: "100%", height: "50%",
    text: "Bottom Full Width (100% x 50%)",
    fontSize: 11, color: "#533483", align: "center", verticalAlign: "center",
    borderWidth: 1, borderColor: "#533483",
  }),
);
propSection.addChild(proportionalParent);
page1.addChild(propSection);

// Section: Nested proportional
const nestedSection = new Box({
  x: 0, y: 0, width: pageWidth, height: 160,
  measure: "absolute",
});
nestedSection.addChild(
  new Text({
    x: 0, y: 0, width: "100%", height: "18%",
    text: "Nested Proportional Boxes",
    fontSize: 20,
    color: "#16213e",
    align: "left",
    verticalAlign: "bottom",
  }),
);

const outerBox = new Box({
  x: 0, y: 0.22, width: "100%", height: "78%",
  borderWidth: 1,
  borderColor: "#cccccc",
});
const innerLeft = new Box({
  x: 0, y: 0, width: "60%", height: "100%",
  borderWidth: 1, borderColor: "#3498db", padding: 8,
});
innerLeft.addChild(new Text({
  x: 0, y: 0, width: "100%", height: "100%",
  text: "60% width, padding: 8",
  fontSize: 10, color: "#3498db", align: "center", verticalAlign: "center",
}));
const innerRight = new Box({
  x: 0.6, y: 0, width: "40%", height: "100%",
  borderWidth: 1, borderColor: "#e67e22", padding: 8,
});
innerRight.addChild(new Text({
  x: 0, y: 0, width: "100%", height: "100%",
  text: "40% width, padding: 8",
  fontSize: 10, color: "#e67e22", align: "center", verticalAlign: "center",
}));
outerBox.addChildren(innerLeft, innerRight);
nestedSection.addChild(outerBox);
page1.addChild(nestedSection);

// Section: Margin
const marginSection = new Box({
  x: 0, y: 0, width: pageWidth, height: 130,
  measure: "absolute",
});
marginSection.addChildren(
  new Text({
    x: 0, y: 0, width: "100%", height: "22%",
    text: "Margin",
    fontSize: 20,
    color: "#16213e",
    align: "left",
    verticalAlign: "bottom",
  }),
  new Text({
    x: 0, y: 0.22, width: "100%", height: "10%",
    text: "margin: 0 vs margin: 15 — margin creates space between box edge and content",
    fontSize: 9,
    color: "#888888",
    align: "left",
    verticalAlign: "bottom",
  }),
);

const marginParent = new Box({
  x: 0, y: 0.35, width: "100%", height: "65%",
  borderWidth: 1,
  borderColor: "#cccccc",
});
marginParent.addChildren(
  new Text({
    x: 0, y: 0, width: "50%", height: "100%",
    text: "margin: 0",
    fontSize: 10, color: "#27ae60", align: "center", verticalAlign: "center",
    borderWidth: 1, borderColor: "#27ae60",
  }),
  new Text({
    x: 0.5, y: 0, width: "50%", height: "100%",
    text: "margin: 15",
    fontSize: 10, color: "#8e44ad", align: "center", verticalAlign: "center",
    borderWidth: 1, borderColor: "#8e44ad",
    margin: 15,
  }),
);
marginSection.addChild(marginParent);
page1.addChild(marginSection);

layout(doc, page1);

// ============================================================
// Page 2: Text Properties
// ============================================================
doc.addPage();

let y = 72;

const page2Title = new Text({
  x: left,
  y: y,
  width: pageWidth,
  height: 50,
  measure: "absolute",
  text: "Text Properties",
  fontSize: 28,
  color: "#1a1a2e",
  align: "center",
  verticalAlign: "center",
});
layout(doc, page2Title);
y += 55;

// fontSize
sectionTitle(y, "fontSize");
y += 35;

const fontSizes = [8, 10, 12, 16, 20, 28];
const fsRow = new FlexBox({
  x: left,
  y: y,
  width: pageWidth,
  height: 45,
  measure: "absolute",
  direction: "row",
  justifyContent: "flex-start",
  alignItems: "flex-end",
  gap: 10,
  borderWidth: 0.5,
  borderColor: "#cccccc",
  padding: 5,
});
for (const size of fontSizes) {
  fsRow.addChild(
    new Text({
      width: 60,
      height: 40,
      measure: "absolute",
      text: `${size}pt`,
      fontSize: size,
      color: "#333333",
      align: "center",
      verticalAlign: "bottom",
    }),
  );
}
layout(doc, fsRow);
y += 60;

// color
sectionTitle(y, "color");
y += 35;

const colors = [
  { name: "black", hex: "#000000" },
  { name: "red", hex: "#e74c3c" },
  { name: "blue", hex: "#3498db" },
  { name: "green", hex: "#27ae60" },
  { name: "purple", hex: "#9b59b6" },
  { name: "gray", hex: "#95a5a6" },
];
const colorRow = new FlexBox({
  x: left,
  y: y,
  width: pageWidth,
  height: 35,
  measure: "absolute",
  direction: "row",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: 8,
  borderWidth: 0.5,
  borderColor: "#cccccc",
  padding: 5,
});
for (const c of colors) {
  colorRow.addChild(
    new Text({
      width: 65,
      height: 25,
      measure: "absolute",
      text: c.hex,
      fontSize: 9,
      color: c.hex,
      align: "center",
      verticalAlign: "center",
      borderWidth: 1,
      borderColor: c.hex,
    }),
  );
}
layout(doc, colorRow);
y += 50;

// align (horizontal)
sectionTitle(y, "align");
y += 35;

const aligns: Array<"left" | "center" | "right"> = ["left", "center", "right"];
const alignRow = new FlexBox({
  x: left,
  y: y,
  width: pageWidth,
  height: 40,
  measure: "absolute",
  direction: "row",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: 10,
  borderWidth: 0.5,
  borderColor: "#cccccc",
  padding: 5,
});
for (const a of aligns) {
  alignRow.addChild(
    new Text({
      width: 140,
      height: 30,
      measure: "absolute",
      text: `align: "${a}"`,
      fontSize: 10,
      color: "#333333",
      align: a,
      verticalAlign: "center",
      borderWidth: 1,
      borderColor: "#aaaaaa",
      padding: 4,
    }),
  );
}
layout(doc, alignRow);
y += 55;

// verticalAlign
sectionTitle(y, "verticalAlign");
y += 35;

const vAligns: Array<"top" | "center" | "bottom"> = ["top", "center", "bottom"];
const vAlignRow = new FlexBox({
  x: left,
  y: y,
  width: pageWidth,
  height: 70,
  measure: "absolute",
  direction: "row",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: 10,
  borderWidth: 0.5,
  borderColor: "#cccccc",
  padding: 5,
});
for (const va of vAligns) {
  vAlignRow.addChild(
    new Text({
      width: 140,
      height: 60,
      measure: "absolute",
      text: `verticalAlign: "${va}"`,
      fontSize: 10,
      color: "#333333",
      align: "center",
      verticalAlign: va,
      borderWidth: 1,
      borderColor: "#aaaaaa",
      padding: 4,
    }),
  );
}
layout(doc, vAlignRow);
y += 85;

// padding
sectionTitle(y, "padding");
y += 35;

const paddings = [0, 5, 15, 20];
const padRow = new FlexBox({
  x: left,
  y: y,
  width: pageWidth,
  height: 80,
  measure: "absolute",
  direction: "row",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: 10,
  borderWidth: 0.5,
  borderColor: "#cccccc",
  padding: 5,
});
for (const p of paddings) {
  padRow.addChild(
    new Text({
      width: 100,
      height: 70,
      measure: "absolute",
      text: `padding: ${p}`,
      fontSize: 10,
      color: "#333333",
      align: "left",
      verticalAlign: "top",
      borderWidth: 1,
      borderColor: "#3498db",
      padding: p,
    }),
  );
}
layout(doc, padRow);
y += 95;

// borderWidth + borderColor
sectionTitle(y, "borderWidth + borderColor");
y += 35;

const borders = [
  { width: 0.5, color: "#95a5a6" },
  { width: 1, color: "#3498db" },
  { width: 2, color: "#e74c3c" },
  { width: 4, color: "#27ae60" },
];
const borderRow = new FlexBox({
  x: left,
  y: y,
  width: pageWidth,
  height: 50,
  measure: "absolute",
  direction: "row",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: 10,
  borderWidth: 0.5,
  borderColor: "#cccccc",
  padding: 5,
});
for (const b of borders) {
  borderRow.addChild(
    new Text({
      width: 100,
      height: 40,
      measure: "absolute",
      text: `${b.width}px ${b.color}`,
      fontSize: 9,
      color: b.color,
      align: "center",
      verticalAlign: "center",
      borderWidth: b.width,
      borderColor: b.color,
    }),
  );
}
layout(doc, borderRow);

// ============================================================
// Page 3: Image Properties + FlexBox Layouts
// ============================================================
doc.addPage();
y = 72;

const page3Title = new Text({
  x: left,
  y: y,
  width: pageWidth,
  height: 50,
  measure: "absolute",
  text: "Image Properties",
  fontSize: 28,
  color: "#1a1a2e",
  align: "center",
  verticalAlign: "center",
});
layout(doc, page3Title);
y += 55;

// fit: contain vs cover
sectionTitle(y, "fit");
y += 35;

const fitHalf = Math.floor((pageWidth - 20) / 2);
label(left, y, fitHalf, 'fit: "contain"');
label(left + fitHalf + 20, y, fitHalf, 'fit: "cover"');
y += 18;

const containImg = new Image({
  x: left,
  y: y,
  width: fitHalf,
  height: 120,
  measure: "absolute",
  src: "static/tools1.jpg",
  fit: "contain",
  align: "center",
  verticalAlign: "center",
  borderWidth: 1,
  borderColor: "#3498db",
});
layout(doc, containImg);

const coverImg = new Image({
  x: left + fitHalf + 20,
  y: y,
  width: fitHalf,
  height: 120,
  measure: "absolute",
  src: "static/tools1.jpg",
  fit: "cover",
  align: "center",
  verticalAlign: "center",
  borderWidth: 1,
  borderColor: "#e74c3c",
});
layout(doc, coverImg);
y += 135;

// align + verticalAlign on images
sectionTitle(y, "Image align + verticalAlign");
y += 35;

const imgAligns: Array<{ align: "left" | "center" | "right"; vAlign: "top" | "center" | "bottom" }> = [
  { align: "left", vAlign: "top" },
  { align: "center", vAlign: "center" },
  { align: "right", vAlign: "bottom" },
];
const imgAlignRow = new FlexBox({
  x: left,
  y: y,
  width: pageWidth,
  height: 100,
  measure: "absolute",
  direction: "row",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: 10,
  borderWidth: 0.5,
  borderColor: "#cccccc",
  padding: 5,
});
for (const ia of imgAligns) {
  imgAlignRow.addChild(
    new Image({
      x: 0,
      y: 0,
      width: 140,
      height: 70,
      measure: "absolute",
      src: "static/tools1.jpg",
      fit: "contain",
      align: ia.align,
      verticalAlign: ia.vAlign,
      borderWidth: 1,
      borderColor: "#3498db",
    }),
  );
}
layout(doc, imgAlignRow);
for (let i = 0; i < imgAligns.length; i++) {
  const ia = imgAligns[i];
  label(
    left + 5 + i * 150,
    y + 105,
    140,
    `align: "${ia.align}", vAlign: "${ia.vAlign}"`,
  );
}
y += 135;

// FlexBox section
const flexTitle = new Text({
  x: left,
  y: y,
  width: pageWidth,
  height: 50,
  measure: "absolute",
  text: "FlexBox Layouts",
  fontSize: 28,
  color: "#1a1a2e",
  align: "center",
  verticalAlign: "center",
});
layout(doc, flexTitle);
y += 55;

function flexLabel(text: string) {
  label(left, y, pageWidth, text);
  y += 18;
}

// Row with flex-start
flexLabel('direction: "row", justifyContent: "flex-start", gap: 10, padding: 5');

const row1 = new FlexBox({
  x: left,
  y: y,
  width: pageWidth,
  height: 50,
  measure: "absolute",
  direction: "row",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: 10,
  borderWidth: 0.5,
  borderColor: "#cccccc",
  padding: 5,
});
for (let i = 0; i < 4; i++) {
  row1.addChild(
    new Text({
      width: 80,
      height: 36,
      measure: "absolute",
      text: `Item ${i + 1}`,
      fontSize: 10,
      color: "#4a90d9",
      align: "center",
      verticalAlign: "center",
      borderWidth: 1,
      borderColor: "#4a90d9",
    }),
  );
}
layout(doc, row1);
y += 60;

// Row with space-between
flexLabel('direction: "row", justifyContent: "space-between", padding: 5');

const row2 = new FlexBox({
  x: left,
  y: y,
  width: pageWidth,
  height: 50,
  measure: "absolute",
  direction: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderWidth: 0.5,
  borderColor: "#cccccc",
  padding: 5,
});
for (let i = 0; i < 4; i++) {
  row2.addChild(
    new Text({
      width: 80,
      height: 36,
      measure: "absolute",
      text: `Item ${i + 1}`,
      fontSize: 10,
      color: "#d94a4a",
      align: "center",
      verticalAlign: "center",
      borderWidth: 1,
      borderColor: "#d94a4a",
    }),
  );
}
layout(doc, row2);
y += 60;

// Row with center
flexLabel('direction: "row", justifyContent: "center", gap: 15, padding: 5');

const row3 = new FlexBox({
  x: left,
  y: y,
  width: pageWidth,
  height: 50,
  measure: "absolute",
  direction: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: 15,
  borderWidth: 0.5,
  borderColor: "#cccccc",
  padding: 5,
});
for (let i = 0; i < 3; i++) {
  row3.addChild(
    new Text({
      width: 100,
      height: 36,
      measure: "absolute",
      text: `Item ${i + 1}`,
      fontSize: 10,
      color: "#27ae60",
      align: "center",
      verticalAlign: "center",
      borderWidth: 1,
      borderColor: "#27ae60",
    }),
  );
}
layout(doc, row3);

doc.end();
console.log("Generated example.pdf");
