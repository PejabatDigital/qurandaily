import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  // Dark colours come from the CSS tokens (src/index.css), following the device or
  // Appearance, so components don't use dark: variants.
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        // Instrument Sans has no Arabic letters: the device's own Arabic font.
        arabic: ['"SF Arabic"', '"Geeza Pro"', '"Noto Naskh Arabic"', "serif"],
      },
      // Clear day's type scale (MyDay's CLAUDE.md). Use these names in new code.
      fontSize: {
        date: ["34px", { lineHeight: "40px", letterSpacing: "-0.02em" }],
        title: ["22px", { lineHeight: "28px" }],
        heading: ["17px", { lineHeight: "24px" }],
        body: ["15px", { lineHeight: "22px" }],
        label: ["15px", { lineHeight: "20px" }],
        small: ["13px", { lineHeight: "18px" }],
        caption: ["12px", { lineHeight: "16px" }],
      },
      // Clear day uses 400, 500 and 600 only; "bold" is 600.
      fontWeight: { bold: "600" },
      boxShadow: { float: "var(--shadow)" },
      colors: {
        subtle: "hsl(var(--subtle))",
        faint: "hsl(var(--faint))",
        "accent-soft": "hsl(var(--accent-soft))",
        "danger-soft": "hsl(var(--danger-soft))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
