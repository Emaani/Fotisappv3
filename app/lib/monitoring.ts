import * as Sentry from '@sentry/nextjs';
import { prisma } from "./db-connect";
import { Integrations } from "@sentry/node";

export function initializeMonitoring() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 1.0,
      integrations: [
        new Integrations.Prisma({ client: prisma }),
      ],
    });
  }
} 