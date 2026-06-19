import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("ml-1 block text-sm font-bold text-on-surface", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
