# Government & Council — gameplay proposal (draft)

**Status:** PR #30 candidate; not shipped. Does not amend canonical v0.3 specifications.

## Playable systems under review
- Form of government: neutral Directorate Charter, Federated Parliament, Technocratic Council, or Imperial Directorate. Reform costs 40 influence and locks government changes for five cycles. Reform causes a 4-point immediate loyalty disruption.
- Constitution civic: one of Open Assembly, Executive Mandate, or Meritocratic Service. Development civic: one of Trade Charters, Public Works, or Frontier Autonomy. Adopting/replacing a civic costs 20 influence and applies the declared economic and stability effects.
- Council: appoint one of two candidates to each of Chancellor, Chief Scientist, and Fleet Marshal. Each appointment costs 12 influence; the same office cannot be reassigned for two cycles.
- Factions: Trade Guilds, Scholars, Frontier Settlers. Support moves two points at most each cycle toward a target set by government, civic, and social-policy choices. Stability drives production penalties below 45, deeper penalties below 30, and a small bonus at 75+.

## Explicitly deferred
True elections, faction secession, governors, assassinations, autonomous council actions, and localized planetary revolts are not included. These require separate design, balance and tests.

## Save and integration contracts
- No save schema migration. Legacy save fields may omit government, civics, council, factionLoyalty, lastGovernmentReform and lastAppointments.
- Missing fields default to neutral governance, no additional bonuses, and faction support 55. This preserves baseline income for existing games.
- Governance modifies existing economy, unity, fleet and colonization calculations; the clock stays turn-based until dedicated PR #19 is separately integrated.
- PR #30 is stacked on navigation PR #28; these must not overwrite other open 4X gameplay branches.

## Required visual gate (incomplete)
Desktop and mobile PNG concepts were created **after coding began** because picture-first rule PR #29 was merged during this work. The concepts are shared in the originating project conversation; they have not been durably attached to this GitHub PR. This is disclosed rather than falsely asserting they preceded the UI implementation.
PR #30 remains **draft**. Before any merge/deployment, the owner must choose the design; attach the images to GitHub; verify real browser screenshots at desktop and mobile widths against it; test click/keyboard/touch interactions and layout; obtain code review and exact-head CI. Node/static regression tests alone do not satisfy browser QA.
