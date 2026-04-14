# Idatgram — Red Social Offline-First con React Native

Aplicación de red social estilo Instagram desarrollada con **React Native + Expo**, arquitectura **Offline-First** y sincronización bidireccional con **Supabase** (Last-Write-Wins).

---

## 🏗️ Stack Tecnológico

| Tecnología | Versión | Propósito | Ubicación |
|---|---|---|---|
| **React Native** | 0.83.4 | Framework móvil | `package.json` |
| **Expo** | ^55.0.11 | Toolchain y servicios | `app.json` |
| **TypeScript** | ~5.9.2 | Tipado estático | `tsconfig.json` |
| **Zustand** | ^4.5.1 | Estado global | `src/store/` |
| **expo-sqlite** | ~55.0.13 | Base de datos local | `src/database/sqlite.ts` |
| **Axios** | ^1.14.0 | Cliente HTTP (declarado) | `package.json` |
| **fetch nativo** | — | Cliente HTTP real (AbortController + timeout 10s) | `src/services/HttpService.ts` |
| **@react-native-community/netinfo** | 11.5.2 | Detección de red (declarado) | `package.json` |
| **AsyncStorage** | ^2.1.0 | Persistencia de sesión | `src/store/authStore.ts` |
| **NativeWind** | latest | Estilos Tailwind | `tailwind.config.js`, `metro.config.js` |
| **React Navigation** | 7.x | Navegación (Stack + Tabs) | `src/navigation/` |
| **Supabase REST API** | — | Backend remoto (PostgreSQL) | `src/services/supabaseService.ts` |

---

## 📁 Estructura del Proyecto

```
IdatgramReactNative-main/
├── .env                          # Variables de entorno (Supabase URL + Key)
├── App.tsx                       # Entry point: init DB + auth + sync + monitoring
├── app.json                      # Configuración de Expo
├── babel.config.js               # Presets NativeWind + Reanimated
├── metro.config.js               # Metro con NativeWind
├── tailwind.config.js            # Config de Tailwind/NativeWind
├── global.css                    # CSS base de Tailwind
├── nativewind-env.d.ts           # Tipos de NativeWind
├── tsconfig.json                 # Config TypeScript
├── eslint.config.js              # Linting
├── prettier.config.js            # Formateo
├── package.json                  # Dependencias
│
├── assets/                       # Recursos estáticos
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash.png
│
└── src/
    ├── components/
    │   └── UI.tsx                 # Componentes reutilizables (Avatar, LoadingSpinner, EmptyState)
    │
    ├── database/                  # Capa de datos local (SQLite)
    │   ├── sqlite.ts              # Init DB, migraciones, helpers CRUD
    │   ├── postRepository.ts      # CRUD posts + upsertFromRemote (LWW)
    │   ├── commentRepository.ts   # CRUD comments + upsertFromRemote
    │   ├── likeRepository.ts      # CRUD likes + upsertFromRemote
    │   ├── userRepository.ts      # CRUD users
    │   ├── notificationRepository.ts  # CRUD notifications
    │   └── storyRepository.ts     # CRUD stories + story_views
    │
    ├── services/                  # Capa de red y sincronización
    │   ├── HttpService.ts         # fetch nativo con timeout 10s (AbortController)
    │   ├── supabaseService.ts     # POST/GET/PATCH/DELETE a Supabase REST API
    │   └── syncService.ts         # Sync bidireccional (push + pull) LWW
    │
    ├── store/                     # Estado global (Zustand)
    │   ├── authStore.ts           # Usuario + token + persistencia
    │   ├── postsStore.ts          # Posts + likes + comments + sync
    │   ├── connectivityStore.ts   # isOnline + autoSync + forceSync
    │   ├── activityStore.ts       # Notificaciones
    │   ├── searchStore.ts         # Búsqueda de usuarios
    │   └── storiesStore.ts        # Historias
    │
    ├── navigation/
    │   ├── index.tsx              # 5 stacks + bottom tabs (18 pantallas)
    │   └── types.ts               # Tipos de navegación
    │
    ├── screens/
    │   ├── Home.tsx               # Feed con posts, likes, comments, sync badge
    │   ├── Search.tsx             # Explorar usuarios
    │   ├── AddPost.tsx            # Crear nuevo post
    │   ├── Activity.tsx           # Notificaciones
    │   ├── Profile.tsx            # Perfil del usuario logueado
    │   ├── auth/
    │   │   ├── Login.tsx          # Inicio de sesión
    │   │   └── Register.tsx       # Registro de usuario
    │   ├── camera/
    │   │   ├── Camera.tsx         # Captura de foto
    │   │   └── EditPhoto.tsx      # Edición antes de publicar
    │   ├── details/
    │   │   ├── PostDetail.tsx     # Detalle de un post
    │   │   ├── Comments.tsx       # Lista de comentarios
    │   │   ├── Likes.tsx          # Usuarios que dieron like
    │   │   ├── Followers.tsx      # Lista de seguidores
    │   │   ├── Following.tsx      # Lista de seguidos
    │   │   ├── UserProfile.tsx    # Perfil de otro usuario
    │   │   └── StoryViewer.tsx    # Visor de historias
    │   ├── profile/
    │   │   └── SavedPosts.tsx     # Posts guardados
    │   └── settings/
    │       ├── EditProfile.tsx    # Editar datos del perfil
    │       └── Settings.tsx       # Configuración y logout
    │
    ├── types/
    │   └── index.ts               # Interfaces TypeScript (User, Post, Comment, Like, etc.)
    │
    └── utils/
        ├── helpers.ts             # generateId, getTimeAgo, formatNumber
        └── connectivity.ts        # fetch HEAD a google.com (sensor de conectividad real)
```

