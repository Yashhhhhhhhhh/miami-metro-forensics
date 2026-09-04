export interface SubtitleCue {
  id: number
  start: number // seconds
  end: number   // seconds
  text: string
}

function timeStringToSeconds(timeStr: string): number {
  if (!timeStr) return 0
  const clean = timeStr.trim().replace(',', '.')
  const parts = clean.split(':')

  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0
    const mins = parseFloat(parts[1]) || 0
    const secs = parseFloat(parts[2]) || 0
    return hours * 3600 + mins * 60 + secs
  } else if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0
    const secs = parseFloat(parts[1]) || 0
    return mins * 60 + secs
  }
  return parseFloat(clean) || 0
}

export function parseSubtitles(content: string): SubtitleCue[] {
  if (!content) return []
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks = normalized.split(/\n\n+/)
  const cues: SubtitleCue[] = []
  let autoId = 1

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    // Skip WebVTT header blocks
    if (lines[0].startsWith('WEBVTT') || lines[0].startsWith('NOTE')) {
      continue
    }

    let timeLineIdx = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLineIdx = i
        break
      }
    }

    if (timeLineIdx === -1) continue

    const timeLine = lines[timeLineIdx]
    const [startStr, endStrRaw] = timeLine.split('-->')
    if (!startStr || !endStrRaw) continue

    // Strip cue positioning settings from WebVTT (e.g. line:90% align:center)
    const endStr = endStrRaw.trim().split(/\s+/)[0]

    const start = timeStringToSeconds(startStr)
    const end = timeStringToSeconds(endStr)

    const textLines = lines.slice(timeLineIdx + 1)
    // Remove HTML tags like <i>, <b>, <font color="...">
    const text = textLines.join('\n').replace(/<[^>]+>/g, '').trim()

    if (text && end > start) {
      cues.push({
        id: autoId++,
        start,
        end,
        text
      })
    }
  }

  return cues.sort((a, b) => a.start - b.start)
}

export function getCurrentSubtitle(
  cues: SubtitleCue[],
  currentTime: number,
  offsetSeconds: number = 0
): string {
  if (!cues || cues.length === 0) return ''
  const t = currentTime + offsetSeconds

  // Binary search for efficiency across 2000+ cue files
  let low = 0
  let high = cues.length - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    const cue = cues[mid]

    if (t >= cue.start && t <= cue.end) {
      return cue.text
    } else if (t < cue.start) {
      high = mid - 1
    } else {
      low = mid + 1
    }
  }

  return ''
}
