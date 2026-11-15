"use client"

import type { Look } from "@/components/start-job/ReviewBoard"

/**
 * The board a stylist just built, handed from the start-job dialog to `/board`.
 *
 * The dialog builds in memory at `/`, but the board is a page: `/board` owns the site chrome
 * (header, demo guide, menu) and is where the demo's next act lives. So the build writes the board
 * here and navigates; `/board` reads it back.
 *
 * sessionStorage, not localStorage: a board is one demo session's working state, not a saved job.
 * Only looks whose source is a URL survive a reload — an uploaded File's blob URL dies with the tab.
 */

export const BOARD_KEY = "pull.board.v1"

export interface StoredBoard {
  job: { title: string; description: string; email: string; dueDate: string }
  looks: Look[]
  /**
   * The spares each house still holds from its collection, keyed by brand. Carried with the board
   * so `/board` can swap a deleted look for another from the same house instead of leaving the row
   * short — the dialog collects these, and without them every remove control read "no more looks"
   * and stayed disabled.
   */
  reserve?: Record<string, Look[]>
}

export function storeBoard(board: StoredBoard) {
  try {
    sessionStorage.setItem(BOARD_KEY, JSON.stringify(board))
  } catch (error) {
    // A full quota is not worth failing a build over — but silence here sends the presenter to the
    // seeded board with no clue why, so leave one line in the console for whoever has to debug it.
    console.warn(`pull: the built board did not fit sessionStorage (${BOARD_KEY})`, error)
  }
}

export function clearStoredBoard() {
  try {
    sessionStorage.removeItem(BOARD_KEY)
  } catch {
    // ignore
  }
}

export function readStoredBoard(): StoredBoard | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(BOARD_KEY)
    if (!raw) return null
    const board = JSON.parse(raw) as StoredBoard
    return board?.looks?.length ? board : null
  } catch {
    return null
  }
}
