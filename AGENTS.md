<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All UI strings live in src/i18n/dictionaries.ts (ar default, RTL); add keys to all three languages — keeps translations complete.
- Fare math in src/lib/fare.ts is illustrative only; authoritative pricing must be server-side — prevents client manipulation.
- Every unconnected feature must show DemoBadge/DemoNotice — the brief forbids implying live bookings, drivers or payments.
