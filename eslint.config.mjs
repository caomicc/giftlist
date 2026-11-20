import { fixupConfigRules } from '@eslint/compat'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// ponytail: fixupConfigRules shims APIs ESLint 10 removed (context.getFilename etc.)
// that eslint-plugin-react/import/jsx-a11y still call. Drop it once eslint-config-next
// ships plugins that support ESLint 10.
export default [
  ...fixupConfigRules([...nextVitals, ...nextTs]),
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
]
