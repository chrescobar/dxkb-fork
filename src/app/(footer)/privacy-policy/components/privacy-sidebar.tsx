import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { privacyPolicySections } from "@/app/(footer)/privacy-policy/data/privacy-policy-sections";

const PrivacySidebar = () => {
  return (
    <aside className="md:w-64 lg:w-72 shrink-0">
    <div className="sticky top-24">
      <div className="mb-6">
        <Badge>Last Updated: July 22, 2026</Badge>
      </div>

      <div className="space-y-1 mb-6">
        <h3 className="font-medium text-sm mb-2">On This Page</h3>
        <nav className="space-y-1">
          {privacyPolicySections.map((section) => (
            <a
              key={section.id}
              href={`#${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="block px-3 py-2 text-sm rounded-md hover:bg-background"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="p-4 bg-secondary rounded-lg">
        <h3 className="font-medium text-sm mb-2 text-white">Need Help?</h3>
        <p className="text-sm text-white mb-4">
          If you have questions about our privacy practices, please contact us at help@dxkb.org.
        </p>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          className="w-full bg-secondary hover:bg-accent text-white"
          render={<Link href="/contact" />}
        >
          Contact Us
        </Button>
      </div>
    </div>
  </aside>
  )
}

export default PrivacySidebar