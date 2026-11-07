/**
 * One drag payload for anything in the studio panel.
 *
 * A tile can be dropped in two places: on the canvas (it becomes a reference card) or on an
 * existing reference card (it replaces that card's picture). Both read the same shape, so the
 * panel does not need to know where the pointer is going.
 */
export const ASSET_MIME = "application/x-pull-asset"

export interface DraggedAsset {
  /** The clean photograph. */
  image: string
  /** The client's markup layer, when the tile came from Approved. */
  overlay?: string
  /** A caption for the card that receives it. */
  label: string
}

/** Attach an asset to a drag event. */
export function setDraggedAsset(event: DragEvent, asset: DraggedAsset): void {
  event.dataTransfer?.setData(ASSET_MIME, JSON.stringify(asset))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy"
}

/** Read an asset from a drag/drop event, or null when the drag is not ours. */
export function readDraggedAsset(event: DragEvent): DraggedAsset | null {
  const raw = event.dataTransfer?.getData(ASSET_MIME)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DraggedAsset
    return typeof parsed?.image === "string" && parsed.image ? parsed : null
  } catch {
    return null
  }
}

/** Whether a drag currently over an element carries one of our tiles. */
export function carriesAsset(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes(ASSET_MIME)
}
