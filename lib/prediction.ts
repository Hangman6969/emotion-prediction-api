export type PredictResponse = {
  data?: unknown
  durationMs?: number
  endpoint?: string
  error?: string
}

export type HistoryEntry = {
  id: string
  text: string
  createdAt: number
  durationMs?: number
  error?: string
  data?: unknown
  topLabel?: string
  topScore?: number
}

/**
 * Model servers return predictions in a few shapes. This normalizes the most
 * common KServe/TorchServe outputs into a single "top label + score" pair so
 * we can show a friendly summary. Falls back gracefully when the shape is
 * unexpected.
 */
export function extractTopPrediction(data: unknown): { label?: string; score?: number } {
  const predictions = getPredictionsArray(data)
  if (!predictions.length) return {}

  const first = predictions[0]

  // Case: [1] — a bare class index (distilbert-emotion default output)
  if (typeof first === "number") {
    return { label: String(first) }
  }

  // Case: ["joy"] or "joy"
  if (typeof first === "string") {
    return { label: first }
  }

  if (first && typeof first === "object") {
    const obj = first as Record<string, unknown>

    // Case: { label: "joy", score: 0.98 }
    if (typeof obj.label === "string") {
      return {
        label: obj.label,
        score: typeof obj.score === "number" ? obj.score : undefined,
      }
    }

    // Case: [{ joy: 0.98, sadness: 0.01, ... }]  -> pick the max
    const entries = Object.entries(obj).filter(([, v]) => typeof v === "number") as [string, number][]
    if (entries.length) {
      entries.sort((a, b) => b[1] - a[1])
      return { label: entries[0][0], score: entries[0][1] }
    }
  }

  // Case: [[0.01, 0.98, ...]] raw logits/probabilities — no labels available.
  if (Array.isArray(first) && first.every((v) => typeof v === "number")) {
    const arr = first as number[]
    let maxIdx = 0
    for (let i = 1; i < arr.length; i++) if (arr[i] > arr[maxIdx]) maxIdx = i
    return { label: `class ${maxIdx}`, score: arr[maxIdx] }
  }

  return {}
}

function getPredictionsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.predictions)) return obj.predictions
    if (Array.isArray(obj.outputs)) return obj.outputs
  }
  return []
}

/**
 * distilbert-emotion label mapping:
 * 0 = sadness, 1 = joy, 2 = love, 3 = anger, 4 = fear, 5 = surprise
 */
const EMOTION_BY_INDEX: { name: string; emoji: string }[] = [
  { name: "sadness", emoji: "😢" },
  { name: "joy", emoji: "😄" },
  { name: "love", emoji: "❤️" },
  { name: "anger", emoji: "😡" },
  { name: "fear", emoji: "😨" },
  { name: "surprise", emoji: "😲" },
]

const EMOTION_BY_NAME: Record<string, { name: string; emoji: string }> = EMOTION_BY_INDEX.reduce(
  (acc, e) => {
    acc[e.name] = e
    return acc
  },
  {} as Record<string, { name: string; emoji: string }>,
)

/**
 * Resolves a model label (e.g. "joy", "LABEL_1", "class 1", or "1") into a
 * friendly emotion name + emoji. Returns undefined emoji when unknown.
 */
export function getEmotionMeta(label?: string): { name: string; emoji?: string } {
  if (!label) return { name: "" }

  const lower = label.toLowerCase().trim()

  // Direct name match: "joy", "sadness", ...
  if (EMOTION_BY_NAME[lower]) return EMOTION_BY_NAME[lower]

  // Index match: "1", "class 1", "label_1", "LABEL_1"
  const idxMatch = lower.match(/(\d+)/)
  if (idxMatch) {
    const idx = Number(idxMatch[1])
    if (EMOTION_BY_INDEX[idx]) return EMOTION_BY_INDEX[idx]
  }

  return { name: label }
}

export function formatScore(score?: number): string | undefined {
  if (typeof score !== "number") return undefined
  // Some servers already return 0-1, treat >1 as a raw value and skip %.
  if (score >= 0 && score <= 1) return `${(score * 100).toFixed(1)}%`
  return score.toFixed(3)
}
