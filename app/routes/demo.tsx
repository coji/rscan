// app/routes/scanner.jsx
import { format } from 'date-fns'
import {
  AlertTriangleIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  DownloadIcon,
  EditIcon,
  ScanIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Form, Link, useNavigation, useSubmit } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { ScrollArea } from '~/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import type { Route } from './+types/demo'

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

  if (action === 'scan_batch') {
    const receiptsData = JSON.parse(formData.get('receiptsData') as string)

    try {
      const db = await openDatabase()

      // 複数の領収書を保存
      for (const receipt of receiptsData) {
        await saveReceipt(db, receipt)
      }

      return {
        success: true,
        message: `${receiptsData.length}件の領収書を保存しました`,
      }
    } catch (error) {
      console.error('保存に失敗しました:', error)
      return { success: false, error: String(error) }
    }
  }

  if (action === 'scan') {
    const imageData = formData.get('imageData')
    if (!imageData || typeof imageData !== 'string') {
      return { success: false, error: 'Invalid image data' }
    }

    const receiptData: Receipt = {
      id: Date.now().toString(),
      image: imageData,
      date:
        formData.get('date')?.toString() ||
        new Date().toISOString().split('T')[0],
      amount: formData.get('amount')?.toString() || '0',
      store: formData.get('store')?.toString() || '',
      category: formData.get('category')?.toString() || '未分類',
      timestamp: new Date().toISOString(),
    }

    try {
      const db = await openDatabase()
      await saveReceipt(db, receiptData)
      return { success: true, receipt: receiptData }
    } catch (error) {
      console.error('保存に失敗しました:', error)
      return { success: false, error: String(error) }
    }
  }

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

// IndexedDBの設定
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ReceiptScannerDB', 1)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('receipts')) {
        db.createObjectStore('receipts', { keyPath: 'id' })
      }
    }

    request.onsuccess = (event: Event) =>
      resolve((event.target as IDBOpenDBRequest).result)
    request.onerror = (event: Event) =>
      reject((event.target as IDBOpenDBRequest).error)
  })
}

type Receipt = {
  id: string
  image: string
  date: string
  amount: string
  store: string
  category: string
  timestamp: string
}

async function saveReceipt(db: IDBDatabase, receipt: Receipt): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['receipts'], 'readwrite')
    const store = transaction.objectStore('receipts')
    const request = store.put(receipt)

    request.onsuccess = () => resolve()
    request.onerror = (event: Event) =>
      reject((event.target as IDBRequest).error)
  })
}

async function getReceiptById(
  db: IDBDatabase,
  id: string,
): Promise<Receipt | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['receipts'], 'readonly')
    const store = transaction.objectStore('receipts')
    const request = store.get(id)

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result
      resolve(result || null)
    }
    request.onerror = (event) => reject((event.target as IDBRequest).error)
  })
}

async function getAllReceipts(db: IDBDatabase): Promise<Receipt[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['receipts'], 'readonly')
    const store = transaction.objectStore('receipts')
    const request = store.getAll()

    request.onsuccess = (event) => resolve((event.target as IDBRequest).result)
    request.onerror = (event) => reject((event.target as IDBRequest).error)
  })
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

