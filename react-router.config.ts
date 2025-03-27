import type { Config } from '@react-router/dev/config'

export default {
  ssr: true,
  prerender: true,
  future: {
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config
