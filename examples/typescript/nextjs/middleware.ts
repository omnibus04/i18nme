// nextjs/middleware.ts
// Locale detection middleware for Next.js App Router.
// Reads the Accept-Language header and redirects to the best matching locale.
//
// Add to your project root as middleware.ts.

import { NextRequest, NextResponse } from 'next/server'

const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'pl', 'es'] // update to match your project
const DEFAULT_LOCALE = 'en'

function getBestLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return DEFAULT_LOCALE

  const requested = acceptLanguage
    .split(',')
    .map((s) => s.split(';')[0].trim().toLowerCase().slice(0, 2))

  return requested.find((l) => SUPPORTED_LOCALES.includes(l)) ?? DEFAULT_LOCALE
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip if already has a locale prefix
  const hasLocale = SUPPORTED_LOCALES.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
  )
  if (hasLocale) return NextResponse.next()

  const locale = getBestLocale(request.headers.get('Accept-Language'))
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
