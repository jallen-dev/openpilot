import { screen } from "@testing-library/dom"
import { render } from "@testing-library/react"

import ChatList from "../../src/components/ChatList"
import { useChatStore } from "../../src/stores/useChatStore"

test("renders just the starting message when there's no chats", () => {
  render(<ChatList />)

  expect(screen.getByText(/welcome/i)).toBeInTheDocument()
})

test("renders user chats and model chats", () => {
  useChatStore.getState().setChatMessages([
    { content: "user chat", participant: "user" },
    { content: "model chat", participant: "gpt-3.5-turbo" }
  ])

  render(<ChatList />)

  expect(screen.getByText(/user chat/i)).toBeInTheDocument()
  expect(screen.getByText(/model chat/i)).toBeInTheDocument()
})

test("renders markdown in model chats", () => {
  useChatStore.getState().setChatMessages([
    {
      content: "# Heading\n\n```js\nconst test = 'hello world'\n```",
      participant: "gpt-3.5-turbo"
    }
  ])

  render(<ChatList />)

  expect(screen.getByText("Heading").tagName).toBe("H1")
  expect(document.querySelector("code")).toBeInTheDocument()
})

test("matches snapshot", () => {
  useChatStore.getState().setChatMessages([
    { content: "user chat", participant: "user" },
    { content: "model chat", participant: "gpt-3.5-turbo" }
  ])

  const { asFragment } = render(<ChatList />)

  expect(asFragment()).toMatchSnapshot()
})
