import { test, expect } from "vitest";
import { serializeAsyncGenerator } from "../serialize";

const getPositiveNumbers = async function* () {
	let number = 1;
	while (true) {
		yield Promise.resolve(number);
		number++;
	}
};

const limit = async function* <Item>(items: AsyncIterable<Item>, max: number) {
	let count = 0;
	for await (const item of items) {
		if (count >= max) {
			return;
		}

		yield item;
		count++;
	}
};

const filter = async function* <Item>(
	items: AsyncIterable<Item>,
	predicate: (item: Item) => any
) {
	for await (const item of items) {
		if (predicate(item)) {
			yield item;
		}
	}
};

const map = async function* <Input, Output>(
	items: AsyncIterable<Input>,
	mapper: (item: Input) => Output
) {
	for await (const item of items) {
		yield mapper(item);
	}
};

const getFirstFiveEvenPositiveNumbersAsItems = () =>
	map(
		limit(
			filter(getPositiveNumbers(), (it) => it % 2),
			5
		),
		(it) => ({ value: it })
	);

test("serialize async generator", async () => {
	const lines: Array<string> = [];
	for await (const line of serializeAsyncGenerator(
		getFirstFiveEvenPositiveNumbersAsItems(),
		[["value", "Value"]]
	)) {
		lines.push(line);
	}

	expect(lines).toStrictEqual([
		"Value\r\n",
		"1\r\n",
		"3\r\n",
		"5\r\n",
		"7\r\n",
		"9\r\n",
	]);
});
