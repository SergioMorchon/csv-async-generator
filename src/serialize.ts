type Headers<Item> = ReadonlyArray<
  [fieldProperty: keyof Item, headerText: string]
>;
type FieldSerializer<Item> = (
  value: Item[typeof propertyName],
  propertyName: keyof Item,
) => string;

type SerializeOptions<Item> = Readonly<{
  delimiter: string;
  lineBreak: string;
  serializeField: FieldSerializer<Item>;
}>;

const DELIMITER = "delimiter";
const LINE_BREAK = "lineBreak";
const SERIALIZE_FIELD = "serializeField";

const escapeField = <Item>(field: string, options: SerializeOptions<Item>) =>
  /"|\r|\n/.test(field) || field.includes(options[DELIMITER])
    ? `"${field.replace(/"/g, '""')}"`
    : field;

const createRecord = <Item>(
  fields: ReadonlyArray<string>,
  options: SerializeOptions<Item>,
) =>
  fields.map((field) => escapeField(field, options)).join(options[DELIMITER]) +
  options[LINE_BREAK];

const toString = (value: unknown) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
};

const createHeader = <Item>(
  headers: Headers<Item>,
  options: SerializeOptions<Item>,
) =>
  createRecord(
    headers.map(([, headerText]) => headerText),
    options,
  );

const createContent = <Item>(
  headers: Headers<Item>,
  item: Item,
  options: SerializeOptions<Item>,
) =>
  createRecord(
    headers.map(([fieldProperty], headerIndex) =>
      options[SERIALIZE_FIELD](item[fieldProperty], headers[headerIndex][0]),
    ),
    options,
  );

type Signature<Item, Items> = [
  items: Items,
  headers: Headers<Item>,
  options?: Partial<SerializeOptions<Item>>,
];

const normalizeArgs = <Item, Items>(...args: Signature<Item, Items>) => {
  const [items, headers, options] = args;
  return [
    items,
    headers,
    {
      [DELIMITER]: ";",
      [LINE_BREAK]: "\r\n",
      [SERIALIZE_FIELD]: toString,
      ...options,
    },
  ] as const;
};

export const serializeAsyncGenerator = async function* <Item>(
  ...args: Signature<Item, AsyncIterable<Item>>
) {
  const [items, headers, options] = normalizeArgs(...args);
  yield createHeader(headers, options);
  for await (const item of items) {
    yield createContent(headers, item, options);
  }
};

export const serializeGenerator = function* <Item>(
  ...args: Signature<Item, Iterable<Item>>
) {
  const [items, headers, options] = normalizeArgs(...args);
  yield createHeader(headers, options);
  for (const item of items) {
    yield createContent(headers, item, options);
  }
};

export const serialize = <Item>(...args: Signature<Item, Iterable<Item>>) =>
  Array.from(serializeGenerator(...args)).join("");
