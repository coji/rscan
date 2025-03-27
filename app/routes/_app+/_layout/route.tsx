import { Outlet } from 'react-router'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
export default function ReceiptScannerLayout() {
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

      <Tabs defaultValue="scan" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan">スキャン</TabsTrigger>
          <TabsTrigger value="history">履歴</TabsTrigger>
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  )
}
