type Column<Item> = Readonly<{
  header: string;
  cell: (item: Item) => string | null | undefined;
}>;
type Columns<Item> = ReadonlyArray<Column<Item>>;

type SerializeOptions = Readonly<{
  delimiter: string;
  lineBreak: string;
}>;

const escapeField = (field: string, options: SerializeOptions) =>
  /"|\r|\n/.test(field) || field.includes(options.delimiter)
    ? `"${field.replace(/"/g, '""')}"`
    : field;

const createRecord = (
  fields: ReadonlyArray<string>,
  options: SerializeOptions,
) =>
  fields.map((field) => escapeField(field, options)).join(options.delimiter) +
  options.lineBreak;

const createHeader = <Item>(
  columns: Columns<Item>,
  options: SerializeOptions,
) =>
  createRecord(
    columns.map((it) => it.header),
    options,
  );

const createContent = <Item>(
  headers: Columns<Item>,
  item: Item,
  options: SerializeOptions,
) =>
  createRecord(
    headers.map((it) => it.cell(item) ?? ""),
    options,
  );

type Signature<Item, Items> = [
  items: Items,
  columns: Columns<Item>,
  options?: Partial<SerializeOptions>,
];

const normalizeArgs = <Item, Items>(...args: Signature<Item, Items>) => {
  const [items, columns, options] = args;
  return [
    items,
    columns,
    {
      delimiter: ";",
      lineBreak: "\r\n",
      ...options,
    } satisfies SerializeOptions,
  ] as const;
};

export const serializeAsyncGenerator = async function* <Item>(
  ...args: Signature<Item, AsyncIterable<Item>>
) {
  const [items, columns, options] = normalizeArgs(...args);
  yield createHeader(columns, options);
  for await (const item of items) {
    yield createContent(columns, item, options);
  }
};

export const serializeGenerator = function* <Item>(
  ...args: Signature<Item, Iterable<Item>>
) {
  const [items, columns, options] = normalizeArgs(...args);
  yield createHeader(columns, options);
  for (const item of items) {
    yield createContent(columns, item, options);
  }
};

export const serialize = <Item>(...args: Signature<Item, Iterable<Item>>) =>
  Array.from(serializeGenerator(...args)).join("");
