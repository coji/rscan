import { format } from 'date-fns'
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircleIcon,
  DownloadIcon,
  EditIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Form, useNavigation, useSubmit } from 'react-router'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Calendar,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui'
import {
  getAllReceipts,
  getReceiptById,
  openDatabase,
  saveReceipt,
  type Receipt,
} from '~/utils/receipt-db'
import type { Route } from './+types/route'

// クライアント側のローダー
export const clientLoader = async () => {
  // IndexedDBからスキャン履歴を取得
  try {
    const db = await openDatabase()
    const receipts = await getAllReceipts(db)
    return { receipts }
  } catch (error) {
    console.error('データの読み込みに失敗しました:', error)
    return { receipts: [] }
  }
}
clientLoader.hydrateRoot = true

// クライアント側のアクション
export const clientAction = async ({ request }: Route.ClientActionArgs) => {
  const formData = await request.formData()
  const action = formData.get('_action')

  if (action === 'export') {
    try {
      const db = await openDatabase()
      const receipts = await getAllReceipts(db)
      const csvContent = generateCSV(receipts)
      return { success: true, csvContent }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  if (action === 'update') {
    const id = formData.get('id')?.toString()
    if (!id) return { success: false, error: '領収書IDが指定されていません' }

    try {
      const db = await openDatabase()
      const receipt = await getReceiptById(db, id)

      if (!receipt) {
        return { success: false, error: '領収書が見つかりません' }
      }

      // 更新するフィールドを設定
      const updatedReceipt: Receipt = {
        ...receipt,
        date: formData.get('date')?.toString() || receipt.date,
        amount: formData.get('amount')?.toString() || receipt.amount,
        store: formData.get('store')?.toString() || receipt.store,
        category: formData.get('category')?.toString() || receipt.category,
      }

      await saveReceipt(db, updatedReceipt)
      return {
        success: true,
        receipt: updatedReceipt,
        message: '領収書を更新しました',
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  return { success: false, error: '不明なアクション' }
}

// CSVデータの生成
function generateCSV(receipts: Receipt[]): string {
  const headers = ['日付', '金額', '店舗名', 'カテゴリ']
  const rows = receipts.map((receipt: Receipt) => [
    receipt.date,
    receipt.amount,
    receipt.store,
    receipt.category,
  ])

  return [
    headers.join(','),
    ...rows.map((row: string[]) => row.join(',')),
  ].join('\n')
}

// 履歴コンポーネント
export default function HistoryPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation()
  const submit = useSubmit()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // 編集用のステート
  const [editReceipt, setEditReceipt] = useState<Receipt | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // ローダーデータの更新を検知してステートを更新
  useEffect(() => {
    if (loaderData?.receipts) {
      setReceipts(loaderData.receipts)
    }
  }, [loaderData])

  // アクションデータの更新を検知してアラートを表示
  useEffect(() => {
    if (actionData?.success) {
      setShowSuccessAlert(true)
      setAlertMessage(actionData.message || '処理が完了しました')
      setTimeout(() => setShowSuccessAlert(false), 3000)
    }
  }, [actionData])

  // 編集モードを開始
  const startEdit = (receipt: Receipt) => {
    setEditReceipt(receipt)
    setShowEditDialog(true)
  }

  // 編集内容を保存
  const saveEditedReceipt = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editReceipt) return

    const formData = new FormData(event.currentTarget)
    formData.append('_action', 'update')
    formData.append('id', editReceipt.id)

    submit(formData, { method: 'post' })
    setShowEditDialog(false)
  }

  // CSVエクスポート
  const exportCSV = () => {
    submit({ _action: 'export' }, { method: 'post' })
  }

  // CSVダウンロード
  useEffect(() => {
    if (actionData?.csvContent) {
      const blob = new Blob([actionData.csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `領収書データ_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [actionData])

  const isSubmitting = navigation.state === 'submitting'

  return (
    <>
      {showSuccessAlert && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertTitle>処理完了</AlertTitle>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        <div className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">スキャン履歴</h2>
            <p className="text-muted-foreground">
              これまでにスキャンした領収書データ
            </p>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={exportCSV}
                  disabled={receipts.length === 0}
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="h-4 w-4" />
                  CSVエクスポート
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>データをCSVファイルで保存</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div>
          {receipts.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangleIcon className="mb-4 h-12 w-12 opacity-20" />
              <p>まだ領収書データがありません</p>
              <p className="mt-1 text-sm">
                「スキャナー」タブから領収書をスキャンしてください
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-md">
              <div className="space-y-4">
                {receipts
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime(),
                  )
                  .map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex flex-col items-start gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                    >
                      <div className="h-16 w-full shrink-0 sm:w-16">
                        <img
                          src={receipt.image}
                          alt={`領収書 ${receipt.store}`}
                          className="h-full w-full rounded-md border object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center sm:gap-2">
                          <div className="truncate font-medium">
                            {receipt.store || '名称なし'}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {new Date(receipt.date).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                          {Number.parseInt(receipt.amount).toLocaleString()}円
                        </div>
                      </div>

                      <Badge variant="outline" className="sm:self-start">
                        {receipt.category}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(receipt)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* 編集ダイアログ */}
      {editReceipt && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>領収書を編集</DialogTitle>
              <DialogDescription>
                データを修正して保存してください
              </DialogDescription>
            </DialogHeader>

            <Form onSubmit={saveEditedReceipt}>
              <div className="grid gap-4 py-4">
                <div className="flex justify-center">
                  <img
                    src={editReceipt.image}
                    alt={`領収書 ${editReceipt.store}`}
                    className="max-h-48 rounded-lg border object-contain"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-date">日付</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(new Date(editReceipt.date), 'yyyy年MM月dd日')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(editReceipt.date)}
                        onSelect={(date) => {
                          if (date) {
                            setEditReceipt({
                              ...editReceipt,
                              date: format(date, 'yyyy-MM-dd'),
                            })
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" name="date" value={editReceipt.date} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">金額 (円)</Label>
                  <Input
                    id="edit-amount"
                    name="amount"
                    type="number"
                    defaultValue={editReceipt.amount}
                    onChange={(e) => {
                      setEditReceipt({
                        ...editReceipt,
                        amount: e.target.value,
                      })
                    }}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-store">店舗名</Label>
                  <Input
                    id="edit-store"
                    name="store"
                    type="text"
                    defaultValue={editReceipt.store}
                    onChange={(e) => {
                      setEditReceipt({
                        ...editReceipt,
                        store: e.target.value,
                      })
                    }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-category">カテゴリ</Label>
                  <Select
                    defaultValue={editReceipt.category}
                    onValueChange={(value) => {
                      setEditReceipt({
                        ...editReceipt,
                        category: value,
                      })
                    }}
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="未分類">未分類</SelectItem>
                      <SelectItem value="食費">食費</SelectItem>
                      <SelectItem value="交通費">交通費</SelectItem>
                      <SelectItem value="医療費">医療費</SelectItem>
                      <SelectItem value="通信費">通信費</SelectItem>
                      <SelectItem value="娯楽費">娯楽費</SelectItem>
                      <SelectItem value="その他">その他</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    name="category"
                    value={editReceipt.category}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowEditDialog(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '保存中...' : '保存する'}
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
