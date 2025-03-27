import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('/scan', 'routes/scan.tsx'),
] satisfies RouteConfig
