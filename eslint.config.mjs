import { fixupConfigRules } from '@eslint/compat'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// ponytail: fixupConfigRules shims APIs ESLint 10 removed (context.getFilename etc.)
// that eslint-plugin-react/import/jsx-a11y still call. Drop it once eslint-config-next
// ships plugins that support ESLint 10.
const config = [
  ...fixupConfigRules([...nextVitals, ...nextTs]),
  {
    rules: {
      // next.config sets images.unoptimized, and gift images come from arbitrary shop domains:
      // next/image would add sizing boilerplate without any optimisation.
      '@next/next/no-img-element': 'off',
    },
  },
  { ignores: ['.next/**', '.next-e2e/**', 'node_modules/**', 'next-env.d.ts'] },
]

export default config
