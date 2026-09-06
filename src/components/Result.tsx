import { forwardRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export type ResultStatus = "success" | "error" | "info" | "warning";

export interface ResultProps {
  status?: ResultStatus;
  title: ReactNode;
  subTitle?: ReactNode;
  extra?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Force bionic reading on/off for the title/subtitle, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

const ICONS: Record<ResultStatus, ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 12l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 11v5M12 8v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3l10 18H2L12 3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10v4M12 17v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export const Result = forwardRef<HTMLDivElement, ResultProps>(function Result(
  { status = "info", title, subTitle, extra, children, bionic, bionicOptions, className },
  ref,
) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const subTitleContent = useBionicChildren(subTitle, bionic, bionicOptions);
  return (
    <div
      ref={ref}
      className={clsx("rebar-result", className)}
      data-rebar-component="result"
      data-rebar-status={status}
    >
      <div className="rebar-result-icon" data-rebar-part="icon">
        {ICONS[status]}
      </div>
      <div className="rebar-result-title" data-rebar-part="title">
        {titleContent}
      </div>
      {subTitle ? (
        <div className="rebar-result-subtitle" data-rebar-part="subtitle">
          {subTitleContent}
        </div>
      ) : null}
      {extra ? (
        <div className="rebar-result-extra" data-rebar-part="extra">
          {extra}
        </div>
      ) : null}
      {children ? (
        <div className="rebar-result-content" data-rebar-part="content">
          {children}
        </div>
      ) : null}
    </div>
  );
});