---

## 🗄️ Base de Datos

### SQLite (Local) — `src/database/sqlite.ts`

| Tabla | Columnas clave | Sync con Supabase |
|---|---|---|
| `users` | id, remote_id, username, email, displayName, is_synced, updatedAt | ✅ |
| `posts` | id, remote_id, user_id, description, image_url, is_synced, updated_at | ✅ |
| `comments` | id, remote_id, post_id, user_id, text, is_synced, updated_at | ✅ |
| `likes` | id, remote_id, post_id, user_id, is_synced, created_at | ✅ |
| `notifications` | id, remote_id, userId, type, fromUserId, text, isRead, createdAt | ✅ |
| `stories` | id, userId, imageUrl, text, expiresAt, createdAt | Local |
| `story_views` | storyId, viewerId, viewedAt | Local |
| `user_follows` | followerId, followingId, createdAt | Local |

**Versión de DB**: 6 (migraciones automáticas en `migrateIfNeeded()`)

### Supabase (Remoto) — Proyecto `lpfneudkpffhpbblcdjo`

| Tabla | Filas | RLS | Columnas clave |
|---|---|---|---|
| `users` | 3 | ✅ | id, username, email, display_name, updated_at (bigint) |
| `posts` | 3 | ✅ | id, user_id, description, image_url, updated_at (bigint) |
| `comments` | 2 | ✅ | id, post_id, user_id, text, updated_at (bigint) |
| `likes` | 2 | ✅ | id, post_id, user_id, created_at (bigint) |
| `notifications` | 0 | ✅ | id, userId, type, fromUserId, text, isRead, createdAt |
| `stories` | 0 | ✅ | id, userId, imageUrl, expiresAt, createdAt |
| `story_views` | 0 | ✅ | story_id, viewer_id, viewed_at |
| `user_follows` | 0 | ✅ | follower_id, following_id, created_at |

**Todas las tablas tienen RLS habilitado con políticas PERMISSIVE** (SELECT, INSERT, UPDATE, DELETE).

---

## 🔄 Arquitectura Offline-First

### Flujo de Sincronización (Last-Write-Wins)

```
┌──────────────────┐     PUSH (is_synced=0)     ┌──────────────────┐
│                  │ ──────────────────────────▶ │                  │
│   SQLite Local   │                             │   Supabase REST  │
│   (expo-sqlite)  │ ◀────────────────────────── │   (PostgreSQL)   │
│                  │     PULL (compare updated_at)│                  │
└──────────────────┘                             └──────────────────┘
```

1. **PUSH** (`syncService.ts`): Posts/comments/likes con `is_synced = 0` se suben a Supabase
   - Si `remote_id` es null → `POST` (crear nuevo)
   - Si `remote_id` existe → `PATCH` (actualizar)
2. **PULL** (`syncService.ts`): Se descargan datos remotos y se compara `updated_at`
   - Remoto más nuevo → actualizar local
   - Local más nuevo → no hacer nada (se sube en el push)
   - No existe localmente → insertar

### Sensor de Conectividad — `src/utils/connectivity.ts`

```typescript
// Verifica acceso REAL a internet (no solo Wi-Fi)
fetch('https://www.google.com', { method: 'HEAD', timeout: 5000 })
```

- Se ejecuta cada **30 segundos** (`connectivityStore.ts`)
- Al reconectar (offline → online) → `fullSync()` automático
- Indicador visual en el Home: 🟢 Online / 🟠 Offline

### HttpService — `src/services/HttpService.ts`

