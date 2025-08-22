import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow inline styles in specific cases used for dynamic color chips
      // and relax unknown property when using aria-hidden dynamically via classes
      'react/no-unknown-property': 'off',
    },
  },
];

export default eslintConfig;
