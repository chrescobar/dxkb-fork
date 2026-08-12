import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const signupFormSchema = z
  .object({
    first_name: z.string().min(2, {
      error: "First name is required",
    }),
    middle_name: z.string(),
    last_name: z.string().min(2, {
      error: "Last name is required",
    }),
    username: z.string().min(1, {
      error: "Username is required",
    }),
    email: z.email({
      error: "Invalid email address",
    }),
    affiliation: z.string(),
    organisms: z.string(),
    interests: z.string(),
    password: z.string().min(8, {
      error: "Password must be at least 8 characters long",
    }),
    password_repeat: z.string().min(8),
  })
  .refine((data) => data.password === data.password_repeat, {
    path: ["password_repeat"],
    error: "Passwords do not match",
  });

type SignupFormValues = z.infer<typeof signupFormSchema>;

const defaultValues: SignupFormValues = {
  first_name: "",
  middle_name: "",
  last_name: "",
  username: "",
  email: "",
  affiliation: "",
  organisms: "",
  interests: "",
  password: "",
  password_repeat: "",
};

export function useSignupForm(
  onSubmit: (value: SignupFormValues) => Promise<void>,
) {
  return useForm({
    defaultValues,
    validators: { onChange: signupFormSchema },
    onSubmit: ({ value }) => onSubmit(value),
  });
}

export type SignupForm = ReturnType<typeof useSignupForm>;
