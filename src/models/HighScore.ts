import { defineModel, field } from '@construct-space/graph'

export const HighScore = defineModel('highscore', {
  table: field.string().required(),
  score: field.number().required(),
  balls: field.number().required(),
  duration: field.number(),
  playerName: field.string(),
})
