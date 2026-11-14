# ExchangeChart

Небольшое веб-приложение с графиком криптовалютных рынков Binance.

## Возможности

- Свечной график для BTC/USDT, ETH/USDT и BNB/USDT.
- Таймфреймы: 15 минут, 1 час, 4 часа и 1 день.
- Живые данные Spot: цена, изменение за 24 часа, максимум, минимум и объём.
- Список последних сделок и подсказка с данными свечи.
- Полноэкранный режим графика.

## Технологии

Vue 3, TypeScript, Vite, Tailwind CSS и `d3-scale`.

## Запуск локально

Требуется Node.js и pnpm.

```bash
pnpm install
```

Создайте `.env.development.local` в корне проекта:

```env
VITE_BINANCE_API_BASE_URL=https://api.binance.com
VITE_BINANCE_WS_BASE_URL=wss://stream.binance.com:9443
```

Затем запустите приложение:

```bash
pnpm dev
```

## Команды

```bash
pnpm run build        # Проверка TypeScript и production-сборка
pnpm run preview      # Просмотр production-сборки локально
pnpm run format:check # Проверка форматирования
```

## Публикация на GitHub Pages

В `vite.config.ts` для репозитория `ExchangeChart` задан базовый путь `/ExchangeChart/`.

Для локальной публикации создайте `.env.production.local` с теми же Binance URL, что и в `.env.development.local`, затем выполните:

```bash
pnpm run deploy
```

Скрипт собирает приложение и публикует папку `dist` в ветку `gh-pages`. В настройках репозитория GitHub Pages выберите эту ветку и папку `/(root)`.

Переменные с префиксом `VITE_` включаются в клиентскую сборку и доступны пользователям приложения. Не храните в них секреты или приватные API-ключи.
