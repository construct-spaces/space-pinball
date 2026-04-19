import { defineModel, field, access } from '@construct-space/graph'

// Public-read, authenticated-create so any player's score is visible on the
// public leaderboard but only logged-in players can submit. A pinball-admin
// space in the same bundle can override read → publisher_admin to see all
// scores across tenants.
export const HighScore = defineModel('highscore', {
  tableId: field.string().required(),
  score: field.number().required(),
  balls: field.number().required(),
  duration: field.number(),
  playerName: field.string(),
}, {
  access: {
    read: access.public(),
    create: access.authenticated(),
    update: access.none(),
    delete: access.none(),
  },
})
