import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import Papa from "papaparse"

type TransformInput = {
  products: any[]
  regions: any[]
}

export const transformProductsToCsvStep = createStep(
  "transform-products-to-csv",
  async ({ products, regions }: TransformInput) => {
    const productsList = products || []
    const regionsList = regions || []

    // Build regions map for resolving region prices
    const regionsMap = new Map(regionsList.map((r: any) => [r.id, r]))

    // Normalize products to flat CSV rows (one row per variant)
    const normalizedRows: Record<string, any>[] = []

    for (const product of productsList) {
      const variants = product.variants ?? []

      if (!variants.length) {
        normalizedRows.push(normalizeProductForExport(product))
        continue
      }

      for (const variant of variants) {
        const row = {
          ...normalizeProductForExport(product),
          ...normalizeVariantForExport(variant, regionsMap, product),
        }
        normalizedRows.push(row)
      }
    }

    if (normalizedRows.length === 0) {
      return new StepResponse("")
    }

    // Collect all unique keys across rows for consistent headers
    const allKeys = new Set<string>()
    normalizedRows.forEach((row) => {
      Object.keys(row).forEach((key) => allKeys.add(key))
    })

    // Sort columns in official Medusa order
    const prodColumnPositions = new Map([
      ["Product Id", 0],
      ["Product Handle", 1],
      ["Product Title", 2],
      ["Product Subtitle", 3],
      ["Product Description", 4],
      ["Product Status", 5],
      ["Product Thumbnail", 6],
      ["Product Weight", 7],
      ["Product Length", 8],
      ["Product Width", 9],
      ["Product Height", 10],
      ["Product HS Code", 11],
      ["Product Origin Country", 12],
      ["Product MID Code", 13],
      ["Product Material", 14],
      ["Product Collection Id", 15],
      ["Product Type Id", 16],
      ["Product Discountable", 17],
      ["Product External Id", 18],
    ])

    const variantColumnPositions = new Map([
      ["Variant Id", 0],
      ["Variant Title", 1],
      ["Variant Sku", 2],
      ["Variant Barcode", 3],
      ["Variant Upc", 4],
      ["Variant Ean", 5],
      ["Variant Hs Code", 6],
      ["Variant Mid Code", 7],
      ["Variant Manage Inventory", 8],
      ["Variant Allow Backorder", 9],
      ["Variant Weight", 10],
      ["Variant Length", 11],
      ["Variant Width", 12],
      ["Variant Height", 13],
      ["Variant Material", 14],
      ["Variant Origin Country", 15],
      ["Variant Variant Rank", 16],
    ])

    const comparator = (a: string, b: string, columnMap: Map<string, number>): number => {
      if (columnMap.has(a) && columnMap.has(b)) {
        return columnMap.get(a)! - columnMap.get(b)!
      }
      if (columnMap.has(a)) return -1
      if (columnMap.has(b)) return 1
      return a.localeCompare(b)
    }

    const orderedKeys = Array.from(allKeys).sort((a, b) => {
      // Product fields
      if (a.startsWith("Product") && b.startsWith("Product")) {
        return comparator(a, b, prodColumnPositions)
      }
      // Shipping Profile Id
      if (a.startsWith("Shipping") && b.startsWith("Shipping")) return 0
      if (a.startsWith("Product") && !b.startsWith("Product")) return -1
      if (!a.startsWith("Product") && b.startsWith("Product")) return 1
      // Shipping before Variant
      if (a.startsWith("Shipping") && b.startsWith("Variant")) return -1
      if (a.startsWith("Variant") && b.startsWith("Shipping")) return 1
      // Variant fields
      if (a.startsWith("Variant") && b.startsWith("Variant")) {
        // Options before prices
        if (a.startsWith("Variant Option") && !b.startsWith("Variant Option")) return -1
        if (!a.startsWith("Variant Option") && b.startsWith("Variant Option")) return 1
        // Prices last
        if (a.startsWith("Variant Price") && !b.startsWith("Variant Price")) return 1
        if (!a.startsWith("Variant Price") && b.startsWith("Variant Price")) return -1
        return comparator(a, b, variantColumnPositions)
      }
      return a.localeCompare(b)
    })

    // Convert to CSV using PapaParse (handles escaping properly)
    const csv = Papa.unparse(normalizedRows, {
      columns: orderedKeys,
      quotes: true,
    })

    return new StepResponse(csv)
  }
)

