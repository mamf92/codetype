import { Navigate, useParams } from 'react-router-dom'
import { keyTrackById } from '@/content/basics/index'
import { STAGE_TITLES } from '@/content/basics/schema'
import type { PracticeStep } from '@/engine/practice/weakKeys'
import { PracticeRunner } from '@/components/practice/PracticeRunner'
import { BASICS_PATH, keyStagePath } from '@/lib/paths'

export default function KeyStage() {
  const { trackId, stageId } = useParams()
  const track = trackId === undefined ? undefined : keyTrackById(trackId)
  const index = track?.stages.findIndex((s) => s.id === stageId) ?? -1
  const stage = track?.stages[index]

  if (track === undefined || stage === undefined) return <Navigate to={BASICS_PATH} replace />

  // Passages are static content and the runner keys off their text, so a
  // fresh array each render costs nothing.
  const steps: PracticeStep[] = stage.passages.map((passage, i) => ({
    name: `Pass ${i + 1}`,
    passage,
    grammar: stage.grammar,
  }))
  const following = track.stages[index + 1]
  return (
    <PracticeRunner
      key={stage.id}
      crumbs={
        <>
          <span className="truncate text-muted">{track.title}</span>
          <span className="text-ink-line">/</span>
          <span className="truncate">{STAGE_TITLES[stage.kind]}</span>
        </>
      }
      eyebrow={`${track.title} · Stage ${index + 1} of ${track.stages.length}`}
      title={STAGE_TITLES[stage.kind]}
      blurb={stage.summary}
      steps={steps}
      record={{ trackId: track.id, lessonId: stage.id, drillId: stage.id }}
      exitTo={BASICS_PATH}
      next={
        following === undefined
          ? undefined
          : {
              label: `Next: ${STAGE_TITLES[following.kind]}`,
              to: keyStagePath(track.id, following.id),
            }
      }
    />
  )
}