// メインコンポーネント
export default function ReceiptScanner({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation()
  const submit = useSubmit()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [activeTab, setActiveTab] = useState('scanner')
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // バッチスキャン用のステート
  const [batchScanMode, setBatchScanMode] = useState(false)
  const [scannedBatch, setScannedBatch] = useState<Receipt[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  // 編集用のステート
  const [editReceipt, setEditReceipt] = useState<Receipt | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      // バッチスキャンモードを終了
      if (actionData.message?.includes('件の領収書')) {
        setBatchScanMode(false)
        setScannedBatch([])
        stopCamera()
      }
    }
  }, [actionData])

  // カメラの初期化
  const initCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setBatchScanMode(true)
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error)
      alert(
        'カメラへのアクセスができませんでした。カメラの許可設定を確認してください。',
      )
    }
  }

  // カメラ停止
  const stopCamera = () => {
    if (!videoRef.current) return

    const stream = videoRef.current.srcObject as MediaStream
    if (stream) {
      const tracks = stream.getTracks()
      for (const track of tracks) {
        track.stop()
      }
      videoRef.current.srcObject = null
    }
  }

  // 写真を撮影
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    const video = videoRef.current
    const canvas = canvasRef.current

    // キャンバスのサイズを設定
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // 画像をキャンバスに描画
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // 画像データを取得
    const imageData = canvas.toDataURL('image/jpeg')
    setPreviewImage(imageData)

    // 仮の領収書データを生成（OCRシミュレーション）
    await simulateOCR(imageData)

    setIsCapturing(false)
  }

  // ファイルから画像を選択（バッチ用）
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setBatchScanMode(true)

    // 複数ファイルを順番に処理
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()

      // Promise化して順番に処理
      await new Promise<void>((resolve) => {
        reader.onload = async (e: ProgressEvent<FileReader>) => {
          const result = e.target?.result
          if (typeof result === 'string') {
            setPreviewImage(result)
            await simulateOCR(result)
            resolve()
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  // OCRのシミュレーション
  const simulateOCR = async (imageData: string): Promise<void> => {
    return new Promise((resolve) => {
      // 実際のアプリでは、ここでOCR APIを呼び出す
      // デモ用にランダムなデータを生成
      setTimeout(() => {
        const today = new Date()
        const randomAmount = Math.floor(Math.random() * 10000) + 100
        const stores = ['コンビニ', 'スーパー', 'カフェ', 'レストラン', '書店']
        const randomStore = stores[Math.floor(Math.random() * stores.length)]

        // 新しい領収書を作成
        const newReceipt: Receipt = {
          id: Date.now().toString(),
          image: imageData,
          date: format(today, 'yyyy-MM-dd'),
          amount: randomAmount.toString(),
          store: randomStore,
          category: '未分類',
          timestamp: new Date().toISOString(),
        }

        // バッチに追加
        setScannedBatch((prev) => [...prev, newReceipt])
        resolve()
      }, 1000)
    })
  }

  // バッチスキャンを保存
  const saveBatchReceipts = () => {
    if (scannedBatch.length === 0) return

    const formData = new FormData()
    formData.append('_action', 'scan_batch')
    formData.append('receiptsData', JSON.stringify(scannedBatch))

    submit(formData, { method: 'post' })
  }

  // 領収書をバッチから削除
  const removeFromBatch = (id: string) => {
    setScannedBatch((prev) => prev.filter((receipt) => receipt.id !== id))
  }

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
    <div className="receipt-scanner container mx-auto max-w-5xl px-4 py-6">
      <header className="mb-8 text-center">
        <h1 className="text-primary mb-2 text-3xl font-bold">
          領収書スキャナー
        </h1>
        <p className="text-muted-foreground text-lg">
          登録不要・完全無料で領収書をまとめて電子化
        </p>
      </header>

      {showSuccessAlert && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertTitle>処理完了</AlertTitle>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs
        defaultValue="scanner"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">スキャナー</TabsTrigger>
          <TabsTrigger value="history">履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner">
          <Card>
            <CardHeader>
              <CardTitle>領収書一括スキャン</CardTitle>
              <CardDescription>
                複数の領収書を連続してスキャンし、まとめて保存できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!batchScanMode ? (
                <div className="space-y-6">
                  <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Button
                      onClick={initCamera}
                      className="flex items-center gap-2"
                    >
                      <CameraIcon className="h-4 w-4" />
                      カメラでスキャン開始
                    </Button>
                    <div className="relative">
                      <Input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center gap-2"
                      >
                        <UploadIcon className="h-4 w-4" />
                        画像をアップロード
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-4 text-lg font-medium">使い方</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full font-bold">
                          1
                        </div>
                        <p>カメラを起動して領収書を次々スキャン</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full font-bold">
                          2
                        </div>
                        <p>スキャン完了後、まとめて自動保存</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full font-bold">
                          3
                        </div>
                        <p>あとから履歴で各領収書を詳細編集</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-lg border bg-black">
                    {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
                    <video
                      ref={videoRef}
                      className="aspect-[4/3] h-auto w-full object-cover"
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4/5 w-4/5 rounded border-2 border-dashed border-white bg-transparent" />
                    </div>
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex justify-between gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBatchScanMode(false)
                        setScannedBatch([])
                        stopCamera()
                      }}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={captureImage}
                      disabled={isCapturing}
                      className="bg-orange-500 text-white hover:bg-orange-600"
                    >
                      <ScanIcon className="mr-2 h-4 w-4" />
                      {isCapturing ? 'スキャン中...' : 'スキャンする'}
                    </Button>
                  </div>

                  {/* スキャン済み領収書の表示 */}
                  {scannedBatch.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-2 text-lg font-medium">
                        スキャン済み ({scannedBatch.length}件)
                      </h3>
                      <ScrollArea className="h-64 rounded-md border p-2">
                        <div className="space-y-2">
                          {scannedBatch.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-md border p-2"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.image}
                                  alt="領収書"
                                  className="h-12 w-12 rounded-md object-cover"
                                />
                                <div>
                                  <div className="font-medium">
                                    {item.store || '名称なし'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {Number.parseInt(
                                      item.amount,
                                    ).toLocaleString()}
                                    円
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFromBatch(item.id)}
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={saveBatchReceipts}
                          disabled={isSubmitting}
                        >
                          {isSubmitting
                            ? '保存中...'
                            : `${scannedBatch.length}件の領収書を保存`}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>スキャン履歴</CardTitle>
                <CardDescription>
                  これまでにスキャンした領収書データ
                </CardDescription>
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
            </CardHeader>

            <CardContent>
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
                                {new Date(receipt.date).toLocaleDateString(
                                  'ja-JP',
                                )}
                              </div>
                            </div>
                            <div className="mt-1 text-lg font-semibold">
                              {Number.parseInt(receipt.amount).toLocaleString()}
                              円
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      <footer className="text-muted-foreground mt-12 text-center text-sm">
        <p className="mb-2">
          &copy; 2025 領収書スキャナー - 登録不要・完全無料
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="#" className="hover:underline">
            プライバシーポリシー
          </Link>
          <Link to="#" className="hover:underline">
            利用規約
          </Link>
          <Link to="#" className="hover:underline">
            お問い合わせ
          </Link>
        </div>
      </footer>
    </div>
  )
}
