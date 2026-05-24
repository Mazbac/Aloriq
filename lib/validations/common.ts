import { z } from "zod";

const optionalText = z.string().trim().optional().transform((value) => (value ? value : undefined));

export const scoreSchema = z.coerce.number().int().min(1).max(10);
export const nullableNumberSchema = z.preprocess((value) => (value === "" || value == null ? undefined : value), z.coerce.number().optional());
export const requiredNumberSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  },
  z.coerce.number({ required_error: "Value is required.", invalid_type_error: "Enter a valid number." }),
);
export const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.string().url().optional());
export const optionalDateSchema = z
  .string()
  .optional()
  .transform((value) => (value ? new Date(`${value}T00:00:00`) : undefined));

export const text = optionalText;
