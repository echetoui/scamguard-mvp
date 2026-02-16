# 🚀 Migration Frontend: React PWA → Next.js 15

## Pourquoi Next.js 15?

| Feature | React PWA | Next.js 15 | Avantage |
|---------|-----------|------------|----------|
| **Routing** | React Router | App Router | Natif + layouts |
| **SSR/SSG** | ❌ | ✅ | SEO + performance |
| **Images** | Manuel | `<Image>` | Auto-optimisation |
| **API Routes** | Externe | `/app/api` | Colocation |
| **Caching** | Service Worker | ISR + Cache | Plus puissant |
| **TypeScript** | Config manuelle | Natif | Meilleur DX |

## Setup Rapide

```bash
# Créer nouveau projet
cd /Users/echetoui/scamguard-mvp
npx create-next-app@latest frontend-next --typescript --tailwind --app --no-src-dir

# Structure
frontend-next/
├── app/
│   ├── layout.tsx          # Layout global
│   ├── page.tsx            # Home
│   ├── scenario/
│   │   └── page.tsx        # Scénario
│   ├── analyze/
│   │   └── page.tsx        # Analyse
│   └── profile/
│       └── page.tsx        # Profil
├── components/
│   ├── ScenarioCard.tsx
│   ├── AnalysisResult.tsx
│   └── VoiceButton.tsx
└── lib/
    ├── api.ts              # API client
    └── auth.ts             # Cognito
```

## Migration Progressive

### Étape 1: Setup (30 min)
```bash
cd frontend-next
npm install @aws-amplify/ui-react aws-amplify
npm install @tanstack/react-query
```

### Étape 2: Layout (15 min)
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="text-2xl">
        <nav className="p-4 bg-blue-600 text-white">
          🛡️ ScamGuard
        </nav>
        {children}
      </body>
    </html>
  )
}
```

### Étape 3: API Client (20 min)
```tsx
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function getScenario(token: string) {
  const res = await fetch(`${API_URL}/scenario`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}
```

### Étape 4: Pages (1h)
```tsx
// app/scenario/page.tsx
'use client'
import { useQuery } from '@tanstack/react-query'
import { getScenario } from '@/lib/api'

export default function ScenarioPage() {
  const { data } = useQuery({
    queryKey: ['scenario'],
    queryFn: () => getScenario(token)
  })
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl mb-4">{data?.title}</h1>
      <p className="text-2xl">{data?.content}</p>
    </div>
  )
}
```

## Deploy Vercel (5 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Outputs:
# https://scamguard.vercel.app
```

## Comparaison Déploiement

| Aspect | S3 + CloudFront | Vercel |
|--------|-----------------|--------|
| **Setup** | CDK + build | `vercel` |
| **Deploy** | `aws s3 sync` | `git push` |
| **Preview** | Manuel | Auto PR |
| **Analytics** | CloudWatch | Vercel Analytics |
| **Coût** | $0.10/mois | $0 (hobby) |

## Timeline Migration

```
Jour 5 (4h):
- Setup Next.js 15
- Migrer 2 pages principales

Jour 6 (4h):
- Migrer pages restantes
- Tests

Jour 7 (2h):
- Deploy Vercel
- Tests E2E
```

## Garder ou Migrer?

### Garder React PWA si:
- ✅ Besoin offline-first absolu
- ✅ Pas besoin SEO
- ✅ Déjà familier avec setup

### Migrer Next.js 15 si:
- ✅ Veux meilleure DX
- ✅ Besoin SEO
- ✅ Veux deploy simplifié
- ✅ Veux ISR pour scénarios

**Recommandation:** Next.js 15 pour production 🚀
