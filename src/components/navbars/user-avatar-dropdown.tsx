"use client";

import { useState } from "react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { SuLoginDialog } from "@/components/auth/su-login-dialog";
import { useAuth } from "@/lib/auth/hooks";
import { authAdmin, authAccount } from "@/lib/auth/advanced";
import { toast } from "sonner";
import { encodeWorkspaceSegment, workspaceUsername } from "@/lib/utils";

import {
  NotebookPen,
  BriefcaseBusiness,
  Settings,
  Mail,
  ShieldUser,
  LogIn,
  LogOut,
} from "lucide-react";

export function UserAvatarDropdown() {
  const { user, isAdmin, isImpersonating } = useAuth();
  const sendVerificationEmail = () => authAccount.sendVerificationEmail();
  const suExit = async () => {
    const { data, error } = await authAdmin.impersonate.exit();
    if (error) {
      toast.error("Failed to exit impersonation");
      return;
    }
    toast.success("Returned to your account");
  };
  const wsUsername = workspaceUsername(user);
  const [suDialogOpen, setSuDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center space-x-2 rounded-md p-1 hover:bg-foreground/10">
        <div className="size-8 shrink-0 overflow-hidden rounded-full **:data-[slot=dropdown-menu-trigger]:size-full **:data-[slot=dropdown-menu-trigger]:min-w-0">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              nativeButton={false}
              render={
                <div className="flex size-full items-center justify-center" />
              }
            >
              {isImpersonating ? (
                <div className="flex size-8 items-center justify-center rounded-full bg-red-600">
                  <ShieldUser className="size-5 text-white" />
                </div>
              ) : (
                <Avatar className="size-8">
                  <AvatarFallback className="bg-white/10 text-white">
                    {user?.username.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              sideOffset={8}
              align="end"
              className="w-60"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate text-sm text-foreground">
                  Hello, <span className="font-semibold">{user?.username ?? "User"}</span>
                  !
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  render={
                    <Link
                      href={
                        wsUsername
                          ? `/workspace/${encodeWorkspaceSegment(wsUsername)}/home`
                          : "/workspace"
                      }
                    />
                  }
                >
                  <NotebookPen className="size-4 text-foreground" />
                  {isImpersonating
                    ? `${user?.username ?? ""}'s Workspace`
                    : "My Workspace"}
                </DropdownMenuItem>

                <DropdownMenuItem render={<Link href="/jobs" />}>
                  <BriefcaseBusiness className="size-4 text-foreground" />
                  {isImpersonating ? `${user?.username ?? ""}'s Jobs` : "My Jobs"}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => { void sendVerificationEmail(); }}>
                  <span className="flex items-center gap-2">
                    <Mail className="size-4 text-foreground" />
                    Resend Verification Email
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem render={<Link href="/settings" />}>
                  <Settings className="size-4 text-foreground" />
                  Settings
                </DropdownMenuItem>

                {isAdmin && !isImpersonating && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setSuDialogOpen(true); }}>
                      <LogIn className="size-4 text-foreground" />
                      SU Login
                    </DropdownMenuItem>
                  </>
                )}

                {isImpersonating && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { void suExit(); }}>
                      <LogOut className="size-4 text-foreground" />
                      Exit SU
                    </DropdownMenuItem>
                  </>
                )}

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
      <SuLoginDialog open={suDialogOpen} onOpenChange={setSuDialogOpen} />
    </>
  );
}
