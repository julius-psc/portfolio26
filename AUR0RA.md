# AURORA — Project Context

## What this is

A job application artifact. Aurora is a London pre-seed startup (backed by Alex Macdonald of Velocity Black, raised $9M) building an "AI-native Lifestyle Operating System" for UHNW individuals — founders, athletes, investors. Conversational, proactive concierge: travel, dining, experiences, gifting, longevity/wellness, all orchestrated by an AI agent members interact with via chat/voice.

Julius is applying for their Founding Product Designer role (£130–160k, London). Round 1 of their hiring process is an open brief: **"Design Aurora's inspiration page."** No further instructions given — deliberately ambiguous, it's part of the filter.

Almost every other applicant will submit a Figma file. Julius's entire strategic bet is submitting a **live, deployed, working coded prototype** instead — because he can design AND build, and this role is specifically titled "Founding Product Designer" at a 20-person team where shipping ability matters as much as taste. The build is the differentiator. Full working polish on 2–3 screens beats broad but static coverage every time.

## Deliverable

A deployed mobile-first web app at **aurora.julius.works**, built to feel like a real screen from Aurora's own (unreleased) member app — not a landing page, not a marketing site. Next.js + Tailwind + Framer Motion, deployed on Vercel.

Submitted alongside: a screen-recording walkthrough video, a one-page rationale PDF, and a CV. The deployed link is the centerpiece; everything else supports it.

## The interpretation (why this is what's being built)

"Inspiration page" was decoded, not assumed, from Aurora's own materials: job postings describing "proactive curation," member testimonials describing Aurora surfacing plans before being asked, and leaked/concept UI screenshots from their launch video showing exactly this kind of card-based proactive interface with inline conversational editing. The interpretation locked on: **the inspiration page is the in-app surface where Aurora speaks first** — presenting already-curated plans (travel, dining, experiences, gifting, wellness) the member can confirm, adjust via conversation, or dismiss. Not a browsing/search feed — Aurora's own positioning explicitly rejects being "another pay-to-play marketplace."

This was built **without access to the real Aurora app.** All visual and interaction language was reverse-engineered from launch video screenshots and concept mockups Julius collected, then extended with original ideas where their materials didn't go far enough (see below).

## Where original design contribution was added (beyond what Aurora has shown)

Aurora's own concept materials show cards, a conversational agent (the "O" orb), and one mockup of a card being adjusted via chat and updating in place. This project reproduces that faithfully as a working build, then adds two original mechanics not present in Aurora's own materials:

1. **Context woven into language, not shown as separate UI chips.** The page opens with a personalized greeting where the reasons behind the day's curations are embedded directly in the sentence Aurora "says" to the member (e.g. calendar/health/relationship signals appear as tinted phrases inside natural language, not as a separate dashboard of stats).
2. **Visible reasoning connections.** Interacting with a curation card can visually trace a line back to the specific phrase(s) in the greeting that produced it — making the AI's reasoning inspectable rather than a black box. This is framed as a trust mechanic appropriate for a product asking wealthy members to delegate real decisions to an agent.

Both should be understood as **the candidate's own product thinking**, presented clearly as an addition on top of Aurora's existing direction — not misrepresented as something Aurora has already built.

## Persona used to make all content concrete

A single fictional member (a post-exit founder, London-based, family, health-tracking habits, recurring travel patterns) is used consistently across every curation shown, so all copy/data feels like it comes from one coherent life rather than generic placeholder content. This persona and its details live in the design spec doc, not here — just know that every piece of content in the build should trace back to it rather than being invented ad hoc.

## What NOT to do

- Don't add screens, flows, or features beyond what's in the design spec doc provided separately. Scope is intentionally narrow — one main screen, one conversational interaction, done extremely well — because polish beats breadth for this submission.
- Don't invent new interaction patterns not already specified — check the spec doc / Figma frames first.
- Don't add a tab bar, search, onboarding, or settings. This is a single focused screen, not an app shell.
- Don't reference this as "just a prototype" or "demo" in any user-facing copy — it should read as a real product screen.

## Where the actual design decisions live

Visual design tokens, copy, component anatomy, motion specs, and the full data model are in a separate spec document and in the Figma file (frames: AURORA/Frame, AURORA/Discover, AURORA/Chat) — refer to those as source of truth for anything pixel-, copy-, or timing-specific. This file is orientation only.

## Timeline context

This is being built under a hard multi-day deadline as part of a live application process. Prioritize finishing the core interaction (card → conversational adjust → card updates → confirmation) to a polished, real-device-tested state over adding anything new.