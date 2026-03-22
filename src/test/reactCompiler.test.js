import { describe, it, expect } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

describe('React Compiler', () => {
  it('all components are compatible (no react-compiler/react-compiler warnings)', async () => {
    const { stdout } = await execAsync(
      'npx eslint src/ --no-warn-ignored -f json 2>/dev/null',
      { cwd: process.env.ROOT || process.cwd() },
    )
    const results = JSON.parse(stdout)
    const compilerWarnings = results.flatMap((file) =>
      file.messages
        .filter((msg) => msg.ruleId === 'react-compiler/react-compiler')
        .map((msg) => `${file.filePath}:${msg.line} — ${msg.message}`),
    )
    expect(compilerWarnings, 'React Compiler bailouts found').toEqual([])
  }, 30_000)
})
