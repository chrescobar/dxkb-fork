import { z } from "zod";

/** Inquiry categories offered in the contact form. */
export const inquiryTypes = [
  { value: "general", label: "General Inquiry" },
  { value: "technical", label: "Technical Support" },
  { value: "research", label: "Research Collaboration" },
  { value: "feedback", label: "Feedback & Suggestions" },
] as const;

export type InquiryType = (typeof inquiryTypes)[number]["value"];

const inquiryTypeValues = inquiryTypes.map((option) => option.value) as [
  InquiryType,
  ...InquiryType[],
];

/** Validation schema shared by the client form and the /api/contact route. */
export const contactFormSchema = z.object({
  inquiryType: z.enum(inquiryTypeValues),
  name: z.string().trim().min(1, "Please enter your name."),
  email: z.string().trim().min(1, "Please enter your email address.").email(
    "Please enter a valid email address.",
  ),
  subject: z.string().trim().min(1, "Please enter a subject."),
  message: z
    .string()
    .trim()
    .min(10, "Please provide a message of at least 10 characters."),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const defaultContactFormValues: ContactFormData = {
  inquiryType: "general",
  name: "",
  email: "",
  subject: "",
  message: "",
};

/** Human-readable label for an inquiry type value. */
export const inquiryTypeLabel = (value: InquiryType): string =>
  inquiryTypes.find((option) => option.value === value)?.label ?? value;
