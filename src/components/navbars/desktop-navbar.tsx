"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  resourcesItems,
  organismItems,
  serviceItems,
} from "@/components/navbars/navbar-links";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { SearchBar } from "@/components/search/search-bar";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Logo from "@/components/ui/logo";
import { useAuth } from "@/lib/auth/hooks";
import { UserAvatarDropdown } from "@/components/navbars/user-avatar-dropdown";
import {
  WorkspaceDropdownContent,
  workspaceUsername,
} from "@/components/navbars/workspace-dropdown-content";
import { SuBanner } from "@/components/auth/su-banner";

const DesktopNavbar = () => {
  const { isAuthenticated, user, status } = useAuth();
  const isLoading = status === "loading";
  const wsUsername = workspaceUsername(user);

  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="bg-primary hidden flex-col text-white lg:flex">
      <div className="flex h-18 items-center justify-between px-4 py-4">
        <div className="flex shrink-0 items-center space-x-2">
          <Link id="dxkb-logo" href="/" className="shrink-0">
            <Logo
              variant="logo-white"
              width={100}
              height={44}
              className="h-8 w-auto shrink-0"
              priority
            />
          </Link>
          <span className="mt-0 self-start text-[11px] font-semibold text-white/90 italic">
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </span>

          <NavigationMenu className="bg-primary hidden w-full items-center justify-between font-bold lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem id="organisms-nav">
                <NavigationMenuTrigger className="bg-primary">
                  Organisms
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[280px] gap-3 p-4 md:w-[360px] md:grid-cols-2 lg:w-[450px]">
                    {organismItems.map((organism) => (
                      <ListItem
                        key={organism.title}
                        title={organism.title}
                        href={organism.href}
                        target={organism.target}
                      >
                        {organism.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem id="services-nav">
                <NavigationMenuTrigger className="bg-primary">
                  Services
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid grid-cols-2 gap-2 p-2 lg:w-[550px]">
                    {(() => {
                      const entries = Object.entries(serviceItems);
                      const mid = Math.ceil(entries.length / 2);
                      return [entries.slice(0, mid), entries.slice(mid)].map(
                        (column, colIdx) => (
                          <div key={colIdx} className="space-y-0">
                            {column.map(([key, section]) => (
                              <div key={key}>
                                <h4 className="bg-primary my-0.5 rounded-md p-2 text-sm font-bold text-white">
                                  {section.title}
                                </h4>
                                <div className="space-y-0">
                                  {section.items.map((item) => (
                                    <NavigationMenuLink
                                      key={item.href}
                                      render={
                                        item.target === "_blank" ? (
                                          <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:bg-secondary/20 my-0.5 block p-2 font-medium"
                                          />
                                        ) : (
                                          <Link
                                            href={item.href}
                                            className="hover:bg-secondary/20 my-0.5 block p-2 font-medium"
                                          />
                                        )
                                      }
                                    >
                                      {item.title}
                                    </NavigationMenuLink>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ),
                      );
                    })()}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem id="workspace-nav">
                <NavigationMenuTrigger className="bg-primary">
                  Workspace
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <WorkspaceDropdownContent
                    isAuthenticated={isAuthenticated}
                    wsUsername={wsUsername}
                  />
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem id="resources-nav">
                <NavigationMenuTrigger className="bg-primary">
                  Resources
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[500px]">
                    {resourcesItems.map((item) => (
                      <ListItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                        target={item.target}
                      >
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {!isHome && (
          <div className="hidden flex-1 items-center justify-end px-2 lg:flex">
            <SearchBar className="max-w-[1000px]" />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-16 bg-white/20" />
                <Skeleton className="h-8 w-20 bg-white/20" />
              </div>
            )}

            {!isLoading && !isAuthenticated && (
              <>
                <Link
                  href="/sign-in"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "text-white hover:bg-white/10 hover:text-white",
                  })}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className:
                      "text-foreground hover:text-secondary hover:bg-white",
                  })}
                >
                  Sign Up
                </Link>
              </>
            )}

            {!isLoading && isAuthenticated && <UserAvatarDropdown />}
          </div>
        </div>
      </div>
      <SuBanner />
    </header>
  );
};

function ListItem({
  title,
  children,
  href,
  target,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  target?: "_self" | "_blank";
}) {
  return (
    <li {...props}>
      <NavigationMenuLink render={<Link href={href} target={target} />}>
        <div className="flex flex-col gap-1 text-sm">
          <div className="leading-none font-medium">{title}</div>
          <div className="text-muted-foreground line-clamp-2">{children}</div>
        </div>
      </NavigationMenuLink>
    </li>
  );
}

export default DesktopNavbar;
