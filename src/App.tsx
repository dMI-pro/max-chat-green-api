import { ChatLayout } from './components/ChatLayout/ChatLayout'
import { LoginForm } from './components/LoginForm/LoginForm'
import { useChatStore } from './store/useChatStore'

export default function App() {
  const credentials = useChatStore((state) => state.credentials)

  return credentials ? <ChatLayout /> : <LoginForm />
}
