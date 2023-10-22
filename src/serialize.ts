type Header<Item> = [fieldProperty: keyof Item, headerText: string];
type Headers<Item> = ReadonlyArray<Header<Item>>;
type FieldSerializer<Item> = (
	value: Item[typeof propertyName],
	propertyName: keyof Item,
) => string;

type SerializeOptions<Item> = Readonly<{
	delimiter: string;
	lineBreak: string;
	serializeField: FieldSerializer<Item>;
}>;

const escapeField = (field: string, options: SerializeOptions<any>) =>
	/"|\r|\n/.test(field) || field.includes(options.delimiter)
		? `"${field.replace(/"/g, '""')}"`
		: field;

const createRecord = (
	fields: ReadonlyArray<string>,
	options: SerializeOptions<any>
) =>
	fields.map((field) => escapeField(field, options)).join(options.delimiter) +
	options.lineBreak;

const toString = (value: any) => {
	if (value === undefined || value === null) {
		return "";
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	return String(value);
};

const defaultOptions: SerializeOptions<any> = {
	delimiter: ";",
	lineBreak: "\r\n",
	serializeField: toString,
};

const createHeader = (headers: Headers<any>, options: SerializeOptions<any>) =>
	createRecord(
		headers.map(([, headerText]) => headerText),
		options
	);

const createContent = (
	headers: Headers<any>,
	item: any,
	options: SerializeOptions<any>
) =>
	createRecord(
		headers.map(([fieldProperty], headerIndex) =>
			options.serializeField(item[fieldProperty], headers[headerIndex][0])
		),
		options
	);

type Signature<Item, Items> = [
	items: Items,
	headers: Headers<Item>,
	options?: Partial<SerializeOptions<Item>>,
];

const normalizeArgs = <Item, Items>(...args: Signature<Item, Items>) => {
	const [items, headers, options] = args;
	return [items, headers, { ...defaultOptions, ...options }] as const;
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
