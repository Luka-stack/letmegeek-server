export enum MangaType {
  MANGA = 'MANGA',
  MANHWA = 'MANHWA',
  MANHUA = 'MANHUA',
  ONE_SHOT = 'ONE_SHOT',
  DOUJINSHI = 'DOUJINSHI',
  NOVEL = 'NOVEL',
  LIGHT_NOVEL = 'LIGHT_NOVEL',
}

export function allMangaTypes(): Array<string> {
  return [
    MangaType.MANGA,
    MangaType.MANHWA,
    MangaType.MANHUA,
    MangaType.ONE_SHOT,
    MangaType.DOUJINSHI,
    MangaType.NOVEL,
    MangaType.LIGHT_NOVEL,
  ];
}