- **fetch nativo** con `AbortController`
- **Timeout estricto de 10 segundos** (`TIMEOUT_MS = 10000`)
- Headers automáticos: `apikey`, `Authorization: Bearer`, `Prefer: return=representation`
- Manejo de errores: `HttpError` con status, data y code
- **NO usa Axios** — fetch puro (requisito del profesor)

---

## ⚙️ Variables de Entorno — `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://lpfneudkpffhpbblcdjo.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### ¿Por qué solo 2 variables? Comparación con otros proyectos

| Variable del profesor | En este proyecto | Dónde está |
|---|---|---|
| `SUPABASE_URL` | ✅ `EXPO_PUBLIC_SUPABASE_URL` | El prefijo `EXPO_PUBLIC_` es **obligatorio en Expo** para exponer la variable al código JS. Sin él, Expo no la inyecta. |
| `SUPABASE_ANON_KEY` | ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Usa formato JWT clásico (equivalente al nuevo `sb_secret_` — ambos funcionan igual). |
| `SUPABASE_API_KEY` | ❌ No necesaria | Es la misma que la `ANON_KEY`. Se usa una sola vez en `HttpService.ts` línea 18: `apikey: SUPABASE_ANON_KEY` |
| `API_TIMEOUT` = `10000` | ❌ No en `.env` | **Hardcodeado** en `src/services/HttpService.ts` línea 13: `const TIMEOUT_MS = 10000` |
| `ENABLE_SYNC` = `true` | ❌ No en `.env` | **Siempre activo** — `connectivityStore.ts` llama `startAutoSync()` al iniciar la app. No hay flag para desactivarlo. |

> **Nota**: Las variables se leen en `HttpService.ts` líneas 8-10 con `process.env.EXPO_PUBLIC_*`. Si las variables no están presentes, hay fallbacks hardcodeados.

---

## 📱 Pantallas (18)

### Stack de Autenticación
| Pantalla | Archivo | Funcionalidad |
|---|---|---|
| Login | `src/screens/auth/Login.tsx` | Email + password → busca en SQLite |
| Register | `src/screens/auth/Register.tsx` | Crea usuario en SQLite + Supabase |

### Stack Principal (Bottom Tabs)
| Tab | Stack | Pantallas |
|---|---|---|
| 🏠 Inicio | HomeStack | HomeFeed → PostDetail, StoryViewer, UserProfile, Likes, Comments, Followers, Following |
| 🔍 Explorar | SearchStack | SearchFeed → UserProfile, Followers, Following |
| ➕ Crear | AddStack | AddFeed → TakePhoto → EditPhoto |
| ❤️ Actividad | ActivityStack | ActivityFeed → PostDetail, UserProfile, Likes, Comments, Followers, Following |
| 👤 Perfil | ProfileStack | ProfileFeed → PostDetail, Comments, Likes, UserProfile, Followers, Following, SavedPosts, EditProfile, Settings |

---

## 🔑 Stores (Zustand)

| Store | Archivo | Responsabilidad |
|---|---|---|
| `useAuthStore` | `src/store/authStore.ts` | Usuario logueado, token, persistencia en AsyncStorage |
| `usePostsStore` | `src/store/postsStore.ts` | CRUD posts, likes, comments + sync con Supabase |
| `useConnectivityStore` | `src/store/connectivityStore.ts` | isOnline, isSyncing, autoSync cada 30s |
| `useStoriesStore` | `src/store/storiesStore.ts` | Historias con expiración 24h |
| `useSearchStore` | `src/store/searchStore.ts` | Búsqueda de usuarios |
| `useActivityStore` | `src/store/activityStore.ts` | Notificaciones (like, comment, follow, mention) |

---

## 🚀 Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor Expo
npm start

# O directamente
npx expo start
```

### Credenciales de prueba

```
Email: test@example.com
Password: password123
```

También hay usuarios registrados: `mark711`, `josek71` (creados desde la app).

---

## 🏛️ Patrones de Arquitectura

- **Repository Pattern** — Abstracción de SQLite (`src/database/*Repository.ts`)
- **Service Layer** — HttpService + supabaseService + syncService
- **Offline-First** — SQLite como fuente primaria, Supabase como respaldo
- **Last-Write-Wins** — Comparación de `updated_at` para resolver conflictos
- **Store Pattern (Zustand)** — Estado global segmentado por dominio
- **Sensor de Conectividad Real** — fetch HEAD a google.com (no solo NetInfo)
- **Timeout configurable** — 10 segundos estrictos con AbortController

---

**Versión**: 1.0.0  
**Última actualización**: Abril 2026  
**Expo SDK**: 55  
**React Native**: 0.83.4  
**Base de datos**: SQLite (local) + Supabase PostgreSQL 17.6 (remoto)
