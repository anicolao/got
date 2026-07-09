# Game of Things

A SvelteKit frontend for the existing Firebase-backed Game of Things action log. Deterministic local mode is available for demos and E2E tests; ordinary table slugs subscribe to `tables/{tableId}/actions` in the original Firebase project.

The domain layer reuses the original action set:

- `join_game`
- `leave_game`
- `set_current_player`
- `show_round`
- `set_category`
- `answer_category`
- `eliminates`

## Development

```sh
npm install
npm run dev
```

## Tests

```sh
npm run check
npm run test:unit
npm run test:e2e
```

E2E tests use zero pixel screenshot tolerance and generate walkthrough README files beside each scenario.

## Routes

- `/table?slug=my-table&me=ana@example.com` moderator console
- `/play?slug=my-table&me=ana@example.com` player answer screen
- `/cast?slug=my-table` shared Chromecast screen
- `/replay` paste or inspect action logs from old games

Use `mode=local` for a browser-local action log: `/table?slug=demo&mode=local`.
