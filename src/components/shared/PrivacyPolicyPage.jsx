import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const LAST_UPDATED = 'September 20, 2026'

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-text-strong mb-2">{title}</h2>
      <div className="space-y-3 text-sm text-text-default leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-secondary hover:underline mb-6"
      >
        <ArrowLeft size={14} />
        Back to Timeliner
      </Link>

      <h1 className="font-display text-3xl font-bold text-text-strong">Privacy Policy</h1>
      <p className="text-xs text-text-muted mt-2">Last updated: {LAST_UPDATED}</p>

      <p className="mt-6 text-sm text-text-default leading-relaxed">
        Timeliner is a local-first app: the text you paste, the events it extracts, and any
        photos you attach are stored primarily in your own browser. This page explains what
        data the app handles, why, and where it goes when a feature needs to leave your device
        (for example, AI extraction or optional cloud sync). It describes Timeliner&apos;s actual
        behavior as implemented — it is not a substitute for legal advice.
      </p>

      <Section title="What data Timeliner collects">
        <p>Timeliner collects and stores the following categories of data:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Content you create or paste</strong> — the raw text you paste or type, and
            the structured events extracted from it (titles, descriptions, dates, people,
            locations, tags, recurrence rules, and any links/attachments you add).
          </li>
          <li>
            <strong>Photos you upload</strong> — image files you attach to events.
          </li>
          <li>
            <strong>A randomly generated device identifier</strong> — used only to scope your
            data if cloud sync is enabled (see below). It is not linked to your name, email, or
            any other identity.
          </li>
          <li>
            <strong>App settings</strong> — view preferences, dark mode, sidebar state, custom
            tags, and similar UI preferences.
          </li>
          <li>
            <strong>Search history and a location lookup cache</strong> — stored locally to make
            repeat searches and map lookups faster.
          </li>
          <li>
            <strong>Basic request metadata</strong> — Timeliner&apos;s serverless API endpoints
            read the requesting IP address transiently, in memory, to enforce rate limits. It is
            not written to a database or logged with your content.
          </li>
        </ul>
        <p>
          Timeliner has no user accounts, login, or signup — there is nothing to register, and
          no name, email address, or password is collected by the app itself.
        </p>
      </Section>

      <Section title="Why this data is collected and how it's used">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Your pasted text and photos are used only to build the timeline you asked for.</li>
          <li>
            The device identifier exists solely so that, if you turn on cloud sync, your data can
            be matched back to you across sessions/devices without requiring an account.
          </li>
          <li>Settings and caches exist to make the app faster and remember your preferences.</li>
          <li>The IP address is used only to prevent abuse of the AI and sharing endpoints.</li>
        </ul>
      </Section>

      <Section title="Where your data is stored">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Your browser (default, always on):</strong> events, timelines, custom tags,
            and photo files are stored locally using IndexedDB; lightweight settings are stored
            in localStorage. This data never leaves your device unless you explicitly use a
            feature described below.
          </li>
          <li>
            <strong>Cloud sync (optional, only if the app is configured to use it):</strong> when
            a Supabase backend is configured, your timelines, events, and photos can also be
            stored in Supabase (database + file storage) so they're available across
            devices/sessions. Photo files are stored in a private storage bucket, scoped to your
            device identifier, and are not publicly accessible — the app reads them back using
            short-lived signed URLs rather than public links.
          </li>
        </ul>
      </Section>

      <Section title="Retention and deletion of your data">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Events, timelines, and photos are kept for as long as you keep them in the app —
            Timeliner does not automatically delete your own timeline content or uploaded photos
            after any fixed period.
          </li>
          <li>
            Deleting an event, timeline, or photo in the app removes it from your local storage
            and, if cloud sync is enabled, from the cloud copy as well.
          </li>
          <li>
            Deleted events go through a brief (a few seconds) &quot;undo&quot; window before the
            cloud copy is actually removed, so an accidental delete can be reversed.
          </li>
          <li>
            You can remove all locally stored data at any time by clearing your browser&apos;s
            site data/storage for Timeliner. Note that if cloud sync was enabled, this clears
            your device identifier too — if you need Timeliner-side cloud records erased after
            that point (i.e. you can no longer reach them from the app), use the contact method
            below.
          </li>
          <li>
            <strong>Shared timeline links:</strong> if you generate a public share link, a copy
            of that timeline&apos;s events is stored separately and is reachable by anyone with
            the link until it expires (you choose 30, 90, or 365 days at creation). Once expired,
            the link stops working immediately; the underlying record is deleted the next time
            the expired link is visited. A share link that is never visited again after expiring
            may remain in storage longer than its stated expiry.
          </li>
        </ul>
      </Section>

      <Section title="AI processing">
        <p>
          When you ask Timeliner to extract events from text, or to generate timeline insights,
          the relevant text (or a stripped-down summary of your events) is sent from
          Timeliner&apos;s own server-side API to Anthropic&apos;s Claude API for processing.
          Photo files themselves are not sent to the AI — only photo filenames, so the AI can
          suggest matches.
        </p>
        <p>
          This processing happens on each request to generate a result; Timeliner does not use
          your content to train its own models. Anthropic processes this data under its own
          terms and privacy policy as the AI provider — see{' '}
          <a
            href="https://www.anthropic.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:underline"
          >
            Anthropic&apos;s privacy policy
          </a>{' '}
          for how they handle data submitted to their API.
        </p>
      </Section>

      <Section title="Third parties Timeliner relies on">
        <p>Depending on which features you use, the following third parties may process data:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Anthropic (Claude API)</strong> — processes text/event data you submit for AI
            extraction and insights, as described above.
          </li>
          <li>
            <strong>Supabase</strong> — hosts the optional cloud database and file storage used
            for cross-device sync and for public share links, when configured.
          </li>
          <li>
            <strong>Vercel</strong> — hosts the application and its serverless API endpoints, and
            provides Vercel Analytics, which collects aggregated, anonymized page-view metrics
            (Timeliner does not use cookie-based tracking or ad/marketing pixels).
          </li>
          <li>
            <strong>OpenStreetMap (map tiles) and Nominatim (place search)</strong> — if you view
            the Map view or type a location, the location text you enter may be sent to
            OpenStreetMap&apos;s Nominatim service to look up coordinates, and map tiles are
            loaded from OpenStreetMap/CARTO.
          </li>
          <li>
            <strong>Google Fonts</strong> — used to load the app&apos;s typefaces.
          </li>
        </ul>
        <p>
          Timeliner does not sell your data, and does not share it with third parties for
          advertising purposes.
        </p>
      </Section>

      <Section title="Cookies and tracking">
        <p>
          Timeliner does not use cookies for tracking or advertising. It uses browser
          localStorage/IndexedDB to store your data and preferences on your own device, and
          Vercel Analytics for anonymized, aggregate usage metrics (page views), which does not
          use cookies or persistent identifiers to track you across sites.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Data in transit to Timeliner&apos;s API and to Supabase is sent over HTTPS. Cloud-stored
          photos are kept in a private storage bucket (not publicly listable or readable) and
          served only via short-lived signed URLs; database access is scoped by your device
          identifier. No method of storage or transmission is perfectly secure, and Timeliner
          cannot guarantee absolute security of data you choose to sync to the cloud.
        </p>
      </Section>

      <Section title="Your choices and rights">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>You can use Timeliner entirely offline/locally without ever syncing to the cloud.</li>
          <li>
            You can export your data (CSV, JSON, Markdown, plain text, or PDF) at any time from
            within the app.
          </li>
          <li>You can delete individual events, timelines, or photos at any time in the app.</li>
          <li>
            You can clear all local data via your browser&apos;s site data settings, or request
            removal of any cloud-stored data using the contact method below.
          </li>
        </ul>
        <p>
          Depending on where you live, you may have additional legal rights over your personal
          data (for example, under GDPR or CCPA/CPRA). Timeliner is a small, independently
          operated project; if you have questions about your rights in your jurisdiction, please
          reach out using the contact method below.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For privacy questions or to request deletion of any data Timeliner holds on your
          behalf, reach out via the links in the app footer/sidebar (developer website or
          GitHub).
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If Timeliner&apos;s data practices change, this page will be updated to reflect them.
        </p>
      </Section>
    </div>
  )
}
