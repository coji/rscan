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
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  type ClientActionFunctionArgs,
} from 'react-router'
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
  DialogTrigger,
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
import type { Route } from '~/types/home'

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
export const clientAction = async ({ request }: ClientActionFunctionArgs) => {
  const formData = await request.formData()
  const action = formData.get('_action')

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
export default function ReceiptScanner() {
  const loaderData = useLoaderData<Route['LoaderData']>()
  const actionData = useActionData<Route['ActionData']>()
  const navigation = useNavigation()
  const submit = useSubmit()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [scanStep, setScanStep] = useState(0)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [recognizedData, setRecognizedData] = useState({
    date: new Date(),
    amount: '',
    store: '',
    category: '未分類',
  })
  const [activeTab, setActiveTab] = useState('scanner')
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

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
      setTimeout(() => setShowSuccessAlert(false), 3000)
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

      setScanStep(1)
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error)
      alert(
        'カメラへのアクセスができませんでした。カメラの許可設定を確認してください。',
      )
    }
  }

  // 写真を撮影
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

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

    // カメラのストリームを停止
    const stream = video.srcObject as MediaStream
    if (stream) {
      const tracks = stream.getTracks()
      tracks.forEach((track: MediaStreamTrack) => track.stop())
      video.srcObject = null
    }

    // OCR処理（モックデータ）
    simulateOCR(imageData)

    setScanStep(2)
  }

  // ファイルから画像を選択
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setPreviewImage(result)
        simulateOCR(result)
        setScanStep(2)
      }
    }
    reader.readAsDataURL(file)
  }

  // OCRのシミュレーション
  const simulateOCR = (imageData: string) => {
    // 実際のアプリでは、ここでOCR APIを呼び出す
    // デモ用にランダムなデータを生成
    setTimeout(() => {
      const today = new Date()
      const randomAmount = Math.floor(Math.random() * 10000) + 100
      const stores = ['コンビニ', 'スーパー', 'カフェ', 'レストラン', '書店']
      const randomStore = stores[Math.floor(Math.random() * stores.length)]

      setRecognizedData({
        date: today,
        amount: randomAmount.toString(),
        store: randomStore,
        category: '未分類',
      })
    }, 1000)
  }

  // 領収書データを保存
  const saveReceiptData = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    if (previewImage) {
      formData.append('imageData', previewImage)
    }
    formData.append('_action', 'scan')
    formData.append('date', format(recognizedData.date, 'yyyy-MM-dd'))

    submit(formData, {
      method: 'post',
    })

    // 保存完了後、スキャンステップをリセット
    setScanStep(0)
    setPreviewImage(null)
    setRecognizedData({
      date: new Date(),
      amount: '',
      store: '',
      category: '未分類',
    })

    // タブを履歴に切り替え
    setActiveTab('history')
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
          登録不要・完全無料で領収書をサクッと電子化
        </p>
      </header>

      {showSuccessAlert && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertTitle>保存完了</AlertTitle>
          <AlertDescription>
            領収書データの保存に成功しました。
          </AlertDescription>
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
              <CardTitle>領収書スキャン</CardTitle>
              <CardDescription>
                カメラで撮影するか、画像ファイルをアップロードしてください
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanStep === 0 && (
                <div className="space-y-6">
                  <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Button
                      onClick={initCamera}
                      className="flex items-center gap-2"
                    >
                      <CameraIcon className="h-4 w-4" />
                      カメラで撮影
                    </Button>
                    <div className="relative">
                      <Input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
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
                        <p>カメラを起動して領収書にかざす</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full font-bold">
                          2
                        </div>
                        <p>自動検出された領収書をスキャン</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full font-bold">
                          3
                        </div>
                        <p>日付・金額・店舗名などを自動認識</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full font-bold">
                          4
                        </div>
                        <p>必要に応じてデータを編集</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full font-bold">
                          5
                        </div>
                        <p>保存してCSVやPDFで出力</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {scanStep === 1 && (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-lg border bg-black">
                    <video
                      ref={videoRef}
                      className="aspect-[4/3] h-auto w-full object-cover"
                      playsInline
                    ></video>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4/5 w-4/5 rounded border-2 border-dashed border-white bg-transparent"></div>
                    </div>
                  </div>

                  <canvas ref={canvasRef} className="hidden"></canvas>

                  <div className="flex justify-between gap-4">
                    <Button variant="outline" onClick={() => setScanStep(0)}>
                      キャンセル
                    </Button>
                    <Button
                      onClick={captureImage}
                      className="bg-orange-500 text-white hover:bg-orange-600"
                    >
                      <ScanIcon className="mr-2 h-4 w-4" />
                      撮影する
                    </Button>
                  </div>
                </div>
              )}

              {scanStep === 2 && (
                <Form onSubmit={saveReceiptData} className="space-y-6">
                  <div className="overflow-hidden rounded-lg border">
                    {previewImage && (
                      <img
                        src={previewImage}
                        alt="領収書プレビュー"
                        className="max-h-64 w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">日付</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {recognizedData.date
                              ? format(recognizedData.date, 'yyyy年MM月dd日')
                              : '日付を選択'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={recognizedData.date}
                            onSelect={(date) =>
                              setRecognizedData({
                                ...recognizedData,
                                date: date || new Date(),
                              })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="amount">金額 (円)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={recognizedData.amount}
                        onChange={(e) =>
                          setRecognizedData({
                            ...recognizedData,
                            amount: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="store">店舗名</Label>
                      <Input
                        id="store"
                        name="store"
                        type="text"
                        value={recognizedData.store}
                        onChange={(e) =>
                          setRecognizedData({
                            ...recognizedData,
                            store: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="category">カテゴリ</Label>
                      <Select
                        value={recognizedData.category}
                        onValueChange={(value) =>
                          setRecognizedData({
                            ...recognizedData,
                            category: value,
                          })
                        }
                      >
                        <SelectTrigger id="category">
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
                        value={recognizedData.category}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setScanStep(0)}
                    >
                      キャンセル
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? '保存中...' : '保存する'}
                    </Button>
                  </div>
                </Form>
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

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <EditIcon className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>領収書詳細</DialogTitle>
                                <DialogDescription>
                                  領収書の詳細情報を確認できます（編集機能は実装予定）
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="flex justify-center">
                                  <img
                                    src={receipt.image}
                                    alt={`領収書 ${receipt.store}`}
                                    className="max-h-64 rounded-lg border object-contain"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <Label>日付</Label>
                                    <div className="bg-muted rounded-md p-2">
                                      {new Date(
                                        receipt.date,
                                      ).toLocaleDateString('ja-JP')}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label>金額</Label>
                                    <div className="bg-muted rounded-md p-2">
                                      {Number.parseInt(
                                        receipt.amount,
                                      ).toLocaleString()}
                                      円
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label>店舗名</Label>
                                    <div className="bg-muted rounded-md p-2">
                                      {receipt.store || '名称なし'}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label>カテゴリ</Label>
                                    <div className="bg-muted rounded-md p-2">
                                      {receipt.category}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline">閉じる</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="text-muted-foreground mt-12 text-center text-sm">
        <p className="mb-2">
          &copy; 2025 領収書スキャナー - 登録不要・完全無料
        </p>
        <div className="flex justify-center space-x-4">
          <a href="#" className="hover:underline">
            プライバシーポリシー
          </a>
          <a href="#" className="hover:underline">
            利用規約
          </a>
          <a href="#" className="hover:underline">
            お問い合わせ
          </a>
        </div>
      </footer>
    </div>
  )
}
