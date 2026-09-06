import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  FormProvider,
  useForm,
  useFormContext,
  type FieldValues,
  type SubmitHandler,
  type UseFormProps,
  type UseFormRegisterReturn,
  type UseFormReturn,
  type RegisterOptions,
} from "react-hook-form";
import clsx from "clsx";
import { Text } from "./Text";

export interface FormProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<ComponentPropsWithoutRef<"form">, "onSubmit" | "children"> {
  onSubmit: SubmitHandler<TFieldValues>;
  defaultValues?: UseFormProps<TFieldValues>["defaultValues"];
  children: ReactNode | ((methods: UseFormReturn<TFieldValues>) => ReactNode);
}

export function Form<TFieldValues extends FieldValues = FieldValues>({
  onSubmit,
  defaultValues,
  className,
  children,
  ...props
}: FormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>({ defaultValues });

  return (
    <FormProvider {...methods}>
      <form
        className={clsx("rebar-form", className)}
        data-rebar-component="form"
        noValidate
        onSubmit={methods.handleSubmit(onSubmit)}
        {...props}
      >
        {typeof children === "function" ? children(methods) : children}
      </form>
    </FormProvider>
  );
}

export type RebarFieldProps = UseFormRegisterReturn & { id: string };

export interface FormItemProps {
  name: string;
  label: ReactNode;
  required?: boolean;
  rules?: Omit<RegisterOptions, "required">;
  children: (field: RebarFieldProps) => ReactNode;
}

export function FormItem({ name, label, required, rules, children }: FormItemProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const field: RebarFieldProps = {
    ...register(name, {
      required: required ? "This field is required" : false,
      ...rules,
    } as RegisterOptions),
    id: name,
  };

  const error = errors[name];

  return (
    <div className="rebar-form-item" data-rebar-component="form-item">
      <label className="rebar-form-item-label" htmlFor={name} data-rebar-part="label">
        <Text as="span" size="sm">
          {label}
          {required ? (
            <span className="rebar-form-item-required" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </Text>
      </label>
      {children(field)}
      {error ? (
        <Text
          as="span"
          size="xs"
          className="rebar-form-item-error"
          role="alert"
          data-rebar-part="error"
        >
          {typeof error.message === "string" && error.message.length > 0
            ? error.message
            : "Invalid value"}
        </Text>
      ) : null}
    </div>
  );
}
