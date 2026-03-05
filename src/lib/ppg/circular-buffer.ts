/**
 * Float64Array 기반 고정 크기 링 버퍼.
 * 실시간 신호 처리를 위해 메모리 할당 없이 동작한다.
 */
export class CircularBuffer {
  private buffer: Float64Array
  private head: number = 0
  private _count: number = 0
  readonly capacity: number

  constructor(capacity: number) {
    this.capacity = capacity
    this.buffer = new Float64Array(capacity)
  }

  push(value: number): void {
    this.buffer[this.head] = value
    this.head = (this.head + 1) % this.capacity
    if (this._count < this.capacity) this._count++
  }

  /** 논리 인덱스로 접근 (0 = 가장 오래된, count-1 = 최신) */
  get(index: number): number {
    if (index < 0 || index >= this._count) return 0
    const realIndex = (this.head - this._count + index + this.capacity) % this.capacity
    return this.buffer[realIndex]
  }

  /** 가장 최근 값 */
  last(): number {
    if (this._count === 0) return 0
    return this.buffer[(this.head - 1 + this.capacity) % this.capacity]
  }

  /** 마지막 N개 값을 새 Float64Array로 반환 */
  getLastN(n: number): Float64Array {
    const count = Math.min(n, this._count)
    const result = new Float64Array(count)
    for (let i = 0; i < count; i++) {
      result[i] = this.get(this._count - count + i)
    }
    return result
  }

  /** 마지막 N개의 평균 */
  meanLastN(n: number): number {
    const count = Math.min(n, this._count)
    if (count === 0) return 0
    let sum = 0
    for (let i = 0; i < count; i++) {
      sum += this.get(this._count - count + i)
    }
    return sum / count
  }

  /** 마지막 N개의 표준편차 */
  stdLastN(n: number): number {
    const count = Math.min(n, this._count)
    if (count < 2) return 0
    const mean = this.meanLastN(count)
    let sumSq = 0
    for (let i = 0; i < count; i++) {
      const diff = this.get(this._count - count + i) - mean
      sumSq += diff * diff
    }
    return Math.sqrt(sumSq / (count - 1))
  }

  /** 마지막 N개의 분산 */
  varianceLastN(n: number): number {
    const count = Math.min(n, this._count)
    if (count < 2) return 0
    const mean = this.meanLastN(count)
    let sumSq = 0
    for (let i = 0; i < count; i++) {
      const diff = this.get(this._count - count + i) - mean
      sumSq += diff * diff
    }
    return sumSq / (count - 1)
  }

  get length(): number {
    return this._count
  }

  get isFull(): boolean {
    return this._count === this.capacity
  }

  clear(): void {
    this.head = 0
    this._count = 0
    this.buffer.fill(0)
  }
}
