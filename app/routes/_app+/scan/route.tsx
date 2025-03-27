// app/routes/scanner.tsx
import { format } from 'date-fns'
import {
  CameraIcon,
  CheckCircleIcon,
  ScanIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigation, useSubmit } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import { openDatabase, saveReceipt, type Receipt } from '~/utils/receipt-db'
import type { Route } from './+types/route'

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

  return { success: false, error: '不明なアクション' }
}

// スキャナーコンポーネント
export default function ScannerPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation()
  const submit = useSubmit()
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // バッチスキャン用のステート
  const [batchScanMode, setBatchScanMode] = useState(false)
  const [scannedBatch, setScannedBatch] = useState<Receipt[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

        try {
          await videoRef.current.play()
          console.log(
            'カメラストリーム開始成功: ',
            videoRef.current.videoWidth,
            'x',
            videoRef.current.videoHeight,
          )
        } catch (playError) {
          console.error('ビデオ再生エラー:', playError)
          setBatchScanMode(false) // エラー時はモードを元に戻す
          alert('カメラの起動に失敗しました。')
        }
      } else {
        console.error(
          'videoRef.current が null です - カメラを初期化できません',
        )
        setBatchScanMode(false) // エラー時はモードを元に戻す
      }
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error)
      setBatchScanMode(false) // エラー時はモードを元に戻す
      alert(
        'カメラへのアクセスができませんでした。カメラの許可設定を確認してください。',
      )
    }
  }

  // カメラ開始ボタンの処理を修正
  const startCamera = () => {
    // 重要: まず先にバッチスキャンモードをtrueに設定
    setBatchScanMode(true)

    // バッチスキャンモードが反映され、videoタグがレンダリングされた後で
    // カメラ初期化を行うために、わずかに遅延させる
    setTimeout(() => {
      if (videoRef.current) {
        initCamera()
      } else {
        console.error(
          'videoRef.current が null です - レンダリングを待っています...',
        )

        // さらに少し待ってから再試行
        setTimeout(() => {
          if (videoRef.current) {
            console.log(
              'videoRef.current が見つかりました、カメラを初期化します',
            )
            initCamera()
          } else {
            console.error('videoRef.current が依然として null です')
            // バッチモードをキャンセル
            setBatchScanMode(false)
            alert('カメラの初期化に失敗しました。もう一度お試しください。')
          }
        }, 500)
      }
    }, 100)
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

  useEffect(() => {
    console.log(
      'コンポーネントがマウントされました。videoRef の状態:',
      videoRef.current ? 'OK' : 'NULL',
    )

    // このeffectは初回レンダリング時のみ実行
  }, [])

  // バッチスキャンモードに入る時にビデオ要素が確実に存在することを確認
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (batchScanMode) {
      console.log('バッチスキャンモードが有効になりました')

      // videoRefが設定されているか確認するための少し遅延させたチェック
      const timeoutId = setTimeout(() => {
        console.log(
          'videoRef の状態:',
          videoRef.current
            ? 'ビデオ要素が存在します'
            : 'ビデオ要素がありません',
        )
      }, 100)

      return () => clearTimeout(timeoutId)
    }
    console.log('バッチスキャンモードが無効になりました')
    // カメラのクリーンアップが必要な場合はここで行う
    stopCamera()
  }, [batchScanMode])

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
                  onClick={startCamera}
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
                  autoPlay
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
                                {Number.parseInt(item.amount).toLocaleString()}
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
                    <Button onClick={saveBatchReceipts} disabled={isSubmitting}>
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
    </>
  )
}
