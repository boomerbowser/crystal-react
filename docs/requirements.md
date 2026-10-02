# Crystal React: the brief, as given

Meridian's requirements are recorded here verbatim, so that the plan can be
checked against the original wording. Where a requirement was clarified later, the
clarification is recorded beneath it with its date.

---

## The original brief (2026-09-18)

> We need to create a comprehensive React component library for Crystal. To
> accomplish this, we want you to:
>
> - Use React Aria for the unstyled primitive library underneath
> - Ensure complete parity with other fully-featured React component libraries
>   (PrimeReact, Mantine, MUI & MUI X, Ant Design), including additional
>   components that are normally shipped as extensions or add-ons
> - Ensure components are shipped with Crystal's animations at every appropriate
>   step
> - Ensure there is a theme provider, a proper theme object, color scheme and
>   typography context, hooks, etc. either from or fully in-line with the Crystal
>   Design System
> - Ensure the library is written in 100% functional and correct TypeScript
> - Ensure the library is compatible with frameworks like NextJS, TanStack Start,
>   React Router, Gatsby, and Redwood
> - Ensure the library can be integrated with Vitest, Jest, Storybook, and LLMs
> - Ensure styling is either handled by Emotion with configurable values made
>   available to users and consumers as props, or that styling is handled under
>   the hood with CSS made easier to work with using SASS, LESS, & PostCSS (we
>   greatly prefer the second option, especially given the context provider(s) but
>   if you think Emotion is better, go with that instead)
> - Ensure the components are dynamic and responsive, making full utilization of
>   the Crystal Design System. In fact, try to improve on the animations during
>   implementation
> - Ensure the library implements form components, state, validation, submission,
>   and mutations with Crystals styling, theming, materials, and animations
> - Name the library Crystal React, and then it's made into an npm/pnpm/bun/yarn
>   package, it's name will be @crystal-ui/react

## Clarifications

**Separate repositories (2026-09-18).** "Make sure the component library and design
system are in separate folders with separate github repos."

**Documentation site (2026-09-18).** A docs website for Crystal React, deployable
to Vercel, "with details, explanations, and isolated visual and code examples for
each component (in-line with the docs websites for MUI, Mantine, PrimeReact,
Blueprint, etc.)".

**Namespace (2026-09-18).** "There should be no @meridian/crystal. Crystal Design
System packages should be under the @crystal scope."

**React-native dependencies (2026-09-18).** "Crystal React should update from
Motion for javaScript to motion for React, if it hasn't already", and then:
"Other libraries that were previously mainly JavaScript that have comparable or
upgraded libraries in React should've received that upgrade already, and we're
concerned this wasn't part of your implementation plan."

**What parity actually meant (2026-09-18).** This correction changed the scope.
It is recorded at length because the first reading of "parity" was wrong:

> Same thing goes for features, (just as an example) Crystal's drag element
> specification can't actually yet handle users click-and-dragging elements.
> Motion has a fix for this, and React-Aria should as well. Make sure upgraded and
> enhanced functionality for each component per-component is included in Crystal
> React's implementation plan. This is what we meant when we specified in Crystal
> React's requirements that the library needs components and functionality that
> would normally be found in extensions and addons of popular UI systems (such as
> click-and-drag elements, date pickers, complex input components like File Input,
> Upload, and UploadZone, Spotlight/Command Zone, Floating Action Button, multiple
> navbar, menu, and submenu types, animated toasts and banners, Alerts, Loading
> and Skeletons, Pagination, Portal, Video and Music Player components and
> elements, Gallery, Carousel, and absolutely all of React-Aria's predefined
> components), and that this request was part of Crystal React's parity
> requirements.

**Third-party libraries (2026-09-18).** Permitted where they help, "just make sure
they don't require a paid license".

---

## What the last clarification changed

The first reading of parity counted component names against four benchmark
libraries. A catalogue can pass that check while still being unable to drag an
element, upload a file with progress or play a video, because a count of names
does not show a missing capability.

Two things followed:

1. React Aria's own component list became a source. CONTRACT §3 says to wrap a
   maintained primitive rather than rebuild it, so a primitive that React Aria
   ships and Crystal does not name is a gap: Crystal would go without accessible
   behaviour that is already available. The installed package was enumerated and
   diffed against the catalogue.
2. Capability is specified per component and is no longer inferred from the
   name. See §4.1 of the implementation plan.

28 components were added on that basis, including a `media` category, which
Crystal did not have before. The catalogue now holds 202 components.
