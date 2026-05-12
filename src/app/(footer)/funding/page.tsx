"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import FooterHeader from "@/components/headers/footer-header";
import { useIsMounted } from "@/hooks/use-is-mounted";
const cepiLogoUrl = "/logos/cepi/cepi-logo.svg";
const cepiLogoWhiteUrl = "/logos/cepi/cepi-logo-white.svg";

const Funding = () => {
  const mounted = useIsMounted();
  const { theme } = useTheme();

  const currentTheme = mounted ? theme : "dxkb-light";
  const isDarkTheme = currentTheme?.includes("-dark");
  const logoSrc = isDarkTheme ? cepiLogoWhiteUrl : cepiLogoUrl;

  return (
    <div id="funding-container">
      <FooterHeader title="Our Funding" />
      <div className="funding-section">
        <div
          id="funding-content"
          className="flex flex-col gap-8 text-sm md:text-lg"
        >
          <Image src={logoSrc} alt="CEPI Logo" width={246} height={74} className="w-auto h-16" />
          <p>
            This project is supported by the Coalition for Epidemic Preparedness
            Innovations (CEPI) under the Disease X Program. We gratefully
            acknowledge CEPI&apos;s commitment to advancing global health security
            and its pivotal role in funding initiatives aimed at preventing and
            controlling infectious disease outbreaks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Funding;
