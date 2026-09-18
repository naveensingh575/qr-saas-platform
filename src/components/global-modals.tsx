'use client';

import React from 'react';
import { LoginModal } from '@/components/login-modal';
import { SignupModal } from '@/components/signup-modal';
import { CreateTeamModal } from '@/components/create-team-modal';
import { useAuth } from '@/lib/auth-context';

export function GlobalModals() {
  const { showCreateTeamModal, setShowCreateTeamModal } = useAuth();

  return (
    <>
      <LoginModal />
      <SignupModal />
      <CreateTeamModal
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
      />
    </>
  );
}
