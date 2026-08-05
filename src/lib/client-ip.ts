/**
 * Best-effort client IP extraction for audit logging. Prefers the first entry
 * of X-Forwarded-For (set by the proxy/load balancer), falling back to
 * X-Real-IP. Returns null when no trustworthy header is present.
 */
export function getClientIp(request: Request | Headers): string | null {
  const headers = request instanceof Headers ? request : request.headers;

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim() || null;

  return null;
}
