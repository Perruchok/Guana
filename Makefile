# ─────────────────────────────────────────────
# Guana Know — Makefile para todo el proyecto
# Backend (Django) + Frontend (Next.js)
# ─────────────────────────────────────────────

.PHONY: help dev migrate backend-dev frontend-dev

help:
	@echo "Guana Know — Comandos disponibles"
	@echo ""
	@echo "  make dev              ➜ Inicia backend + frontend (en paralelo)"
	@echo "  make backend-dev      ➜ Inicia solo el servidor Django"
	@echo "  make frontend-dev     ➜ Inicia solo Next.js"
	@echo "  make migrate          ➜ Ejecuta migraciones de base de datos"
	@echo "  make help             ➜ Muestra esta ayuda"

# ── Frontend ──────────────────────────────────
frontend-dev:
	cd frontend && npm run dev

# ── Backend ───────────────────────────────────
backend-dev:
	cd backend && python manage.py runserver

# ── Migraciones ───────────────────────────────
migrate:
	cd backend && python manage.py makemigrations users venues events subscriptions

# ── Ambos (en paralelo) ───────────────────────
dev: backend-dev & frontend-dev
	@echo "Backend en http://localhost:8000"
	@echo "Frontend en http://localhost:3000"
