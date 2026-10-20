'use client';

import { notFound, useParams } from 'next/navigation';
import { BrokerCallback } from '@/components/settings/BrokerCallback';
import { isBroker } from '@/lib/brokers';

/** Each broker's redirect URL: /settings/brokers/callback/<broker>. */
export default function BrokerCallbackPage() {
  const { broker } = useParams<{ broker: string }>();
  if (!isBroker(broker)) notFound();
  return <BrokerCallback broker={broker} />;
}
