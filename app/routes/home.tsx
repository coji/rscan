import type { Route } from './+types/home';
import { Button } from '~/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {
  Camera,
  CheckCircle,
  FileText,
  Shield,
  Smartphone,
} from 'lucide-react';
import { Link } from 'react-router';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { AvatarImage } from '@radix-ui/react-avatar';

export function meta() {
  return [
    { title: '領収書スキャナー | 登録不要・無料の領収書スキャン・管理ツール' },
    {
      name: 'description',
      content:
        'アカウント登録不要、完全無料で使える領収書スキャナー。スマホカメラでサクッとスキャン、データ化。確定申告や経費精算に最適。個人情報不要でプライバシーを保護。',
    },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold">領収書スキャナー</span>
        </div>
        <Button variant="default" className="bg-orange-500 hover:bg-orange-600">
          スキャン開始
        </Button>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              領収書スキャナー
              <br />
              <span className="text-3xl md:text-4xl text-muted-foreground">
                登録不要・完全無料
              </span>
            </h1>
            <p className="text-xl text-gray-700">
              スマホでサクッと一気にスキャン
              <br />
              確定申告も簡単に。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-lg"
              >
                今すぐスキャン開始
              </Button>
              {/* <Button variant="outline" size="lg" className="text-lg">
                デモを見る
              </Button> */}
            </div>
            <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              すでに10,000人以上が利用中！
            </div>
          </div>

          <div className="flex-1 relative h-[400px] w-full ">
            <div className="flex items-center justify-center">
              <div className="relative w-[280px] h-[560px] border-8 border-gray-800 rounded-[36px] overflow-hidden shadow-xl bg-white">
                <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 flex justify-center items-end pb-1">
                  <div className="w-20 h-1.5 bg-gray-600 rounded-full" />
                </div>
                <div className="pt-6 px-2 h-full">
                  <div className="bg-gray-100 h-full rounded-lg flex items-center justify-center">
                    <div className="relative w-full h-[70%] flex items-center justify-center">
                      <div className="absolute border-2 border-dashed border-blue-500 w-[80%] h-[60%] rounded-md flex items-center justify-center">
                        <FileText className="h-16 w-16 text-blue-500 opacity-50" />
                      </div>
                      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-md text-sm">
                        領収書を枠内に合わせてください
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">特徴</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">登録不要・完全無料</h3>
              <p className="text-gray-600">
                アカウント作成なし、メールアドレス不要。余計な手続きゼロでスキャン開始できます。
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">スマホで簡単スキャン</h3>
              <p className="text-gray-600">
                領収書を自動検出してスマートスキャン。複数の領収書もサクサク処理できます。
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">プライバシー保護</h3>
              <p className="text-gray-600">
                データはあなたのブラウザにのみ保存。サーバーにデータを送信しない安心設計です。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">使い方</h2>
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            {[
              { step: 1, title: 'サイトにアクセス', desc: 'アプリ不要' },
              { step: 2, title: 'カメラを起動', desc: '領収書にかざす' },
              { step: 3, title: '自動検出', desc: '領収書をスキャン' },
              { step: 4, title: '情報を自動認識', desc: '日付・金額・店舗名' },
              { step: 5, title: '出力', desc: 'CSVやPDFで保存' },
            ].map((item) => (
              <div key={item.step} className="text-center relative">
                <div className="bg-white w-16 h-16 rounded-full border-2 border-blue-500 flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-xl font-bold text-blue-500">
                    {item.step}
                  </span>
                </div>
                {item.step < 5 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-blue-200" />
                )}
                <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button className="bg-orange-500 hover:bg-orange-600">
              試してみる
            </Button>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">ユースケース</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="mb-4 h-72 bg-gray-100 rounded-lg flex items-center justify-center">
                <img
                  src="/images/usecase-1.png"
                  alt="確定申告イメージ"
                  width={500}
                  height={500}
                  className="rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold mb-3">確定申告に最適</h3>
              <ul className="text-gray-600 space-y-2 list-disc pl-5">
                <li>医療費控除、経費精算が簡単に</li>
                <li>年間の領収書をまとめて管理</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="mb-4 h-72 bg-gray-100 rounded-lg flex items-center justify-center">
                <img
                  src="/images/usecase-2.png"
                  alt="経費精算イメージ"
                  width={500}
                  height={500}
                  className="rounded-lg w-auto h-auto"
                />
              </div>
              <h3 className="text-xl font-bold mb-3">経費精算をスムーズに</h3>
              <ul className="text-gray-600 space-y-2 list-disc pl-5">
                <li>仕事の経費をさっと電子化</li>
                <li>CSV出力で会社提出もラクラク</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="mb-4 h-72 bg-gray-100 rounded-lg flex items-center justify-center">
                <img
                  src="/images/usecase-3.png"
                  alt="領収書作成イメージ"
                  width={500}
                  height={500}
                  className="rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold mb-3">領収書作成も可能</h3>
              <ul className="text-gray-600 space-y-2 list-disc pl-5">
                <li>シンプルな領収書PDFを素早く作成</li>
                <li>メールやSNSでそのまま共有</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-10">
            <Button className="bg-orange-500 hover:bg-orange-600">
              無料ではじめる
            </Button>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      {/* <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">デモ</h2>
          <div className="bg-white p-6 rounded-xl shadow-lg overflow-hidden">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">デモ動画</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-lg p-4 aspect-[4/3] flex items-center justify-center"
                >
                  <div className="text-center">
                    <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      スクリーンショット {i}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-700 mt-6">
              この通り、シンプルで使いやすい
            </p>
            <div className="text-center mt-6">
              <Button className="bg-orange-500 hover:bg-orange-600">
                自分の領収書でお試し
              </Button>
            </div>
          </div>
        </div>
      </section> */}

      {/* Social Proof Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">ユーザーの声</h2>
          <p className="text-center text-gray-600 mb-12">
            すでに10,000人以上が利用しています
          </p>

          <div className="flex justify-center mb-8">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-6 h-6 text-yellow-400 fill-current"
                  viewBox="0 0 24 24"
                >
                  <title>{star >= 4 ? 'star' : 'star outline'}</title>
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-gray-700 font-medium">4.8/5</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: '田中 健太',
                comment:
                  '確定申告の時期に大活躍しています。医療費控除の領収書整理が格段に楽になりました。登録不要なのも気軽に使えて良いです。',
                role: '会社員',
              },
              {
                name: '佐藤 美咲',
                comment:
                  'フリーランスの経費管理に使っています。シンプルで使いやすく、CSVで出力できるのが便利です。無料なのに高機能で助かっています。',
                role: 'フリーランスデザイナー',
              },
              {
                name: '鈴木 大輔',
                comment:
                  '小さな飲食店を経営していますが、お客様への領収書発行にも使っています。スマホだけで完結するのが本当に便利です。',
                role: '飲食店オーナー',
              },
            ].map((testimonial, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <div key={i} className="bg-blue-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <Avatar className="size-12">
                    <AvatarFallback>
                      {testimonial.name.charAt(0)}
                    </AvatarFallback>
                    <AvatarImage
                      src={`images/user-${i + 1}.png`}
                      alt={testimonial.name}
                    />
                  </Avatar>
                  <div className="ml-4">
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">{testimonial.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">よくある質問</h2>

          <Accordion
            type="single"
            collapsible
            className="bg-white rounded-xl shadow-sm"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                本当に無料ですか？
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                はい、広告表示のみで運営しています。すべての機能を無料でご利用いただけます。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                アカウント登録は必要ですか？
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                不要です。メールアドレスなどの個人情報を入力せずに、すぐに利用できます。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                データはどこに保存されますか？
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                お使いのブラウザ内だけに保存されます。サーバーには一切送信されないため、プライバシーが保護されます。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                データが消えることはありますか？
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                ブラウザのデータを消去すると失われる可能性があります。重要なデータはCSVやPDFで出力して保存することをおすすめします。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            さあ、領収書の山とサヨナラしよう
          </h2>
          <p className="text-xl mb-8">
            今すぐスマホを使って、領収書管理を始めましょう
          </p>

          <div>
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-lg px-8"
            >
              スキャン開始
            </Button>
          </div>

          <div className="mt-4 inline-block bg-blue-400 bg-opacity-30 px-4 py-2 rounded-full">
            登録不要・完全無料
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Camera className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold text-white">
                領収書スキャナー
              </span>
            </div>
            <div className="flex gap-6">
              <Link to="#" className="hover:text-white">
                プライバシーポリシー
              </Link>
              <Link to="#" className="hover:text-white">
                利用規約
              </Link>
              <Link to="#" className="hover:text-white">
                お問い合わせ
              </Link>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} 領収書スキャナー All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
