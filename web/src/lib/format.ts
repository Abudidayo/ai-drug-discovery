/**
 * Display formatting shared by every step, so a name or number reads the same everywhere.
 */

/** Upper-cases the first letter and leaves the rest alone. */
export function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * A drug's name in sentence case. ChEMBL sends preferred names in capitals (BARICITINIB,
 * ACETYLSALICYLIC ACID); they read as shouting next to the rest of the interface. Names that
 * already mix cases are left as they are.
 */
export function drugName(chemblName: string): string {
  const name = chemblName.trim();
  if (name !== name.toUpperCase()) return name;
  return capitalise(name.toLowerCase());
}

/**
 * Replaces the API's capitalised drug name inside a sentence, so statements quote the drug the
 * same way the rest of the screen does.
 */
export function withDrugName(sentence: string, chemblName: string): string {
  if (chemblName === "") return sentence;
  return sentence.split(chemblName).join(drugName(chemblName));
}

/** A signed decimal with a true minus sign, e.g. −3.1, and tabular-friendly digits. */
export function signed(value: number, digits = 1): string {
  const text = Math.abs(value).toFixed(digits);
  if (Number(text) === 0) return text;
  return value < 0 ? `−${text}` : text;
}

/** "a", "a and b", "a, b and c". */
export function listOf(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1] ?? ""}`;
}
