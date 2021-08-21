export enum GameModes {
  SINGLE_PLAYER = 'SINGLE_PLAYER',
  MULTIPLAYER = 'MULTIPLAYER',
  BUY_TO_PLAY = 'BUY_TO_PLAY',
  SUBSCRIPTION = 'SUBSCRIPTION',
  FREE_TO_PLAY = 'FREE_TO_PLAY',
  CO_OP = 'CO_OP',
}

export function allGameModes(): Array<string> {
  return [
    GameModes.BUY_TO_PLAY,
    GameModes.CO_OP,
    GameModes.FREE_TO_PLAY,
    GameModes.MULTIPLAYER,
    GameModes.SINGLE_PLAYER,
    GameModes.SUBSCRIPTION,
  ];
}
