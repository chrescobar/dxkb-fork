import Link from "next/link";
import Logo from "@/components/ui/logo";
import ThemeContent from "@/components/ui/theme-content";

/** Ghost icon button styles for server component (avoids importing client-only buttonVariants). */
const socialLinkClassName =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 icon-link";

const socialIcons = {
  X: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
  Facebook:
    "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103v3.52c-2.26-.36-3.114.38-3.114 2.64v1.297h3.919l-.673 3.667h-3.246v8.245C19.396 23.238 24 18.179 24 12.044 24 5.417 18.627.044 12 .044S0 5.417 0 12.044c0 5.628 3.874 10.35 9.101 11.647Z",
  Instagram:
    "M12 2.2c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.67 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.69-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.96 3.9 2.42 7.15 2.27 8.42 2.21 8.8 2.2 12 2.2M12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.63 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.3.27 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8Zm6.41-11.6a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z",
  GitHub:
    "M12 .3A12 12 0 0 0 8.2 23.68c.6.11.82-.26.82-.58v-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18.76.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.69.83.57A12 12 0 0 0 12 .3Z",
  YouTube:
    "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.55 12 3.55 12 3.55s-7.51 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.51 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z",
} as const;

function SocialIcon({ name }: { name: keyof typeof socialIcons }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      data-icon="inline-start"
    >
      <path fill="currentColor" d={socialIcons[name]} />
    </svg>
  );
}

interface FooterLink {
  name: string;
  url: string;
}

interface FooterSection {
  title: string;
  /** When omitted, the section title renders as plain text (no link). */
  titleUrl?: string;
  links: FooterLink[];
}

const isExternalUrl = (url: string): boolean => {
  return url.startsWith("http") || url.startsWith("https");
};

const footerLinks: FooterSection[] = [
  {
    title: "ABOUT",
    titleUrl: "/about",
    links: [
      { name: "Funding", url: "/funding" },
      { name: "Our Team", url: "/team" },
    ],
  },
  {
    title: "UPDATES",
    links: [
      { name: "Citations", url: "/citations" },
      { name: "Community News", url: "/news" },
      { name: "Publications", url: "/publications" },
    ],
  },
  {
    title: "FAQ",
    titleUrl: "/faq",
    links: [
      { name: "Documentation", url: "https://docs.dxkb.org" },
      { name: "Related Resources", url: "/related-resources" },
    ],
  },
  {
    title: "HELP",
    titleUrl: "/help",
    links: [
      { name: "Contact Us", url: "/contact" },
      { name: "Privacy Policy", url: "/privacy-policy" },
      {
        name: "Walkthroughs",
        url: "https://docs.dxkb.org/docs/bv-brc/resources",
      },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-primary py-8 text-white">
      <div className="mx-auto w-full px-12">
        <div className="grid gap-8 md:grid-cols-[40%_60%]">
          <div id="website-info" className="order-2 flex flex-col md:order-1">
            <Logo
              variant="logo-text-white"
              alt="DXKB Logo"
              width={100}
              height={32}
              className="h-14 w-auto self-start"
              priority
            />
            <span className="mt-5 text-xl font-semibold">
              <ThemeContent type="funding-title" as="span" />
            </span>
            <span className="mt-1 text-sm text-white/80">
              <ThemeContent type="funding-statement" as="span" />
            </span>
            <div className="gap-auto mt-4 flex lg:gap-4">
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className={socialLinkClassName}
              >
                <SocialIcon name="X" />
                <span className="sr-only">X</span>
              </Link>
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className={socialLinkClassName}
              >
                <SocialIcon name="Facebook" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className={socialLinkClassName}
              >
                <SocialIcon name="Instagram" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                href="https://github.com/CEPI-dxkb"
                target="_blank"
                rel="noopener noreferrer"
                className={socialLinkClassName}
              >
                <SocialIcon name="GitHub" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className={socialLinkClassName}
              >
                <SocialIcon name="YouTube" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>
          <div
            id="footer-links"
            className="order-1 grid grid-cols-2 gap-4 md:order-2 md:grid-cols-4"
          >
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="footer-header">
                  {section.titleUrl ? (
                    <Link
                      href={section.titleUrl}
                      {...(isExternalUrl(section.titleUrl) && {
                        target: "_blank",
                        rel: "noopener noreferrer",
                      })}
                    >
                      {section.title}
                    </Link>
                  ) : (
                    section.title
                  )}
                </h4>
                <ul className="mb-2 space-y-4 md:space-y-6">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.url}
                        className="footer-link"
                        {...(isExternalUrl(link.url) && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        })}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
