import { EmotionClassifier } from "@/components/emotion-classifier"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-2">
        <span className="w-fit rounded-md bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground">
          distilbert-emotion
        </span>
        <h1 className="text-2xl font-semibold text-balance sm:text-3xl">Emotion Classifier</h1>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Send text to your model server{"'"}s predict endpoint and see the emotion it returns. Every
          request is logged below so you can compare results.
        </p>
      </header>

      <EmotionClassifier />
    </main>
  )
}
