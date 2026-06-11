import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { privacyPolicySections } from "@/app/(footer)/privacy-policy/data/privacy-policy-sections";

const PrivacySidebar = () => {
  return (
    <aside className="shrink-0 md:w-64 lg:w-72">
    <div className="sticky top-24">
      <div className="relative mb-6">
        <Input type="text" placeholder="Search policy..." className="pl-9" />
        <Search className="absolute top-1/2 left-3 -translate-y-1/2 transform text-primary" size={16} />
      </div>

      <div className="mb-6">
        <Badge className="mb-2">Last Updated: April 8, 2023</Badge>
        <Progress value={0} className="mb-2">
          <ProgressLabel className="text-xs text-muted-foreground">
            Reading progress
          </ProgressLabel>
          <ProgressValue />
        </Progress>
      </div>

      <div className="mb-6 space-y-1">
        <h3 className="mb-2 text-sm font-medium">On This Page</h3>
        <nav className="space-y-1">
          {privacyPolicySections.map((section) => (
            <a
              key={section.id}
              href={`#${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="block rounded-md px-3 py-2 text-sm hover:bg-background"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="rounded-lg bg-secondary p-4">
        <h3 className="mb-2 text-sm font-medium text-white">Need Help?</h3>
        <p className="mb-4 text-sm text-white">
          If you have questions about our privacy practices, please contact our Data Protection Officer.
        </p>
        <Button size="sm" variant="outline" className="w-full bg-secondary text-white hover:bg-accent">
          Contact Us
        </Button>
      </div>
    </div>
  </aside>
  )
}

export default PrivacySidebar