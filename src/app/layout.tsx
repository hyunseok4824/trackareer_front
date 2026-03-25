import { pretendard } from '@/src/app/font';
import '@/src/app/globals.css';
import AuthProvider from '@/src/components/common/provider/AuthProvider';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trackareer.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '트래커리어 | 취준 웹 다이어리',
    template: '%s | 트래커리어',
  },
  description:
    '채용 일정부터 할 일, 지원 현황 관리까지 한 곳에서, 취준 웹 다이어리 트래커리어와 함께 쉽고 똑똑하게 취업 준비에 필요한 모든 것을 관리하세요',
  keywords: [
    '트래커리어',
    '취업 준비',
    '취준 관리',
    '채용 공고 관리',
    '지원 일정 관리',
    '면접 일정 캘린더',
    '할 일 관리',
    '커리어 트래킹',
    '취준 웹 다이어리',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: '트래커리어',
    title: '트래커리어 | 취준 웹 다이어리',
    description:
      '채용 일정부터 할 일, 지원 현황 관리까지 한 곳에서, 취준 웹 다이어리 트래커리어와 함께 쉽고 똑똑하게 취업 준비에 필요한 모든 것을 관리하세요',
    images: [
      {
        url: 'https://trackareer.com/images/og.png',
        width: 1200,
        height: 630,
        alt: '트래커리어 서비스 미리보기 이미지',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '트래커리어 | 취준 웹 다이어리',
    description:
      '채용 일정부터 할 일, 지원 현황 관리까지 한 곳에서, 취준 웹 다이어리 트래커리어와 함께 쉽고 똑똑하게 취업 준비에 필요한 모든 것을 관리하세요',
    images: ['https://trackareer.com/images/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'career',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body
        id="modal-root"
        className={`${pretendard.variable} bg-background flex justify-center items-center w-full h-full`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
