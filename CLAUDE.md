# Panel VendeYaOnline

Panel Next.js para los clientes. El backend está en `../backend-cliente`.

## Pruebas en local

Seguir `../backend-cliente/PRUEBAS-LOCALES.md`. Nunca probar contra la base de
producción (`DATABASE_URL` del backend).

- Backend contra la base local: configuración `backend-local` de
  `.claude/launch.json` (puerto 5001, `npm run dev`, que usa la base local).
- Panel contra ese backend: configuración `panel-local` (puerto 3006,
  `NEXT_PUBLIC_URL_BACKEND=http://localhost:5001/api`, `NEXT_DIST_DIR=.next/local`
  para no chocar con un `next dev` que ya esté corriendo).
- Usuario de prueba: `LOCAL_TEST_ADMIN_EMAIL` / `LOCAL_TEST_ADMIN_PASSWORD` en
  `../backend-cliente/.env` (solo existe en la base local).