// --- Helpers matching official Medusa format ---

function beautifyKey(key: string): string {
  return key
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

function normalizeProductForExport(product: any): Record<string, any> {
  const res: Record<string, any> = {}

  // Scalar product fields (matching official Medusa column names exactly)
  res["Product Id"] = product.id
  res["Product Handle"] = product.handle
  res["Product Title"] = product.title
  res["Product Subtitle"] = product.subtitle
  res["Product Description"] = product.description
  res["Product Status"] = product.status
  res["Product Thumbnail"] = product.thumbnail
  res["Product Weight"] = product.weight
  res["Product Length"] = product.length
  res["Product Width"] = product.width
  res["Product Height"] = product.height
  res["Product HS Code"] = product.hs_code
  res["Product Origin Country"] = product.origin_country
  res["Product MID Code"] = product.mid_code
  res["Product Material"] = product.material
  res["Product Collection Id"] = product.collection_id ?? product.collection?.id
  res["Product Type Id"] = product.type_id ?? product.type?.id
  res["Product Discountable"] = product.discountable
  res["Product External Id"] = product.external_id

  // Shipping Profile Id (NOT nested object)
  res["Shipping Profile Id"] = product.shipping_profile?.id

  // Flatten images: Product Image 1, Product Image 2, ...
  product.images?.forEach((image: any, idx: number) => {
    res[`Product Image ${idx + 1}`] = image.url
  })

  // Flatten tags (by ID for import compatibility)
  product.tags?.forEach((tag: any, idx: number) => {
    res[`Product Tag ${idx + 1}`] = tag.id
  })

  // Flatten sales channels (by ID)
  product.sales_channels?.forEach((sc: any, idx: number) => {
    res[`Product Sales Channel ${idx + 1}`] = sc.id
  })

  // Flatten categories (by ID)
  product.categories?.forEach((cat: any, idx: number) => {
    res[`Product Category ${idx + 1}`] = cat.id
  })

  return res
}

function normalizeVariantForExport(
  variant: any,
  regionsMap: Map<string, any>,
  product: any
): Record<string, any> {
  const res: Record<string, any> = {}

  // Scalar variant fields (matching official Medusa column names exactly)
  res["Variant Id"] = variant.id
  res["Variant Title"] = variant.title
  res["Variant Sku"] = variant.sku
  res["Variant Barcode"] = variant.barcode
  res["Variant Upc"] = variant.upc
  res["Variant Ean"] = variant.ean
  res["Variant Hs Code"] = variant.hs_code
  res["Variant Mid Code"] = variant.mid_code
  res["Variant Manage Inventory"] = variant.manage_inventory
  res["Variant Allow Backorder"] = variant.allow_backorder
  res["Variant Weight"] = variant.weight
  res["Variant Length"] = variant.length
  res["Variant Width"] = variant.width
  res["Variant Height"] = variant.height
  res["Variant Material"] = variant.material
  res["Variant Origin Country"] = variant.origin_country
  res["Variant Variant Rank"] = variant.variant_rank

  // Flatten options: Variant Option 1 Name / Value, ...
  const productOptions = product.options ?? []
  variant.options?.forEach((option: any, idx: number) => {
    const prodOption = productOptions.find(
      (po: any) => po.id === option.option_id
    )
    res[`Variant Option ${idx + 1} Name`] = prodOption?.title
    res[`Variant Option ${idx + 1} Value`] = option.value
  })

  // Flatten prices: Variant Price RUB, Variant Price Краснодар [RUB]
  variant.price_set?.prices
    ?.sort((a: any, b: any) =>
      b.currency_code.localeCompare(a.currency_code)
    )
    .forEach((price: any) => {
      const regionRule = price.price_rules?.find(
        (r: any) => r.attribute === "region_id"
      )
      if (regionRule) {
        const region = regionsMap.get(regionRule.value)
        if (region) {
          // Official format: Variant Price Краснодар [RUB]
          res[`Variant Price ${region.name} [${region.currency_code.toUpperCase()}]`] =
            price.amount
        }
      } else if (!price.price_rules?.length) {
        // Standard currency: Variant Price RUB
        res[`Variant Price ${price.currency_code.toUpperCase()}`] = price.amount
      }
    })

  return res
}
