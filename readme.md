# [gen.new](https://gen.new)

> Generate anything. Personalized. Any model.

Started project from [this template](https://github.com/Topfi/BetterAuth-Convex-9ui-shadcn-CLI-).

## Setup

```
bun i
bun run setup
```

## Run

```
bun dev
```

## Billing

- Set `AUTUMN_SECRET_KEY` in `.env.local` and sync it with `npx convex env set AUTUMN_SECRET_KEY=...`.
- Autumn product `messages-1000` sells 1,000 additional chat messages for $10. The `/pricing` route surfaces the Autumn pricing table, and the chat UI prompts users to upgrade once they exhaust the 10 free messages.
