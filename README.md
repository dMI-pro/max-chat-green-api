# MAX Chat · GREEN-API

Прототип веб-чата для мессенджера **MAX** на React + TypeScript.  
Тестовое задание: отправка и получение текстовых сообщений через [GREEN-API](https://green-api.com/max).

Интерфейс упрощённо повторяет [web.max.ru](https://web.max.ru/): тёмная тема «Космос», список чатов слева, переписка справа, минимальный набор функций.

## Возможности

- Вход по `idInstance` и `apiTokenInstance`
- Создание чата по номеру телефона (`CheckAccount` → `chatId`)
- Отправка текста методом `SendMessage`
- Получение входящих сообщений через HTTP API: `ReceiveNotification` + `DeleteNotification`
- Сохранение сессии и истории чатов в `localStorage`

## Стек

- React 19 + TypeScript
- Vite
- Zustand
- SCSS Modules
- UI-токены по мотивам MaxUI (`space` / `dark`)

## Локальный запуск

### Требования

- Node.js 20+
- Аккаунт и авторизованный инстанс в [личном кабинете GREEN-API](https://console.green-api.com)
- Мессенджер MAX на телефоне, привязанный к инстансу

### Установка

```bash
npm install
npm run dev
```

Приложение откроется на адресе, который покажет Vite (обычно `http://localhost:5173`).

### Сборка

```bash
npm run build
npm run preview
```

## Как пользоваться

1. Войдите с `idInstance` и `apiTokenInstance` из личного кабинета.
2. Нажмите **Новый чат** и укажите номер получателя (РФ `+7…` или РБ `+375…`).
3. Отправьте текстовое сообщение.
4. Ответьте из приложения MAX на другом устройстве/аккаунте — ответ появится в чате.

## Важно по настройке инстанса

Для HTTP API polling поле `webhookUrl` должно быть **пустым**, а входящие уведомления — включены.

При входе приложение пытается применить настройки:

- `webhookUrl: ""`
- `incomingWebhook: "yes"`

Если настройки уже заданы вручную в кабинете — это тоже подходит.

`apiUrl` вычисляется из префикса `idInstance` по стандартному правилу GREEN-API:

```text
https://{первые 4 цифры idInstance}.api.green-api.com
```

## Архитектура (кратко)

```text
src/
  api/           # клиент GREEN-API
  components/    # UI (login, sidebar, chat)
  hooks/         # long-polling уведомлений
  store/         # Zustand: чаты, сообщения, сессия
  styles/        # токены и глобальные стили
  utils/         # телефон, время, текст webhook
```

## API, которые используются

| Сценарий | Метод |
| --- | --- |
| Проверка входа | `GetStateInstance` |
| Настройка приёма | `SetSettings` |
| Новый чат | `CheckAccount` |
| Отправка | `SendMessage` |
| Получение | `ReceiveNotification` |
| Подтверждение | `DeleteNotification` |

Документация:

- [SendMessage](https://green-api.com/v3/docs/api/sending/SendMessage/)
- [HTTP API receiving](https://green-api.com/v3/docs/api/receiving/technology-http-api/)

## Деплой

Любой статический хостинг после `npm run build` (Vercel / Netlify / GitHub Pages).  
Для production приложение ходит в GREEN-API напрямую из браузера. Для локальной разработки в Vite настроен proxy `/green-api`.

## Автор

Дмитрий Прохватаев · Telegram: [t.me/dmi_pro](https://t.me/dmi_pro)
