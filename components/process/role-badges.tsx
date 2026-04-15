"use client";

import type { ProcessStructuredData } from "@/lib/ai/schemas";

const badgeColors = [
  "bg-indigo-900/50 text-indigo-300",
  "bg-orange-900/50 text-orange-300",
  "bg-emerald-900/50 text-emerald-300",
  "bg-pink-900/50 text-pink-300",
  "bg-cyan-900/50 text-cyan-300",
];

export function RoleBadges({ data }: { data: ProcessStructuredData }) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-1">
      {data.roles.map((role, i) => (
        <span
          key={role.id}
          className={`${badgeColors[i % badgeColors.length]} text-xs px-3 py-1 rounded-full whitespace-nowrap`}
        >
          {role.name}
        </span>
      ))}
    </div>
  );
}
