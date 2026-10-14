"use client";

import * as React from "react";
import { Plus, Shield, Waves, Building2, Scale } from "lucide-react";
import { DOMAIN_PROFILES, type DomainProfileId, type DomainProfile } from "@/lib/domain/profiles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createDocumentAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { MembershipRole } from "@/server/documents/store";

interface WorkspaceSelectorProps {
  tenantId: string;
  userRole?: MembershipRole;
  initialDomain?: DomainProfileId;
  onDomainChange?: (domain: DomainProfileId) => void;
  className?: string;
}

const DOMAIN_ICONS: Record<DomainProfileId, React.ComponentType<{ className?: string }>> = {
  "public-safety": Shield,
  "disaster-response": Waves,
  "corporate-crisis": Building2,
  "legal-compliance": Scale,
};

export function WorkspaceSelector({
  tenantId,
  userRole = "approver",
  initialDomain = "public-safety",
  onDomainChange,
  className,
}: WorkspaceSelectorProps): React.JSX.Element {
  const [selectedDomain, setSelectedDomain] = React.useState<DomainProfileId>(initialDomain);
  const activeProfile: DomainProfile = DOMAIN_PROFILES[selectedDomain];
  const Icon = DOMAIN_ICONS[selectedDomain];

  const handleSelect = (id: DomainProfileId) => {
    setSelectedDomain(id);
    onDomainChange?.(id);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Sector Workspace Pill Toggles */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-muted/40 rounded-2xl border border-border/60">
        {(Object.keys(DOMAIN_PROFILES) as DomainProfileId[]).map((id) => {
          const profile = DOMAIN_PROFILES[id];
          const ProfileIcon = DOMAIN_ICONS[id];
          const isSelected = id === selectedDomain;

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none",
                isSelected
                  ? "bg-card text-foreground shadow-xs ring-1 ring-foreground/10 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <ProfileIcon className="w-3.5 h-3.5" />
              <span>{profile.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Workspace Banner & Creation Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card ring-1 ring-foreground/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <Badge variant={activeProfile.badgeVariant} className="text-[11px] py-0 px-2 font-mono">
              {activeProfile.entityName}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Role: <strong className="text-foreground">{activeProfile.actorRole}</strong>
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {activeProfile.description}
          </p>
        </div>

        {/* Creation Form or Auditor Notice */}
        {userRole === "auditor" ? (
          <div className="flex items-center gap-2 p-2.5 px-4 rounded-xl border border-dashed border-border/80 bg-muted/40 text-xs text-muted-foreground font-mono">
            <Scale className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Auditor Read-Only: Dossier drafting restricted</span>
          </div>
        ) : (
          <form
            action={createDocumentAction}
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <input type="hidden" name="tenantId" value={tenantId} />
            <input type="hidden" name="domainProfileId" value={selectedDomain} />
            <Input
              name="title"
              placeholder={activeProfile.defaultTitlePlaceholder}
              className="w-full md:w-80 text-xs bg-page"
              required
            />
            <Button type="submit" size="sm" className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" />
              <span>New {activeProfile.entityName.split(" ")[0]}</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
