"use client";

import { Eye, EyeOff, Lock, Mail, MessageCircle, User } from "lucide-react";
import { useState } from "react";
import type { SignupForm } from "./use-signup-form";
import { RequiredFormLabel } from "@/components/forms/required-form-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FieldErrors,
  FieldItem,
  FieldLabel,
} from "@/components/ui/tanstack-form";
import { Textarea } from "@/components/ui/textarea";

interface SignupFieldsProps {
  form: Pick<SignupForm, "Field">;
}

interface SignupProfileFieldsProps extends SignupFieldsProps {
  disabled: boolean;
}

export function SignupProfileFields({
  form,
  disabled,
}: SignupProfileFieldsProps) {
  return (
    <>
      <form.Field name="first_name">
        {(field) => (
          <FieldItem>
            <RequiredFormLabel>First name</RequiredFormLabel>
            <div className="relative">
              <User className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="John"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                className="pl-10"
              />
            </div>
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>

      <form.Field name="middle_name">
        {(field) => (
          <FieldItem>
            <FieldLabel field={field}>Middle name</FieldLabel>
            <div className="relative">
              <User className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="James"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                className="pl-10"
                disabled={disabled}
              />
            </div>
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>

      <form.Field name="last_name">
        {(field) => (
          <FieldItem>
            <RequiredFormLabel>Last name</RequiredFormLabel>
            <div className="relative">
              <User className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Doe"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                className="pl-10"
                disabled={disabled}
              />
            </div>
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>

      <form.Field name="username">
        {(field) => (
          <FieldItem>
            <RequiredFormLabel>Username</RequiredFormLabel>
            <div className="relative">
              <Mail className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="john.doe"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                className="pl-10"
              />
            </div>
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <FieldItem>
            <RequiredFormLabel>Email</RequiredFormLabel>
            <div className="relative">
              <Mail className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="john.doe@example.com"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                className="pl-10"
              />
            </div>
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>

      <form.Field name="affiliation">
        {(field) => (
          <FieldItem>
            <FieldLabel field={field}>Organization</FieldLabel>
            <div className="relative">
              <User className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="John Doe Inc."
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                className="pl-10"
              />
            </div>
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>

      <form.Field name="organisms">
        {(field) => (
          <FieldItem>
            <FieldLabel field={field}>Organisms</FieldLabel>
            <div className="relative">
              <User className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Enter organisms"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                className="pl-10"
              />
            </div>
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>

      <form.Field name="interests">
        {(field) => (
          <FieldItem>
            <FieldLabel field={field}>Interests</FieldLabel>
            <div className="relative">
              <MessageCircle className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Textarea
                placeholder="Enter interests"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                className="max-h-32 pl-10"
              />
            </div>
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>
    </>
  );
}

export function SignupPasswordFields({ form }: SignupFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <>
      <form.Field name="password">
        {(field) => (
          <FieldItem>
            <RequiredFormLabel>Password</RequiredFormLabel>
            <div className="relative">
              <Lock className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                id={field.name}
                name={field.name}
                type={showPassword ? "text" : "password"}
                placeholder="Enter a password"
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                className="px-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => {
                  setShowPassword((visible) => !visible);
                }}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>

      <form.Field name="password_repeat">
        {(field) => (
          <FieldItem>
            <RequiredFormLabel>Confirm password</RequiredFormLabel>
            <div className="relative">
              <Lock className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                id={field.name}
                name={field.name}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Enter a password"
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                className="px-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => {
                  setShowConfirmPassword((visible) => !visible);
                }}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
                <span className="sr-only">
                  {showConfirmPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>
    </>
  );
}
