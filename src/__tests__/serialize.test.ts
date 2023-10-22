import { test, expect } from "vitest";
import { serialize, serializeGenerator } from "../serialize";

test.each`
	field                     | options               | expectedText
	${null}                   | ${undefined}          | ${""}
	${undefined}              | ${undefined}          | ${""}
	${""}                     | ${undefined}          | ${""}
	${"text"}                 | ${undefined}          | ${"text"}
	${'"text"'}               | ${undefined}          | ${'"""text"""'}
	${"te;xt"}                | ${undefined}          | ${'"te;xt"'}
	${"te;xt"}                | ${{ delimiter: "," }} | ${"te;xt"}
	${-1234.567}              | ${undefined}          | ${"-1234.567"}
	${new Date("2023-10-22")} | ${undefined}          | ${"2023-10-22T00:00:00.000Z"}
`("default serializes field $field", ({ field, options, expectedText }) => {
	const [, line] = Array.from(
		serializeGenerator([{ field }], [["field", "field"]], options)
	);
	expect(line).toBe(expectedText + "\r\n");
});

test("serialize sync generator", () => {
	expect(
		Array.from(
			serializeGenerator([{ value: "A" }, { value: "B" }], [["value", "Value"]])
		)
	).toStrictEqual(["Value\r\n", "A\r\n", "B\r\n"]);
});

test("serialize", () => {
	expect(
		serialize([{ value: "A" }, { value: "B" }], [["value", "Value"]])
	).toBe("Value\r\n" + "A\r\n" + "B\r\n");
});
