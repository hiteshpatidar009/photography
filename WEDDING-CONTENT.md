# Tarun & Shelu — editing the wedding website

This is the existing Basex photography template, converted locally. No framework,
packages, font families, animation libraries, or hosting configuration were replaced.

## Content mapping

| Original section | Wedding content |
| --- | --- |
| Photographer hero / moving wall | Couple names, invitation, decorative wall until confirmed photos arrive |
| About / quote / years counter | Welcome, blessings, five gatherings counter |
| Portfolio grid / PhotoSwipe | Memories gallery with clearly labelled illustrated placeholders |
| Two skills columns | Couple introductions and editable story placeholders |
| Services / animated circular charts | Five-event timeline; animated rings surround calendar days |
| Contact / animated modal | Venue, directions, family contact, invitation and RSVP details |

Original Raleway and Oswald fonts, spacing utilities, responsive columns, circular
hover buttons, loader, navigation transition, wall drag/drift, counter, parallax,
chart easing and PhotoSwipe transitions remain. Content-specific styles are in
`css/wedding.css`. Gallery pagination now opens the current images in PhotoSwipe.

## Edit invitation details

Edit `js/wedding-config.js`:

- `story.meeting` and `story.memories`: the couple's actual story.
- `events`: each event's venue, time, and optional map URL. Dates and themes match
  the supplied invitation. There is no event on 12 February and no assumed ceremony date.
- `venue`, `mapUrl`, `contactName`, `contactPhone`: invitation contact information.
- `rsvpUrl`: full HTTPS URL to the actual RSVP service/form. Until supplied, the
  modal shows a pending message and collects no guest information.
- `rsvpMessage`: instructions to accompany the RSVP link.

Couple introductions and other editorial copy live in `index.html`.

## Add authentic photographs

No existing portfolio photographs have been identified as this couple. They remain
on disk but are not displayed. The SVGs are decorative illustrations, not portraits.

Add confirmed photos to `img/couple/` and entries to `photos` in the configuration:

```js
{ src: 'img/couple/memory.jpg',
  thumbnail: 'img/couple/web/memory.jpg',
  large: 'img/couple/large/memory.jpg',
  width: 1600, height: 1200,
  caption: 'Our caption' }
```

`width` and `height` must match the large image's dimensions. Thumbnail and large
paths are optional; they fall back to `src`. Optimized copies are recommended.
Once photos are supplied, both the wall and gallery use them automatically.
Do not use the old `add-image.py` / `add-images.html` workflow: it targets the
original photographer's hardcoded lists. Use the configuration above instead.

## Sources and unknowns

Names, profession, workplace, event details and supplied social links came from the
task. Tarun's public LinkedIn result also supports Ujjain and IET DAVV affiliation:
https://in.linkedin.com/in/tarun-gami-64b0a2200
No verified YouTube channel was established, so none is included. No bride biography,
relationship history, ceremony date, venue or time has been invented.

## Validation

JavaScript syntax checks passed. HTML nesting, IDs, navigation targets and local
assets were checked. Node checks verified the exact five dates, generated events,
illustration paths and RSVP behavior with and without a configured link.
The local HTTP server returned 200. Browser automation was unavailable, so rendered
desktop/mobile layouts and live animations still need a browser review.

Preview locally with `python -m http.server 8765 --bind 127.0.0.1`, then visit
http://127.0.0.1:8765. The legacy PHP business-mail endpoint is disabled; RSVP uses
only the configured external link.
