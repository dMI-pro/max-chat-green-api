import { useState } from 'react'
import type { FormEvent } from 'react'
import { useChatStore } from '../../store/useChatStore'
import styles from './LoginForm.module.scss'

export function LoginForm() {
  const login = useChatStore((state) => state.login)
  const isAuthenticating = useChatStore((state) => state.isAuthenticating)
  const authError = useChatStore((state) => state.authError)

  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await login(idInstance, apiTokenInstance)
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>
          <div className={styles.logo}>M</div>
          <div>
            <h1>MAX</h1>
            <p>Чат через GREEN-API</p>
          </div>
        </div>

        <label className={styles.field}>
          <span>idInstance</span>
          <input
            value={idInstance}
            onChange={(event) => setIdInstance(event.target.value)}
            placeholder="3100..."
            autoComplete="username"
            required
          />
        </label>

        <label className={styles.field}>
          <span>apiTokenInstance</span>
          <input
            value={apiTokenInstance}
            onChange={(event) => setApiTokenInstance(event.target.value)}
            placeholder="Токен из личного кабинета"
            autoComplete="current-password"
            required
          />
        </label>

        {authError ? <div className={styles.error}>{authError}</div> : null}

        <button className={styles.submit} type="submit" disabled={isAuthenticating}>
          {isAuthenticating ? 'Проверяем инстанс…' : 'Войти'}
        </button>

        <p className={styles.hint}>
          Учётные данные берутся из{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личного кабинета GREEN-API
          </a>
          . Перед входом убедитесь, что инстанс авторизован в MAX.
        </p>
      </form>
    </div>
  )
}
