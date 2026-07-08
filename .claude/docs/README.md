# Module Documentation

One file per module under `src/modules/`, plus `muzik` (route scaffold only — no module directory yet).

- [auth.md](auth.md)
- [class-wallet.md](class-wallet.md)
- [gold-price.md](gold-price.md)
- [wallet.md](wallet.md)
- [muzik.md](muzik.md)

Each doc covers: purpose, files, public API (services/actions/types), data model, and module-specific rules. See `.claude/rules/` for the cross-cutting architecture, coding-style, and security rules that apply to every module — this folder documents what's specific to each one, not what's already covered there.

Keep these in sync when a module's services/actions/types change.
