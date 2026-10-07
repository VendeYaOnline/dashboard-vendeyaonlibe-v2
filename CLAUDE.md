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

## Vistas nuevas

Toda vista se registra en `src/config/navigation.ts` (`NAV_ITEMS`), que es la
fuente del menú y de los permisos por rol.

- **Etiqueta "Nuevo":** al agregar una vista, ponerle `releasedAt: "AAAA-MM-DD"`
  con el día en que sale a producción (hora de Colombia). El menú la marca con
  la etiqueta "Nuevo" (degradado + icono Sparkles) durante `NEW_BADGE_DAYS`
  (3 días) y después desaparece sola. No hay que quitar nada a mano; el campo
  puede quedarse.
- **Vistas de pago:** la tienda las paga en vendeyaonline.com y el
  superadministrador las activa en Plataforma (editar empresa → "Vistas de
  pago"). Para crear una:
  1. Sumarla a `PAID_FEATURES` aquí (`src/config/navigation.ts`) y en el backend
     (`src/modules/platform/features.js`).
  2. Ponerle `feature: "clave"` a su `NavItem`: sin activar, el menú la muestra
     con candado.
  3. Envolver su página en `<FeatureGate feature="clave">`
     (`src/components/layout/feature-gate.tsx`): sin activar, muestra la
     pantalla de "no está activo" con el enlace a vendeyaonline.com.
  4. En el backend, proteger sus endpoints con `requireFeature("clave")`
     (ocultarla en el panel no basta).
