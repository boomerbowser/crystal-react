# Crystal's environment, in Storybook's Controls panel

Meridian's report, 19 September 2026, with a screenshot of the Tab Strip story
and the Controls panel reading *"This story has no controls"*:

> this is where and what we were talking about in terms of how Crystal's
> controls should be translated to Storybook

`controls-panel-after.png` is the same story afterwards. Fourteen controls under
an **Environment** group, matching Crystal's own "Make it yours" panel:

| Crystal's control | Here |
|---|---|
| Product palette | inline radio, six palettes |
| Appearance | light / dark / **system** — the Auto the toolbar never offered |
| Colour atmosphere | slider, 15–90, live value |
| Frost base tint | slider, 35–85 |
| Elevation | slider, 60–150 |
| Corner radius | slider, 14–28 |
| Content density | comfortable / compact |
| Typeface | manrope / system — **added**, the provider never forwarded `font` |
| Animation speed | slider, 0.25–2 |
| Reduce motion | checkbox |
| Reduce transparency | checkbox — **separated** from the product's `effects` |

Every range is read from Crystal's own `RANGES` and `CHOICES` rather than
retyped, so a floor Crystal moves moves here.

The toolbar stays. The two do different jobs: the toolbar takes one axis across
many stories, the args drive many axes on one story.
