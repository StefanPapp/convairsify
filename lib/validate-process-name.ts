const GIBBERISH_PATTERN = /^[^aeiou]{4,}$|^(.)\1{2,}$/i;

const VAGUE_NAMES = new Set([
  "test",
  "testing",
  "untitled",
  "process",
  "new process",
  "my process",
  "asdf",
  "temp",
  "tmp",
  "foo",
  "bar",
  "baz",
  "example",
  "sample",
  "demo",
  "stuff",
  "thing",
  "todo",
  "draft",
  "placeholder",
]);

export function validateProcessName(name: string): string | null {
  const trimmed = name.trim();

  if (!trimmed) return null;

  if (trimmed.length < 3) {
    return "Name is too short — use a descriptive, universally recognizable name.";
  }

  if (VAGUE_NAMES.has(trimmed.toLowerCase())) {
    return `"${trimmed}" is too generic — use a name anyone in your org would recognize (e.g., "Sample Receipt QC").`;
  }

  if (GIBBERISH_PATTERN.test(trimmed)) {
    return "This doesn't look like a meaningful name — use something universally recognizable.";
  }

  return null;
}
