# ExchangeChart

Веб-приложение для просмотра Binance Spot рынков и тестирования Spot Testnet ордеров.

## Возможности

- Свечной график, выбор рынка и таймфрейма.
- Текущие рыночные данные, последние сделки и сведения о выбранной свече.
- Просмотр открытых ордеров и обновлений аккаунта.
- Создание и отмена ордеров на Binance Spot Testnet.

## Структура проекта

```text
apps/
  api/       Express API для Binance Spot Testnet
  web/       Vue-приложение и график
packages/
  shared/    Общие TypeScript-типы и проверки данных
```

## Требования

- Node.js 24
- pnpm

Включите Corepack, установите зависимости из корня репозитория:

```bash
corepack enable
pnpm install
```

## Настройка окружения

### Frontend

Создайте `apps/web/.env.development.local` для публичных рыночных данных:

```env
VITE_BINANCE_API_BASE_URL=https://api.binance.com
VITE_BINANCE_WS_BASE_URL=wss://stream.binance.com:9443
```

Переменные `VITE_*` попадают в клиентскую сборку и доступны пользователям. Не помещайте в них API-ключи или секреты.

### Testnet API

Создайте `apps/api/.env.local`:

```env
BINANCE_SPOT_TESTNET_API_KEY=your_testnet_api_key
BINANCE_SPOT_TESTNET_API_SECRET=your_testnet_api_secret
BINANCE_SPOT_TESTNET_BASE_URL=https://testnet.binance.vision
BINANCE_SPOT_TESTNET_WS_BASE_URL=wss://ws-api.testnet.binance.vision/ws-api/v3
```

Используйте только ключи Binance Spot Testnet. Не добавляйте `.env.local` и другие файлы с секретами в Git.

## Локальная разработка

Запустите API и frontend в отдельных терминалах из корня репозитория.

Терминал 1:

```bash
pnpm dev:api
```

Терминал 2:

```bash
pnpm dev
```

Откройте URL, указанный Vite в терминале. В режиме разработки Vite проксирует запросы `/api/testnet` к локальному API на порту `3000`.

## Сборка и форматирование

```bash
pnpm build
pnpm run format:check
```

`pnpm build` собирает пакеты в правильном порядке: shared, web, затем API.

Чтобы запустить собранное приложение локально:

```bash
pnpm --filter @exchange-chart/api start
```

Express отдаёт frontend из `apps/web/dist` и обрабатывает запросы API на том же origin.

## Деплой на Render

Создайте **Web Service**, подключите репозиторий и оставьте **Root Directory** пустым, чтобы сборка имела доступ ко всем пакетам монорепозитория.

Настройки сервиса:

- **Build Command:** `pnpm install --frozen-lockfile && pnpm build`
- **Start Command:** `pnpm --filter @exchange-chart/api start`

Добавьте в **Environment** сервиса переменные из обоих env-разделов выше. `VITE_*` переменные нужны во время сборки frontend; Testnet API-ключи должны быть доступны только backend. Render сам задаёт `PORT`.

`apps/api` обслуживает и frontend, и `/api/testnet`, поэтому после успешного деплоя Render предоставляет один URL для приложения.

> **Важно:** маршруты `/api/testnet` сейчас не требуют аутентификации. При публичном деплое пользователи, знающие URL приложения, могут обращаться к Testnet API, включая просмотр балансов и создание или отмену Testnet ордеров. Используйте только Testnet-ключи и добавьте аутентификацию перед тем, как полагаться на приватность API.

Корневая команда `pnpm deploy` предназначена только для публикации frontend на GitHub Pages и не деплоит API.
