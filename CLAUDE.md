# 트래커리어 프론트엔드 (trackareer-front)

취업 준비생을 위한 캘린더 기반 지원 현황 관리 서비스.

---

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (커스텀 breakpoint: mobile/tablet/laptop/desktop)
- **State**: Zustand v5 + persist (localStorage)
- **Auth**: Firebase Authentication (Google OAuth — `signInWithPopup`)
- **Date**: date-fns v4

## 개발 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 포맷
npm run fix:all      # Prettier + ESLint 동시 수정
```

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx              # RootLayout — AuthProvider 래핑
│   └── (public)/
│       ├── layout.tsx          # 헤더 포함 공개 레이아웃
│       └── page.tsx            # 메인 페이지 (캘린더 + 사이드바)
├── api/                        # API 레이어 (authApi, jobPostingsApi, stageScheduleApi 등)
├── components/
│   ├── common/                 # 공통 컴포넌트 (modal, header, provider 등)
│   ├── calendar/               # CalendarView, CalendarCell
│   ├── jobPosting/             # JobPostingDetailModal, JobPostingEditModal
│   ├── sidebar/                # Sidebar, SidebarCard
│   ├── stage/                  # UpdateMenu, CompleteMenu, PassMenu
│   └── todo/                   # CreateTodoModal, EditTodoModal
├── stores/                     # Zustand 스토어 (authStore, jobPostingStore, scheduleStore)
├── hooks/                      # useJobPosting, useSchedule 등
├── types/                      # TypeScript 타입 (jobPosting, auth, stageSchedule)
├── lib/
│   ├── firebase/               # Firebase 초기화 및 설정
│   └── api/                    # apiRequest 범용 함수 (Bearer 토큰 자동 주입)
├── utils/                      # 유틸 함수 (dateFormatters, strFormatters, inAppBrowser)
└── constant/                   # 상수 (auth 선택지 등)
```

## 핵심 데이터 모델

### JobPosting
공고 단위로 전형 단계(`stages[]`)를 포함한다. `memo` 필드로 자유 메모 저장.

### Stage
전형 단계 (`DOCUMENT` | `INTERVIEW` | `EXAM` | `ASSIGNMENT`).
상태: `IN_PROGRESS` → `DONE` → `PASSED` | `REJECTED`

### StageSchedule
캘린더에 표시되는 일정 단위. `STAGE`(전형 일정)와 `ANNOUNCEMENT`(결과 발표) 두 종류.

## 중요 규칙 & 주의사항

### Auth
- Firebase `signInWithPopup` 사용 — 인앱 브라우저(Instagram 등)에서 sessionStorage 제한으로 실패함
- `LoginModal`에서 `isInAppBrowser()` 감지 후 외부 브라우저 유도 UI 표시
- API 요청에는 `lib/api/client.ts`의 `apiRequest()` 사용 (자동으로 Firebase ID 토큰 주입)

### Tailwind Breakpoint
```
mobile:  320px  (모바일 단열 레이아웃 기준)
tablet:  600px
laptop:  1200px (현재 데스크톱 레이아웃 기준)
desktop: 1536px
```
`md:`, `lg:` 대신 `tablet:`, `laptop:` 사용.

### 상태 관리
- `authStore`: Firebase 인증 상태 + 유저 정보. `initAuth()`로 Firebase 리스너 등록.
- `jobPostingStore`: 공고 목록 캐시.
- `scheduleStore`: 캘린더 일정 캐시.

### SVG
`@svgr/webpack` 으로 SVG를 React 컴포넌트로 import.
```tsx
import Logo from '@/public/svg/logo/FullLogo.svg';
<Logo width={100} />
```

## 현재 개선 작업 (2026-03)

`docs/ux-improvement-spec.md` 참고. PM 피드백 기반 UX 개선 및 모바일 반응형 대응 작업 진행 중.

주요 항목:
- 모바일 반응형 (P0)
- 상세 모달 메모 인라인 편집 (P1)
- 월간 캘린더 뷰 + 공휴일 표시 (P1)
- 지원 현황 대시보드, 드래그앤드롭, 알림 (P1~P2)
