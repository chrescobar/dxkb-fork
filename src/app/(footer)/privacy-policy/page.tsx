import FooterHeader from "@/components/headers/footer-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowUp } from "lucide-react";
import PrivacySidebar from "./components/privacy-sidebar";
import { privacyPolicySections } from "./data/privacy-policy-sections";

const PrivacyPolicy = () => {
  return (
    <div>
      <FooterHeader title="Privacy Policy" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sidebar */}
          <PrivacySidebar />

          {/* Main Content */}
          <main className="max-w-3xl flex-grow">
            <section id="introduction" className="mb-10">
              <div className="mb-6 border-l-4 border-secondary bg-secondary/20 p-4">
                <p className="text-secondary">
                  This Privacy Policy was last updated on <strong>April 8, 2023</strong>. Please read it carefully as it
                  affects your rights and how your data is handled.
                </p>
              </div>

              <p className="mb-6 text-lg text-muted-foreground">
                At VirusDB, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you visit our website or use our services. Please read this privacy
                policy carefully. If you do not agree with the terms of this privacy policy, please do not access the
                site.
              </p>
            </section>

            {privacyPolicySections.map((section) => (
              <section id={section.title.toLowerCase().replace(/\s+/g, '-')} key={section.id}>
                <div className="mb-4 flex items-center">
                  <div className="mr-3 flex size-8 items-center justify-center rounded-full bg-secondary/20" key={section.id}>
                    <span className="font-bold text-secondary">{section.id}</span>
                  </div>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>

                <p className="mb-4">{section.description}</p>
              </section>
            ))}

            <Separator className="my-8" />

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                <ArrowUp className="mr-2 size-4" />
                Back to Top
              </Button>
              <div className="text-sm text-foreground">© 2023 VirusDB. All rights reserved.</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy