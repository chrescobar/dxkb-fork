import { Info, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ServiceHeaderProps {
  title: string;
  description: string;
  tooltipContent?: string;
  quickReferenceGuide?: string;
  tutorial?: string;
  instructionalVideo?: string;
  version?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export function ServiceHeader({
  title,
  description,
  tooltipContent,
  quickReferenceGuide,
  tutorial,
  instructionalVideo,
  version,
  socialLinks,
}: ServiceHeaderProps) {
  return (
    <div className="service-header">
      <div className="service-header-title">
        <h1>{title}</h1>
        {tooltipContent && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="service-header-tooltip" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {version && (
          <Badge variant="outline" className="bg-primary-50 text-primary-700">
            {version}
          </Badge>
        )}
        {socialLinks && (
          <div className="flex gap-2">
            {socialLinks.github && (
              <a href={socialLinks.github} aria-label="GitHub">
                <ExternalLink className="service-header-tooltip" />
              </a>
            )}
            {socialLinks.linkedin && (
              <a href={socialLinks.linkedin} aria-label="LinkedIn">
                <ExternalLink className="service-header-tooltip" />
              </a>
            )}
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} aria-label="Twitter">
                <ExternalLink className="service-header-tooltip" />
              </a>
            )}
          </div>
        )}
      </div>
      <div className="service-header-description">
        <p>
          {description}
          <br />
          For more information, please see the
          {quickReferenceGuide && (
            <>
              {" "}
              <a href={quickReferenceGuide}>
                Quick Reference Guide
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </>
          )}
          {tutorial && (
            <>
              {", "}
              <a href={tutorial}>
                Tutorial
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </>
          )}
          {instructionalVideo && (
            <>
              {" "}and{" "}
              <a href={instructionalVideo}>
                Instructional Video
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </>
          )}
          .
        </p>
      </div>
    </div>
  );
} 