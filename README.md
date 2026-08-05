# Hoja de Ruta - Transporte — Offal

Módulo del ecosistema Offal que **reemplaza el Microsoft Form "HOJA DE RUTA -
TRANSPORTE"**. Tiene dos vistas: **carga** de la hoja de ruta y **panel de
respuestas** (búsqueda + export CSV). Identidad navy + índigo, misma barra
unificada que el resto de las apps.

Login único con **Entra ID (Easy Auth)** y autorización contra el **padrón central
`acceso`** (app `transporte`). Las respuestas se guardan en la base compartida
`controletiquetas`, esquema **`transporte.HojasRuta`**.

## El formulario es *field-agnostic*

Todos los campos se definen en **`config/formConfig.js`** — esa es la única fuente
de verdad. De ahí salen (1) las columnas de la tabla SQL, (2) los campos del
formulario y (3) las columnas del panel. Para agregar/quitar/renombrar un campo o
cambiar un tipo, se edita ese archivo (no hay que tocar el resto del código).

Campos actuales (del Form original): Fecha, Número de Remito, Chofer (desplegable),
Patente del Tractor, Destino, Semi Lleva, Semi Trae, Hielo, Tambor, Pallets, Agua
Oxigenada, Tambor de Hiel.

> **Pendiente:** la lista de **choferes** (`CHOFERES` en `formConfig.js`) es
> provisoria — reemplazar por la real, o cambiar el campo para que lea de una tabla.
> Los campos Hielo/Tambor/Pallets/Agua Oxigenada/Tambor de Miel se modelaron como
> **número (cantidad)**; si alguno debe ser texto, se cambia su `type`/`sqlType`.

## Correr en local

```bash
npm install
npm run client:build     # compila el frontend
npm start                # http://localhost:3007
```

Desarrollo con recarga del frontend (dos terminales):

```bash
npm start                # backend en :3007
npm run client           # Vite en :5177
```

Sin variables de entorno arranca en **modo sin base**: guarda las hojas en memoria
(con datos de ejemplo) para poder probar formulario y panel. Copiá `.env.example`
a `.env` para conectar la base real.

## Base de datos

Al arrancar con `DB_AUTO_INIT=true`, crea de forma **idempotente** el esquema y la
tabla `transporte.HojasRuta` (columnas derivadas de `formConfig.js`).

> **Gotcha del ecosistema:** si el entorno local apunta a la MISMA base de
> producción, arrancar con `DB_AUTO_INIT=true` crea la tabla en prod. Es
> create-if-not-exists de un esquema NUEVO (`transporte`), así que es seguro y no
> choca con los esquemas existentes (`acceso`, `ingresos`, `comun`, `lavados`, `dbo`).

## Deploy (Azure)

1. Crear **App Service `hoja-ruta-offal`** (Node 20, Linux). Prender **Basic authentication**.
2. Cargar el secret `AZUREAPPSERVICE_PUBLISHPROFILE_HOJARUTAOFFAL` (publish profile) en GitHub.
3. Habilitar **Easy Auth** contra el mismo registro de Entra (SSO con las otras apps).
4. Cargar la app **`transporte`** en `acceso.Permisos` y poner
   `TRANSPORTE_REQUIRE_PERMISSION=true` para exigir permiso.
5. Sumar la tarjeta del módulo al **portal** (`portal-offal/config/apps.js`).

Push a `main` dispara el workflow y deploya.

## Pendientes de infraestructura (los resuelve Infra)

- [ ] Crear el App Service `hoja-ruta-offal` + Basic auth + publish profile.
- [ ] Easy Auth (SSO Entra).
- [ ] Alta de la app `transporte` en `acceso.Permisos` + permisos por usuario.
- [ ] Confirmar credenciales de la base compartida en el App Service.
- [ ] Lista real de choferes.
