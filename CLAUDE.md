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
- **Vistas de pago (pendiente):** habrá vistas bloqueadas que la empresa
  desbloquea pagando aparte, y el superadministrador las activará desde
  Plataforma. Todavía no existen. Cuando llegue la primera, la idea es:
  1. Un campo `feature` (clave de la funcionalidad) en el `NavItem`.
  2. Las funcionalidades activas de la empresa guardadas en el backend
     (columna de `companies`) y editables desde Plataforma.
  3. En el menú, la vista bloqueada se muestra con un candado y abre una
     pantalla de "Disponible con el plan…" en lugar del contenido.
  4. El backend también rechaza sus endpoints (no basta con ocultarla en el
     panel).
