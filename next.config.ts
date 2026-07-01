import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/packing-lists/[id]/pdf": ["./node_modules/pdfkit/js/data/**"],
    "/api/quotes/[id]/pdf": ["./node_modules/pdfkit/js/data/**"],
    "/api/reports/[type]/pdf": ["./node_modules/pdfkit/js/data/**"],
    "/api/shipments/[id]/label": ["./node_modules/pdfkit/js/data/**"],
  },
};

export default nextConfig;
