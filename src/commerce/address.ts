/* The shape of an address form, which is data the product owns.
 *
 * "Field order, labels and required-ness change by country; postcode validation
 * is per-locale, not one regular expression." And, from the catalogue's own
 * product column: "**countries supported and their field rules**".
 *
 * That last line is the boundary, and it is the one worth defending. A design
 * system that ships a table of countries has taken on a data set that is wrong
 * the week it is written and wrong differently every year after: postcodes
 * change, administrative divisions are renamed and abolished, countries come and
 * go, and which of them a shop delivers to is a commercial decision this library
 * has no view on. Worse, a wrong table is invisible — the form renders, and one
 * country's addresses are quietly unusable.
 *
 * So the library ships the **shape** and the renderer, and the product ships the
 * descriptors. That is a real division rather than a dodge: everything that is
 * hard and general — the field order being honoured, the autocomplete tokens
 * being right, required-ness reaching the control, validation reaching the
 * field's own message — lives here and is tested here.
 *
 * Reference descriptors live in the stories, where they are examples rather than
 * a source of truth somebody might import.
 */

/** One field of an address. */
export interface AddressField {
  /** The key this field reads and writes in the address value. */
  name: string;
  label: string;
  /**
   * The browser's autofill token — `address-line1`, `address-level2`,
   * `postal-code`, `country-name`. Required, and deliberately not optional: a
   * field without one is a field a reader has to type by hand every time, and
   * the tokens are a fixed vocabulary rather than a per-country decision.
   */
  autoComplete: string;
  required?: boolean;
  /** Turns the field into a select — a state, a province, a region. */
  options?: readonly { value: string; label: string }[];
  /** A hint under the field. */
  description?: string;
  /**
   * Checked when the field is left. Returns a message, or nothing when the
   * value is acceptable. Per-locale, because one regular expression for the
   * world's postcodes is a regular expression that is wrong somewhere.
   */
  validate?: (value: string) => string | undefined;
}

/** The fields one country's addresses have, in the order they are written. */
export interface AddressDescriptor {
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** What the country is called, in the reader's language. */
  countryLabel: string;
  /** In the order this country writes them. */
  fields: readonly AddressField[];
}

/** The values, keyed by each field's `name`. */
export type AddressValue = Record<string, string>;
