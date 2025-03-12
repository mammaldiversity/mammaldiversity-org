
import { test, expect } from "@playwright/test";
import { isItalic } from "../src/scripts/utils";

test("isItalic",() => {
    expect(isItalic("_italic_")).toBe(true);
    expect(isItalic("not italic")).toBe(false);
    expect(isItalic("_not italic")).toBe(false);
    expect(isItalic("not italic_")).toBe(false);
    expect(isItalic("_not italic_")).toBe(false);
    expect(isItalic("_")).toBe(false);
});