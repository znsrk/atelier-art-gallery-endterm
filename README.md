# Atelier Art Gallery — Endterm

**Topic:** Art Gallery Website

**Group members:** Zhanserik Zharylgassyn and Erkebulan Korganbek

Atelier is a responsive student art gallery. This endterm extends the midterm's existing pages, design, six original SVG artworks, fictional artists, and exhibition themes with JavaScript and jQuery. Visitors can search the collection, open an artwork viewer, manage an exhibition table, and try validated registration and contact forms.

| Link | Address | Status |
| --- | --- | --- |
| Endterm repository | [atelier-art-gallery-endterm](https://github.com/znsrk/atelier-art-gallery-endterm) | Verified |
| Endterm website | [Open the gallery](https://znsrk.github.io/atelier-art-gallery-endterm/) | Published and verified |
| Original midterm repository | [atelier-art-gallery](https://github.com/znsrk/atelier-art-gallery) | Existing project and history |

**Repository choice:** The assignment document requests an update to the existing repository. This separate endterm repository follows the explicit request for a new repository and preserves the midterm commit history. Individual contribution assignments are omitted as requested; group member names are retained.

## Open the website

No build, npm installation, database, or account is needed.

1. Download the repository using **Code ? Download ZIP** and extract it, or clone it with the command below.
2. Open `index.html` in a modern browser.
3. Use the navigation to explore the six original main pages: Home, Gallery, Artists, Exhibitions, About, and Contact. The **Join the gallery** link opens the new registration demonstration. `thank-you.html` is the contact form's confirmation page.

To clone with Git:

```sh
git clone https://github.com/znsrk/atelier-art-gallery-endterm.git
cd atelier-art-gallery-endterm
```

For consistent local storage behavior, serve the folder over HTTP instead of opening files directly. With Python installed, open a terminal inside this repository and run:

```sh
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Stop the server with **Ctrl+C**. On Windows, `py -m http.server 8000` is an alternative if `python` is unavailable.

## Features and assignment requirements

| Requirement | Implementation and files | How to demonstrate it |
| --- | --- | --- |
| Extend the same midterm topic and structure | Original six main pages, artwork, artist profiles, exhibition themes, shared navigation/footer, and original styling remain. `register.html` adds registration. | Visit Home, Gallery, Artists, Exhibitions, About, and Contact; compare them with the midterm. |
| Preserve HTML, CSS, Bootstrap, and responsiveness | Semantic HTML, CSS Grid, Flexbox, Bootstrap layout classes, shared `css/style.css`, and page-specific `css/gallery.css` and `css/forms.css`. | Resize the browser to phone, tablet, and desktop widths; navigate each page and scroll the exhibition table on a small screen. |
| Add `/js/script.js` | `js/script.js` implements the exhibition table. `js/gallery.js` and `js/forms.js` keep the other features in readable files. Scripts load after local jQuery. | Open these files and trace the commented event handlers. |
| Registration form with required fields | `register.html` and `js/forms.js`: name, email, password, and password confirmation. Empty and whitespace-only names are rejected. | Submit an empty form and correct the highlighted fields. |
| Email verification with RegEx | `js/forms.js` shares an email regular expression between registration and contact. | Enter `wrong-email`, then `alex@example.com`; watch the feedback change. |
| Password strength indicator | `register.html`, `js/forms.js`, and `css/forms.css`: visible Weak, Medium, and Strong states with text and a colored indicator. | Try `abc`, `Gallery26`, and `Gallery2026!`. See the exact strength rules below. |
| Password confirmation check | `js/forms.js` compares both password fields and rechecks confirmation when the first password changes. | Enter two different passwords, then make them match. |
| Real-time feedback and blocked invalid submissions | jQuery `input` and `blur` handlers update DOM text, field classes, and accessibility attributes; submit handlers prevent invalid submissions and focus the first error. | Edit an invalid field without reloading; submit with an error remaining. |
| Real-time search | `gallery.html` and `js/gallery.js`: case-insensitive search across artwork title, artist, and category using the `input` event. Result count and empty state update immediately. | Type `SUN`, `mira`, and a phrase with no matches. |
| Category filter buttons | `gallery.html` and `js/gallery.js`: All, Landscape, Abstract, Still life, and Botanical buttons combine with the search term. | Search `mira`, then choose Abstract; only Warm Earth should remain. Clear filters to restore all six works. |
| Create and Read table records | `exhibitions.html` and `js/script.js`: render records dynamically and add exhibitions through a validated form. | Add a sample exhibition with a name, theme, featured works, and artwork link; find the new row. |
| Update table records | `js/script.js`: Edit fills the same form; Save changes updates the selected record; Cancel edit leaves it unchanged. | Edit a title and save, then start another edit and cancel it. |
| Delete with confirmation | `js/script.js`: Delete uses a confirmation prompt; Restore samples also asks before replacing custom records. | Cancel a deletion, then confirm it; restore the three original exhibitions. |
| Image gallery grid and lightbox arrows | `gallery.html`, `css/gallery.css`, and `js/gallery.js`: enlarge artwork and browse the currently visible search/filter results using buttons or keyboard arrows. | Open an artwork, use Previous/Next or Left/Right, and close with Escape. |
| jQuery fade effects | `js/gallery.js` uses `.fadeIn()` and `.fadeOut()` for the viewer and image changes; reduced-motion preferences are respected. | Open the viewer, switch artworks, and close it. |
| Updated README and online delivery | This README contains the project description, members, features, technologies, links, and setup. The link table above records deployment status. | Verify the final repository and website URLs before submission. |

## Try the forms

Use invented details. Registration demonstrates validation; it does not create an account, contact a server, or save credentials. A successful attempt clears the fields and displays a confirmation on the same page.

Password rules are intentionally visible and simple for this exercise:

| Strength | Rule | Example |
| --- | --- | --- |
| Weak | Fewer than 8 characters, or missing an uppercase letter, lowercase letter, or digit | `abc` |
| Medium | At least 8 characters with an uppercase letter, lowercase letter, and digit | `Gallery26` |
| Strong | At least 12 characters with all Medium requirements plus a symbol | `Gallery2026!` |

Registration accepts Medium or Strong passwords, and both password fields must match. The example passwords are for the demonstration only.

The Contact form requires a name, an email matching the RegEx, and a message. It gives immediate feedback and blocks invalid submissions. A valid attempt opens `thank-you.html` without putting form values in the URL. No message is sent or saved.

## Exhibition data and persistence

The exhibition guide starts with the three original fictional exhibitions. Add, edit, and delete work immediately in the browser. Changes are saved under the local storage key `atelier-exhibitions-v1` and survive a page reload in the same browser and website address.

This is a browser-only demonstration with no backend. Records are not shared with other visitors, devices, or browsers. Local files, localhost, and the published website have separate storage. Clearing site data removes saved records. If browser storage is unavailable, CRUD still works during the current page session and a warning explains that changes cannot be saved. The demo allows up to 200 exhibitions.

To start over, choose **Restore sample exhibitions** and confirm. This replaces custom records with the three original exhibitions. Cancelling the prompt keeps current records.

## Find and edit the code

```text
atelier-art-gallery-endterm/
├── index.html             Home
├── gallery.html           Artwork grid, search, categories, and lightbox
├── artists.html           Original fictional artist profiles
├── exhibitions.html       Exhibition table and add/edit form
├── about.html             Gallery story and project team
├── contact.html           Validated contact demonstration
├── register.html          Registration validation demonstration
├── thank-you.html         Contact confirmation
├── css/
│   ├── style.css          Shared original design and exhibition styles
│   ├── gallery.css        Gallery controls and lightbox
│   └── forms.css          Form feedback and password indicator
├── js/
│   ├── script.js          Exhibition CRUD and local storage
│   ├── gallery.js         Search, filters, lightbox, and fades
│   └── forms.js           Registration and contact validation
├── images/                Six original SVG illustrations
├── vendor/                Local Bootstrap CSS, full jQuery, and notices
├── tests/check.py         Automated browser checks
├── requirements-dev.txt   Optional testing dependencies
└── README.md
```

Change content in the relevant HTML file. Change shared colors and spacing in `css/style.css`; the `:root` variables define the main palette. Navigation and footer markup repeat in each page, so update each copy when changing a shared link.

In JavaScript, `$("#gallery-search")` selects an element by its HTML `id`; `$(".filter-button")` selects elements sharing a class. `.on("input", handler)` runs a function as the visitor types. The scripts use named functions and comments to explain validation, filtering, rendering, and saving. For example, `renderExhibitions()` redraws the table from an array, and `saveExhibitions()` saves that array. The page checks at the start of each script prevent unrelated features from running on the wrong page.

New gallery cards need matching artwork metadata (`data-title`, `data-artist`, and `data-category`) so search and category filtering can find them. The original illustration files remain in `images/`; the gallery does not depend on an external image service.

## Technologies and credits

- HTML5, CSS3, original SVG illustrations, JavaScript, and jQuery 3.7.1.
- Bootstrap 5.3.8 CSS is stored locally in `vendor/`; its grid and utilities support the existing layouts.
- The full jQuery build is stored locally in `vendor/` because its effects module provides the lightbox fades. Replacing it with the slim build would remove those effects.
- DM Sans and Playfair Display load from Google Fonts. System fonts are used when Google Fonts is unavailable.
- Artwork, artist personas, and exhibitions belong to this fictional student gallery. Social links open the Instagram and Pinterest homepages.

Keep the Bootstrap and jQuery license notices in `vendor/` when copying the project. Bootstrap's source is [twbs/bootstrap](https://github.com/twbs/bootstrap); jQuery's source is [jquery/jquery](https://github.com/jquery/jquery).

## Check the project

**Verified:** automated checks passed locally, against the published website, and in [GitHub Actions](https://github.com/znsrk/atelier-art-gallery-endterm/actions). All eight pages were checked at 1440, 834, 390, and 320 pixels, with interaction tests on desktop and phone widths.

The website runs without Python packages. The following optional commands install development dependencies and run the browser checks:

```sh
python -m pip install -r requirements-dev.txt
python tests/check.py
```

The script uses installed Google Chrome on Windows. Otherwise install its test browser with `python -m playwright install chromium`, or set `CHROME_PATH` to a Chrome executable. Tests start and stop their own local server and use an isolated browser; they do not change your saved exhibitions.

The checks cover links, labels, semantic structure, all eight pages at 1440, 834, 390, and 320 pixels, image loading, combined search and categories, lightbox keyboard/focus behavior, validation and password rules, CRUD and persistence, corrupt/disabled storage, and no-JavaScript fallbacks. Run `python tests/check.py --static-only` for file checks alone or add `--screenshots` to save screenshots in `.qa/`. GitHub Actions runs the complete checks on pushes to `main` and on pull requests.

For a manual review, work through the demonstration column in the requirements table. Check the same interactions on the published website and confirm that the browser console has no errors. Restore sample exhibitions after testing if you want the original guide in that browser.

## Publish with GitHub Pages

1. Push the completed files to the intended repository.
2. In GitHub, open **Settings → Pages**.
3. Choose **Deploy from a branch**, select **main**, select **/(root)**, and save.
4. Wait for the deployment to finish, then open the website link from GitHub Pages.
5. Verify the repository and website links at the top of this README and update their status after checking them.

Keep `index.html` at the repository root. Relative links allow the website to work from a GitHub Pages project subdirectory. Submit the repository and published website links shown above.
