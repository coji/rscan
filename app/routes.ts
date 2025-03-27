import { remixRoutesOptionAdapter } from '@react-router/remix-routes-option-adapter'
import { flatRoutes } from 'remix-flat-routes'

export default remixRoutesOptionAdapter((defineRoute) =>
  flatRoutes('routes', defineRoute, {
    ignoredRouteFiles: ['**/index.ts', '**/_shared/**'],
  }),
)
