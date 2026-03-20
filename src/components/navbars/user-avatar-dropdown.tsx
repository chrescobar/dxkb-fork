"use client";

import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignoutButton } from "@/components/auth/signout-button";
import { useAuth } from "@/contexts/auth-context";
import { encodeWorkspaceSegment } from "@/lib/utils";

import { NotebookPen, BriefcaseBusiness, Settings, Mail } from "lucide-react";

/** Full username with @domain for workspace URLs. */
function workspaceUsername(user: { username?: string; realm?: string } | null): string {
  if (!user?.username) return "";
  return user.realm ? `${user.username}@${user.realm}` : user.username;
}

export function UserAvatarDropdown() {
  const { user, sendVerificationEmail } = useAuth();
  const wsUsername = workspaceUsername(user);

  return (
    <div className="hover:bg-foreground/10 flex items-center space-x-2 rounded-md px-1 py-1">
      <div className="size-8 shrink-0 overflow-hidden rounded-full **:data-[slot=dropdown-menu-trigger]:size-full **:data-[slot=dropdown-menu-trigger]:min-w-0">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            nativeButton={false}
            render={<div className="flex size-full items-center justify-center" />}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-white/10 text-white">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" sideOffset={8} align="end" className="w-[200px]">
            <DropdownMenuGroup>
              <DropdownMenuLabel>User Actions</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <span className="flex items-center gap-2">
                  <NotebookPen className="text-foreground h-4 w-4" />
                  <Link href={wsUsername ? `/workspace/${encodeWorkspaceSegment(wsUsername)}/home` : "/workspace"}>My Workspace</Link>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="flex items-center gap-2">
                  <BriefcaseBusiness className="text-foreground h-4 w-4" />
                  <Link href="/jobs">My Jobs</Link>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="flex items-center gap-2">
                  <Settings className="text-foreground h-4 w-4" />
                  <Link href="/settings">Settings</Link>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="flex items-center gap-2">
                  <Mail className="text-foreground h-4 w-4" />
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => sendVerificationEmail()}
                    className="text-foreground font-inherit h-5 cursor-pointer p-0"
                  >
                    Resend Verification Email
                  </Button>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SignoutButton
                variant="ghost"
                className="h-auto w-full justify-start gap-2 rounded-md border-none px-1.5 py-1 text-sm shadow-none hover:bg-secondary/80 focus:bg-secondary/80"
              />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
