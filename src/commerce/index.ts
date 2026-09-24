/* The commerce slice's shared vocabulary. Exported because a product composing
   these components needs the `Money` shape to pass one, and the availability
   states to switch on. */
export { moneyFormat, percentOff, sameCurrency } from './money.js';
export type { Money } from './money.js';
export { AVAILABILITY_LABEL, AVAILABILITY_STATUS } from './availability.js';
export type { Availability } from './availability.js';
