import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MAINTENANCE_MODE } from "~~/utils/maintenance";

/**
 * 当 MAINTENANCE_MODE 为 true 时，将所有请求（除 /maintenance 和 /_next）重定向到维护页。
 * 放开系统：将 NEXT_PUBLIC_MAINTENANCE_MODE 设为 false 或删除，见 utils/maintenance.ts
 */
export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  // 放行：维护页、Next 静态资源
  if (pathname.startsWith("/maintenance") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/maintenance", request.url));
}

export const config = {
  // 不对 /_next 和 /maintenance 执行 middleware，减少无效逻辑
  matcher: ["/((?!_next|maintenance).*)"],
};
