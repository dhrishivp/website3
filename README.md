# Tom Yum, Amersham

Website for Tom Yum Thai restaurant, 101 Sycamore Road, Amersham HP6 5EJ.

A static, single-page site with no build step: open `index.html` in a browser,
or upload the folder to any static host (GitHub Pages, Netlify, etc.).

```
index.html        page markup, SEO meta and schema.org Restaurant data
css/styles.css    all styles
js/main.js        mobile sidebar, header shadow, opening hours / "open now"
assets/img/       photos, favicon and social share image
```

## Updating details

- **Opening hours** live in two places: the table in `index.html` and the
  `HOURS` object in `js/main.js` (used for the "Open now" badge, in UK time).
  The schema.org block in the `<head>` of `index.html` should match as well.
- **Phone number** appears as `tel:+441494728806` links throughout `index.html`.

## Mobile sidebar

The sidebar is deliberately placed outside `<header>` and has a solid
background. A sidebar nested in a parent with `transform`, `filter` or
`backdrop-filter` gets positioned against that parent rather than the
viewport, which is what usually causes see-through or clipped mobile menus.
