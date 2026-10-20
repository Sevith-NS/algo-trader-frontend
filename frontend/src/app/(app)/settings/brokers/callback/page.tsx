'use client';

import { BrokerCallback } from '@/components/settings/BrokerCallback';

/** Zerodha's redirect URL, registered in the Kite developer console before other brokers existed. */
export default function ZerodhaCallbackPage() {
  return <BrokerCallback broker="zerodha" />;
}
