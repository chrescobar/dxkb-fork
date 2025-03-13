import React from "react"
import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaTwitter, FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { Button } from "@/components/buttons/button";


const footerLinks = {
  about: {
    "Funding": "/funding",
    "Our Team": "/team",
    "Community News": "/news"
  },
  faq: {
    "Documentation": "/documentation",
    "Related Resources": "/related-resources",
    "Tutorials": "/tutorials"
  },
  updates: {
    "Calendar": "/calendar",
    "Publications": "/publications",
    "Citations": "/citations"
  },
  help: {
    "Contact Us": "/contact",
    "Instructional Videos": "/instructional-videos",
    "Privacy Policy": "/privacy-policy"
  }
};

const footer = () => {
  return (
    <footer className="bg-dxkb-blue text-white py-8">
      <div className="w-full mx-auto px-24">
        <div className="grid md:grid-cols-5 gap-8">
          <div id="Website Info" className="flex flex-col">
            <Image
              src="/dxkb-logo-white-cropped.svg"
              alt="DXKB Logo"
              width={100}
              height={32}
              className="h-14 w-auto self-start"
              priority
            />
            <span className="text-xl font-semibold mt-5">A CEPI Initiative.</span>
            <span className="text-sm mt-1 text-white/80">
              This project is funded in whole or in parts with Federal funds using grants awarded to the University of Chicago.
            </span>
            <div className="flex gap-4 mt-4">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-dxkb-orange" asChild>
                <Link href="https://twitter.com" target="_blank">
                  <FaTwitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-dxkb-orange" asChild>
                <Link href="https://facebook.com" target="_blank">
                  <FaFacebook className="h-4 w-4" />
                  <span className="sr-only">Facebook</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-dxkb-orange" asChild>
                <Link href="https://instagram.com" target="_blank">
                  <FaInstagram className="h-4 w-4" />
                  <span className="sr-only">Instagram</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-dxkb-orange" asChild>
                <Link href="https://github.com" target="_blank">
                  <FaGithub className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-dxkb-orange" asChild>
                <Link href="https://youtube.com" target="_blank">
                  <FaYoutube className="h-4 w-4" />
                  <span className="sr-only">YouTube</span>
                </Link>
              </Button>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-dxkb-orange">
              <Link href="/about" className="hover:underline">
                ABOUT
              </Link>
            </h4>
            <ul className="space-y-2">
              {Object.entries(footerLinks.about).map(([link_name, link_url]) => (
                <li key={link_name}>
                  <Link href={link_url} className="hover:underline">
                    {link_name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-dxkb-orange">
              <Link href="/faq" className="hover:underline">
                FAQ
              </Link>
            </h4>
            <ul className="space-y-2">
              {Object.entries(footerLinks.faq).map(([link_name, link_url]) => (
                <li key={link_name}>
                  <Link href={link_url} className="hover:underline">
                    {link_name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-dxkb-orange">
              <Link href="/updates" className="hover:underline">
                UPDATES
              </Link>
            </h4>
            <ul className="space-y-2">
              {Object.entries(footerLinks.updates).map(([link_name, link_url]) => (
                <li key={link_name}>
                  <Link href={link_url} className="hover:underline">
                    {link_name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-dxkb-orange">
              <Link href="/help" className="hover:underline">
                HELP
              </Link>
            </h4>
            <ul className="space-y-2">
              {Object.entries(footerLinks.help).map(([link_name, link_url]) => (
                <li key={link_name}>
                  <Link href={link_url} className="hover:underline">
                    {link_name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default footer;