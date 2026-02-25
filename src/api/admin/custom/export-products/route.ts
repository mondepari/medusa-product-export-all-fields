import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { exportProductsWorkflow } from "../../../../workflows/export-products-workflow"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { result } = await exportProductsWorkflow(req.scope).run({
    input: {},
  })

  res.setHeader("Content-Type", "text/csv")
  res.setHeader("Content-Disposition", "attachment; filename=products.csv")
  res.send(result)
}
