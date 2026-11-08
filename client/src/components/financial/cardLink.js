/**
 * Card-wide link ("stretched link") classes shared by StatCard and IndicatorCard (docs/design.md section 4).
 * The label is the only <a>; its ::after covers the card, so other controls inside the card (raised with
 * `relative z-10`, e.g. a <details>) stay separately clickable. The focus ring is drawn on the whole card.
 */
export const linkedCardClass =
  'relative transition-shadow hover:border-primary/50 hover:shadow-md has-[a[data-card-link]:focus-visible]:outline-2 has-[a[data-card-link]:focus-visible]:outline-offset-2 has-[a[data-card-link]:focus-visible]:outline-ring'
export const cardLinkClass = 'after:absolute after:inset-0 after:rounded-[inherit] after:content-[""] focus-visible:outline-none'
