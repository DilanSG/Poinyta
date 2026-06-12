# ESTRUCTURA DEL PROYECTO — POINYTA

```
poinyta/
│
├── app/                            # PANTALLAS (expo-router)
│   ├── _layout.tsx                 #   Layout raíz (Tabs + ThemeProvider)
│   ├── index.tsx                   #   Home / Dashboard
│   ├── tasks.tsx                   #   Tareas
│   ├── notes.tsx                   #   Notas
│   ├── finance.tsx                 #   Finanzas
│   ├── wishlist.tsx                #   Lista de deseos
│   ├── goals.tsx                   #   Metas
│   └── settings.tsx               #   Ajustes / Tienda
│
├── components/                     # COMPONENTES REUTILIZABLES
│   ├── backgrounds/                #   Fondos decorativos (20 figuras)
│   │   ├── ArrowsBg.tsx
│   │   ├── CirclesBg.tsx
│   │   ├── CrossesBg.tsx
│   │   ├── CylindersBg.tsx
│   │   ├── DecagonsBg.tsx
│   │   ├── DiamondsBg.tsx
│   │   ├── DodecagonsBg.tsx
│   │   ├── DotsBg.tsx
│   │   ├── FlatBg.tsx
│   │   ├── HeptagonsBg.tsx
│   │   ├── HexagonsBg.tsx
│   │   ├── MixedBg.tsx
│   │   ├── NonagonsBg.tsx
│   │   ├── OctagonsBg.tsx
│   │   ├── PentagonosBg.tsx
│   │   ├── RingsBg.tsx
│   │   ├── SquaresBg.tsx
│   │   ├── StarsBg.tsx
│   │   ├── TrianglesBg.tsx
│   │   └── WavesBg.tsx
│   │
│   ├── features/                   #   Componentes por feature
│   │   ├── finance/
│   │   │   ├── FinancePeriodCard.tsx
│   │   │   ├── MonthlyStats.tsx
│   │   │   └── TransactionCard.tsx
│   │   ├── notes/
│   │   │   ├── NoteCard.tsx
│   │   │   ├── NoteDetailView.tsx
│   │   │   └── NoteModal.tsx
│   │   ├── tasks/
│   │   │   ├── TaskDetailModal.tsx
│   │   │   └── TaskItem.tsx
│   │   └── wishlist/
│   │       ├── WishCard.tsx
│   │       └── WishDetailModal.tsx
│   │
│   ├── layout/                     #   Layout / navegación
│   │   ├── AnimatedSplash.tsx
│   │   ├── DrawerMenu.tsx
│   │   ├── NotificationBanner.tsx
│   │   ├── NotificationContext.tsx
│   │   └── OnboardingScreen.tsx
│   │
│   └── ui/                         #   UI atómica
│       ├── AlertModal.tsx
│       ├── AppText.tsx
│       ├── BackgroundDecor.tsx
│       ├── Badge.tsx
│       ├── EmptyState.tsx
│       ├── GlowView.tsx
│       ├── SectionHeader.tsx
│       └── StatusBox.tsx
│
├── hooks/                          # HOOKS PERSONALIZADOS
│   ├── useGoals.ts
│   ├── useHomeData.ts
│   ├── useNotes.ts
│   ├── useTasks.ts
│   ├── useTransactions.ts
│   ├── useWeather.ts
│   └── useWishlist.ts
│
├── lib/                            # LÓGICA DE NEGOCIO Y DATOS
│   │
│   ├── storage/                    #   CAPA DE DATOS (SQLite)
│   │   ├── index.ts                #     Barrel
│   │   ├── db.ts                   #     Conexión + esquema SQLite
│   │   ├── types.ts                #     Tipos compartidos
│   │   ├── helpers.ts              #     Utilidades (generateId, etc.)
│   │   ├── settings.ts             #     CRUD settings
│   │   ├── finance.ts              #     CRUD transactions
│   │   ├── tasks.ts                #     CRUD tasks
│   │   ├── notes.ts                #     CRUD notes + note_links
│   │   ├── wishlist.ts             #     CRUD wish items
│   │   ├── goals.ts                #     CRUD goals + goal_steps
│   │   ├── notifications.ts        #     CRUD app_notifications
│   │   ├── sync.ts                 #     Sincronización n8n
│   │   ├── themes.ts               #     CRUD themes comprados
│   │   ├── backgrounds.ts          #     CRUD backgrounds comprados
│   │   ├── button-colors.ts        #     CRUD button colors comprados
│   │   ├── chart-colors.ts         #     CRUD chart colors comprados
│   │   ├── glow.ts                 #     CRUD glow settings
│   │   └── movement-layers.ts      #     CRUD movement layers comprados
│   │
│   ├── theme/                      #   SISTEMA DE TEMAS
│   │   ├── index.ts                #     Barrel
│   │   ├── colors.ts               #     Paletas LIGHT / DARK
│   │   ├── context.ts              #     ThemeContext + tipos
│   │   ├── provider.tsx            #     ThemeProvider (estado global)
│   │   ├── hooks.ts                #     useTheme, useGlow, shop hooks
│   │   └── presets/                #     Catálogo de la tienda
│   │       ├── themes.ts           #       52 variantes de tema
│   │       ├── button-colors.ts    #       53 colores de botón
│   │       ├── chart-colors.ts     #       15 paletas de gráficos
│   │       ├── glow-presets.ts     #       27 efectos de brillo
│   │       └── movement-layers.ts  #       11 capas de movimiento
│   │
│   ├── theme.tsx                   #   Shim ← re-exporta theme/index
│   │
│   ├── native/                     #   Módulos nativos
│   │   └── SmsReader.ts
│   │
│   └── notifications/              #   Notificaciones locales
│       ├── calendar.ts
│       ├── permissions.ts
│       └── taskReminders.ts
│
├── api/                            # BRIDGE DE SINCRONIZACIÓN (n8n)
│   ├── server.js                   #   Express server (puerto 3001)
│   └── package.json
│
├── constants/                      # CONSTANTES
│   └── index.ts
│
├── declarations/                   # DECLARACIONES DE TIPOS
│   └── react-native-svg.d.ts
│
├── .github/                        # CONFIGURACIÓN GITHUB
│   ├── agents/                     #   Agentes de IA
│   │   ├── revisor.agent.md
│   │   ├── son.agent.md
│   │   └── thomas.agent.md
│   └── copilot-instructions.md
│
├── AGENTS.md                       # Guía para agentes de IA
├── app.json                        # Configuración Expo
├── eas.json                        # Configuración EAS Build
├── tsconfig.json                   # Configuración TypeScript
├── package.json                    # Dependencias y scripts
├── readmedev.md                    # Documentación técnica
├── .env.example                    # Variables de entorno (API key)
└── LICENSE
```

---

## FLUJO DE DATOS

```
  Pantalla (app/*.tsx)
       │
       ▼
  Hook personalizado (hooks/*.ts)
       │
       ▼
  CRUD storage (lib/storage/*.ts)
       │
       ▼
  SQLite (lib/storage/db.ts)
```

## FLUJO DE TEMAS

```
  ThemeProvider (lib/theme/provider.tsx)
       │
       ├── Colores base ← colors.ts (LIGHT / DARK)
       ├── Overrides    ← presets/themes.ts (variante activa)
       ├── Botones      ← presets/button-colors.ts (color activo)
       ├── Gráficos     ← presets/chart-colors.ts (paleta activa)
       │
       ▼
  ThemeContext (lib/theme/context.ts)
       │
       ▼
  Hooks de consumo (lib/theme/hooks.ts)
       ├── useTheme()           → colores finales
       ├── useGlow()            → estilo de sombra
       ├── useThemeMode()       → modo claro/oscuro
       └── use*Shop()           → tienda (comprar/equipar)
```
