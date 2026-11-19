'use client';

import React, { useMemo } from 'react';
import { AbilityProvider, Can as CaslCan, useAbility as useCaslAbility } from '@casl/react';
import { defineAbilityFor, AppAbility } from '@/lib/permissions';
import { useSession } from '@/lib/auth-client';

export function AuthAbilityProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const ability: AppAbility = useMemo(() => {
    return defineAbilityFor(session?.user as any);
  }, [session?.user]);

  return <AbilityProvider value={ability}>{children}</AbilityProvider>;
}

export const Can = CaslCan;
export const useAbility = useCaslAbility;
