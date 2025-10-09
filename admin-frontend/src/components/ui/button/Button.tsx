import React, { ReactNode } from "react";
import { getButtonStyles, combineStyles } from "../../../utils/themeStyles";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Disabled state
  type?: "button" | "submit" | "reset"; // Button type
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };


  const baseStyles = getButtonStyles(variant);
  const disabledStyles = disabled ? {
    backgroundColor: 'var(--button-primary-disabled)',
    cursor: 'not-allowed',
    opacity: 0.5,
  } : {};

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium gap-2 transition-all duration-200 ${className} ${
        sizeClasses[size]
      } ${disabled ? "" : "hover:shadow-md"}`}
      style={combineStyles(baseStyles, disabledStyles)}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
