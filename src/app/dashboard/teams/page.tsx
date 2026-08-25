import React from 'react';
import { TeamRbacManager } from '@/components/team-rbac-manager';

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Team Workspace & RBAC Settings</h1>
        <p className="text-xs text-slate-400">
          Manage workspace team roles (Owner, Admin, Member) and configure rate-limited API keys (`x-api-key`).
        </p>
      </div>

      <TeamRbacManager />
    </div>
  );
}
