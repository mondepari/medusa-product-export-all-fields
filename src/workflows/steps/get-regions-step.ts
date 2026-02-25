import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const getRegionsStep = createStep(
  "get-regions-step",
  async (_, { container }) => {
    const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

    const query = {
      entryPoint: "region",
      fields: ["id", "name", "currency_code"],
      variables: {
        take: 9999,
      },
    }

    const result = await remoteQuery(query)
    // Handle various response formats from remoteQuery
    let regions: any[] = []
    
    if (Array.isArray(result)) {
      regions = result
    } else if (result && Array.isArray(result.rows)) {
      regions = result.rows
    } else if (result && Array.isArray(result.region)) {
      regions = result.region
    } else {
       // Fallback or empty
       regions = []
    }

    return new StepResponse(regions)
  }
)
