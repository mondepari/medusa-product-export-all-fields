import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { getProductsForExportStep } from "./steps/get-products-for-export"
import { getRegionsStep } from "./steps/get-regions-step"
import { transformProductsToCsvStep } from "./steps/transform-products-to-csv"

export type ExportProductsWorkflowInput = {
  region_ids?: string[]
}

export const exportProductsWorkflow = createWorkflow(
  "custom-export-products",
  function (input: ExportProductsWorkflowInput) {
    const products = getProductsForExportStep(input)
    const regions = getRegionsStep()

    const csvContent = transformProductsToCsvStep({ products, regions })

    return new WorkflowResponse(csvContent)
  }
)
