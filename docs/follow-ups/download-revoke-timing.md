# .md 다운로드 직후 blob URL을 바로 해제함

- 증상(추정): Safari·Firefox에서 `.md 다운로드` 직후 빈 파일이 저장되거나 다운로드가 실패할 수 있음.
- 근거: `features/markdown-export/index.ts`의 `downloadMarkdown`이 `link.click()` 직후 `URL.revokeObjectURL`을 동기 호출함. Chromium에서는 정상 동작을 확인했고 다른 브라우저는 검증하지 못함.
- 다음 단계: 다른 브라우저에서 재현해 보고, 재현되면 해제를 `setTimeout`으로 미룸.
