import { test, expect } from "vitest";
import { serialize, serializeGenerator } from "../serialize";

test.each`
  field        | options               | expectedText
  ${null}      | ${undefined}          | ${""}
  ${undefined} | ${undefined}          | ${""}
  ${""}        | ${undefined}          | ${""}
  ${"text"}    | ${undefined}          | ${"text"}
  ${'"text"'}  | ${undefined}          | ${'"""text"""'}
  ${"te;xt"}   | ${undefined}          | ${'"te;xt"'}
  ${"te;xt"}   | ${{ delimiter: "," }} | ${"te;xt"}
`("default serializes field $field", ({ field, options, expectedText }) => {
  const [, line] = Array.from(
    serializeGenerator(
      [{ field }],
      [{ header: "field", cell: (item) => item.field }],
      options,
    ),
  );
  expect(line).toBe(expectedText + "\r\n");
});

test("serialize sync generator", () => {
  expect(
    Array.from(
      serializeGenerator(
        [{ value: "A" }, { value: "B" }],
        [{ header: "Value", cell: (item) => item.value }],
      ),
    ),
  ).toStrictEqual(["Value\r\n", "A\r\n", "B\r\n"]);
});

test("serialize", () => {
  expect(
    serialize(
      [
        { propA: "A1", propB: "B1" },
        { propA: "A2", propB: "B2" },
      ],
      [
        { header: "A", cell: (item) => item.propA },
        { header: "B", cell: (item) => item.propB },
      ],
    ),
  ).toBe("A;B\r\n" + "A1;B1\r\n" + "A2;B2\r\n");
});

test("escapes the header content too", () => {
  expect(serialize([], [{ header: 'Va;"lue', cell: () => "" }])).toBe(
    '"Va;""lue"\r\n',
  );
});
