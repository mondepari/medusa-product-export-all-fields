import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type GetProductsForExportInput = {
  region_ids?: string[]
}

export const getProductsForExportStep = createStep(
  "get-products-for-export",
  async (input: GetProductsForExportInput, { container }) => {
    const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

    const allProducts: any[] = []
    const pageSize = 50
    let page = 0

    while (true) {
      const { rows: products } = await remoteQuery({
        entryPoint: "product",
        variables: {
          skip: page * pageSize,
          take: pageSize,
        },
        fields: [
          "id",
          "title",
          "handle",
          "description",
          "subtitle",
          "is_giftcard",
          "status",
          "thumbnail",
          "weight",
          "length",
          "height",
          "width",
          "material",
          "origin_country",
          "mid_code",
          "hs_code",
          "discountable",
          "external_id",
          "collection_id",
          "type_id",
          "variants.id",
          "variants.title",
          "variants.sku",
          "variants.barcode",
          "variants.ean",
          "variants.upc",
          "variants.inventory_quantity",
          "variants.allow_backorder",
          "variants.manage_inventory",
          "variants.hs_code",
          "variants.origin_country",
          "variants.mid_code",
          "variants.material",
          "variants.weight",
          "variants.length",
          "variants.height",
          "variants.width",
          "variants.metadata",
          "variants.price_set.prices.id",
          "variants.price_set.prices.amount",
          "variants.price_set.prices.currency_code",
          "variants.price_set.prices.min_quantity",
          "variants.price_set.prices.max_quantity",
          "variants.price_set.prices.price_rules.value",
          "variants.price_set.prices.price_rules.attribute",
          "variants.options.value",
          "variants.options.option_id",
          "variants.variant_rank",
          "options.id",
          "options.title",
          "collection.id",
          "collection.title",
          "collection.handle",
          "type.id",
          "type.value",
          "tags.id",
          "tags.value",
          "sales_channels.id",
          "sales_channels.name",
          "shipping_profile.id",
          "shipping_profile.name",
          "categories.id",
          "categories.name",
          "categories.handle",
          "images.url",
        ],
      })

      if (!products || products.length === 0) {
        break
      }

      allProducts.push(...products)

      if (products.length < pageSize) {
        break
      }

      page += 1
    }

    return new StepResponse(allProducts)
  }
)
