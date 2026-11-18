# Vercel + Firebase + ImgBB setup

The entire project now runs on Vercel: static pages plus one Node.js API function.
Cloudflare Workers, Wrangler, a separate API domain and Firebase Hosting are no longer
needed. Firebase Authentication and Firestore are retained. There are no application
daily upload limits; photos still group into daily albums.

## 1. Complete `.env`

Existing Firebase Web App values, ImgBB API key and admin UID were preserved during
migration. The configuration checker currently reports two missing server fields:

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Get these from **Firebase Console ? Project settings ? Service accounts ? Generate
new private key** (or a dedicated least-privilege service account with Cloud Datastore
User access). The downloaded JSON contains `client_email` and `private_key`.
Copy those two values into `.env`. Keep the full PEM key, including BEGIN/END markers.
Keep the JSON outside the repository and do not paste private credentials into chat.

```dotenv
FIREBASE_CLIENT_EMAIL="your-service-account@wedding-tarun.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_CONTENT\n-----END PRIVATE KEY-----\n"
```

The example above is a placeholder, not a usable credential. Node normalizes literal
`\n` sequences and actual newlines. Use the values for **wedding-tarun**, not a different
Firebase project.

Only these variables are needed:

| Variable | Purpose | Visibility |
| --- | --- | --- |
| FIREBASE_API_KEY | Firebase Web App API key | Public |
| FIREBASE_AUTH_DOMAIN | Firebase login domain | Public |
| FIREBASE_PROJECT_ID | Firestore / Firebase project | Public |
| FIREBASE_APP_ID | Firebase Web App ID | Public |
| FIREBASE_CLIENT_EMAIL | Service-account email | Server only |
| FIREBASE_PRIVATE_KEY | Service-account private key | Server only |
| IMGBB_API_KEY | ImgBB API v1 upload key | Server only |
| ADMIN_UID | Primary Firebase Authentication user UID | Server only |
| FIREBASE_MEASUREMENT_ID | Optional analytics measurement ID | Public |
| FIREBASE_ANALYTICS_ENABLED | Optional true / false | Public |

Removed unused settings: Worker URL/name, origin allowlist, service-account file path,
Firebase Storage bucket and messaging sender ID. No new hosting keys are required.
The frontend automatically calls `/api` on the same domain.

`.env` is Git-ignored and excluded from Vercel upload and static output. Browser config
is generated from a strict public-field allowlist. **Vercel does not automatically
receive your local `.env`: add its values to the Vercel dashboard.** Deployment
variables take precedence over local values. Never put private keys into HTML/JS.

## 2. Firebase Authentication

1. Enable **Google** and **Email/Password** under Authentication ? Sign-in method.
2. Verify your admin account email. ADMIN_UID must match its Firebase Auth UID.
3. Under Authentication ? Settings ? Authorized domains, add your actual Vercel domain
   (for example `your-project.vercel.app`), without `https://` or a path.
4. Add your custom domain too, if used. Add `localhost` and `127.0.0.1` for local live
   testing. Preview deployments need their specific domain authorized; a stable
   preview domain is easier than changing domains repeatedly.

Google/email sign-in, account creation, email verification and password reset use
Firebase SDK 13.3.0. Users must verify their email before API access. New verified
accounts become guests; admins assign groom-side/bride-side roles. The configured
ADMIN_UID is promoted to admin even if that user previously signed in as a guest.
The primary admin cannot be demoted through the dashboard.

Creating the Firebase project/database alone does not enable login providers or
supply the server private key. These are separate configuration steps.

## 3. Firestore

Keep the default Firestore database you created. Apply `firestore.rules` in Firebase
Console ? Firestore ? Rules, or use the official Firebase CLI:

```text
firebase use wedding-tarun
firebase deploy --only firestore:rules
```

Rules deny all direct browser database access. Vercel's server identity uses IAM;
server code checks the signed-in user, role, image status and permissions. Do not
switch Firestore to open/test rules. `firebase.json` now contains only Firestore rules
configuration, not Firebase Hosting.

## 4. Local development

Node 22.x is required. No npm runtime packages are needed.

```text
npm run check:env
npm run dev
```

On Windows use `npm.cmd` if PowerShell blocks `npm.ps1`; equivalent commands are
`node scripts/configure.mjs --check` and `node scripts/dev.mjs`.

Open **http://127.0.0.1:8765/admin.html**. The development server serves only `dist/`
and routes `/api/*` to the same code used by Vercel. It does not serve `.env` or server
source. Do not use a Python/static-only server for live authentication and uploads.

For an isolated local demo, run `npm run demo` (or `node scripts/dev.mjs --demo`).
Demo sign-ins are explicitly local and use IndexedDB. Demo is never enabled on
Vercel. Local demo storage remains capped at 100 photos in total to protect browser
storage; this is not a daily or live upload limit.

