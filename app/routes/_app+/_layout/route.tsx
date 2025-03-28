import { href, Link, Outlet } from 'react-router'
import { match } from 'ts-pattern'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui'
import type { Route } from './+types/route'

export const loader = ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url)
  const tab = match(url.pathname)
    .with('/scan', () => 'scan')
    .with('/history', () => 'history')
    .otherwise(() => 'scan')
  return { tab }
}

export default function ReceiptScannerLayout({
  loaderData: { tab },
}: Route.ComponentProps) {
  return (
    <div className="receipt-scanner container mx-auto max-w-5xl px-4 py-6">
      <header className="mb-8 text-center">
        <h1 className="text-primary mb-2 text-3xl font-bold">
          領収書スキャナー
        </h1>
        <p className="text-muted-foreground text-lg">
          登録不要・完全無料で領収書をまとめて電子化
        </p>
      </header>

      <Tabs defaultValue={tab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan" asChild>
            <Link to={href('/scan')}>スキャン</Link>
          </TabsTrigger>
          <TabsTrigger value="history" asChild>
            <Link to={href('/history')}>履歴</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  )
}
