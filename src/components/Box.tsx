import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface BoxProps extends ComponentPropsWithoutRef<"div"> {
  as?: ElementType;
  children?: ReactNode;
  /** Force bionic reading on/off for this instance, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

// Tags whose content is code/syntax, never prose — bionic-splitting an identifier or keyword
// (e.g. "cons" bold + "t" dim inside `const`) doesn't aid reading, it misrepresents the text.
// Forced off unconditionally here rather than left to the `bionic` prop, since this is about
// what the content *is*, not a per-instance style choice.
const CODE_LIKE_TAGS = new Set(["code", "pre", "kbd", "samp"]);

// Box is the generic escape hatch every other component (here and in consuming apps) reaches for
// to render arbitrary tags — table cells, custom prose, one-off layout — so it needs its own
// bionic support too, not just the named components. Safe by the same rule as everywhere else:
// only plain string children are ever split, so a Box wrapping other components is untouched.
export const Box = forwardRef<HTMLDivElement, BoxProps>(function Box(
  { as: Component = "div", className, children, bionic, bionicOptions, ...props },
  ref,
) {
  const isCodeLike = typeof Component === "string" && CODE_LIKE_TAGS.has(Component);
  const content = useBionicChildren(children, isCodeLike ? false : bionic, bionicOptions);
  return (
    <Component
      ref={ref}
      className={clsx("rebar-box", className)}
      data-rebar-component="box"
      {...props}
    >
      {content}
    </Component>
  );
});
