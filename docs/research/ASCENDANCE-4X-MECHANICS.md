# Ascendance (Torchdrive) research for Orbital Empires

Verified from public sources on 2026-11-03. **Ascendance** (Torchdrive) is distinct from older games called *Ascendancy*.

## What the developers say
- **Real-time** space 4X/grand strategy, not turn-based; adjustable game speed and pause. The FAQ says the smallest time unit is an in-game minute and describes accelerated game-month passage. See [official FAQ](https://www.ascendance4x.com/faq-1).
- Players can direct a **government** or, according to the FAQ, a **corporation** rather than omnipotently click every unit. Governments set laws, taxes, budgets and goals for departments. See [official About](https://www.ascendance4x.com/about), [FAQ](https://www.ascendance4x.com/faq-1), [Steam page](https://store.steampowered.com/app/2275750/Ascendance/).
- Governments, corporations, military, transportation and industrial actors have specialist AIs; many ordinary activities can be delegated. A player may also intervene in fleets and ship combat.
- The developer describes complex industry supply chains, demographics, physical freight, fuel/crew/ammunition and physically modeled tactical battles. These are **development claims**, not a verified released-game technical audit.
- The official FAQ reports a target **2027–2028 Early Access** and confirms the game is still in development at the research date.

## What we could not verify
Discord invitation available via official site, but **private Discord server message history was not accessible**. There is no basis here to claim review of all Discord channels or official private announcements. Features planned in a Steam description are not necessarily working or playtested.

## Design takeaways
Use the appealing **delegation model**: a player sets high-level goals and may intervene when desired. Use deterministic departmental agents with budgets, explainable decisions and manual overrides. Decouple graphics from economy, simulate off-screen cheaply and preserve offline-capable play. Do **not** immediately build a 1:1 physical freight or minute-level ship physics engine; that would need major architecture, performance budgets and gameplay QA.
