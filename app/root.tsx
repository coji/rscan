import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router'

import type { Route } from './+types/root'
import styles from './app.css?url'
import { Toaster } from './components/ui'

export function meta() {
  return [
    { title: '領収書スキャナー | 登録不要・無料の領収書スキャン・管理ツール' },
    {
      name: 'description',
      content:
        'アカウント登録不要、完全無料で使える領収書スキャナー。スマホカメラでサクッとスキャン、データ化。確定申告や経費精算に最適。個人情報不要でプライバシーを保護。',
    },
  ]
}

export const links: Route.LinksFunction = () => [
  { rel: 'stylesheet', href: styles },
]

export const loader = ({ request, context }: Route.LoaderArgs) => {
  const url = new URL(request.url)
  const isProd = url.hostname === 'rscan.app'
  const env = {
    GA_TRACKING_ID: context.cloudflare.env.GA_TRACKING_ID,
  }
  return { isProd, env }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const rootLoaderData = useRouteLoaderData('root')
  const { isProd, env } = rootLoaderData ?? { isProd: false, env: {} }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {isProd && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${env.GA_TRACKING_ID}`}
            />
            <script
              async
              id="gtag-init"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
              dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${env.GA_TRACKING_ID}');
                `,
              }}
            />
          </>
        )}
        <Toaster />

        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
