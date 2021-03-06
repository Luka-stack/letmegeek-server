export function makeId(length: number): string {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOQPRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; ++i) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function slugify(str: string): string {
  str = str.trim().toLowerCase();

  const from = 'åàáãäâèéëêìíïîòóöôùúüûñç·/_,:;';
  const to = 'aaaaaaeeeeiiiioooouuuunc------';

  for (let i = 0, l = from.length; i < l; ++i) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  return str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+/, '') // trim - from start of text
    .replace(/-+$/, '') // trim - from end of text
    .replace(/-/g, '_');
}

export function prepareMultipleNestedAndQueryForStringField(
  filter: string,
  field: string,
): [string, Record<string, unknown>] {
  let query = '(';
  const values = {};

  filter.split(',').forEach((value) => {
    const lowerCaseValue = value.toLowerCase();
    query += `LOWER(${field}) LIKE :${lowerCaseValue} AND `;
    values[lowerCaseValue] = `%${lowerCaseValue}%`;
  });
  query = query.slice(0, -4) + ')';

  return [query, values];
}

export function removeSpacesFromCommaSeparatedString(values: string): string {
  return values
    .split(',')
    .map((v) => v.trim())
    .join(',');
}
