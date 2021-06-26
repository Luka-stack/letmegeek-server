export enum WallArticleStatus {
  IN_PLANS = 'IN_PLANS',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export function allWallArticleStatusesModes(): Array<string> {
  return [
    WallArticleStatus.IN_PLANS,
    WallArticleStatus.IN_PROGRESS,
    WallArticleStatus.COMPLETED,
    WallArticleStatus.DROPPED,
  ];
}
