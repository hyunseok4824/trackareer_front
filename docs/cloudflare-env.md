# Cloudflare 배포 시 환경 변수

## 1. Firebase 사용 위치 (EvalError 방지)

- Firebase는 **클라이언트 전용**으로만 사용됩니다.
  - `src/lib/firebase/firebaseConfig.ts` → `authStore`, `api/client`에서만 import
  - `AuthProvider`, `page.tsx` 등은 모두 `'use client'` 컴포넌트
- 서버 컴포넌트(`layout.tsx`, API Route)에서는 Firebase를 import하지 않습니다.
- `next.config.ts`에 `serverExternalPackages: ['firebase']`가 설정되어 있어, 서버 번들에 Firebase가 포함되지 않습니다.

## 2. 환경 변수 동기화

배포 로그에서 `vars`가 `-`(삭제)로 나오면, 배포 시 적용되는 설정에 환경 변수가 없어 500 등 오류가 날 수 있습니다.

**방법 A – Cloudflare 대시보드**

- **Workers & Pages** → 해당 프로젝트 → **Settings** → **Variables and Secrets**
- `NEXT_PUBLIC_*` 등 필요한 키를 추가

**방법 B – 빌드 시점 변수 (권장)**

- `NEXT_PUBLIC_*` 는 빌드 시 코드에 주입되므로, **Cloudflare 대시보드**에서:
  - **Workers & Pages** → 프로젝트 → **Settings** → **Builds** 또는 **Environment variables**
  - 빌드용 환경 변수에 `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FIREBASE_*` 등 설정

**방법 C – wrangler.jsonc의 vars**

- 로컬에서 `wrangler deploy` 할 때 사용할 값이면 `wrangler.jsonc`에 `vars` 추가 가능.
- **주의:** 이 설정이 배포 시 **원격(대시보드) 설정을 덮어씁니다.**  
  대시보드에 이미 값을 넣었다면, `vars`를 비우거나 제거해 두는 편이 안전합니다.

```jsonc
"vars": {
  "NEXT_PUBLIC_API_URL": "https://api.example.com",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "your-project-id"
  // ... 나머지 키
}
```

민감한 값은 대시보드 **Variables and Secrets**에서만 설정하고, `vars`에는 넣지 않는 것을 권장합니다.
