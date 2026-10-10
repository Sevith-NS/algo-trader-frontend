import type { NextConfig } from "next";

/**
 * Baseline security headers, applied to every route.
 *
 * No Content-Security-Policy here, deliberately. This app renders inline
 * <style> blocks (dashboard/page.tsx), compiles WebGL shaders at runtime
 * (Galaxy, SplashCursor, the globe) and animates with GSAP/framer-motion, so
 * any CSP strict enough to be worth setting needs a nonce threaded through the
 * document and the shader paths audited first. A wide policy full of
 * 'unsafe-inline' and 'unsafe-eval' would only look like protection. Worth
 * doing properly as its own change — start with Report-Only to see what fires.
 */
const securityHeaders = [
  // Stop the browser second-guessing a declared Content-Type: a JSON or text
  // response that happens to contain markup must not be sniffed into HTML.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No framing: there is no legitimate embed of this app, and denying it
  // removes clickjacking of the authenticated views outright.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the origin cross-site, the full URL same-origin. Screener and movers
  // URLs carry the symbol being viewed in ?q=, which should not travel to
  // third-party hosts in a Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here uses these, so hand them back rather than leave them granted.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  // `experimental.turbopackUseSystemTlsCerts` used to sit here, to make the
  // build-time Google Fonts fetch work behind a TLS-intercepting proxy. Next
  // removed the option (it does not typecheck on 16.4), so if a build ever
  // fails on a self-signed certificate again, point NODE_EXTRA_CA_CERTS at the
  // proxy's root CA instead — the Node-level equivalent of what run.sh does
  // for the backend.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
