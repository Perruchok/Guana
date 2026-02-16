# AI Development Rules — Guana Know

All AI-generated code must respect these constraints.

---

## General Rules

- Follow PROJECT_CHARTER.md
- Follow architecture.md
- Follow product_vision.md
- Never introduce new technologies without justification
- Never overengineer

---

## Backend Rules

- Use Django best practices
- Use DRF ViewSets
- Do not put business logic inside serializers
- Keep views clean
- Use permissions properly
- Use UUID as primary keys
- Include created_at and updated_at
- Do not duplicate logic across apps

---

## Code Quality

- No placeholder pseudocode
- No unnecessary comments
- Write production-ready code
- Follow PEP8
- Use clear naming conventions
- Avoid magic strings

---

## Security Rules

- Never expose private fields in serializers
- Validate ownership before updates
- Protect write endpoints
- Do not store sensitive Stripe data beyond IDs

---

## Frontend Rules (Future)

- Use clean component architecture
- Avoid massive components
- Keep API calls centralized
- Respect backend contracts

---

## When in doubt

Prefer simplicity.
Ask for clarification rather than inventing complexity.
