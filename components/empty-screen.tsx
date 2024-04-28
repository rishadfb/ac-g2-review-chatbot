import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Find most used features',
    message: 'What are the top 5 most used features in ActiveCampaign?'
  },
  {
    heading: 'Understand customer frustration',
    message:
      'What are the top 5 biggest frustrations users have with ActiveCampaign?'
  },
  {
    heading: 'Product ideas',
    message: `List 5 product ideas that could improve ActiveCampaign?`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to the ActiveCampaign G2 Reviews AI Chatbot!
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          Query a knowledge base of 4,500 customer reviews from{' '}
          <a href="https://g2.com">G2</a>.
        </p>
        <p className="mb-6 leading-normal text-muted-foreground">
          Ask questions and gain insights that can improve our product quality.
        </p>
        <p className="leading-normal text-muted-foreground">
          You can start a conversation here or try the following examples:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