## 5. Deploy the full project to Vercel

1. Import the repository into Vercel.
2. Choose **Framework Preset: Other** and **Node.js: 22.x**.
3. Keep the repository root as Root Directory. Do not deploy only the `dist` folder:
   the root `api/` directory must be included for server functions.
4. `vercel.json` sets Build Command to `node scripts/build.mjs`, Output Directory to
   `dist`, and rewrites `/api/*` to `api/index.js`. No manual API URL is needed.
5. Add all eight required variables above in **Project Settings ? Environment
   Variables**, selecting Production and any Preview/Development environments you use.
   For FIREBASE_PRIVATE_KEY, paste the private-key value without extra wrapping
   quotes; either actual newlines or literal `\n` escapes work. Optional analytics
   variables may also be added.
6. Deploy, add the resulting hostname to Firebase Authorized domains, and test login.
   Redeploy after changing environment variables because public Firebase config is
   generated during the build.

The API uses a 60-second function limit and accepts optimized JPEG uploads up to
2 MB, within Vercel's documented 4.5 MB request payload limit. Original camera files
are resized in the browser before being sent. ZIP archives are assembled in the
browser from individual image downloads rather than one oversized API response.

## 6. Final live checklist

- `npm run check:env` passes locally (validates presence/format, not provider access).
- Firebase Google and Email/Password providers are enabled and the domain authorized.
- Firestore rules are applied and the service account has access to the project.
- Sign in as the configured admin and save **Website & events** once. This creates
  initial live settings; uploads remain closed until settings are saved.
- Upload one real photo, check auto-publication, hide/restore it, and open its album.
- Sign in with a second verified account: it should be a guest and unable to access
  admin controls. Assign its family side from the admin dashboard and test again.
- Supply actual couple photos, venue/timing details, story, RSVP details, and permitted
  HTTPS music URLs. Creating provider accounts does not fill those wedding details.

## Behavior and cost boundaries

No application daily caps. The 30-photo batch size only keeps the browser responsive;
another batch can follow immediately. Duplicate hashes are reserved transactionally,
failed uploads can retry, and interrupted pending uploads can retry after ten minutes.
Admin can pause uploads. Automatic publication is file validation, not AI moderation.

Keep camera originals separately. ImgBB URLs are public; hiding/archiving removes a
photo from the website but not its host. Private host-deletion links are admin-only.
JSON exports contain account details and deletion links and must be kept private.

Firebase Spark, ImgBB availability and Vercel plan quotas still apply; removing daily
caps cannot remove provider limits. No billing upgrade is performed by this code.
Use a Vercel plan appropriate for the account's permitted usage. Firebase Storage,
Firebase Functions, SMS login and paid AI services are not used.

## Validation

Run `npm test` and `npm run build`. Tests cover role restrictions, duplicate handling,
no daily caps, hiding/archives, private-field filtering, environment separation and
Vercel route/query/multipart forwarding. API provider calls are mocked in tests.
The local build is verified; actual Vercel deployment, Firebase/ImgBB integration and
visual browser QA remain to be verified after the server credentials are supplied.

Official references:
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/functions/limitations
- https://firebase.google.com/docs/auth/web/google-signin
- https://api.imgbb.com/


### Homepage photos and first upload

Save **Website & events** once before the first upload. The dashboard opens this section automatically when settings are missing. Failed uploads display the reason in the notice; they are not published.

In the photo library, use **Feature** to select photos for **Our Beautiful Moments**, **Use as home background** for the animated homepage background, or **Use as admin background** for the studio. Background URLs can also be edited or cleared in Website & events. Published, unarchived photos appear automatically in **Public Moments** near the bottom of the homepage, with pagination. Daily albums remain on the diary page. Hide a photo or archive its album to remove it from public galleries; clear a background URL separately if that photo was selected as a background.


### Dedicated homepage banner editor

Open **Admin ? Homepage banner**. Upload photographs directly (successful uploads are also saved to the banner), or choose existing published photographs from the library. Use **Earlier / Later** to arrange them, **Remove** to remove a selection, then **Save banner**. The collage supports up to 24 selected photographs; this is not a daily upload cap. Hidden photos and archived albums are excluded automatically.

The section includes an animated preview, overlay darkness, motion toggle, small heading and celebrations-link text. Couple names, headline, welcome text, events, story, contact and RSVP details remain under **Website & events**. **Feature** in the library controls Our Beautiful Moments; ordinary published uploads appear in Public Moments and the diary. Open **Preview homepage** after saving. Browser reduced-motion preferences override banner animation.


The homepage now uses the original connected Wall animation, matched to the supplied recording: drag the entire background in any direction, release to glide, and keep all headings fixed. Individual tiles are not reordered. The admin thumbnail preview shows the selected photos; use Preview homepage to test full wall dragging.
