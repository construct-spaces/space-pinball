/**
 * Snapshot-based undo/redo. `push` records a new state and clears the redo
 * stack. `undo` returns the previous state (one before current). `redo` returns
 * the state after the current.
 */
export class History<T> {
  private stack: T[] = []
  private cursor = -1
  constructor(private cap: number) {}

  push(snapshot: T): void {
    this.stack = this.stack.slice(0, this.cursor + 1)
    this.stack.push(snapshot)
    if (this.stack.length > this.cap) {
      this.stack.shift()
    } else {
      this.cursor++
    }
  }

  undo(): T | undefined {
    if (this.cursor <= 0) return undefined
    this.cursor--
    return this.stack[this.cursor]
  }

  redo(): T | undefined {
    if (this.cursor >= this.stack.length - 1) return undefined
    this.cursor++
    return this.stack[this.cursor]
  }

  size(): number {
    return this.stack.length
  }
}
