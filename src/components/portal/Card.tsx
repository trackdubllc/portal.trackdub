import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
}

export function Card({ title, children, className = "", style, ...props }: CardProps) {
  return (
    <div
      className={`bg-white p-5 ${className}`}
      style={{
        border: "1px solid #e0dbd2",
        borderTop: "2px solid #c0b8ac",
        ...style,
      }}
      {...props}
    >
      {title && (
        <h3
          className="mb-4 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#8a8a82" }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
