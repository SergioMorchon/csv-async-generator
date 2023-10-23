# CSV Async Generator

A tiny CSV library to serialize and deserialize in a performant way. You can take a look at the kind of memory problems it can solve at [serialize-async-generator.test.ts](src/__tests__/serialize-async-generator.test.ts).

## Usage

### Basic

```typescript
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
```

### Advanced

```typescript
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
  predicate: (item: Item) => any,
) {
  for await (const item of items) {
    if (predicate(item)) {
      yield item;
    }
  }
};

const map = async function* <Input, Output>(
  items: AsyncIterable<Input>,
  mapper: (item: Input) => Output,
) {
  for await (const item of items) {
    yield mapper(item);
  }
};

const getFirstFiveEvenPositiveNumbersAsItems = () =>
  map(
    limit(
      filter(getPositiveNumbers(), (it) => it % 2),
      5,
    ),
    (it) => ({ value: String(it) }),
  );

const lines: Array<string> = [];
for await (const line of serializeAsyncGenerator(
  getFirstFiveEvenPositiveNumbersAsItems(),
  [{ header: "Value", cell: (item) => item.value }],
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
```
