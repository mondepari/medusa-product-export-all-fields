# medusa-product-export-all-fields
Custom products exprots with all fileds (support regions price) for Medusa JS v2.
Admin UI страница — src/admin/routes/products/export/page.tsx
Кнопка "Экспортировать" в боковом меню, вызывает GET /admin/custom/export-products

API Route — [src/api/admin/custom/export-products/route.ts] — Обрабатывает GET запрос, запускает workflow и отдаёт CSV

Workflow — [src/workflows/export-products-workflow.ts]— Оркестрирует 3 шага: получение товаров → получение регионов → трансформация в CSV

Step: 
Получение товаров — [src/workflows/steps/get-products-for-export.ts] — Запрашивает все товары из БД со всеми полями (variants, prices, options, tags, sales_channels, categories, images и т.д.)

Step: Трансформация в CSV — [src/workflows/steps/transform-products-to-csv.ts] — Преобразует данные товаров в плоские CSV строки с нумерованными колонками (Product Tag 1, Product Sales Channel 1 и т.д.)

Плюс вспомогательный шаг для регионов:
Step: Получение регионов — [src/workflows/steps/get-regions-step.ts] — Запрашивает все регионы для резолва региональных цен (Variant Price Russia [RUB])