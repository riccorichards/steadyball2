# @pss/player (bundled)

Built from Pitch Scenario Studio with `pnpm bundle:player`. Do not edit by hand: rebuild it there.

```tsx
import { LessonPlayer, validateLesson } from "@pss/player";
const r = validateLesson(json);
if (r.ok) <LessonPlayer lesson={r.value} lang="ka" onComplete={...} onNext={...} />;
```
