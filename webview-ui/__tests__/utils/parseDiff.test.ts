import { parseDiff } from "../../src/utils/parseDiff"

test("no changed lines", () => {
  const diff = `// src/foo.js
if (x == 1) {
  console.log("x is 1");
}`

  const result = parseDiff(diff)
  expect(result).toEqual({
    path: "src/foo.js",
    newContent: `if (x == 1) {
  console.log("x is 1");
}`,
    oldContent: `if (x == 1) {
  console.log("x is 1");
}`
  })
})

test("only added lines", () => {
  const diff = `// src/foo.js
+if (x == 1) {
+  console.log("x is 1");
+}`
  const result = parseDiff(diff)
  expect(result).toEqual({
    path: "src/foo.js",
    newContent: `if (x == 1) {
  console.log("x is 1");
}`,
    oldContent: ""
  })
})

test("only deleted lines", () => {
  const diff = `// src/foo.js
if (x == 1) {
-  console.log("x is 1");
}`
  const result = parseDiff(diff)
  expect(result).toEqual({
    path: "src/foo.js",
    newContent: `if (x == 1) {
}`,
    oldContent: `if (x == 1) {
  console.log("x is 1");
}`
  })
})

test("added and deleted lines", () => {
  const diff = `// src/foo.js
if (x == 1) {
-  console.log("x is 1");
+  console.log("x is one");
}`
  const result = parseDiff(diff)
  expect(result).toEqual({
    path: "src/foo.js",
    newContent: `if (x == 1) {
  console.log("x is one");
}`,
    oldContent: `if (x == 1) {
  console.log("x is 1");
}`
  })
})
