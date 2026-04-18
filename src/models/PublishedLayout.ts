import { defineModel, field } from '@construct-space/graph'

export const PublishedLayout = defineModel('publishedlayout', {
  name: field.string().required(),
  data: field.json().required(),
})
